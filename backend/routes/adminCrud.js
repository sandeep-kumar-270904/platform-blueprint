const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AdminActionLog = require('../models/AdminActionLog');
const User = require('../models/User'); // Required to check roles

// Middleware to verify admin status
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Protect all routes
router.use(isAdmin);

// GET /api/admin/collections - Get all registered models
router.get('/', (req, res) => {
  const models = Object.keys(mongoose.models);
  res.json({ collections: models });
});

// Helper to get Mongoose Model safely
const getModel = (modelName) => {
  if (!mongoose.models[modelName]) {
    throw new Error(`Model ${modelName} not found`);
  }
  return mongoose.models[modelName];
};

// GET /api/admin/collections/:modelName - List records with pagination/search
router.get('/:modelName', async (req, res) => {
  try {
    const Model = getModel(req.params.modelName);
    const { page = 1, limit = 50, search = '' } = req.query;
    
    let query = {};
    if (search && search.trim() !== '') {
      // Basic text search across common string fields
      const paths = Object.keys(Model.schema.paths).filter(path => Model.schema.paths[path].instance === 'String');
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: paths.map(path => ({ [path]: searchRegex }))
      };
    }

    // Try to sort by createdAt if it exists
    let sort = {};
    if (Model.schema.paths.createdAt) {
      sort.createdAt = -1;
    } else if (Model.schema.paths.created_at) {
      sort.created_at = -1;
    }

    const records = await Model.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
      
    const total = await Model.countDocuments(query);
    
    res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/admin/collections/:modelName/:id - Get single record
router.get('/:modelName/:id', async (req, res) => {
  try {
    const Model = getModel(req.params.modelName);
    const record = await Model.findById(req.params.id).lean();
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/collections/:modelName/:id - Update record
router.put('/:modelName/:id', async (req, res) => {
  try {
    const Model = getModel(req.params.modelName);
    
    const before = await Model.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Record not found' });

    // Prevent overriding critical fields like _id directly through mass assignment, but allow deep edits
    const updateData = { ...req.body };
    delete updateData._id;

    // We use findOneAndUpdate to apply updates
    const after = await Model.findOneAndUpdate({ _id: req.params.id }, updateData, { new: true, runValidators: true }).lean();

    // Log the action
    await AdminActionLog.create({
      adminId: req.adminUser._id,
      actionType: 'crud_update',
      modelName: req.params.modelName,
      targetId: req.params.id,
      reason: 'Admin Panel CRUD Update',
      changes: { before, after }
    });

    res.json(after);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/admin/collections/:modelName/:id - Delete (or soft delete)
router.delete('/:modelName/:id', async (req, res) => {
  try {
    const Model = getModel(req.params.modelName);
    const before = await Model.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Record not found' });

    // Soft delete policy implementation
    let actionType = 'crud_delete';
    
    if (req.params.modelName === 'User') {
      // For users, soft delete
      await Model.updateOne({ _id: req.params.id }, { $set: { banned: true, deleted: true, banReason: 'Deleted via Admin Panel' } });
      actionType = 'crud_soft_delete';
    } else {
      // Hard delete for other things, unless they have a standard deleted flag
      if (Model.schema.paths.isDeleted) {
        await Model.updateOne({ _id: req.params.id }, { $set: { isDeleted: true } });
        actionType = 'crud_soft_delete';
      } else {
        await Model.deleteOne({ _id: req.params.id });
      }
    }

    await AdminActionLog.create({
      adminId: req.adminUser._id,
      actionType,
      modelName: req.params.modelName,
      targetId: req.params.id,
      reason: 'Admin Panel CRUD Delete',
      changes: { before, after: null }
    });

    res.json({ message: 'Record deleted', actionType });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
