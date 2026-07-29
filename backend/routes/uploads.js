const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Simple in-memory cache for idempotency
const processedUploads = new Map();

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
    cb(new Error('Invalid file type. Images, PDFs, and Videos only!'));
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

// POST /api/uploads/multiple - Upload multiple general files (up to 4)
router.post('/multiple', (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (idempotencyKey && processedUploads.has(idempotencyKey)) {
    return res.status(200).json(processedUploads.get(idempotencyKey));
  }

  upload.array('files', 4)(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Validation Failed', errors: [{ field: 'files', message: err.message }] });
    } else if (err) {
      return res.status(400).json({ message: 'Validation Failed', errors: [{ field: 'files', message: err.message }] });
    }
    
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      const uploadedFiles = [];
      for (const file of req.files) {
        let finalUrl = '';
        if (file.mimetype.startsWith('image/')) {
          const optimizedFilename = 'optimized-' + file.filename + '.jpg';
          const resizedPath = path.join(uploadDir, optimizedFilename);
          await sharp(file.path)
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(resizedPath);
          
          fs.unlinkSync(file.path);
          finalUrl = `/uploads/${optimizedFilename}`;
        } else {
          finalUrl = `/uploads/${file.filename}`;
        }
        
        uploadedFiles.push({
          url: finalUrl,
          metadata: {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          }
        });
      }
      
      const responsePayload = { 
        message: 'Files uploaded successfully', 
        files: uploadedFiles 
      };

      if (idempotencyKey) {
        processedUploads.set(idempotencyKey, responsePayload);
        // Simple cache limit
        if (processedUploads.size > 1000) {
          const firstKey = processedUploads.keys().next().value;
          processedUploads.delete(firstKey);
        }
      }
      
      res.status(200).json(responsePayload);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during upload' });
    }
  });
});

router.post('/', (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Validation Failed', errors: [{ field: 'file', message: err.message }] });
    } else if (err) {
      return res.status(400).json({ message: 'Validation Failed', errors: [{ field: 'file', message: err.message }] });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Return a mocked public URL (in real app, this would be a static route or cloud bucket URL)
      const publicUrl = `/uploads/${req.file.filename}`;
      
      res.status(200).json({ 
        message: 'File uploaded successfully', 
        url: publicUrl,
        metadata: {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during upload' });
    }
  });
});

router.post('/evidence', (req, res) => {
  uploadEvidence.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Validation Failed', errors: [{ field: 'file', message: 'Evidence file cannot exceed 5MB' }] });
      }
      return res.status(400).json({ message: 'Validation Failed', errors: [{ field: 'file', message: err.message }] });
    } else if (err) {
      return res.status(400).json({ message: 'Validation Failed', errors: [{ field: 'file', message: err.message }] });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const publicUrl = `/uploads/${req.file.filename}`;
      
      res.status(200).json({ 
        message: 'Evidence uploaded successfully', 
        url: publicUrl,
        metadata: {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during upload' });
    }
  });
});

module.exports = router;
