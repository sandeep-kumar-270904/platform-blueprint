const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const calendarService = require('../services/calendarService');
const CalendarConnection = require('../models/CalendarConnection');
const jwt = require('jsonwebtoken');

// Initiates OAuth Flow
router.get('/auth/google', authMiddleware, (req, res) => {
  // Pass user ID in state to link accounts on callback
  const state = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '10m' });
  
  const url = calendarService.getAuthUrl();
  res.redirect(`${url}&state=${state}`);
});

// OAuth Callback
router.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}/dashboard?calendar=error`);
  }

  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET || 'secret');
    await calendarService.handleCallback(code, decoded.id);
    res.redirect(`${frontendUrl}/dashboard?calendar=success`);
  } catch (err) {
    console.error('Calendar auth error:', err);
    res.redirect(`${frontendUrl}/dashboard?calendar=error`);
  }
});

// Get connection status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const conn = await CalendarConnection.findOne({ user_id: req.user.id });
    if (!conn) {
      return res.json({ connected: false });
    }
    res.json({ 
      connected: true, 
      status: conn.syncStatus, 
      accountId: conn.accountId,
      lastSyncAt: conn.lastSyncAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Disconnect
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    await CalendarConnection.findOneAndDelete({ user_id: req.user.id });
    res.json({ message: 'Calendar disconnected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
