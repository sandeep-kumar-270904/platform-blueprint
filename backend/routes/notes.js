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
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|docx|doc|xlsx|xls|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only PDFs, documents, spreadsheets, and images are allowed.'));
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

// @route   GET api/notes/top-contributors
// @desc    Get top note contributors
router.get('/top-contributors', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'studenthub_secret_key_2024');
        if (decoded && decoded.user) {
          currentUserId = decoded.user.id;
        }
      } catch (err) {}
    }

    const contributors = await Note.aggregate([
      {
        $group: {
          _id: "$user_id",
          note_count: { $sum: 1 },
          avg_rating: { $avg: "$rating" },
          total_views: { $sum: "$views" },
          total_downloads: { $sum: "$downloads" }
        }
      },
      {
        $match: {
          note_count: { $gte: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          user_id: "$_id",
          username: "$user.username",
          full_name: "$user.full_name",
          note_count: 1,
          avg_rating: { $ifNull: ["$avg_rating", 0] },
          total_views: { $ifNull: ["$total_views", 0] },
          total_downloads: { $ifNull: ["$total_downloads", 0] }
        }
      },
      {
        $sort: { note_count: -1, total_views: -1 }
      }
    ]);

    let currentUserRank = -1;
    let currentUserData = null;

    if (currentUserId) {
      contributors.forEach((c, index) => {
        if (c.user_id.toString() === currentUserId) {
          currentUserRank = index + 1;
          currentUserData = c;
        }
      });
    }

    res.json({
      top10: contributors.slice(0, 10),
      currentUser: currentUserData ? { ...currentUserData, rank: currentUserRank } : null
    });
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

// @route   GET api/notes/bookmarks
// @desc    Get user's bookmarked notes
router.get('/bookmarks', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.bookmarked_notes || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/notes/:id/bookmark
// @desc    Toggle bookmark for a note
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const user = await require('../models/User').findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isBookmarked = user.bookmarked_notes && user.bookmarked_notes.includes(noteId);
    if (isBookmarked) {
      user.bookmarked_notes = user.bookmarked_notes.filter(id => id.toString() !== noteId);
    } else {
      user.bookmarked_notes = user.bookmarked_notes || [];
      user.bookmarked_notes.push(noteId);
    }
    await user.save();
    res.json({ isBookmarked: !isBookmarked, bookmarked_notes: user.bookmarked_notes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/notes/:id/download
// @desc    Increment note download count
router.put('/:id/download', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    note.downloads += 1;
    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/notes/:id/rate
// @desc    Rate a note
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { score, review } = req.body;
    if (score < 1 || score > 5) return res.status(400).json({ error: 'Score must be between 1 and 5' });

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    // Prevent self-rating
    if (note.user_id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot rate your own note' });
    }

    const NoteRating = require('../models/NoteRating');
    let rating = await NoteRating.findOne({ note_id: req.params.id, user_id: req.user.id });
    
    if (rating) {
      rating.score = score;
      if (review !== undefined) rating.review = review;
      await rating.save();
    } else {
      rating = new NoteRating({
        note_id: req.params.id,
        user_id: req.user.id,
        score,
        review
      });
      await rating.save();
    }

    // Recalculate average rating
    const allRatings = await NoteRating.find({ note_id: req.params.id });
    const totalScore = allRatings.reduce((sum, r) => sum + r.score, 0);
    note.rating = totalScore / allRatings.length;
    note.rating_count = allRatings.length;
    await note.save();

    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/notes/:id/ratings
// @desc    Get rating info for a note
router.get('/:id/ratings', async (req, res) => {
  try {
    const NoteRating = require('../models/NoteRating');
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    let userRating = 0;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'studenthub_secret_key_2024');
        if (decoded && decoded.user) {
          const rating = await NoteRating.findOne({ note_id: req.params.id, user_id: decoded.user.id });
          if (rating) userRating = rating.score;
        }
      } catch (err) {}
    }

    res.json({
      totalRatings: note.rating_count || 0,
      avgRating: note.rating || 0,
      userRating
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/notes/:id/comments
// @desc    Get comments for a note
router.get('/:id/comments', async (req, res) => {
  try {
    const { NoteComment } = require('../models/NoteComment');
    const comments = await NoteComment.find({ note_id: req.params.id })
      .populate('user_id', 'full_name username avatar_url')
      .sort({ created_at: -1 });
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/notes/:id/comments
// @desc    Add a comment to a note
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const { NoteComment } = require('../models/NoteComment');
    const comment = new NoteComment({
      note_id: req.params.id,
      user_id: req.user.id,
      content
    });
    await comment.save();

    // Increment comment count
    note.comment_count += 1;
    await note.save();

    const populatedComment = await NoteComment.findById(comment._id).populate('user_id', 'full_name username avatar_url');
    res.json(populatedComment);
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
