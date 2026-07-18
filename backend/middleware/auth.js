const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  // Get token from cookies or fallback to header
  let token = req.cookies?.accessToken;
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch user to check ban status and fresh role
    const user = await User.findById(decoded.id || decoded._id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    req.user = { 
      id: user._id.toString(), 
      role: user.role,
      banned: user.banned
    };
    if (user.role === 'recruiter' || user.role === 'admin') {
      req.user.recruiterProfile = user.recruiterProfile;
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
