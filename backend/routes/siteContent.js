const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const SiteNavigation = require('../models/SiteNavigation');
const SiteSettings = require('../models/SiteSettings');

// GET all site global settings, active navigation, and optionally content for a specific page
router.get('/', async (req, res) => {
  try {
    const { pageSlug } = req.query;
    
    // Fetch settings (assume one singleton document, create if not exists)
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    // Fetch active navigation
    let activeNav = await SiteNavigation.findOne({ isActive: true });
    if (!activeNav) {
      activeNav = { groups: [] };
    }

    // Fetch content if pageSlug is provided
    let pageContent = [];
    if (pageSlug) {
      pageContent = await SiteContent.find({ pageSlug });
    }

    res.json({
      settings,
      navigation: activeNav,
      pageContent
    });
  } catch (error) {
    console.error('Error fetching site content:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET specific page content
router.get('/page/:pageSlug', async (req, res) => {
  try {
    const content = await SiteContent.find({ pageSlug: req.params.pageSlug });
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
