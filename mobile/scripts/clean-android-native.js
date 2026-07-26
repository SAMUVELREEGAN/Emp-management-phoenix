const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');

function removeIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`Removed ${targetPath}`);
  }
}

function walkAndRemoveCxx(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.cxx') {
        removeIfExists(fullPath);
      } else if (entry.name !== 'node_modules' || dir === mobileRoot) {
        walkAndRemoveCxx(fullPath);
      }
    }
  }
}

removeIfExists(path.join(mobileRoot, 'android', 'app', 'build'));
removeIfExists(path.join(mobileRoot, 'android', 'app', '.cxx'));
walkAndRemoveCxx(path.join(mobileRoot, 'node_modules'));
console.log('Android native caches cleaned.');
