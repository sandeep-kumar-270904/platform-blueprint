const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Institution = require('../models/Institution');
const Cohort = require('../models/Cohort');
const User = require('../models/User');
const MentorBooking = require('../models/MentorBooking');
const Resume = require('../models/Resume');

// --- INSTITUTIONS ---

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const institutions = await Institution.find().sort({ createdAt: -1 });
    res.json({ institutions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const inst = new Institution(req.body);
    await inst.save();
    res.status(201).json(inst);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/suspend', auth, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const inst = await Institution.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: 'Institution not found' });

    inst.status = 'suspended';
    await inst.save();

    // Cascade seat downgrades per Mentors Phase 9 transition logic
    await User.updateMany(
      { institutionId: inst._id, tier: 'pro' },
      { $set: { tier: 'free', institutionVerified: false } }
    );

    const AdminActionLog = require('../models/AdminActionLog');
    await AdminActionLog.create({
      adminId: req.user.id,
      actionType: 'suspend_institution',
      targetId: inst._id,
      reason: 'Admin initiated suspension'
    });

    res.json({ message: 'Institution suspended and seats downgraded.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/claim-seat', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const domain = user.email.split('@')[1];

    const inst = await Institution.findOne({ domain, status: 'active' });
    if (!inst) return res.status(404).json({ message: 'No active institution found for your email domain' });

    if (inst.seatsUsed >= inst.seatLimit) {
      return res.status(400).json({ message: 'Institution seat limit reached' });
    }

    if (user.tier !== 'pro' && !user.institutionVerified) {
      user.tier = 'pro';
      user.institutionVerified = true;
      user.institutionId = inst._id;
      inst.seatsUsed += 1;
      
      await user.save();
      await inst.save();
      
      return res.json({ message: 'Seat claimed successfully! You now have Pro access.' });
    } else {
      return res.status(400).json({ message: 'You already have Pro or Institution access' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/remove-seat', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { userId } = req.body;
    const inst = await Institution.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: 'Institution not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.institutionVerified && user.institutionId?.toString() === inst._id.toString()) {
      user.institutionVerified = false;
      user.institutionId = null;
      user.tier = 'free'; // Downgrade
      
      if (inst.seatsUsed > 0) {
        inst.seatsUsed -= 1;
      }

      await user.save();
      await inst.save();

      return res.json({ message: 'Seat removed and user downgraded to free tier.' });
    } else {
      return res.status(400).json({ message: 'User does not occupy a seat in this institution' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Institutional Resume Review Tools (Phase 6)
router.get('/:id/resumes/stats', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.institutionId || admin.institutionId.toString() !== req.params.id) {
      if (admin.role !== 'admin') { // Super admin can bypass
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Find all users belonging to this institution
    const students = await User.find({ institutionId: req.params.id, tier: 'pro' }).select('_id');
    const studentIds = students.map(s => s._id);

    // Aggregate resume stats for these students
    const resumes = await Resume.find({ user_id: { $in: studentIds }, 'atsScore.score': { $gt: 0 } });
    
    let totalScore = 0;
    let weaknessCounts = {};

    resumes.forEach(r => {
      totalScore += r.atsScore.score;
      if (r.atsScore.tips) {
        r.atsScore.tips.forEach(tip => {
          if (tip.severity === 'high') {
            weaknessCounts[tip.issue] = (weaknessCounts[tip.issue] || 0) + 1;
          }
        });
      }
    });

    const avgScore = resumes.length > 0 ? (totalScore / resumes.length).toFixed(1) : 0;
    const topWeaknesses = Object.entries(weaknessCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    res.json({
      studentCount: studentIds.length,
      resumesAnalyzed: resumes.length,
      avgAtsScore: avgScore,
      topWeaknesses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- COHORTS ---

router.get('/cohorts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const cohorts = await Cohort.find()
      .populate('institutionId', 'name')
      .populate('mentorIds', 'title')
      .sort({ createdAt: -1 });
    res.json({ cohorts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/cohorts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const cohort = new Cohort(req.body);
    await cohort.save();
    res.status(201).json(cohort);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/cohorts/:id/auto-schedule', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) return res.status(404).json({ message: 'Cohort not found' });

    // Simple auto-scheduler:
    // For each week in curriculum, create a booking between a mentee and a suggested mentor
    let bookingsCreated = 0;
    
    // In a real scenario, this would check availability. Here we schedule tentatively.
    const startDate = new Date(cohort.startDate);
    
    for (const step of cohort.structuredCurriculum) {
      // Offset by weeks
      const sessionDate = new Date(startDate.getTime());
      sessionDate.setDate(sessionDate.getDate() + (step.week - 1) * 7);
      
      // Assign the first mentee to the suggested mentor for this step
      if (cohort.menteeIds.length > 0 && step.suggestedMentorId) {
        const booking = new MentorBooking({
          mentorId: step.suggestedMentorId,
          menteeId: cohort.menteeIds[0], // Simplified: Just mapping first mentee
          date: sessionDate.toISOString().split('T')[0],
          timeSlot: '10:00 AM', // Default time
          duration: 30,
          status: 'pending',
          paymentStatus: 'free', // Institutional cohorts are prepaid
          joinUrl: `https://studenthub.app/meet/${step.suggestedMentorId}-${Date.now()}`
        });
        await booking.save();
        bookingsCreated++;
      }
    }
    
    res.json({ message: `Auto-scheduled ${bookingsCreated} sessions for cohort` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
