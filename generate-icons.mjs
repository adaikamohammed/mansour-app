// Script to copy logo.png as icons for PWA
// Uses only built-in Node.js modules - no dependencies needed
import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'public');

const src = join(publicDir, 'logo.png');

if (!existsSync(src)) {
  console.error('❌ logo.png not found in public/');
  process.exit(1);
}

// Copy logo as different icon sizes
// (Browser will scale them as needed)
copyFileSync(src, join(publicDir, 'icon-192.png'));
copyFileSync(src, join(publicDir, 'icon-512.png'));
copyFileSync(src, join(publicDir, 'apple-touch-icon.png'));

console.log('✅ icon-192.png created');
console.log('✅ icon-512.png created');
console.log('✅ apple-touch-icon.png created');
console.log('');
console.log('🎉 Icons ready! Now commit and deploy to Vercel.');
