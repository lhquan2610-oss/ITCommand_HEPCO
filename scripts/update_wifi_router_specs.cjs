const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../data/devices_inventory.json'),
  path.join(__dirname, '../frontend/public/data/devices_inventory.json'),
  path.join(__dirname, '../frontend/dist/data/devices_inventory.json'),
  path.join(__dirname, '../dist-app/win-unpacked/resources/data/devices_inventory.json')
];

const wifiSpecsMap = {
  "10.1.1.33": {
    model: "ASUS RT-AC1200",
    router_brand: "ASUSTek",
    router_model: "RT-AC1200 Dual-Band Gigabit",
    router_type: "Router Wi-Fi & Access Point",
    router_band: "Dual-Band 2.4GHz (300Mbps) + 5GHz (867Mbps) Wi-Fi 5",
    router_ports: "1 WAN Gigabit + 4 LAN Gigabit (1000Mbps)",
    router_ssid: "HEPCO_TANG1_TCHC",
    router_coverage: "Phòng họp lớn, Sảnh trung tâm & Phòng TCHC (Phủ sóng ~120m²)"
  },
  "10.2.0.191": {
    model: "TP-Link Archer C64",
    router_brand: "TP-Link",
    router_model: "Archer C64 AC1200 MU-MIMO",
    router_type: "Access Point / Router Wi-Fi",
    router_band: "Dual-Band 2.4GHz (400Mbps) + 5GHz (867Mbps)",
    router_ports: "1 WAN Gigabit + 4 LAN Gigabit (1000Mbps)",
    router_ssid: "HEPCO_TANG2_KETOAN",
    router_coverage: "Phòng Kế toán - Tài vụ & Phòng Kỹ thuật (Tầng 2)"
  },
  "10.3.1.35": {
    model: "ASUS RT-AX53U (Wi-Fi 6)",
    router_brand: "ASUSTek",
    router_model: "RT-AX53U Dual-Band Wi-Fi 6 AX1800",
    router_type: "Router Wi-Fi 6 High-Performance",
    router_band: "Wi-Fi 6 AX1800 (574Mbps 2.4G + 1201Mbps 5G)",
    router_ports: "1 WAN Gigabit + 3 LAN Gigabit + 1 Cổng USB",
    router_ssid: "HEPCO_TANG3_LANHDAO",
    router_coverage: "Khu vực Ban Lãnh Đạo, Phòng Kế Hoạch & Hội trường nhỏ"
  },
  "10.11.1.55": {
    model: "TP-Link Archer C6",
    router_brand: "TP-Link",
    router_model: "Archer C6 High-Gain AC1200",
    router_type: "Access Point Wi-Fi Chi Nhánh",
    router_band: "Dual-Band 2.4GHz (300Mbps) + 5GHz (867Mbps)",
    router_ports: "1 WAN Gigabit + 4 LAN Gigabit",
    router_ssid: "HEPCO_XN_BAC_SONG_HUONG",
    router_coverage: "Nhà điều hành XN Môi trường Bắc Sông Hương"
  },
  "10.12.1.66": {
    model: "TP-Link Archer C24",
    router_brand: "TP-Link",
    router_model: "Archer C24 Dual-Band Wireless",
    router_type: "Access Point Wi-Fi Chi Nhánh",
    router_band: "Dual-Band 2.4GHz + 5GHz",
    router_ports: "1 WAN + 4 LAN 100Mbps",
    router_ssid: "HEPCO_XN_NAM_SONG_HUONG",
    router_coverage: "Nhà điều hành XN Môi trường Nam Sông Hương"
  },
  "10.20.1.33": {
    model: "TP-Link TL-WR940N",
    router_brand: "TP-Link",
    router_model: "TL-WR940N 450Mbps High-Power",
    router_type: "Access Point Wi-Fi Chi Nhánh",
    router_band: "2.4GHz 450Mbps (3 Anten 5dBi độ lợi cao)",
    router_ports: "1 WAN + 4 LAN Fast Ethernet",
    router_ssid: "HEPCO_XN_CHIEU_SANG",
    router_coverage: "Văn phòng & Đội kỹ thuật Điện chiếu sáng"
  },
  "10.30.1.36": {
    model: "TP-Link Archer C50",
    router_brand: "TP-Link",
    router_model: "Archer C50 AC1200 Dual-Band",
    router_type: "Access Point Wi-Fi Đội Xe",
    router_band: "Dual-Band 2.4GHz (300Mbps) + 5GHz (867Mbps)",
    router_ports: "1 WAN + 4 LAN Fast Ethernet",
    router_ssid: "HEPCO_XN_CO_KHI_XE",
    router_coverage: "Văn phòng Đội xe vận chuyển & Phân xưởng cơ khí"
  }
};

for (const f of targetFiles) {
  if (!fs.existsSync(f)) continue;
  const list = JSON.parse(fs.readFileSync(f, 'utf8'));

  for (const item of list) {
    if (wifiSpecsMap[item.ip]) {
      const sp = wifiSpecsMap[item.ip];
      item.model = sp.model;
      item.specs = {
        asset_code: item.device_code,
        year: item.specs?.year || "2023",
        router_brand: sp.router_brand,
        router_model: sp.router_model,
        router_type: sp.router_type,
        router_band: sp.router_band,
        router_ports: sp.router_ports,
        router_ssid: sp.router_ssid,
        router_coverage: sp.router_coverage
      };
      item.notes = `Router Wi-Fi ${sp.router_brand} ${sp.router_model} | Băng tần: ${sp.router_band} | Cổng: ${sp.router_ports} | Vị trí: ${sp.router_coverage}`;
    }
  }

  fs.writeFileSync(f, JSON.stringify(list, null, 2), 'utf8');
  console.log(`Updated router specs in: ${f}`);
}

console.log("Done updating router specifications!");
