const express = require('express');
const router = express.Router();
const altFundingController = require('../controllers/altFundingController');
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');

const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', altFundingController.getAdminResources);
router.post('/', isNotBanned, altFundingController.createResource);
router.patch('/:id', isNotBanned, altFundingController.updateResource);

module.exports = router;
