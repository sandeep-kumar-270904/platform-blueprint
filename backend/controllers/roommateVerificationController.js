const RoommateProfile = require('../models/RoommateProfile');
const RoommateVerificationRequest = require('../models/RoommateVerificationRequest');
const crypto = require('crypto');

// In a real app, this would be stored in Redis/DB or JWT
// We'll use a global mock store for the demo since it's a prototype phase
const mockEmailTokens = new Map();

exports.requestEmailCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.endsWith('.edu')) {
      // Don't hard-block, but flag it logically (for this prototype, we'll allow it but warn, or just accept it as valid for demo purposes)
      // The prompt asks to accept it if we don't maintain a list, but routing to manual review if it doesn't match a pattern.
      // We'll enforce a strict .edu check for the auto-email flow, and tell them to use ID upload otherwise.
      if (!email.includes('@')) return res.status(400).json({ message: 'Invalid email format.' });
      
      if (!email.endsWith('.edu') && !email.endsWith('.ac.uk')) {
        return res.status(400).json({ 
          message: 'Email does not appear to be a recognized university domain. Please use the Student ID upload option for manual review instead.' 
        });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    mockEmailTokens.set(req.user.id, { code, email, expires: Date.now() + 15 * 60 * 1000 });

    // Mock sending email
    console.log(`[MOCK EMAIL] To: ${email} | Your Roommate Finder verification code is: ${code}`);

    res.json({ message: 'Verification code sent to your email (check server console for the mock code).' });
  } catch (error) {
    console.error('Error requesting email code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.confirmEmailCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    const tokenData = mockEmailTokens.get(req.user.id);
    if (!tokenData) {
      return res.status(400).json({ message: 'No verification request found. Please request a new code.' });
    }

    if (Date.now() > tokenData.expires) {
      mockEmailTokens.delete(req.user.id);
      return res.status(400).json({ message: 'Verification code expired. Please request a new code.' });
    }

    if (tokenData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    // Success! Update profile
    const profile = await RoommateProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Roommate profile not found.' });
    }

    // Don't downgrade if they are already ID verified
    if (profile.verificationStatus !== 'id_verified') {
      profile.verificationStatus = 'email_verified';
      await profile.save();
    }

    // Cleanup
    mockEmailTokens.delete(req.user.id);

    res.json({ message: 'Email verified successfully!', verificationStatus: profile.verificationStatus });
  } catch (error) {
    console.error('Error confirming email code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.requestIdReview = async (req, res) => {
  try {
    const { idPhotoUrl } = req.body;
    if (!idPhotoUrl) {
      return res.status(400).json({ message: 'Student ID photo URL is required.' });
    }

    const profile = await RoommateProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Roommate profile not found.' });
    }

    // Check if there's already a pending request
    const existing = await RoommateVerificationRequest.findOne({ user: req.user.id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending Student ID review.' });
    }

    const request = new RoommateVerificationRequest({
      user: req.user.id,
      idPhotoUrl
    });

    await request.save();

    res.status(201).json({ message: 'Student ID submitted for review.', request });
  } catch (error) {
    console.error('Error submitting ID review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const profile = await RoommateProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const pendingRequest = await RoommateVerificationRequest.findOne({ user: req.user.id, status: 'pending' });

    res.json({
      verificationStatus: profile.verificationStatus,
      hasPendingIdReview: !!pendingRequest
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
