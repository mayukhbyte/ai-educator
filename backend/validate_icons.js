const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = getFiles('c:/Projects/ai educator/frontend/src');
const iconRegex = /from ['"]@mui\/icons-material\/([^'"]+)['"]/g;
const icons = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = iconRegex.exec(content)) !== null) {
    icons.push({ icon: match[1], file: f });
  }
});

console.log('Total icon imports found:', icons.length);
const iconsDir = 'c:/Projects/ai educator/frontend/node_modules/@mui/icons-material';
let hasError = false;
for (const item of icons) {
  const existsJs = fs.existsSync(path.join(iconsDir, item.icon + '.js'));
  const existsDts = fs.existsSync(path.join(iconsDir, item.icon + '.d.ts'));
  if (!existsJs && !existsDts) {
    console.error('MISSING ICON:', item.icon, 'in file:', item.file);
    hasError = true;
  }
}
if (!hasError) console.log('All MUI icons verified successfully!');
