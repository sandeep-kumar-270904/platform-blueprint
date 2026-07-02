const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const gradientBgRegex = /bg-gradient-to-[a-brtl]+\s+(from-[a-zA-Z0-9/-]+)?\s*(via-[a-zA-Z0-9/-]+)?\s*(to-[a-zA-Z0-9/-]+)?/g;
const textGradientRegex = /bg-clip-text text-transparent/g;
const shadowRegex = /shadow-(glow|hover|card)/g;
const animateFloatRegex = /animate-float/g;

walk(directoryPath, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace gradient background containers
    content = content.replace(/bg-gradient-to-b from-background via-primary\/5 to-accent\/5/g, 'bg-background');
    content = content.replace(/<div className="absolute inset-0 bg-gradient-[^"]+" \/>/g, '');
    
    // Replace gradient text
    content = content.replace(/bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent/g, 'text-foreground display-font');
    content = content.replace(/bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent/g, 'text-foreground display-font');
    content = content.replace(/bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent/g, 'text-foreground display-font');
    
    // Replace specific dashboard card gradients
    content = content.replace(/bg-gradient-to-br from-primary\/5 to-accent\/5 border-primary\/20/g, 'border-border bg-card');

    // Replace other gradients
    content = content.replace(gradientBgRegex, 'bg-primary text-primary-foreground');
    content = content.replace(textGradientRegex, '');

    // Replace shadows
    content = content.replace(shadowRegex, 'shadow-sm');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  }
});
