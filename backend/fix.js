const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'routes/news.js');
let content = fs.readFileSync(file, 'utf8');

const regex = /const assessModeration = async \(text\) => {[\s\S]*?return { flagged: false };\n};/;

// Find all matches
let matches = [];
let m;
const globalRegex = new RegExp(regex, 'g');
while ((m = globalRegex.exec(content)) !== null) {
  matches.push({ start: m.index, end: globalRegex.lastIndex });
}

console.log(`Found ${matches.length} matches`);

if (matches.length > 1) {
  // Remove the second one
  const m2 = matches[1];
  content = content.substring(0, m2.start) + content.substring(m2.end);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Removed duplicate.");
}
