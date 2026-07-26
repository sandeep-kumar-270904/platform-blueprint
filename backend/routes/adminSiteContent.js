const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const SiteNavigation = require('../models/SiteNavigation');
const SiteSettings = require('../models/SiteSettings');

// Middleware to check admin role (assuming req.user is set by auth middleware)
// Since this is generic, we expect the caller app to mount this behind an auth/admin check.

// UPDATE Site Settings
router.put('/settings', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      settings = new SiteSettings({});
    }
    
    // Update fields
    if (req.body.maintenanceMode !== undefined) settings.maintenanceMode = req.body.maintenanceMode;
    if (req.body.announcement) settings.announcement = req.body.announcement;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE Navigation
router.put('/navigation', async (req, res) => {
  try {
    const { groups } = req.body;
    let nav = await SiteNavigation.findOne({ isActive: true });
    if (!nav) {
      nav = new SiteNavigation({ versionName: 'default', isActive: true });
    }

    // Push revision before updating
    nav.revisions.push({
      groups: nav.groups,
      updatedBy: req.user ? req.user.id : null,
      updatedAt: new Date()
    });

    nav.groups = groups;
    await nav.save();
    res.json(nav);
  } catch (error) {
    console.error('Error updating navigation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// REVERT Navigation
router.post('/navigation/revert/:revisionId', async (req, res) => {
  try {
    const nav = await SiteNavigation.findOne({ isActive: true });
    if (!nav) return res.status(404).json({ error: 'Navigation not found' });

    const rev = nav.revisions.id(req.params.revisionId);
    if (!rev) return res.status(404).json({ error: 'Revision not found' });

    // Push current to revisions before reverting
    nav.revisions.push({
      groups: nav.groups,
      updatedBy: req.user ? req.user.id : null,
      updatedAt: new Date()
    });

    nav.groups = rev.groups;
    await nav.save();
    res.json(nav);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// UPSERT Page Content Section
router.put('/content/:pageSlug/:section', async (req, res) => {
  try {
    const { pageSlug, section } = req.params;
    const { content } = req.body;

    let siteContent = await SiteContent.findOne({ pageSlug, section });
    
    if (!siteContent) {
      siteContent = new SiteContent({ pageSlug, section, content });
    } else {
      // Save revision
      siteContent.revisions.push({
        content: siteContent.content,
        updatedBy: req.user ? req.user.id : null,
        updatedAt: new Date()
      });
      siteContent.content = content;
    }

    await siteContent.save();
    res.json(siteContent);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// REVERT Page Content Section
router.post('/content/:pageSlug/:section/revert/:revisionId', async (req, res) => {
  try {
    const { pageSlug, section, revisionId } = req.params;
    
    const siteContent = await SiteContent.findOne({ pageSlug, section });
    if (!siteContent) return res.status(404).json({ error: 'Content not found' });

    const rev = siteContent.revisions.id(revisionId);
    if (!rev) return res.status(404).json({ error: 'Revision not found' });

    // Push current to revisions before reverting
    siteContent.revisions.push({
      content: siteContent.content,
      updatedBy: req.user ? req.user.id : null,
      updatedAt: new Date()
    });

    siteContent.content = rev.content;
    await siteContent.save();
    res.json(siteContent);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all Revisions for a page section
router.get('/content/:pageSlug/:section/revisions', async (req, res) => {
  try {
    const { pageSlug, section } = req.params;
    const siteContent = await SiteContent.findOne({ pageSlug, section }).populate('revisions.updatedBy', 'name email');
    if (!siteContent) return res.json([]);
    res.json(siteContent.revisions || []);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
