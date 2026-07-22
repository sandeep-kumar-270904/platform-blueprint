const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const PlacementResource = require('../models/PlacementResource');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resource-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|docx|doc/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only PDFs, documents, and images are allowed.'));
  }
});

// @route   GET api/placement-resources
// @desc    Get all public resources (and admin resources)
router.get('/', auth, async (req, res) => {
  try {
    const resources = await PlacementResource.find({ isPublic: true })
      .populate('uploadedBy', 'full_name username avatar_url')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/placement-resources
// @desc    Upload a new resource (by user or admin)
router.post('/', [auth, upload.single('file')], async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const isAdmin = req.user.role === 'admin';

    const newResource = new PlacementResource({
      title,
      description,
      category,
      fileUrl,
      uploadedBy: req.user.id,
      isAdminUpload: isAdmin,
      isPublic: true // Assuming all uploads are public immediately
    });

    const resource = await newResource.save();
    
    // Populate user info for immediate display
    await resource.populate('uploadedBy', 'full_name username avatar_url');
    
    res.json(resource);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/placement-resources/:id
// @desc    Delete a resource
router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await PlacementResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Check user (only owner or admin can delete)
    if (resource.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ error: 'User not authorized' });
    }

    await resource.deleteOne();
    res.json({ msg: 'Resource removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
