const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '../frontend/public/hepco-logo.png');
const buf = fs.readFileSync(imgPath);
const b64 = 'data:image/png;base64,' + buf.toString('base64');
const outPath = path.join(__dirname, '../frontend/src/assets/logoBase64.ts');
fs.writeFileSync(outPath, `export const HEPCO_LOGO = "${b64}";\n`);
console.log('Saved logoBase64.ts with length:', b64.length);
