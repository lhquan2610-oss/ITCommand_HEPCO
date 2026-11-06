const https = require('https');

const macs = [
  { ip: '10.1.1.33', mac: '04:42:1A:3F:BA:28' },
  { ip: '10.2.0.191', mac: 'E4:C3:2A:82:AE:A0' },
  { ip: '10.2.1.34', mac: '74:56:3C:58:10:C2' },
  { ip: '10.2.1.43', mac: '10:7C:61:E2:D5:40' },
  { ip: '10.2.1.52', mac: '74:56:3C:2D:BC:DD' },
  { ip: '10.3.1.35', mac: 'CC:28:AA:B6:3A:10' },
  { ip: '10.11.1.55', mac: '40:AE:30:C7:5D:FF' },
  { ip: '10.12.1.66', mac: '50:91:E3:FF:81:60' },
  { ip: '10.20.1.33', mac: 'A8:29:48:98:95:7A' },
  { ip: '10.30.1.36', mac: '5C:E9:31:6A:58:2A' },
  { ip: '10.30.1.69', mac: 'D8:BB:C1:11:D1:90' }
];

function checkMac(item) {
  return new Promise((resolve) => {
    https.get(`https://api.macvendors.com/${item.mac}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ ...item, vendor: data }));
    }).on('error', (e) => resolve({ ...item, vendor: e.message }));
  });
}

async function run() {
  for (const m of macs) {
    const res = await checkMac(m);
    console.log(`${res.ip} | MAC: ${res.mac} | Vendor: ${res.vendor}`);
    // delay 1s to avoid rate limiting
    await new Promise(r => setTimeout(r, 1100));
  }
}

run();
