const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function testConnection() {
  console.log("URI in .env starts with:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + '...' : 'undefined');
  try {
    await mongoose.connect(process.env.MONGO_URI, { 
      serverSelectionTimeoutMS: 5000 
    });
    console.log("Connected successfully!");
  } catch (err) {
    console.log("CONNECTION ERROR STACK:");
    console.log(err.stack);
  } finally {
    process.exit(0);
  }
}

testConnection();
