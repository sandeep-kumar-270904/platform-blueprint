const fs = require('fs');

const routes = `
// POST /api/classrooms/verify-host - Request/Approve Host Verification
router.post('/verify-host', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.host_verification_status === 'verified') {
      return res.status(400).json({ message: 'Already verified' });
    }
    
    // For MVP, we automatically approve verification when requested if guidelines are accepted
    user.is_verified_host = true;
    user.host_verification_status = 'verified';
    await user.save();
    
    res.json({ message: 'Host verification successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/feature - Admin feature class
router.post('/:id/feature', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin' && user.adminRole !== 'super') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    classroom.is_featured = !classroom.is_featured;
    await classroom.save();
    
    res.json({ message: 'Classroom feature status updated', is_featured: classroom.is_featured });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id/alternatives - Get similar active classes
router.get('/:id/alternatives', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    const alternatives = await VirtualClassroom.find({
      _id: { $ne: classroom._id },
      subject: classroom.subject,
      status: 'scheduled',
      visibility: 'public',
      $expr: { $lt: ['$participant_count', '$max_participants'] }
    }).limit(3).populate('host_id', 'first_name last_name avatar is_verified_host');
    
    res.json(alternatives);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/feedback/:participantId/respond - Host responds to feedback
router.post('/:id/feedback/:participantId/respond', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    if (classroom.host_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can respond to feedback' });
    }
    
    const participant = await ClassroomParticipant.findById(req.params.participantId);
    if (!participant) return res.status(404).json({ message: 'Participant not found' });
    
    participant.host_response = req.body.response;
    participant.host_responded_at = new Date();
    await participant.save();
    
    res.json({ message: 'Response added', participant });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

`;

let content = fs.readFileSync('backend/routes/classrooms.js', 'utf8');
content = content.replace('module.exports = router;', routes + '\nmodule.exports = router;');
fs.writeFileSync('backend/routes/classrooms.js', content);
console.log("Routes added");
