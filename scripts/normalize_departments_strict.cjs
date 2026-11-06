const fs = require('fs');

const ALLOWED_DEPTS = [
  'Máy chủ',
  'Camera',
  'Máy in, Scan, Photocopy',
  'Ban Lãnh Đạo',
  'Phòng Tổ chức - Hành chính',
  'Phòng Kỹ Thuật',
  'Phòng Kế toán - Tài vụ',
  'Phòng Kế hoạch',
  'Xí nghiệp Môi trường Bắc sông Hương',
  'Xí nghiệp Môi trường Nam sông Hương',
  'Xí nghiệp Điện chiếu sáng',
  'Xí nghiệp Vận chuyển - Cơ khi',
  'Xí nghiệp Thoát nước',
  'Xí nghiệp Xử lý chất thải',
  'Ban quản trang',
  'Trạm cân'
];

function normalizeDept(dept) {
  if (!dept) return 'Phòng Tổ chức - Hành chính';
  const d = dept.trim();
  if (d === 'Phòng Kỹ thuật') return 'Phòng Kỹ Thuật';
  if (d === 'Máy in') return 'Máy in, Scan, Photocopy';
  if (d === 'Xí nghiệp Vận chuyển - Cơ khí') return 'Xí nghiệp Vận chuyển - Cơ khi';
  if (d === 'Tổ Bảo Vệ') return 'Phòng Tổ chức - Hành chính';
  if (ALLOWED_DEPTS.includes(d)) return d;
  return 'Phòng Tổ chức - Hành chính';
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  let devices = JSON.parse(raw);

  devices = devices.map(d => ({
    ...d,
    department: normalizeDept(d.department)
  }));

  fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf8');
  console.log('Strictly normalized departments for:', filePath);
}

processFile('data/devices_inventory.json');
processFile('frontend/public/data/devices_inventory.json');
processFile('frontend/dist/data/devices_inventory.json');
