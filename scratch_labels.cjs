const fs = require('fs');
const glob = require('glob');

const files = glob.sync('C:/Users/edhub/Desktop/Anti Gravity Projects/platform-blueprint/src/**/*.tsx');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  
  content = content.replace(/<Label>([^<]+)<\/Label>\s*<(Input|Textarea)([^>]*)>/g, (match, labelText, tag, attrs) => {
    let id = labelText.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!attrs.includes('id=')) {
      return `<Label htmlFor="${id}">${labelText}</Label><${tag} id="${id}"${attrs}>`;
    }
    return match;
  });

  if (content !== orig) {
    fs.writeFileSync(file, content);
    changed++;
  }
});
console.log('Fixed labels in ' + changed + ' files');
