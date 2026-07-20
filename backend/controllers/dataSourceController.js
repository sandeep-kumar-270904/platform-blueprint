const ScholarshipDataSource = require('../models/ScholarshipDataSource');
const { runApiSync } = require('../services/apiSyncService');

exports.createDataSource = async (req, res) => {
  try {
    const {
      name, apiEndpoint, authMethod, credentialsRef, 
      syncFrequency, fieldMapping, verifiedApiDocUrl
    } = req.body;

    // Hard compliance check: must provide verifiedApiDocUrl
    if (!verifiedApiDocUrl) {
      return res.status(400).json({ 
        message: 'A verifiedApiDocUrl is required to confirm this is a genuine public/partner API. Sites like Buddy4Study are NOT permitted.' 
      });
    }

    const dataSource = new ScholarshipDataSource({
      name,
      apiEndpoint,
      authMethod,
      credentialsRef,
      syncFrequency,
      fieldMapping,
      isActive: false, // explicitly false initially
      createdBy: req.user.id
    });

    await dataSource.save();
    res.status(201).json(dataSource);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateDataSource = async (req, res) => {
  try {
    const dataSource = await ScholarshipDataSource.findById(req.params.id);
    if (!dataSource) return res.status(404).json({ message: 'Data source not found' });

    const updatableFields = ['name', 'apiEndpoint', 'authMethod', 'credentialsRef', 'syncFrequency', 'fieldMapping', 'isActive'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        dataSource[field] = req.body[field];
      }
    });

    await dataSource.save();
    res.json(dataSource);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDataSources = async (req, res) => {
  try {
    const sources = await ScholarshipDataSource.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(sources);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.triggerSyncNow = async (req, res) => {
  try {
    const dataSource = await ScholarshipDataSource.findById(req.params.id);
    if (!dataSource) return res.status(404).json({ message: 'Data source not found' });

    // Trigger sync asynchronously to not block the request
    runApiSync(dataSource._id).catch(err => console.error('Manual sync failed:', err));

    res.json({ message: 'Sync triggered successfully', dataSourceId: dataSource._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
