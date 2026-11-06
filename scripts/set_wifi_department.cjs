const fs = require('fs');

const wifiIps = [
  '10.3.1.35',   // Wi-Fi ASUS Tầng 3
  '10.1.1.33',   // Wi-Fi ASUS Tầng 1
  '10.2.0.191',  // Wi-Fi TP-Link Tầng 2
  '10.11.1.55',  // Wi-Fi TP-Link Bắc Sông Hương
  '10.12.1.66',  // Wi-Fi TP-Link Nam Sông Hương
  '10.20.1.33',  // Wi-Fi TP-Link Điện Chiếu Sáng
  '10.30.1.36',  // Wi-Fi TP-Link Cơ Khí
  '10.1.0.62',   // Router ASUS Phòng Kỹ Thuật
  '10.11.1.10',  // AP TP-Link XN MT Bắc Sông Hương
  '192.168.50.1' // Modem Wi-Fi ASUS RT-AC/AX
];

function updateDeptToWifi(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  let devices = JSON.parse(raw);

  devices = devices.map(d => {
    if (wifiIps.includes(d.ip)) {
      return {
        ...d,
        department: 'Wi-Fi'
      };
    }
    return d;
  });

  fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf8');
  console.log('Successfully updated Wi-Fi department in:', filePath);
}

updateDeptToWifi('data/devices_inventory.json');
updateDeptToWifi('frontend/public/data/devices_inventory.json');
updateDeptToWifi('frontend/dist/data/devices_inventory.json');
