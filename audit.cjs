const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' 
  });
  const page = await browser.newPage();
  
  const pagesToVisit = [
    { name: 'College List/Search', url: 'http://localhost:8080/college-insights' },
    { name: 'College Profile', url: 'http://localhost:8080/colleges/6a76ad50aae0dc13badab564' },
    { name: 'Community Feed', url: 'http://localhost:8080/community' },
    { name: 'Alumni Directory', url: 'http://localhost:8080/mentors/alumni' },
    { name: 'Alumni Connections', url: 'http://localhost:8080/alumni/connections' },
    { name: 'AI Mentor', url: 'http://localhost:8080/ai-mentor' },
    { name: 'Admin Moderation Panel', url: 'http://localhost:8080/admin' }
  ];

  for (const p of pagesToVisit) {
    console.log(`\n================================`);
    console.log(`Loading: ${p.name} (${p.url})`);
    console.log(`================================`);
    
    page.removeAllListeners('console');
    
    let hasOutput = false;
    page.on('console', msg => {
      hasOutput = true;
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    try {
      // Go to a lightweight page on the same origin first to set localStorage
      await page.goto('http://localhost:8080/robots.txt', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNzc2OTgwZmVkOTFiMTkyZmFiNjEyYSIsImVtYWlsIjoiYXVkaXQ0QHRlc3QuY29tIiwidXNlcm5hbWUiOiJhdWRpdDQiLCJpYXQiOjE3ODYyMTA2ODgsImV4cCI6MTc4NjIxNDI4OH0.V7QQIepS0EmUWq7pqnUcNmzjUx6J0ZRq-zs9PG8LpNc');
      });

      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 8000 });
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.log(`[PAGE ERROR] Failed to load ${p.name}: ${err.message}`);
      hasOutput = true;
    }
    
    if (!hasOutput) {
      console.log('zero console output');
    }
  }

  await browser.close();
})();
