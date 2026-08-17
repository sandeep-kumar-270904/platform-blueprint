const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const College = require('./models/College');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const college = await College.findOne();
  if (!college) return console.log("No college found");
  
  const res = await axios.get(`http://localhost:5000/api/colleges/${college._id}/reality-check`);
  console.log("Reality Check Response:");
  console.log(JSON.stringify(res.data, null, 2));
  process.exit(0);
}
run();
