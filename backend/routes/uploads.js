const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|mp4|webm|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images, PDFs, and Videos only!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
});

const uploadEvidence = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for evidence/identity
  fileFilter: fileFilter
});

// POST /api/uploads - Upload a general file
router.post('/', (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Multer error', error: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Upload error', error: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Return a mocked public URL (in real app, this would be a static route or cloud bucket URL)
      const publicUrl = `/uploads/${req.file.filename}`;
      
      res.status(200).json({ 
        message: 'File uploaded successfully', 
        url: publicUrl 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during upload' });
    }
  });
});

// POST /api/uploads/evidence - Upload identity/evidence file (stricter limit)
router.post('/evidence', (req, res) => {
  uploadEvidence.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Evidence file cannot exceed 5MB' });
      }
      return res.status(400).json({ message: 'Multer error', error: err.message });
    } else if (err) {
      return res.status(400).json({ message: 'Upload error', error: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const publicUrl = `/uploads/${req.file.filename}`;
      
      res.status(200).json({ 
        message: 'Evidence uploaded successfully', 
        url: publicUrl 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during upload' });
    }
  });
});

module.exports = router;
