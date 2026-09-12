const TechnologyTaxonomy = require('../models/TechnologyTaxonomy');

// @desc    Get all taxonomies
// @route   GET /api/taxonomy
// @access  Public
exports.getTaxonomies = async (req, res) => {
  try {
    const taxonomies = await TechnologyTaxonomy.find({ isActive: true }).sort({ category: 1, name: 1 });
    
    // Group by category for the UI
    const grouped = taxonomies.reduce((acc, tech) => {
      if (!acc[tech.category]) {
        acc[tech.category] = [];
      }
      acc[tech.category].push(tech);
      return acc;
    }, {});

    res.status(200).json({ success: true, data: grouped, flat: taxonomies });
  } catch (error) {
    console.error('Get Taxonomies Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
