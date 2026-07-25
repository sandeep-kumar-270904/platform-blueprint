async function testExport() {
  const mongoose = require('mongoose');
  
  // 1. Get dev server admin token from dev server DB by logging in
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@studenthub.com', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const adminToken = loginData.token;
  if (!adminToken) {
    console.error("Login failed!", loginData);
    process.exit(1);
  }
  
  const articleId = new mongoose.Types.ObjectId().toString();
  
  // 3. Create collection via API
  const colRes = await fetch('http://localhost:5000/api/news/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'My Public Collection' })
  });
  const colData = await colRes.json();
  console.log("Collection POST response:", colData);
  const collectionId = colData._id;
  
  // 4. Create bookmark via API
  await fetch(`http://localhost:5000/api/news/${articleId}/bookmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ collectionId })
  });
  
  console.log("Collection created:", collectionId);
  
  // 5. Hit the shared route logic directly
  const res = await fetch(`http://localhost:5000/api/news/collections/${collectionId}/shared`);
  const data = await res.json();
  
  if (data && data.articles && data.articles.length > 0) {
    console.log("SUCCESS: Public collection is readable.");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("FAILED to read public collection.", data);
  }
  
  process.exit(0);
}
testExport();
