const http = require('http');
const fs = require('fs');

const request = (method, path, headers = {}, body = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

(async () => {
    try {
        console.log("Testing GET /api/scholarships without auth...");
        let res = await request('GET', '/api/scholarships');
        console.log(`Status: ${res.status}, isArray: ${Array.isArray(res.data.data || res.data)}`);

        console.log("Testing GET /api/scholarships/saved without auth...");
        res = await request('GET', '/api/scholarships/saved');
        console.log(`Status: ${res.status} (Expected 401)`);
        
        console.log("Testing GET /api/scholarships with invalid query...");
        res = await request('GET', '/api/scholarships?limit=invalid');
        console.log(`Status: ${res.status}`);
        
        // Also check if data is hardcoded (stub)
        if (res.data.data && res.data.data.length > 0) {
            console.log(`First item title: ${res.data.data[0].title}`);
        } else {
            console.log("No items returned (good if DB is empty, otherwise check if mock data is used)");
        }
    } catch (e) {
        console.error(e);
    }
})();
