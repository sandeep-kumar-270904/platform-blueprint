require('dotenv').config();
const mongoose = require('mongoose');
const RepairProvider = require('./models/RepairProvider');
const RepairRequest = require('./models/RepairRequest');
const User = require('./models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/platform-blueprint');
    console.log('Connected to MongoDB');

    // 1. Add gallery to an existing provider
    const provider = await RepairProvider.findOne({ category: 'plumbing' });
    if (provider) {
      provider.gallery = [
        {
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&auto=format&fit=crop',
          type: 'before',
          groupId: 'pipe-fix-1',
          caption: 'Burst pipe before repair',
          category: 'Plumbing',
          order: 1
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1594903332412-f70916a4f5f5?q=80&w=600&auto=format&fit=crop',
          type: 'after',
          groupId: 'pipe-fix-1',
          caption: 'Fixed and insulated pipe',
          category: 'Plumbing',
          order: 2
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=600&auto=format&fit=crop',
          type: 'single',
          caption: 'Completed drain replacement',
          category: 'Plumbing',
          order: 3
        }
      ];
      provider.handlesEmergencies = true;
      await provider.save();
      console.log('Added gallery to provider:', provider.name);
    }
    
    // 2. Add an urgent request
    const testUser = await mongoose.model('User').findOne({ email: 'test@student.edu' });
    if (testUser && provider) {
      await RepairRequest.create({
        providerId: provider._id,
        providerName: provider.name,
        userId: testUser._id,
        issueDescription: 'URGENT: Pipe burst in the kitchen, flooding the floor!',
        category: provider.category,
        preferredDate: new Date(),
        preferredTime: 'ASAP',
        contactPhone: '555-999-1111',
        status: 'In Progress',
        isAsap: true,
        isUrgent: true,
      });
      console.log('Added urgent request for user');
      
      // Add completed requests to compute 'Completed Jobs' stat
      await RepairRequest.create({
        providerId: provider._id,
        providerName: provider.name,
        userId: testUser._id, // could be any user
        issueDescription: 'Fixed leaky faucet',
        category: provider.category,
        preferredDate: new Date(),
        preferredTime: '10:00',
        contactPhone: '555-999-1111',
        status: 'Completed',
      });
      
      await RepairRequest.create({
        providerId: provider._id,
        providerName: provider.name,
        userId: testUser._id, // could be any user
        issueDescription: 'Unclogged shower drain',
        category: provider.category,
        preferredDate: new Date(),
        preferredTime: '12:00',
        contactPhone: '555-999-1111',
        status: 'Completed',
      });
      console.log('Added completed requests to verify Completed Jobs count');
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
