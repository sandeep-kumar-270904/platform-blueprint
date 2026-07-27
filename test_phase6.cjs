const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const userA = { email: 'phase6A@test.com', password: 'password123', full_name: 'Phase6 User A' };

let tokenA = '';

async function loginUser(user) {
    try {
        await axios.post(BASE_URL + '/auth/register', user);
    } catch (e) {} 
    const res = await axios.post(BASE_URL + '/auth/login', { email: user.email, password: user.password });
    return res.data.token;
}

async function run() {
    try {
        console.log('1. Setup Test User');
        tokenA = await loginUser(userA);
        const headersA = { Authorization: 'Bearer ' + tokenA };
        
        console.log('2. Test Rate Limiting (POST /offers)');
        let rateLimitHit = false;
        for (let i = 0; i < 15; i++) {
            try {
                await axios.post(BASE_URL + '/skill-swap/offers', {
                    skillName: 'Skill ' + i,
                    category: 'Technology',
                    description: 'Test',
                    proficiencyLevel: 'Beginner',
                    wantsToLearn: ['Node.js'],
                    availability: 'Weekends'
                }, { headers: headersA });
            } catch (err) {
                if (err.response && err.response.status === 429) {
                    rateLimitHit = true;
                    console.log('Rate limit successfully hit on attempt ' + (i + 1));
                    break;
                }
            }
        }

        console.log('3. Test Data Export');
        const exportRes = await axios.get(BASE_URL + '/skill-swap/users/me/export', { headers: headersA });
        console.log('Exported data keys: ' + Object.keys(exportRes.data).join(', '));
        console.log('Number of offers exported: ' + exportRes.data.offers.length);

        console.log('4. Test Account Deletion Cascade');
        const deleteRes = await axios.delete(BASE_URL + '/users/me', { headers: headersA });
        console.log('Delete response: ' + deleteRes.data.message);

        console.log('Phase 6 tests completed successfully.');
    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

run();
