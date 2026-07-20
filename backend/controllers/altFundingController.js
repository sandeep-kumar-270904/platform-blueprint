const AlternativeFundingResource = require('../models/AlternativeFundingResource');

exports.createResource = async (req, res) => {
  try {
    const { title, category, description, applicableRegions, externalUrl, isActive } = req.body;
    const resource = new AlternativeFundingResource({
      title,
      category,
      description,
      applicableRegions,
      externalUrl,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });
    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAdminResources = async (req, res) => {
  try {
    const resources = await AlternativeFundingResource.find({}).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const resource = await AlternativeFundingResource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Not found' });

    const { title, category, description, applicableRegions, externalUrl, isActive } = req.body;
    if (title !== undefined) resource.title = title;
    if (category !== undefined) resource.category = category;
    if (description !== undefined) resource.description = description;
    if (applicableRegions !== undefined) resource.applicableRegions = applicableRegions;
    if (externalUrl !== undefined) resource.externalUrl = externalUrl;
    if (isActive !== undefined) resource.isActive = isActive;

    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPublicResources = async (req, res) => {
  try {
    const { category, region } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (region) filter.applicableRegions = region; // Matches if array contains string

    const resources = await AlternativeFundingResource.find(filter).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
