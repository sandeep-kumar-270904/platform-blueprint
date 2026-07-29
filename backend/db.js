const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    try {
      // First try to connect to the provided URI (Atlas) with a short timeout
      console.log('Attempting to connect to MongoDB Atlas...');
      const conn = await mongoose.connect(mongoUri, { 
        family: 4,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 100 // Connection pooling
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      
      mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      return;
    } catch (atlasErr) {
      console.log(`Failed to connect to Atlas (${atlasErr.message}). Falling back to in-memory MongoDB...`);
    }

    // Fallback to in-memory server
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    const conn = await mongoose.connect(mongoUri, { family: 4 });
    console.log(`MongoDB (In-Memory) Connected: ${conn.connection.host}`);

    const seedLocalFallback = require('./scripts/seedLocalFallback');
    await seedLocalFallback();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
