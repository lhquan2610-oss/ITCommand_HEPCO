const fs = require('fs');
const path = require('path');

const targetDevice = {
  id: 'PRN-RICOH-7502',
  device_code: 'PRN-RICOH-7502',
  display_name: 'Máy Photocopy Ricoh Aficio MP 7502 (Tổ Chức - Hành Chính)',
  hostname: 'RICOH-MP7502.hepco',
  category: 'PRINTER',
  ip: '10.1.1.18',
  mac: '00:26:73:9A:18:18', // Standard Ricoh OUI (00:26:73 Ricoh Co., Ltd.)
  vendor: 'Ricoh Company, Ltd.',
  model: 'Ricoh Aficio MP 7502 High-Speed Multifunction',
  department: 'Phòng Tổ chức - Hành chính',
  assigned_user: 'Văn Thư Lưu Trữ - TCHC',
  location: 'Tầng 1 - Phòng Tổ chức - Hành chính',
  status: 'ONLINE',
  openPorts: [80, 515, 631, 9100],
  notes: 'Máy photocopy đa chức năng tốc độ cao Ricoh 7502 in/scan/copy tài liệu công ty',
  is_type_locked: true,
  is_authorized: true,
  last_seen: new Date().toISOString()
};

const paths = [
  'data/devices_inventory.json',
  'frontend/public/data/devices_inventory.json',
  'frontend/dist/data/devices_inventory.json'
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    const list = JSON.parse(fs.readFileSync(p, 'utf8'));
    const idx = list.findIndex(d => d.ip === '10.1.1.18');
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...targetDevice };
    } else {
      list.push(targetDevice);
    }
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf8');
    console.log(`Updated ${p}: Total devices = ${list.length}`);
  }
});
