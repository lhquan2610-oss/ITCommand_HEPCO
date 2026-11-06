const fs = require('fs');
const path = require('path');

const ALLOWED_DEPTS = [
  'Máy chủ',
  'Camera',
  'Máy in',
  'Scan',
  'Photocopy',
  'Ban Lãnh Đạo',
  'Phòng Tổ chức - Hành chính',
  'Phòng Kỹ thuật',
  'Phòng Kế toán - Tài vụ',
  'Phòng Kế hoạch',
  'Xí nghiệp Môi trường Bắc sông Hương',
  'Xí nghiệp Môi trường Nam sông Hương',
  'Xí nghiệp Điện chiếu sáng',
  'Xí nghiệp Vận chuyển - Cơ khí',
  'Xí nghiệp Thoát nước',
  'Xí nghiệp Xử lý chất thải',
  'Ban quản trang',
  'Trạm cân'
];

const invPath = path.join(__dirname, '../data/devices_inventory.json');
const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

function standardizeDepartment(dev) {
  const code = (dev.device_code || '').toUpperCase();
  const name = (dev.assigned_user || dev.display_name || '').toLowerCase();
  const oldDept = (dev.department || '').toLowerCase();
  const ip = dev.ip || '';
  const cat = dev.category || '';

  // 1. Máy chủ
  if (cat === 'SERVER' || ip.startsWith('10.0.0.1') || ip.startsWith('10.0.0.5') || ip.startsWith('10.0.0.8') || ip.startsWith('10.0.0.16') || ip.startsWith('192.168.1.104') || ip.startsWith('192.168.1.118') || ip.startsWith('10.1.1.7')) {
    return 'Máy chủ';
  }

  // 2. Camera & NVR
  if (cat === 'CAMERA' || ip.startsWith('10.110.1.') || name.includes('camera') || name.includes('nvr') || name.includes('dahua') || name.includes('hikvision')) {
    return 'Camera';
  }

  // 3. Photocopy
  if (name.includes('ricoh') || name.includes('photocopy') || name.includes('mp 7502') || name.includes('mp 7503') || name.includes('photo')) {
    return 'Photocopy';
  }

  // 4. Scan
  if (name.includes('scan') || name.includes('scanjet') || name.includes('máy quét')) {
    return 'Scan';
  }

  // 5. Máy in
  if (cat === 'PRINTER' || ip.startsWith('10.1.1.43') || ip.startsWith('10.1.1.101') || ip.startsWith('10.2.0.11') || ip.startsWith('10.2.0.50') || ip.startsWith('10.2.1.54') || ip.startsWith('10.2.1.55') || ip.startsWith('10.11.1.58') || ip.startsWith('10.30.1.31')) {
    return 'Máy in';
  }

  // 6. Trạm cân
  if (name.includes('trạm cân') || name.includes('phiếu cân') || code === 'XLCT04' || ip.startsWith('10.40.1.')) {
    return 'Trạm cân';
  }

  // 7. Ban Lãnh Đạo
  if (
    code.includes('CTHĐQT') || code.includes('TTHĐQT') || code.includes('TGĐ') || code.includes('PTGĐ') ||
    name.includes('phan lê hiến') || name.includes('dương thị huệ') || name.includes('trần quốc khánh') ||
    name.includes('lê vĩnh thắng') || name.includes('trần hữu ân')
  ) {
    return 'Ban Lãnh Đạo';
  }

  // 8. Phòng Tổ chức - Hành chính
  if (
    code.startsWith('TC') || oldDept.includes('tổ chức') || oldDept.includes('hành chính') || oldDept.includes('cntt') ||
    name.includes('huy vũ') || name.includes('hải hà') || name.includes('hữu nhân') || name.includes('lam trà') ||
    name.includes('minh châu') && code.includes('TC') || name.includes('hồng nhung') || name.includes('huỳnh phương') ||
    name.includes('lê hồng quân') || name.includes('lhquan')
  ) {
    return 'Phòng Tổ chức - Hành chính';
  }

  // 9. Phòng Kế toán - Tài vụ
  if (
    code.startsWith('TV') || oldDept.includes('kế toán') || oldDept.includes('tài vụ') ||
    name.includes('phi hải') || name.includes('mỹ hảo') || name.includes('lan hương') ||
    name.includes('xuân hòa') || name.includes('trang') && oldDept.includes('kế toán') ||
    name.includes('khánh thu') || name.includes('minh châu') && code.includes('TV')
  ) {
    return 'Phòng Kế toán - Tài vụ';
  }

  // 10. Phòng Kỹ thuật
  if (
    code.startsWith('KT') || oldDept.includes('kỹ thuật') ||
    name.includes('ngọc tú') || name.includes('văn quyền') || name.includes('hoàng phúc') ||
    name.includes('tấn thanh') || name.includes('lê nhân') && code.includes('KT') ||
    name.includes('minh hoàng') && code.includes('KT') || name.includes('mạnh hùng') ||
    name.includes('lê trung') && code.includes('KT')
  ) {
    return 'Phòng Kỹ thuật';
  }

  // 11. Phòng Kế hoạch
  if (
    code.startsWith('KH') || oldDept.includes('kế hoạch') || oldDept.includes('kinh doanh') ||
    name.includes('chánh nghĩa') || name.includes('nhật quang') && code.includes('KH') ||
    name.includes('hoàng dũng') || name.includes('ngọc thành') || name.includes('phước quang') ||
    name.includes('trung đức') || name.includes('quốc cường') || name.includes('hoàng thanh') ||
    name.includes('phương nhi') || name.includes('việt huy') || name.includes('minh hiền') ||
    code === 'TT05' || code === 'NSH08'
  ) {
    return 'Phòng Kế hoạch';
  }

  // 12. Xí nghiệp Môi trường Bắc sông Hương
  if (
    code.startsWith('BSH') || oldDept.includes('bắc sông hương') || oldDept.includes('đội 2') ||
    ip.startsWith('10.12.1.') || name.includes('ngọc tuấn') || name.includes('đức hân') ||
    name.includes('diệu phương') || name.includes('minh trí') || name.includes('đăng đô') ||
    name.includes('lê tuấn') || name.includes('văn cư')
  ) {
    return 'Xí nghiệp Môi trường Bắc sông Hương';
  }

  // 13. Xí nghiệp Môi trường Nam sông Hương
  if (
    code.startsWith('NSH') || oldDept.includes('nam sông hương') || oldDept.includes('đội 1') ||
    ip.startsWith('10.11.1.') || name.includes('nhật quang') && code.includes('NSH') ||
    name.includes('hữu hóa') || name.includes('quang long') || name.includes('văn chiến') ||
    name.includes('văn nguyên') || name.includes('minh thảo') || name.includes('duy việt') ||
    code === 'LC01' || name.includes('lăng cô')
  ) {
    return 'Xí nghiệp Môi trường Nam sông Hương';
  }

  // 14. Xí nghiệp Điện chiếu sáng
  if (code.startsWith('DCS') || oldDept.includes('chiếu sáng') || name.includes('văn tiến') && code.includes('DCS') || name.includes('hữu thế') || name.includes('văn trung') && code.includes('DCS')) {
    return 'Xí nghiệp Điện chiếu sáng';
  }

  // 15. Xí nghiệp Vận chuyển - Cơ khí
  if (
    code.startsWith('CK') || oldDept.includes('cơ giới') || oldDept.includes('vận tải') ||
    oldDept.includes('cơ khí') || oldDept.includes('xây lắp') || name.includes('gsptcd') ||
    name.includes('ngọc vỹ') || name.includes('hoàng phương') && code.includes('CK') ||
    name.includes('thị quy') || name.includes('hữu phương') || name.includes('văn trung') && code.includes('CK') ||
    ip.startsWith('10.20.1.')
  ) {
    return 'Xí nghiệp Vận chuyển - Cơ khí';
  }

  // 16. Xí nghiệp Thoát nước
  if (code.startsWith('TN') || oldDept.includes('thoát nước') || ip.startsWith('10.50.1.')) {
    return 'Xí nghiệp Thoát nước';
  }

  // 17. Xí nghiệp Xử lý chất thải
  if (code.startsWith('XLCT') || oldDept.includes('chất thải') || oldDept.includes('bãi rác') || ip.startsWith('10.30.1.')) {
    return 'Xí nghiệp Xử lý chất thải';
  }

  // 18. Ban quản trang
  if (code.startsWith('BQT') || oldDept.includes('quản trang') || ip.startsWith('10.60.1.')) {
    return 'Ban quản trang';
  }

  // Default fallback
  return 'Phòng Kỹ thuật';
}

let changed = 0;
for (const dev of inventory) {
  const standardized = standardizeDepartment(dev);
  if (dev.department !== standardized) {
    dev.department = standardized;
    changed++;
  }
}

// Verify that all devices belong strictly to ALLOWED_DEPTS
const finalDepts = new Set(inventory.map(d => d.department));
console.log(`Changed ${changed} devices. Final departments list in inventory:`);
console.log([...finalDepts]);

const invalid = [...finalDepts].filter(d => !ALLOWED_DEPTS.includes(d));
if (invalid.length > 0) {
  console.error('ERROR: Found invalid departments:', invalid);
  process.exit(1);
} else {
  console.log('SUCCESS: All devices strictly belong to the 18 allowed departments!');
}

// Save back to both files
fs.writeFileSync(invPath, JSON.stringify(inventory, null, 2), 'utf8');
const pubPath = path.join(__dirname, '../frontend/public/data/devices_inventory.json');
fs.writeFileSync(pubPath, JSON.stringify(inventory, null, 2), 'utf8');
const distPath = path.join(__dirname, '../frontend/dist/data/devices_inventory.json');
if (fs.existsSync(path.dirname(distPath))) {
  fs.writeFileSync(distPath, JSON.stringify(inventory, null, 2), 'utf8');
}
console.log('Saved to data/devices_inventory.json and public/data/devices_inventory.json');
