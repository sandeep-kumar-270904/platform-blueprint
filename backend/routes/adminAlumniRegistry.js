const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs');
const crypto = require('crypto');
const AlumniRegistry = require('../models/AlumniRegistry');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const upload = multer({ dest: 'uploads/' });

// POST /api/admin/alumni-registry/import - Upload CSV
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const { collegeId } = req.body;
  if (!collegeId) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'collegeId is required.' });
  }

  const records = [];
  let duplicates = 0;
  let invalid = 0;
  let created = 0;

  try {
    const parser = fs.createReadStream(req.file.path).pipe(
      parse({ columns: true, skip_empty_lines: true })
    );

    for await (const row of parser) {
      // Validate row
      if (!row.full_name || !row.graduation_year) {
        invalid++;
        continue;
      }

      const email = row.email ? row.email.toLowerCase().trim() : null;
      
      // Check for duplicate in the current college registry
      let exists = false;
      if (email) {
        exists = await AlumniRegistry.exists({ collegeId, institutionalEmail: email });
      }

      if (exists) {
        duplicates++;
        continue;
      }

      records.push({
        collegeId,
        fullName: row.full_name,
        institutionalEmail: email,
        graduationYear: parseInt(row.graduation_year),
        degree: row.degree,
        branch: row.branch,
        status: 'UNCLAIMED'
      });
    }

    if (records.length > 0) {
      // MongoDB insertMany ignores duplicates if we set ordered: false, but we already filtered them.
      try {
         const result = await AlumniRegistry.insertMany(records, { ordered: false });
         created = result.length;
      } catch (err) {
         if (err.code === 11000) {
           // Some duplicates slipped through (e.g. within the CSV itself)
           created = err.insertedDocs ? err.insertedDocs.length : 0;
           duplicates += records.length - created;
         } else {
           throw err;
         }
      }
    }

    fs.unlinkSync(req.file.path); // Cleanup

    res.json({
      message: 'Import complete',
      summary: {
        imported: records.length,
        created,
        duplicates,
        invalid
      }
    });

  } catch (error) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error parsing CSV', error: error.message });
  }
});

// POST /api/admin/alumni-registry/:id/invite - Send Invitation
router.post('/:id/invite', auth, isAdmin, async (req, res) => {
  try {
    const registry = await AlumniRegistry.findById(req.params.id).populate('collegeId', 'name');
    if (!registry) return res.status(404).json({ message: 'Registry record not found' });
    if (!registry.institutionalEmail) return res.status(400).json({ message: 'No email found for this record' });
    if (registry.status === 'VERIFIED') return res.status(400).json({ message: 'Alumni is already verified' });

    const admin = await User.findById(req.user.id);

    // Generate secure claim token
    const token = crypto.randomBytes(32).toString('hex');
    registry.claimToken = token;
    // Expire in 7 days
    registry.claimTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await registry.save();

    // Enqueue email in the robust Notification system
    await Notification.create({
      targetEmail: registry.institutionalEmail, // out-of-band email
      type: 'alumni_invitation',
      message: 'Invitation to claim your alumni profile',
      actionUrl: `/claim-alumni?token=${token}`,
      deliveryChannels: ['email'],
      emailStatus: 'pending',
      actors: [{ userId: admin._id, name: admin.full_name }],
      metadata: { collegeName: registry.collegeId ? registry.collegeId.name : 'Your College' }
    });

    res.json({ message: 'Invitation sent successfully', status: registry.status });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invitation', error: error.message });
  }
});

// GET /api/admin/alumni-registry - View registry
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { collegeId, status, search, page = 1, limit = 50 } = req.query;
    let query = {};
    if (collegeId) query.collegeId = collegeId;
    if (status) query.status = status;
    if (search) {
       query.fullName = { $regex: new RegExp(search, 'i') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await AlumniRegistry.find(query)
      .populate('collegeId', 'name')
      .populate('claimedBy', 'full_name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AlumniRegistry.countDocuments(query);

    res.json({
      records,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registry', error: error.message });
  }
});

module.exports = router;
