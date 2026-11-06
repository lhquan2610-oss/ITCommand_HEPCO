const fs = require('fs');
const path = require('path');

const src = 'C:/Users/lhquan.HEPCO/.gemini/antigravity/brain/b050b093-6507-4ee3-813b-38af30295d88/.user_uploaded/media_1793890755096_3ef6fec2.jpg';
if (fs.existsSync(src)) {
  const data = fs.readFileSync(src);
  const base64 = 'data:image/jpeg;base64,' + data.toString('base64');
  fs.writeFileSync('frontend/public/hepco-logo.png', data);
  fs.writeFileSync('frontend/public/favicon.png', data);
  fs.writeFileSync('frontend/electron/icon.png', data);
  fs.writeFileSync('frontend/src/assets/logoBase64.ts', `export const HEPCO_LOGO = "${base64}";\n`);
  console.log('Logo updated successfully! Bytes:', data.length);
} else {
  console.log('Source file not found:', src);
}
