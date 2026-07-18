const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');
const auth = require('../middleware/auth');
const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.use(auth);

router.get('/', certificationController.getMyCertifications);
router.post('/', certificationController.addCertification);
router.put('/:id', certificationController.updateCertification);
router.delete('/:id', certificationController.deleteCertification);

// Admin Routes
router.get('/admin/pending', requireAdmin, certificationController.getPendingVerifications);
router.put('/admin/:id/verify', requireAdmin, certificationController.verifyCertification);

module.exports = router;
