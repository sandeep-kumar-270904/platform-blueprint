const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Helper for handling OAuth profiles
const handleOAuth = async (provider, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    
    // Check if user exists by provider id
    let user = await User.findOne({ [`${provider}Id`]: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // If we have an email, check if user exists by email
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // User exists with this email but not linked to this provider
        // Instead of outright rejecting, we flag it so our route can handle the 'linking required' redirect
        return done(null, false, { 
          message: 'linking_required',
          email: user.email,
          existingMethod: user.authProvider,
          provider: provider,
          providerId: profile.id
        });
      }
    }
    
    // Create new user
    const usernameBase = (profile.displayName || profile.username || email?.split('@')[0] || 'user').replace(/\s+/g, '').toLowerCase();
    const username = `${usernameBase}${Math.floor(Math.random() * 1000)}`;

    user = new User({
      email: email || `${profile.id}@${provider}.com`, // Fallback for Github users with hidden emails
      [`${provider}Id`]: profile.id,
      authProvider: provider,
      full_name: profile.displayName || profile.username || 'Anonymous User',
      username,
      consent: {
        accepted_at: new Date(),
        terms_version: 'oauth_implicit',
        ip_address: '0.0.0.0'
      }
    });
    
    await user.save();
    return done(null, user);
    
  } catch (err) {
    return done(err, null);
  }
};

// Helper for building absolute callback URLs
const getCallbackUrl = (provider) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${backendUrl.replace(/\/$/, '')}/api/auth/${provider}/callback`;
};

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'MOCK_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MOCK_CLIENT_SECRET',
    callbackURL: getCallbackUrl('google')
  },
  (accessToken, refreshToken, profile, done) => handleOAuth('google', profile, done)
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'MOCK_CLIENT_ID',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'MOCK_CLIENT_SECRET',
    callbackURL: getCallbackUrl('github')
  },
  (accessToken, refreshToken, profile, done) => handleOAuth('github', profile, done)
));

// LinkedIn Strategy
const linkedInStrategy = new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID || 'MOCK_CLIENT_ID',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'MOCK_CLIENT_SECRET',
    callbackURL: getCallbackUrl('linkedin'),
    scope: ['openid', 'profile', 'email'],
    state: true
  },
  (accessToken, refreshToken, profile, done) => handleOAuth('linkedin', profile, done)
);

linkedInStrategy.userProfile = function(accessToken, done) {
  this._oauth2.get('https://api.linkedin.com/v2/userinfo', accessToken, function (err, body, res) {
    if (err) { return done(new Error('failed to fetch user profile')); }
    try {
      const json = JSON.parse(body);
      const profile = {
        provider: 'linkedin',
        id: json.sub,
        displayName: json.name,
        emails: [{ value: json.email }],
        _raw: body,
        _json: json
      };
      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
};

passport.use(linkedInStrategy);

module.exports = passport;
