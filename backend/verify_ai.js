require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

async function testEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studenthub');
    
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.log("No user found");
      return;
    }
    
    const token = jwt.sign({ user: { id: user.id, role: user.role } }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
    
    const res = await fetch('http://localhost:5000/api/quizzes/ai-draft-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'React Hooks',
        difficulty: 'medium',
        count: 3
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
    
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}

testEndpoint();
