const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const emailService = require('../services/emailService');
const fingerprintService = require('../services/fingerprintService');
const AuthEvent = require('../models/AuthEvent');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, username: user.username, full_name: user.full_name },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, username, full_name, consent, captchaToken } = req.body;
    
    // Validate captcha securely (mocked for now since keys are placeholder)
    if (!captchaToken) {
       return res.status(400).json({ message: 'Captcha validation failed' });
    }

    if (!consent) {
       return res.status(400).json({ message: 'You must accept the Terms and Privacy Policy' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      username: username || email.split('@')[0],
      full_name,
      authProvider: 'local',
      consent: {
        accepted_at: new Date(),
        terms_version: 'v1.0',
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
      }
    });

    await user.save();
    
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    
    setCookies(res, accessToken, refreshToken);
    res.status(201).json({ message: 'Registered successfully', user: { id: user._id, email: user.email, username: user.username, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(401).json({ message: 'That email or password isn\'t right' });

    if (user.deletedAt) {
      return res.status(403).json({ message: 'This account has been scheduled for deletion.' });
    }

    // Lockout check
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(429).json({ message: `Too many attempts — try again in ${minutesLeft} minutes`, locked: true });
    }

    if (user.authProvider !== 'local' && !user.password) {
      // It's a social account that hasn't set a password yet
      return res.status(401).json({ message: 'Please login using your social account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60000); // 15 mins
      }
      await user.save();
      await AuthEvent.create({ userId: user._id, eventType: 'login_failed', ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress, userAgent: req.headers['user-agent'] });
      return res.status(401).json({ message: 'That email or password isn\'t right' });
    }

    // Success: Clear lockout and failures
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Check device fingerprint
    const fp = fingerprintService.getDeviceFingerprint(req);
    const existingDevice = user.knownDevices.find(d => d.hash === fp.hash);
    let isNewDevice = false;

    if (!existingDevice) {
      isNewDevice = true;
      user.knownDevices.push({ ...fp, last_seen: new Date() });
      if (user.knownDevices.length > 5) {
        user.knownDevices.shift(); // Evict oldest
      }
      // Send email alert (don't await so we don't block login)
      emailService.sendNewDeviceAlert(user.email, fp.os, fp.browser, fp.region).catch(console.error);
    } else {
      existingDevice.last_seen = new Date();
    }

    // Check account linking
    let linkedProvider = null;
    if (user.pendingLinkProvider && user.pendingLinkProvider.expiresAt > new Date()) {
      user[`${user.pendingLinkProvider.provider}Id`] = user.pendingLinkProvider.id;
      linkedProvider = user.pendingLinkProvider.provider.charAt(0).toUpperCase() + user.pendingLinkProvider.provider.slice(1);
      user.pendingLinkProvider = null;
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    
    await AuthEvent.create({ userId: user._id, eventType: 'login_success', ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress, userAgent: req.headers['user-agent'] });

    setCookies(res, accessToken, refreshToken);
    res.json({ 
      message: 'Logged in successfully', 
      user: { id: user._id, email: user.email, username: user.username, full_name: user.full_name },
      linkedProvider,
      newDeviceDetails: isNewDevice ? { browser: fp.browser, os: fp.os, region: fp.region } : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: 'No session' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Session expired' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ message: 'Token refreshed' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    if (req.cookies.refreshToken) {
       const decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', { ignoreExpiration: true });
       await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    }
  } catch (e) {} // ignore invalid tokens on logout
  
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// OAuth Routes
const handleOAuthCallback = (req, res, next) => {
  passport.authenticate(req.params.provider, { session: false }, async (err, user, info) => {
    if (err) return res.redirect('/auth?error=oauth_failed');
    
    if (!user && info && info.message === 'linking_required') {
      const existingUser = await User.findOne({ email: info.email });
      existingUser.pendingLinkProvider = {
        provider: info.provider,
        id: info.providerId,
        expiresAt: new Date(Date.now() + 15 * 60000) // 15 mins to link
      };
      await existingUser.save();
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth?error=linking_required&method=${info.existingMethod}`);
    }
    
    if (!user) return res.redirect('/auth?error=oauth_failed');

    if (user.deletedAt) {
      return res.redirect('/auth?error=account_deleted');
    }

    // Check fingerprint for OAuth login
    const fp = fingerprintService.getDeviceFingerprint(req);
    const existingDevice = user.knownDevices.find(d => d.hash === fp.hash);
    
    if (!existingDevice) {
      user.knownDevices.push({ ...fp, last_seen: new Date() });
      if (user.knownDevices.length > 5) {
        user.knownDevices.shift();
      }
      emailService.sendNewDeviceAlert(user.email, fp.os, fp.browser, fp.region).catch(console.error);
      // We can't send a payload down a redirect easily. Could pass in a short-lived cookie.
      res.cookie('new_device_alert', JSON.stringify({ browser: fp.browser, os: fp.os, region: fp.region }), { maxAge: 10000 });
    } else {
      existingDevice.last_seen = new Date();
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    
    await AuthEvent.create({ userId: user._id, eventType: 'login_success', ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress, userAgent: req.headers['user-agent'] });

    setCookies(res, accessToken, refreshToken);
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
  })(req, res, next);
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', (req, res, next) => { req.params.provider = 'google'; next(); }, handleOAuthCallback);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', (req, res, next) => { req.params.provider = 'github'; next(); }, handleOAuthCallback);

router.get('/linkedin', passport.authenticate('linkedin'));
router.get('/linkedin/callback', (req, res, next) => { req.params.provider = 'linkedin'; next(); }, handleOAuthCallback);

module.exports = router;
