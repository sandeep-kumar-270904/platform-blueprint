const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const http = require('http');

async function runLiveBrowserVerification() {
  console.log('=== STARTING LIVE BROWSER NOTIFICATION CLICK-THROUGH AUDIT ===\n');

  // 1. Start test backend server on port 5055
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  const mockNotifications = [
    {
      _id: "notif-browser-1",
      type: "group_join_request",
      message: "User B requested to join your Study Group: Private AI Lab",
      isRead: false,
      relatedContentId: "group-ai-999",
      createdAt: new Date().toISOString()
    },
    {
      _id: "notif-browser-2",
      type: "group_session_scheduled",
      message: "New session scheduled in Study Group: Quantum Computing",
      isRead: false,
      relatedContentId: "group-qc-888",
      createdAt: new Date().toISOString()
    }
  ];

  app.get('/api/notifications/unread-count', (req, res) => {
    res.json({ count: mockNotifications.filter(n => !n.isRead).length });
  });

  app.get('/api/notifications', (req, res) => {
    res.json({ notifications: mockNotifications });
  });

  app.get('/api/study-groups/:id', (req, res) => {
    res.json({
      _id: req.params.id,
      name: req.params.id === 'group-ai-999' ? 'Private AI Lab' : 'Quantum Computing',
      description: 'Live browser verification test group',
      isPrivate: req.params.id === 'group-ai-999',
      members: [
        { user: { _id: "test-owner-id", full_name: "Owner User", email: "owner@test.com" }, role: "owner", status: "active" }
      ],
      owner: "test-owner-id"
    });
  });

  // Catch-all for any other dashboard widget fetches
  app.use((req, res) => {
    res.status(200).json([]);
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5055, resolve));
  console.log(' [TEST SERVER] Mock API Server listening on port 5055');

  // 2. Launch Chromium via Playwright
  console.log(' [PLAYWRIGHT] Launching headless Chromium browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log(' [PLAYWRIGHT] Navigating to local Vite app (http://localhost:5179)...');
    await page.goto('http://localhost:5179/', { waitUntil: 'domcontentloaded' });
    
    // Inject auth token so app recognizes user as logged in
    await page.evaluate(() => {
      localStorage.setItem('token', 'dummy-jwt-token-for-browser-test');
    });

    console.log(' [PLAYWRIGHT] Navigating to /dashboard...');
    await page.goto('http://localhost:5179/dashboard', { waitUntil: 'networkidle' });

    console.log(' [PLAYWRIGHT] Current page URL:', page.url());

    // Find and click Notification Bell
    console.log(' [PLAYWRIGHT] Locating Notification Bell button...');
    const bellButton = page.locator('button:has(svg.lucide-bell)').first();
    await bellButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log(' [PLAYWRIGHT] Clicking Notification Bell button...');
    await bellButton.click();

    // 3. Test Join Request Notification Click
    console.log(' [PLAYWRIGHT] Waiting for join request notification in popover...');
    const joinNotif = page.locator('text="User B requested to join your Study Group: Private AI Lab"').first();
    await joinNotif.waitFor({ state: 'visible', timeout: 5000 });
    console.log(' [PLAYWRIGHT] Found join request notification in live DOM! Clicking it...');
    await joinNotif.click();

    await page.waitForURL('**/study-groups/group-ai-999?tab=manage', { timeout: 10000 });
    const urlAfterJoinClick = page.url();
    console.log('\n========================================================================');
    console.log(' [VERIFIED LIVE BROWSER CLICK 1] Join Request Notification');
    console.log(' Action: Clicked notification item in live browser popover');
    console.log(' Expected URL ending: /study-groups/group-ai-999?tab=manage');
    console.log(' Actual Result URL:', urlAfterJoinClick);
    console.log(' Status: SUCCESS (Live Browser Navigation Confirmed)');
    console.log('========================================================================\n');

    // 4. Test Session Scheduled Notification Click
    console.log(' [PLAYWRIGHT] Clicking Notification Bell again...');
    await bellButton.click();
    console.log(' [PLAYWRIGHT] Waiting for session scheduled notification in popover...');
    const sessionNotif = page.locator('text="New session scheduled in Study Group: Quantum Computing"').first();
    await sessionNotif.waitFor({ state: 'visible', timeout: 5000 });
    console.log(' [PLAYWRIGHT] Found session notification in live DOM! Clicking it...');
    await sessionNotif.click();

    await page.waitForURL('**/study-groups/group-qc-888?tab=sessions', { timeout: 10000 });
    const urlAfterSessionClick = page.url();
    console.log('\n========================================================================');
    console.log(' [VERIFIED LIVE BROWSER CLICK 2] Session Scheduled Notification');
    console.log(' Action: Clicked notification item in live browser popover');
    console.log(' Expected URL ending: /study-groups/group-qc-888?tab=sessions');
    console.log(' Actual Result URL:', urlAfterSessionClick);
    console.log(' Status: SUCCESS (Live Browser Navigation Confirmed)');
    console.log('========================================================================\n');

    console.log('=== ALL LIVE BROWSER NOTIFICATION CLICK AUDITS PASSED ===');

  } catch (error) {
    console.error(' [ERROR] Live browser test failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

runLiveBrowserVerification();
