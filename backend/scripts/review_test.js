const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://avinash:anitha@cluster0.gznlyfi.mongodb.net/platform-blueprint?retryWrites=true&w=majority&appName=Cluster0";
const BASE_URL = 'http://localhost:5000';
const COLLEGE_ID = '6a7785cd960a8f5c09db4d91';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNzc4NjdhZDg3ZTk1Y2UyYzBjNzYwMyIsImlhdCI6MTc4NjIxODEwNiwiZXhwIjoxNzg4ODEwMTA2fQ.Smj2_7i9y1o_wYXXuLiFX-UmLzGkAwjAvuMOKDOAcUU';

async function run() {
  const res = await fetch(`${BASE_URL}/api/colleges/${COLLEGE_ID}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ title: 'test', reviewText: 'test test test test test', rating: 4, categoryRatings: { academics: 4 } })
  });
  console.log(res.status, await res.text());
}
run();
