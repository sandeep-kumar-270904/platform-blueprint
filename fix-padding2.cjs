const fs = require('fs');
const path = require('path');
const pagesDir = path.join('src', 'pages');

fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let changed = false;
    content = content.replace(/<Header \/>\s*<([a-zA-Z]+) className=\"([^\"]*?)\bpy-([0-9]+)\b([^\"]*?)\">/g, (match, tag, p1, p2, p3) => {
      changed = true;
      return `<Header />\n      <${tag} className="${p1}pt-24 pb-${p2}${p3}">`;
    });
    // also catch mt- cases if any
    content = content.replace(/<Header \/>\s*<([a-zA-Z]+) className=\"([^\"]*?)\bmt-([0-9]+)\b([^\"]*?)\">/g, (match, tag, p1, p2, p3) => {
       // if we have mt- we just replace with pt-24
       if(p2 < 24) {
          changed = true;
          return `<Header />\n      <${tag} className="${p1}pt-24${p3}">`;
       }
       return match;
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed padding in ' + file);
    }
  }
});
