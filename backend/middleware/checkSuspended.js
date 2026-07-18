module.exports = function (req, res, next) {
  if (req.user && req.user.banned) {
    return res.status(403).json({ message: 'Action rejected: Account suspended' });
  }
  next();
};
