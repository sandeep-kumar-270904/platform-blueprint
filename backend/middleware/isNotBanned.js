module.exports = (req, res, next) => {
  if (req.user && req.user.banned) {
    return res.status(403).json({ message: 'Forbidden: Account is banned' });
  }
  next();
};
