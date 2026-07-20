const express = require('express');
const router = express.Router();
const dataSourceController = require('../controllers/dataSourceController');
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

router.post('/', isNotBanned, dataSourceController.createDataSource);
router.patch('/:id', isNotBanned, dataSourceController.updateDataSource);
router.get('/', dataSourceController.getDataSources);
router.post('/:id/trigger-sync-now', isNotBanned, dataSourceController.triggerSyncNow);

module.exports = router;
