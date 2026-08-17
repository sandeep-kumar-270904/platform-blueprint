const axios = require('axios');

async function testConnections() {
    try {
        console.log("Registering a new test user...");
        const email = `testuser_${Date.now()}@example.com`;
        const registerRes = await axios.post('http://localhost:5000/api/auth/register', {
            full_name: 'Connections Test User',
            email: email,
            password: 'password123',
            captchaToken: 'dev_bypass_captcha',
            consent: true
        }, { validateStatus: () => true });
        
        if (registerRes.status !== 201 && registerRes.status !== 200) {
            console.log("Register failed:", registerRes.data);
            return;
        }
        
        const token = registerRes.data.token;
        console.log("Got token.");

        console.log("Fetching /api/alumni/connections/me ...");
        const meRes = await axios.get('http://localhost:5000/api/alumni/connections/me', {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });
        console.log(`Status: ${meRes.status}`);
        console.log("Response:", JSON.stringify(meRes.data).substring(0, 500));

        console.log("Fetching /api/alumni/connections/inbox ...");
        const inboxRes = await axios.get('http://localhost:5000/api/alumni/connections/inbox', {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });
        console.log(`Status: ${inboxRes.status}`);
        console.log("Response:", JSON.stringify(inboxRes.data).substring(0, 500));

    } catch (err) {
        console.error("Test failed:", err.message);
    }
}
testConnections();
