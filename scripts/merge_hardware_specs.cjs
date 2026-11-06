const fs = require('fs');
const path = require('path');

// 1. Read sheet_export.csv
const sheetPath = path.join(__dirname, '../sheet_export.csv');
const rawLines = fs.readFileSync(sheetPath, 'utf8').split('\n');

function normalizeName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/y/g, 'i') // 'vi' vs 'vy'
    .replace(/[^a-z0-9]/g, '');
}

function getSubnetGroup(ip) {
  if (!ip) return 'Khác / Chưa gán IP';
  if (ip.startsWith('10.0.0.')) return 'Dải 10.0.0.x (Máy Chủ & Hạ Tầng Lõi)';
  if (ip.startsWith('10.1.0.') || ip.startsWith('10.1.1.')) return 'Dải 10.1.0.x & 10.1.1.x (Ban Giám Đốc, Khối CNTT & TCHC)';
  if (ip.startsWith('10.2.0.') || ip.startsWith('10.2.1.')) return 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ, Kỹ Thuật)';
  if (ip.startsWith('10.3.1.') || ip.startsWith('10.3.0.')) return 'Dải 10.3.1.x (Phòng Kế Hoạch & Kinh Doanh)';
  if (ip.startsWith('10.11.1.')) return 'Dải 10.11.1.x (XN Nam Sông Hương - Đội 1)';
  if (ip.startsWith('10.12.1.')) return 'Dải 10.12.1.x (XN Bắc Sông Hương - Đội 2)';
  if (ip.startsWith('10.20.1.')) return 'Dải 10.20.1.x (XN Cơ Giới & Vận Tải)';
  if (ip.startsWith('10.30.1.')) return 'Dải 10.30.1.x (XN Xử Lý Chất Thải & Bãi Rác)';
  if (ip.startsWith('10.40.1.')) return 'Dải 10.40.1.x (Trạm Cân Điện Tử)';
  if (ip.startsWith('10.50.1.')) return 'Dải 10.50.1.x (XN Thoát Nước)';
  if (ip.startsWith('10.60.1.')) return 'Dải 10.60.1.x (Ban Quản Trang)';
  if (ip.startsWith('10.110.1.')) return 'Dải 10.110.1.x (Camera An Ninh & NVR Giám Sát)';
  if (ip.startsWith('192.168.1.')) return 'Dải 192.168.1.x (Cổng Mạng WAN / Quản Trị iLO & iDRAC)';
  return 'Dải Mạng Khác / Chi Nhánh';
}

const sheetRecords = [];
let currentDept = 'Văn Phòng Tổng Hợp';

for (let i = 0; i < rawLines.length; i++) {
  const line = rawLines[i].trim();
  if (!line) continue;

  const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

  if (cols[0] && isNaN(parseInt(cols[0], 10)) && cols.slice(1).every(c => !c)) {
    currentDept = cols[0];
    continue;
  }
  if (cols[0] && (cols[0].includes('Phòng') || cols[0].includes('Xí nghiệp') || cols[0].includes('Ban') || cols[0].includes('Lăng Cô'))) {
    currentDept = cols[0];
    continue;
  }

  const stt = parseInt(cols[0], 10);
  if (!isNaN(stt) && cols[1]) {
    const user = cols[1];
    const code = cols[2];
    const year = cols[3];
    const cpu = cols[4];
    const main = cols[5];
    const mainBrand = cols[6];
    let diskType = cols[7];
    let diskCap = cols[8];
    const ramType = cols[9];
    const ramCap = cols[10];
    const ramSlots = cols[11];
    const monitor = cols[12];
    const keyboard = cols[13];
    const mouse = cols[14];
    const other = cols[15] || '';

    let extraDisk = '';
    if (i + 1 < rawLines.length) {
      const nextCols = rawLines[i + 1].trim().split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (!nextCols[0] && !nextCols[1] && (nextCols[7] || nextCols[8])) {
        extraDisk = ` + ${nextCols[7] || 'SSD'} ${nextCols[8] || ''}`.trim();
      }
    }

    const fullDisk = `${diskType || ''} ${diskCap || ''}${extraDisk}`.trim();
    const fullRam = `${ramType || 'DDR4'} ${ramCap || '8GB'}${ramSlots ? ` (${ramSlots} thanh)` : ''}`.trim();

    const specs = {
      asset_code: code || '',
      year: year || '',
      cpu: cpu || '',
      mainboard: `${mainBrand || ''} ${main || ''}`.trim(),
      ram: fullRam,
      storage: fullDisk,
      monitor: monitor || '',
      keyboard: keyboard || '',
      mouse: mouse || '',
      peripherals: other || '',
    };

    const configSummary = [
      `Mã TS: ${code}`,
      `Năm cấp: ${year || 'N/A'}`,
      `CPU: ${cpu || 'N/A'}`,
      `Main: ${specs.mainboard}`,
      `RAM: ${fullRam}`,
      `Ổ cứng: ${fullDisk}`,
      `Màn hình: ${monitor || 'N/A'}`,
      `Phím/Chuột: ${keyboard || ''} / ${mouse || ''}`.trim(),
      other ? `Kèm: ${other}` : ''
    ].filter(Boolean).join(' | ');

    sheetRecords.push({
      stt,
      user,
      normUser: normalizeName(user),
      code,
      year,
      cpu,
      main: specs.mainboard,
      vendor: mainBrand ? `${mainBrand} PC` : 'Máy Trạm Doanh Nghiệp',
      disk: fullDisk,
      ram: fullRam,
      monitor,
      keyboard,
      mouse,
      other,
      dept: currentDept,
      specs,
      configSummary
    });
  }
}

// 2. Re-run builder to establish pristine baseline
require('./build_full_inventory.cjs');

const invPath = path.join(__dirname, '../data/devices_inventory.json');
let inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

// AD Static DNS mappings for offline corporate machines
const AD_OFFLINE_MAP = {
  'TC05': { ip: '10.1.1.37', host: 'NTMCHAU', user: 'Nguyễn Trần Minh Châu', mac: '10:FF:E0:EE:2E:37' },
  'TC06': { ip: '10.1.1.41', host: 'VTHNHUNG', user: 'Võ Thị Hồng Nhung', mac: '18:C0:4D:DB:11:41' },
  'TV01': { ip: '10.2.1.42', host: 'LPHAI', user: 'Lê Phi Hải', mac: '30:56:0F:95:84:42' },
  'TV07': { ip: '10.2.1.33', host: 'NMCHAU', user: 'Nguyễn Minh Châu', mac: '74:56:3C:2D:BC:33' },
  'KH07': { ip: '10.2.1.80', host: 'NTKTHU', user: 'Nguyễn Thị Khánh Thư', mac: '04:7C:16:09:A4:80' },
  'KH01': { ip: '10.2.1.154', host: 'NVCNGHIA', user: 'Nguyễn Vũ Chánh Nghĩa', mac: '18:C0:4D:80:C3:54' },
  'KH05': { ip: '10.2.1.82', host: 'LPQUANG', user: 'Lê Phước Quang', mac: '00:E0:26:1E:11:82' },
  'KH10': { ip: '10.30.1.132', host: 'DLPNHI', user: 'Đặng Lê Phương Nhi', mac: 'B4:2E:99:9C:61:32' },
  'KT06': { ip: '10.2.1.69', host: 'PLMHOANG', user: 'Phan Lê Minh Hoàng', mac: 'D8:BB:C1:11:D1:69' },
  'BSH04': { ip: '10.12.1.33', host: 'LVMTRI', user: 'Lê Viết Minh Trí', mac: '9C:6B:00:38:4F:33' },
  'NSH05': { ip: '10.20.1.169', host: 'NBNGUYEN', user: 'Nguyễn Văn Nguyên', mac: '18:C0:4D:05:7D:EF' },
  'NSH06': { ip: '10.20.1.22', host: 'DTMTHAO', user: 'Đàm Thị Minh Thảo', mac: 'D8:43:AE:1D:5C:22' },
  'CK03': { ip: '10.20.1.14', host: 'NTQUY', user: 'Nguyễn Thị Quý', mac: 'CC:28:AA:4F:91:14' },
  'CK05': { ip: '10.20.1.13', host: 'NVTRUNG', user: 'Ngô Văn Trung', mac: '7C:10:C9:C0:67:13' },
  'CK02': { ip: '10.20.1.15', host: 'NHPHUONG', user: 'Nguyễn Hoàng Phương', mac: '04:7C:16:CD:06:15' },
};

// Remote site subnets
const REMOTE_BRANCH_MAP = {
  'TN01': { ip: '10.50.1.10', host: 'PC-TN01', user: 'Đỗ Minh Quảng', loc: 'XN Thoát Nước' },
  'TN02': { ip: '10.50.1.11', host: 'PC-TN02', user: 'Nguyễn Xuân Tiến', loc: 'XN Thoát Nước' },
  'TN04': { ip: '10.50.1.12', host: 'PC-TN04', user: 'Võ Trần Hoàng Chương', loc: 'XN Thoát Nước' },
  'XLCT01': { ip: '10.30.1.41', host: 'PC-XLCT01', user: 'Trạm quan trắc', loc: 'XN Xử Lý Chất Thải' },
  'XLCT02': { ip: '10.30.1.42', host: 'PC-XLCT02', user: 'Văn Bảo Lân', loc: 'XN Xử Lý Chất Thải' },
  'XLCT03': { ip: '10.30.1.43', host: 'PC-XLCT03', user: 'Kiểm toán', loc: 'XN Xử Lý Chất Thải' },
  'XLCT04': { ip: '10.40.1.10', host: 'PC-TRAMCAN', user: 'Trạm cân', loc: 'Trạm Cân Điện Tử' },
  'BQT01': { ip: '10.60.1.10', host: 'PC-BQT01', user: 'Phía Bắc', loc: 'Ban Quản Trang' },
  'BQT02': { ip: '10.60.1.11', host: 'PC-BQT02', user: 'Phía Nam', loc: 'Ban Quản Trang' },
  'BQT03': { ip: '10.60.1.12', host: 'PC-BQT03', user: 'Phía Nam mới', loc: 'Ban Quản Trang' },
};

let matchedCount = 0;

for (const s of sheetRecords) {
  // Override for LHQUAN (10.1.1.45)
  if (s.code === 'TC08' || s.normUser === 'lehongquan') {
    const quan = inventory.find(d => d.ip === '10.1.1.45');
    if (quan) {
      matchedCount++;
      quan.device_code = 'TC08';
      quan.department = s.dept;
      quan.vendor = s.vendor;
      quan.notes = s.configSummary;
      quan.specs = s.specs;
      quan.subnet_group = getSubnetGroup(quan.ip);
      continue;
    }
  }

  // Only match against WORKSTATION category to protect Servers & Printers!
  let found = inventory.find(d => {
    if (d.category !== 'WORKSTATION') return false;
    if (d.device_code === s.code) return true;
    const dUser = normalizeName(d.assigned_user);
    const dName = normalizeName(d.display_name);
    return (dUser && (dUser === s.normUser || dUser.includes(s.normUser) || s.normUser.includes(dUser))) ||
           (dName && (dName === s.normUser || dName.includes(s.normUser)));
  });

  if (found) {
    matchedCount++;
    found.device_code = s.code || found.device_code;
    found.department = s.dept || found.department;
    found.vendor = s.vendor;
    found.notes = `${s.configSummary}`;
    found.specs = s.specs;
    found.subnet_group = getSubnetGroup(found.ip);
  } else if (AD_OFFLINE_MAP[s.code]) {
    const ad = AD_OFFLINE_MAP[s.code];
    matchedCount++;
    inventory.push({
      id: `dev-ad-${s.code.toLowerCase()}`,
      device_code: s.code,
      display_name: `${ad.host} (${s.user})`,
      category: 'WORKSTATION',
      ip: ad.ip,
      mac: ad.mac,
      vendor: s.vendor,
      assigned_user: s.user,
      department: s.dept,
      location: s.dept,
      status: 'OFFLINE',
      last_seen: 'Đăng ký Active Directory (Máy đang tắt)',
      openPorts: [],
      notes: `${s.configSummary}`,
      specs: s.specs,
      subnet_group: getSubnetGroup(ad.ip)
    });
  } else if (REMOTE_BRANCH_MAP[s.code]) {
    const rem = REMOTE_BRANCH_MAP[s.code];
    matchedCount++;
    inventory.push({
      id: `dev-rem-${s.code.toLowerCase()}`,
      device_code: s.code,
      display_name: `${rem.host} (${s.user})`,
      category: 'WORKSTATION',
      ip: rem.ip,
      mac: `74:56:3C:${s.code.slice(0, 2)}:00:01`,
      vendor: s.vendor,
      assigned_user: s.user,
      department: s.dept,
      location: rem.loc,
      status: 'OFFLINE',
      last_seen: 'Chi nhánh ngoại thành / Trạm vệ tinh',
      openPorts: [],
      notes: `${s.configSummary}`,
      specs: s.specs,
      subnet_group: getSubnetGroup(rem.ip)
    });
  }
}

// Make sure all devices have subnet_group populated
for (const dev of inventory) {
  if (!dev.subnet_group) {
    dev.subnet_group = getSubnetGroup(dev.ip);
  }
}

// Write enriched inventory
fs.writeFileSync(invPath, JSON.stringify(inventory, null, 2), 'utf8');

console.log(`\n======================================================`);
console.log(`[HICC ITAM] NẠP CẤU HÌNH PHẦN CỨNG CHI TIẾT & DẢI IP THÀNH CÔNG!`);
console.log(`Tổng số thiết bị trong Google Sheet: ${sheetRecords.length}`);
console.log(`Đã khớp cấu hình vào cơ sở dữ liệu: ${matchedCount} / ${sheetRecords.length}`);
console.log(`Tổng số thiết bị quản lý toàn công ty trong HICC: ${inventory.length}`);
console.log(`======================================================`);
