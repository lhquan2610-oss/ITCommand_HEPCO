const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../data/devices_inventory.json'),
  path.join(__dirname, '../frontend/public/data/devices_inventory.json'),
  path.join(__dirname, '../frontend/dist/data/devices_inventory.json'),
  path.join(__dirname, '../dist-app/win-unpacked/resources/data/devices_inventory.json')
];

const ricoh7502 = {
  id: "PRN-RICOH-7502",
  device_code: "PRN-RICOH-7502",
  display_name: "Máy Photocopy Ricoh Aficio MP 7502 (Tổ Chức - Hành Chính)",
  hostname: "RICOH-MP7502.hepco",
  category: "PRINTER",
  ip: "10.1.1.17",
  mac: "00:26:73:9A:17:17",
  vendor: "Ricoh Company, Ltd.",
  model: "Ricoh Aficio MP 7502 High-Speed Multifunction",
  department: "Phòng Tổ chức - Hành chính",
  assigned_user: "Văn Thư Lưu Trữ - TCHC",
  location: "Tầng 1 - Phòng Tổ chức - Hành chính",
  status: "ONLINE",
  openPorts: [80, 515, 631, 9100],
  notes: "Máy photocopy công nghiệp đa chức năng tốc độ cao Ricoh Aficio MP 7502 (In, Scan, Copy) - IP tĩnh 10.1.1.17",
  is_type_locked: true,
  is_authorized: true,
  last_seen: new Date().toISOString(),
  subnet_group: "Dải 10.1.0.x & 10.1.1.x (Ban Giám Đốc, Khối CNTT & TCHC)"
};

const ricohIM5000 = {
  id: "PRN-RICOH-IM5000",
  device_code: "PRN-RICOH-IM5000",
  display_name: "Máy Photocopy Ricoh IM 5000 (Tổ Chức - Hành Chính)",
  hostname: "RICOH-IM5000.hepco",
  category: "PRINTER",
  ip: "10.1.1.18",
  mac: "00:26:73:9A:18:18",
  vendor: "Ricoh Company, Ltd.",
  model: "Ricoh IM 5000 Smart Multifunction Printer",
  department: "Phòng Tổ chức - Hành chính",
  assigned_user: "Văn Thư Lưu Trữ - TCHC",
  location: "Tầng 1 - Phòng Tổ chức - Hành chính",
  status: "ONLINE",
  openPorts: [80, 443, 515, 631, 9100],
  notes: "Máy photocopy đa chức năng thế hệ mới Ricoh IM 5000 thông minh (In mạng, Scan mạng, Photocopy) - IP tĩnh 10.1.1.18",
  is_type_locked: true,
  is_authorized: true,
  last_seen: new Date().toISOString(),
  subnet_group: "Dải 10.1.0.x & 10.1.1.x (Ban Giám Đốc, Khối CNTT & TCHC)"
};

for (const f of targetFiles) {
  if (!fs.existsSync(f)) {
    console.log(`Skipping non-existent: ${f}`);
    continue;
  }
  let list = JSON.parse(fs.readFileSync(f, 'utf8'));

  // 1. If PTGĐ03 currently has 10.1.1.17, move PTGĐ03 to 10.1.1.19 / DHCP
  const ptgdIdx = list.findIndex(x => x.device_code === 'PTGĐ03');
  if (ptgdIdx !== -1) {
    list[ptgdIdx].ip = '10.1.1.19';
    list[ptgdIdx].notes = (list[ptgdIdx].notes || '') + ' | (Chuyển tách biệt khỏi IP 10.1.1.17 của máy Photo Ricoh 7502)';
  }

  // 2. Remove old ricoh entries if any
  list = list.filter(x => x.id !== 'PRN-RICOH-7502' && x.id !== 'PRN-RICOH-IM5000' && x.ip !== '10.1.1.17' && x.ip !== '10.1.1.18');

  // 3. Add both Ricoh machines correctly
  list.push(ricoh7502);
  list.push(ricohIM5000);

  fs.writeFileSync(f, JSON.stringify(list, null, 2), 'utf8');
  console.log(`Updated ${f} -> Total devices: ${list.length}`);
}

console.log("Successfully updated Ricoh 7502 (10.1.1.17) and Ricoh IM 5000 (10.1.1.18)!");
