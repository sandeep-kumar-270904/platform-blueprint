const puppeteer = require('puppeteer');
const axios = require('axios');

async function run() {
    let browser;
    try {
        console.log("Registering test user...");
        const email = `testuser_${Date.now()}@example.com`;
        const registerRes = await axios.post('http://localhost:5000/api/auth/register', {
            full_name: 'UI Test User',
            email: email,
            password: 'password123',
            captchaToken: 'dev_bypass_captcha',
            consent: true
        });
        const token = registerRes.data.token;
        console.log("Token acquired.");

        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        // Setup console listening
        page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`));
        page.on('pageerror', err => console.log(`[BROWSER ERROR]: ${err.toString()}`));

        // Setup network listening
        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('/api/')) {
                console.log(`[NETWORK] ${response.request().method()} ${url} - Status: ${response.status()}`);
            }
        });

        // Set token in localStorage/cookie so we are authenticated
        await page.goto('http://localhost:8080');
        await page.evaluate((t) => {
            localStorage.setItem('token', t);
        }, token);

        console.log("Navigating to Connections Hub...");
        await page.goto('http://localhost:8080/alumni/connections', { waitUntil: 'networkidle0' });
        
        console.log("Page loaded successfully.");

    } catch (err) {
        console.error("Test error:", err);
    } finally {
        if (browser) await browser.close();
    }
}
run();
