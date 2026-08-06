const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const multer = require('multer');
const path = require('path');
const { notifyDashboardUpdate } = require('../services/dashboardCache');

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
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

// @route   POST api/notes
// @desc    Upload a new note
router.post('/', [auth, upload.single('file')], async (req, res) => {
  try {
    const { title, subject, description, branch, semester, category, university, year, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const content_url = `/uploads/${req.file.filename}`;
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const newNote = new Note({
      user_id: req.user.id,
      title,
      subject,
      description,
      branch,
      semester: semester ? parseInt(semester) : null,
      category,
      university,
      year: year ? parseInt(year) : null,
      tags: parsedTags,
      content_url
    });

    const note = await newNote.save();
    notifyDashboardUpdate(req, req.user.id);
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/notes/summary
// @desc    Get global notes statistics
router.get('/summary', async (req, res) => {
  try {
    const totalNotes = await Note.countDocuments();
    
    const stats = await Note.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalDownloads: { $sum: "$downloads" }
        }
      }
    ]);
    
    const uniqueSubjects = await Note.distinct("subject");

    res.json({
      totalNotes,
      totalViews: stats[0]?.totalViews || 0,
      totalDownloads: stats[0]?.totalDownloads || 0,
      totalSubjects: uniqueSubjects.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/notes
// @desc    Get all notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ created_at: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/notes/:id
// @desc    Delete a note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check user
    if (note.user_id.toString() !== req.user.id) {
      return res.status(401).json({ error: 'User not authorized' });
    }

    await note.remove();
    res.json({ msg: 'Note removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/notes/:id/view
// @desc    Increment note view
router.put('/:id/view', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    note.views += 1;
    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
