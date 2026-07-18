const axios = require('axios');
const logger = require('../utils/logger');

// Middleware to verify CAPTCHA token for bot protection
// Assumes req.body.captchaToken is passed by the frontend
const verifyCaptcha = async (req, res, next) => {
  // If not configured, bypass for development
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    return next();
  }

  const token = req.body.captchaToken;
  if (!token) {
    return res.status(403).json({ message: 'CAPTCHA token is required.' });
  }

  try {
    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`);
    
    if (response.data.success) {
      next();
    } else {
      logger.warn(`CAPTCHA verification failed for ${req.ip}`);
      res.status(403).json({ message: 'Failed CAPTCHA verification.' });
    }
  } catch (error) {
    logger.error('Error verifying CAPTCHA:', error);
    res.status(500).json({ message: 'Internal error verifying CAPTCHA.' });
  }
};

module.exports = verifyCaptcha;
