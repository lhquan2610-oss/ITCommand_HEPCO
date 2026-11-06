const fs = require('fs');
const path = require('path');

const invPath = path.join(__dirname, '../data/devices_inventory.json');
const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

// 1. Enrich Servers with real hardware specs and set department = 'Máy chủ'
const serverSpecs = {
  '10.0.0.1': {
    name: 'DSERVER (Domain Controller & DNS Lõi)',
    user: 'Máy Chủ DSERVER (Domain Controller)',
    code: 'SRV-DC-01',
    year: '2019',
    cpu: 'Intel Xeon Silver 4210 (10 Cores, 20 Threads, 2.2GHz)',
    main: 'Dell PowerEdge T440 Server Board',
    ram: '32GB DDR4 ECC Registered',
    storage: '2x 1TB SAS SSD RAID 1 + 4x 2TB SAS 10K RAID 5',
    monitor: 'KVM Console Rack 19 inch',
    kb: 'Rack Console Keyboard',
    mouse: 'Touchpad Console',
    other: 'iDRAC 9 Enterprise (192.168.1.118), Dell PERC H730P RAID, 4x 1GbE NIC'
  },
  '10.0.0.8': {
    name: 'B-SERVER (Ứng Dụng & Hóa Đơn Điện Tử)',
    user: 'Máy Chủ B-SERVER (App & Database)',
    code: 'SRV-APP-02',
    year: '2018',
    cpu: '2x Intel Xeon E5-2620 v4 (16 Cores, 32 Threads, 2.1GHz)',
    main: 'HPE ProLiant DL80 Gen9 Server Board',
    ram: '64GB DDR4 ECC Registered',
    storage: '4x 1.2TB SAS 10K RAID 10 + 2x 240GB SATA Enterprise SSD',
    monitor: 'Màn hình kỹ thuật Server Room',
    kb: 'Logitech Console',
    mouse: 'Logitech Console',
    other: 'HPE iLO 4 Advanced (192.168.1.104), HPE Smart Array P440/4GB, Nguồn đôi Redundant'
  },
  '10.0.0.16': {
    name: 'SERVER-PC (FTP & Chia Sẻ Dữ Liệu)',
    user: 'Máy Chủ SERVER-PC (File Share & Backup)',
    code: 'SRV-FTP-03',
    year: '2020',
    cpu: 'Intel Xeon E3-1240 v5 (4 Cores, 8 Threads, 3.5GHz)',
    main: 'ASUS Workstation C236',
    ram: '16GB DDR4 ECC',
    storage: '2x 2TB WD Red NAS HDD RAID 1 + SSD 256GB NVMe',
    monitor: 'DELL 21.5 inch',
    kb: 'Logitech K120',
    mouse: 'Logitech M100',
    other: 'Dual Gigabit LAN, Bộ lưu điện UPS APC Smart 1500VA'
  },
  '10.1.1.7': {
    name: 'Máy Chủ CNTT (Quản Trị Kỹ Thuật)',
    user: 'Bộ phận CNTT (cntt.hepco.com.vn)',
    code: 'SRV-IT-04',
    year: '2021',
    cpu: 'Intel Core i7-10700 (8 Cores, 16 Threads, 2.9GHz - 4.8GHz)',
    main: 'Gigabyte B460M D3H Workstation',
    ram: '32GB DDR4 3200MHz',
    storage: 'SSD 512GB NVMe M.2 + HDD 2TB Seagate IronWolf',
    monitor: 'DELL P2419H 24 inch',
    kb: 'Logitech MK200',
    mouse: 'Logitech MK200',
    other: 'Web Server quản trị nội bộ CNTT, Hệ thống Giám sát HICC'
  }
};

let serverCount = 0;
for (const dev of inventory) {
  if (dev.category === 'SERVER' || serverSpecs[dev.ip]) {
    dev.department = 'Máy chủ';
    const s = serverSpecs[dev.ip];
    if (s) {
      serverCount++;
      dev.display_name = s.name;
      dev.assigned_user = s.user;
      dev.device_code = s.code;
      dev.specs = {
        asset_code: s.code,
        year: s.year,
        cpu: s.cpu,
        mainboard: s.main,
        ram: s.ram,
        storage: s.storage,
        monitor: s.monitor,
        keyboard: s.kb,
        mouse: s.mouse,
        peripherals: s.other
      };
    }
  }
}

// 2. Identify workstations that have NO assigned user name or placeholder
let unidentifiedCount = 0;
for (const dev of inventory) {
  // If it is a computer (WORKSTATION) but assigned_user is missing or just IP/host placeholder
  if (dev.category === 'WORKSTATION') {
    const user = (dev.assigned_user || '').trim();
    const isPlaceholder = !user || user.startsWith('HOST-') || user.startsWith('PC-') || user.toLowerCase().includes('unknown') || user.toLowerCase().includes('chưa gán');
    
    if (isPlaceholder) {
      dev.assigned_user = '';
      dev.department = 'Chưa định danh tên';
      unidentifiedCount++;
    }
  }
}

console.log(`Enriched ${serverCount} servers with complete hardware specs.`);
console.log(`Identified ${unidentifiedCount} unassigned/unidentified workstations into 'Chưa định danh tên'.`);

// Save updated inventory
fs.writeFileSync(invPath, JSON.stringify(inventory, null, 2), 'utf8');
const pubPath = path.join(__dirname, '../frontend/public/data/devices_inventory.json');
fs.writeFileSync(pubPath, JSON.stringify(inventory, null, 2), 'utf8');
const distPath = path.join(__dirname, '../frontend/dist/data/devices_inventory.json');
if (fs.existsSync(path.dirname(distPath))) {
  fs.writeFileSync(distPath, JSON.stringify(inventory, null, 2), 'utf8');
}
console.log('Saved updated inventory to all paths successfully!');
