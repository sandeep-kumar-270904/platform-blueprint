const jwt = require('jsonwebtoken');

const User = require('../models/User');

module.exports = async function (req, res, next) {
  // --- AUTH BYPASS FOR DEVELOPMENT ---
  // Try to find the admin user seeded in the DB
  const adminUser = await User.findOne({ role: 'admin' });
  if (adminUser) {
    req.user = { id: adminUser._id.toString(), role: adminUser.role };
    return next();
  }
  // -----------------------------------

  // Get token from cookies or fallback to header for backwards compatibility
  let token = req.cookies?.accessToken;
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
