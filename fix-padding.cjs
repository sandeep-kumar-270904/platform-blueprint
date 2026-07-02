const fs = require('fs');
const path = require('path');
const pagesDir = path.join('src', 'pages');

fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let changed = false;
    content = content.replace(/<Header \/>\s*<div className=\"([^\"]*?)\bpy-([0-9]+)\b([^\"]*?)\">/g, (match, p1, p2, p3) => {
      changed = true;
      return `<Header />\n      <div className="${p1}pt-24 pb-${p2}${p3}">`;
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed padding in ' + file);
    }
  }
});
