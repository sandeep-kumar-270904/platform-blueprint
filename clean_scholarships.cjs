const fs = require('fs');
let content = fs.readFileSync('backend/routes/scholarships.js', 'utf8');

// The file has a duplicate header. Let's find the first instance of 'const express = require('express');' 
// that occurs after the first line.
const firstExpress = content.indexOf('const express = require(\'express\');', 100);

if (firstExpress !== -1) {
    // The duplicated section seems to end right before `router.get('/match/path/:pathId'`
    const endDuplicate = content.indexOf('router.get(\'/match/path/:pathId\'', firstExpress);
    if (endDuplicate !== -1) {
        // Just remove the chunk from `firstExpress` to `endDuplicate`
        const newContent = content.substring(0, firstExpress) + content.substring(endDuplicate);
        fs.writeFileSync('backend/routes/scholarships.js', newContent);
    }
}
console.log("Done");
