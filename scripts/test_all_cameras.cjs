// scripts/test_all_cameras.cjs
const net = require('net');
const http = require('http');
const fs = require('fs');

const d = JSON.parse(fs.readFileSync('data/devices_inventory.json', 'utf8'));
const cameras = d.filter(x => x.category === 'CAMERA');

console.log(`==================================================================`);
console.log(` KIỂM THỬ TỪNG CAMERA AN NINH TRONG MẠNG LAN HEPCO (${cameras.length} THIẾT BỊ)`);
console.log(`==================================================================\n`);

function probePort(ip, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, ip);
  });
}

function probeHttp(ip, path = '/', timeout = 1500) {
  return new Promise((resolve) => {
    const req = http.get(`http://${ip}${path}`, { timeout }, (res) => {
      let body = '';
      res.on('data', chunk => { if (body.length < 500) body += chunk; });
      res.on('end', () => {
        resolve({
          success: true,
          statusCode: res.statusCode,
          server: res.headers['server'] || '',
          auth: res.headers['www-authenticate'] || '',
          contentType: res.headers['content-type'] || '',
          bodySnippet: body.replace(/[\r\n\t]+/g, ' ').substring(0, 80)
        });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
    req.on('error', (err) => resolve({ success: false, error: err.message }));
  });
}

function probeRtsp(ip, port = 554, timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    let response = '';
    socket.on('connect', () => {
      socket.write(`OPTIONS rtsp://${ip}:${port}/ RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: HICC-CameraAuditor/1.0\r\n\r\n`);
    });
    socket.on('data', (data) => {
      response += data.toString();
      socket.destroy();
      resolve({ success: true, response: response.split('\r\n')[0] });
    });
    socket.on('timeout', () => { socket.destroy(); resolve({ success: false, error: 'Timeout' }); });
    socket.on('error', (err) => { socket.destroy(); resolve({ success: false, error: err.message }); });
    socket.connect(port, ip);
  });
}

async function testSingleCamera(cam, idx) {
  const ip = cam.ip;
  console.log(`[${idx + 1}/${cameras.length}] Kiểm tra Camera ${ip} (${cam.display_name})...`);

  // 1. Port checks
  const p80 = await probePort(ip, 80);
  const p554 = await probePort(ip, 554);
  const p8000 = await probePort(ip, 8000);
  const p37777 = await probePort(ip, 37777);

  // 2. HTTP Web Interface
  let httpInfo = null;
  if (p80) {
    httpInfo = await probeHttp(ip, '/');
  }

  // 3. RTSP handshake
  let rtspInfo = null;
  if (p554) {
    rtspInfo = await probeRtsp(ip, 554);
  }

  // 4. Snapshot probe
  let snapshotInfo = null;
  if (p80) {
    const isHik = (cam.vendor || '').toLowerCase().includes('hikvision') || p8000;
    const snapPath = isHik ? '/ISAPI/Streaming/channels/101/picture' : '/cgi-bin/snapshot.cgi';
    snapshotInfo = await probeHttp(ip, snapPath);
  }

  const result = {
    ip,
    name: cam.display_name,
    vendor: cam.vendor,
    ports: {
      http_80: p80,
      rtsp_554: p554,
      hikvision_8000: p8000,
      dahua_37777: p37777,
    },
    webStatus: httpInfo ? httpInfo.statusCode : (p80 ? 'Open' : 'Closed'),
    serverHeader: httpInfo?.server || '',
    authRequired: httpInfo?.auth || snapshotInfo?.auth || '',
    rtspReply: rtspInfo?.response || (p554 ? 'Port 554 Open (RTSP Ready)' : 'Port 554 Closed'),
    snapshotStatus: snapshotInfo ? `${snapshotInfo.statusCode} (${snapshotInfo.contentType || snapshotInfo.error || 'N/A'})` : 'N/A',
  };

  console.log(`    -> Cổng mở: 80(HTTP)=${p80 ? '✓' : '✗'}, 554(RTSP)=${p554 ? '✓' : '✗'}, 37777(Dahua)=${p37777 ? '✓' : '✗'}, 8000(Hik)=${p8000 ? '✓' : '✗'}`);
  console.log(`    -> Web HTTP: ${result.webStatus} | Server: ${result.serverHeader || 'N/A'}`);
  console.log(`    -> RTSP 554: ${result.rtspReply}`);
  console.log(`    -> Snapshot: ${result.snapshotStatus}\n`);

  return result;
}

async function run() {
  const results = [];
  for (let i = 0; i < cameras.length; i++) {
    const res = await testSingleCamera(cameras[i], i);
    results.push(res);
  }

  fs.writeFileSync('data/camera_audit_report.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`==================================================================`);
  console.log(` HOÀN TẤT KIỂM THỬ ${results.length} CAMERA!`);
  console.log(` Đã lưu báo cáo chi tiết vào data/camera_audit_report.json`);
  console.log(`==================================================================`);
}

run();
