// Run: node generate-icons.js
// Requires: npm install sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'icons', 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(__dirname, 'icons', 'icon-192.png'));
  console.log('✅ icon-192.png generated');
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(__dirname, 'icons', 'icon-512.png'));
  console.log('✅ icon-512.png generated');
}

generate().catch(console.error);
