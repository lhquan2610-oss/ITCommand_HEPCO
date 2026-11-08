const { app, BrowserWindow, shell, ipcMain, session, webFrameMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const { exec, spawn } = require('child_process');
const dgram = require('dgram');
const net = require('net');
const os = require('os');

let mainWindow;
let activePingProcess = null;

// ===========================================================================
// Comprehensive Enterprise OUI Database specifically matched to HEPCO LAN
// ===========================================================================
// OUI DATABASE (Exact mappings aligned with HEPCO Corporate LAN Audit)
// ===========================================================================
const OUI_DATABASE = {
  // PRINTERS & PHOTOCOPIERS
  '00:26:73': { vendor: 'Ricoh Company Ltd. (Photocopy MP 7503)', type: 'PRINTER' },
  '58:38:79': { vendor: 'Ricoh Company Ltd.', type: 'PRINTER' },
  '6C:3C:7C': { vendor: 'Canon Inc. (i-SENSYS LBP242/243)', type: 'PRINTER' },
  'F8:A2:6D': { vendor: 'Canon Inc. (Laser LBP458 A3)', type: 'PRINTER' },
  '94:DD:F8': { vendor: 'Brother Industries (MFC-B7810DW)', type: 'PRINTER' },
  '30:24:A9': { vendor: 'HP LaserJet Pro M404dn', type: 'PRINTER' },
  '84:2A:FD': { vendor: 'HP LaserJet Pro M404dn', type: 'PRINTER' },
  'E4:E7:49': { vendor: 'HP LaserJet Pro M402dn', type: 'PRINTER' },
  '7C:57:58': { vendor: 'HP LaserJet Pro M706n (A3)', type: 'PRINTER' },
  '00:80:77': { vendor: 'Brother Industries', type: 'PRINTER' },
  '00:00:48': { vendor: 'Seiko Epson Corp', type: 'PRINTER' },
  '00:00:AA': { vendor: 'Xerox Corporation', type: 'PRINTER' },
  '3C:D9:2B': { vendor: 'HP LaserJet Printer', type: 'PRINTER' },
  'A0:B3:CC': { vendor: 'HP LaserJet Printer', type: 'PRINTER' },

  // CAMERAS & NVR SECURITY (Dahua, KBVision, Hikvision)
  '08:54:11': { vendor: 'Hangzhou Hikvision Digital', type: 'CAMERA' },
  '3C:1B:F8': { vendor: 'Hangzhou Hikvision Digital (NVR Trung Tâm)', type: 'CAMERA' },
  'AC:B9:2F': { vendor: 'Hangzhou Hikvision Digital', type: 'CAMERA' },
  'FC:5F:49': { vendor: 'Zhejiang Dahua / KBVision Camera', type: 'CAMERA' },
  'A0:BD:1D': { vendor: 'Zhejiang Dahua / KBVision Camera', type: 'CAMERA' },
  'FC:B6:9D': { vendor: 'Zhejiang Dahua / KBVision Camera', type: 'CAMERA' },
  'F8:CE:07': { vendor: 'Zhejiang Dahua / KBVision Camera', type: 'CAMERA' },
  'C0:39:5A': { vendor: 'Zhejiang Dahua / KBVision Camera', type: 'CAMERA' },
  'E0:50:8B': { vendor: 'Zhejiang Dahua Technology', type: 'CAMERA' },
  '08:ED:ED': { vendor: 'Zhejiang Dahua Technology', type: 'CAMERA' },
  'F4:B1:C2': { vendor: 'Zhejiang Dahua / KBVision Camera', type: 'CAMERA' },
  '9C:14:63': { vendor: 'Zhejiang Dahua Technology', type: 'CAMERA' },
  'CC:28:AA': { vendor: 'Hangzhou Hikvision Digital', type: 'CAMERA' },
  'BC:54:51': { vendor: 'Hangzhou Hikvision Digital', type: 'CAMERA' },
  '44:19:B6': { vendor: 'Hangzhou Hikvision Digital', type: 'CAMERA' },
  '58:D9:D5': { vendor: 'Zhejiang Dahua Technology', type: 'CAMERA' },

  // SERVERS & HARDWARE BMC
  '08:F1:EA': { vendor: 'Dell PowerEdge Server (DSERVER)', type: 'SERVER' },
  '98:F2:B3': { vendor: 'HPE ProLiant Server / iLO (B-SERVER)', type: 'SERVER' },
  '00:1A:64': { vendor: 'IBM System x Server (SERVER-PC)', type: 'SERVER' },
  '00:50:56': { vendor: 'VMware Virtual NIC', type: 'SERVER' },
  '00:0C:29': { vendor: 'VMware Virtual NIC', type: 'SERVER' },
  '00:15:5D': { vendor: 'Microsoft Hyper-V NIC', type: 'SERVER' },

  // ROUTER, GATEWAY & NETWORK INFRASTRUCTURE
  '3C:7C:3F': { vendor: 'ASUSTek Computer (Router ASUS)', type: 'ROUTER' },
  'C4:6E:1F': { vendor: 'TP-Link Technologies (Access Point)', type: 'SWITCH' },
  'C0:9F:E1': { vendor: 'Core Switch / Router WAN Gateway', type: 'ROUTER' },
  '00:1D:AA': { vendor: 'DrayTek Corp', type: 'ROUTER' },
  '48:8D:36': { vendor: 'MikroTik', type: 'ROUTER' },
  '4C:5E:0C': { vendor: 'MikroTik', type: 'ROUTER' },
  '24:5A:4C': { vendor: 'Ubiquiti Networks', type: 'SWITCH' },
  '78:8A:20': { vendor: 'Ubiquiti Networks', type: 'SWITCH' },
  '80:EA:07': { vendor: 'Ruijie Networks', type: 'SWITCH' },
  '58:69:6C': { vendor: 'Ruijie Networks', type: 'SWITCH' },
  '00:1A:7D': { vendor: 'Cisco Systems', type: 'SWITCH' },
  '00:00:0C': { vendor: 'Cisco Systems', type: 'SWITCH' },

  // WORKSTATIONS & COMPUTERS (Dell, HP, Lenovo, Gigabyte, MSI, Asus)
  'C0:25:A5': { vendor: 'Dell Inc. (Máy Quản Trị Viên IT)', type: 'WORKSTATION' },
  'D8:43:AE': { vendor: 'Dell OptiPlex Workstation', type: 'WORKSTATION' },
  '10:FF:E0': { vendor: 'Dell OptiPlex Workstation', type: 'WORKSTATION' },
  'B4:2E:99': { vendor: 'Dell OptiPlex Workstation', type: 'WORKSTATION' },
  '3C:06:30': { vendor: 'Dell Inc.', type: 'WORKSTATION' },
  'B8:AC:6F': { vendor: 'Dell Inc.', type: 'WORKSTATION' },
  '18:66:DA': { vendor: 'Dell Inc.', type: 'WORKSTATION' },
  '18:C0:4D': { vendor: 'HP ProDesk Workstation', type: 'WORKSTATION' },
  '30:56:0F': { vendor: 'HP ProDesk Workstation', type: 'WORKSTATION' },
  'E4:54:E8': { vendor: 'HP ProDesk Workstation', type: 'WORKSTATION' },
  '04:7C:16': { vendor: 'Lenovo ThinkCentre Workstation', type: 'WORKSTATION' },
  'E8:6A:64': { vendor: 'Lenovo ThinkCentre', type: 'WORKSTATION' },
  'BC:FC:E7': { vendor: 'Lenovo PC', type: 'WORKSTATION' },
  '58:11:22': { vendor: 'Lenovo PC', type: 'WORKSTATION' },
  '74:56:3C': { vendor: 'Gigabyte Workstation PC', type: 'WORKSTATION' },
  'D8:5E:D3': { vendor: 'Gigabyte Workstation PC', type: 'WORKSTATION' },
  '7C:10:C9': { vendor: 'HP ProDesk Workstation', type: 'WORKSTATION' },
  'D8:BB:C1': { vendor: 'MSI / Workstation PC', type: 'WORKSTATION' },
  '00:E0:26': { vendor: 'MSI Workstation PC', type: 'WORKSTATION' },
  'E0:D5:5E': { vendor: 'HP ProDesk Workstation', type: 'WORKSTATION' },
  '9C:6B:00': { vendor: 'Realtek PC', type: 'WORKSTATION' },
  '1E:02:0F': { vendor: 'Lenovo ThinkCentre', type: 'WORKSTATION' },
  'A0:36:BC': { vendor: 'HP ProDesk Workstation', type: 'WORKSTATION' },
  '34:5A:60': { vendor: 'Workstation PC', type: 'WORKSTATION' },
  '5C:E9:31': { vendor: 'Workstation PC', type: 'WORKSTATION' },
  '04:42:1A': { vendor: 'ASUS Workstation PC', type: 'WORKSTATION' },
  '10:7C:61': { vendor: 'ASUS Workstation PC', type: 'WORKSTATION' },
  'A8:29:48': { vendor: 'Workstation PC', type: 'WORKSTATION' },
  '00:E0:4C': { vendor: 'Realtek Semiconductor', type: 'WORKSTATION' },
  '00:1B:21': { vendor: 'Intel Corporation', type: 'WORKSTATION' },
  '60:F6:77': { vendor: 'Intel Corporation', type: 'WORKSTATION' },
  'A4:83:E7': { vendor: 'Apple Inc.', type: 'WORKSTATION' },
  'F0:18:98': { vendor: 'Apple Inc.', type: 'WORKSTATION' },
  '34:F3:9A': { vendor: 'Apple Inc.', type: 'WORKSTATION' },
};

function lookupOui(mac) {
  if (!mac) return { vendor: 'Không rõ (Generic Device)', hintedType: null };
  const prefix = mac.toUpperCase().slice(0, 8).replace(/-/g, ':');
  if (OUI_DATABASE[prefix]) {
    return { vendor: OUI_DATABASE[prefix].vendor, hintedType: OUI_DATABASE[prefix].type };
  }
  return { vendor: 'Thiết bị Nội bộ / Generic', hintedType: null };
}

const APP_VERSION = '1.1.0';

// Performance Optimization Flags for Low Memory & Low CPU Footprint
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

function createWindow() {
  const icoPath = path.join(__dirname, 'icon.ico');
  const pngPath = path.join(__dirname, 'icon.png');
  const winIcon = fs.existsSync(icoPath) ? icoPath : pngPath;

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: 'HEPCO COMMAND',
    icon: winIcon,
    backgroundColor: '#f8fafc',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
    },
    autoHideMenuBar: true,
    show: false,
  });

  const devUrl = 'http://localhost:5173';
  const prodIndex = path.join(__dirname, '../dist/index.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devUrl).catch(() => mainWindow.loadFile(prodIndex));
  } else {
    mainWindow.loadFile(prodIndex);
  }

  // Strip X-Frame-Options and CSP for tracking.vn and quanlyxe.vn to allow seamless embedding in the application
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    if (details.url && (details.url.includes('tracking.vn') || details.url.includes('quanlyxe.vn') || details.url.includes('808gps'))) {
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['Content-Security-Policy'];
    }
    callback({ cancel: false, responseHeaders });
  });

  // Persistent session for embedded tracking webviews
  const trackingSession = session.fromPartition('persist:tracking_fleet');
  trackingSession.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  );
  trackingSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    callback({ cancel: false, responseHeaders });
  });

  // Intercept all embedded webviews for fleet tracking and execute smart authentication
  app.on('web-contents-created', (event, contents) => {
    if (contents.getType() === 'webview') {
      contents.on('did-finish-load', () => {
        const url = contents.getURL() || '';
        if (url.includes('quanlyxe.vn')) {
          contents.executeJavaScript(`
            (function() {
              try {
                const u = document.getElementById('UserName');
                const p = document.getElementById('Password');
                const chk = document.getElementById('RememberMe');
                if (chk) chk.checked = true;
                if (u && p && !u.value) {
                  u.value = 'hepco';
                  p.value = '123456';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  const btn = document.querySelector('input[name="login"]') || document.querySelector('input[type="submit"]');
                  if (btn) setTimeout(() => btn.click(), 400);
                }
              } catch(e) {}
            })();
          `).catch(() => {});
        } else if (url.includes('v5.tracking.vn')) {
          contents.executeJavaScript(`
            (function() {
              try {
                const u = document.getElementById('UserName');
                const p = document.getElementById('Password');
                if (u && p && !u.value) {
                  u.value = 'moitruonghue';
                  p.value = 'dss@12345';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  const btn = document.querySelector('input[type="submit"]') || document.querySelector('button[type="submit"]');
                  if (btn) setTimeout(() => btn.click(), 400);
                }
              } catch(e) {}
            })();
          `).catch(() => {});
        } else if (url.includes('cam.tracking.vn') || url.includes('808gps')) {
          contents.executeJavaScript(`
            (function() {
              try {
                const u = document.getElementById('loginAccount');
                const p = document.getElementById('loginPassword');
                const code = document.getElementById('phraseLogin');
                if (u && p) {
                  if (!u.value) u.value = 'moitruonghue';
                  if (!p.value) p.value = 'dss@12345';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  if (code) {
                    code.focus();
                    code.addEventListener('input', function() {
                      if (this.value && this.value.length === 4) {
                        const btn = document.getElementById('loginSubmit') || document.querySelector('.btn-login');
                        if (btn) setTimeout(() => btn.click(), 300);
                      }
                    });
                    code.addEventListener('keydown', function(e) {
                      if (e.key === 'Enter') {
                        const btn = document.getElementById('loginSubmit') || document.querySelector('.btn-login');
                        if (btn) btn.click();
                      }
                    });
                  }
                }
              } catch(e) {}
            })();
          `).catch(() => {});
        }
      });
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximized-state', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximized-state', false));
}

// Window Controls
ipcMain.handle('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.handle('window-maximize-toggle', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) { mainWindow.unmaximize(); return false; }
    else { mainWindow.maximize(); return true; }
  }
  return false;
});
ipcMain.handle('window-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle('window-is-maximized', () => mainWindow ? mainWindow.isMaximized() : false);

// ---------------------------------------------------------------------------
// Helper: Fast TCP Probe with 600ms timeout
// ---------------------------------------------------------------------------
function probeSinglePort(ip, port, timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

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

// ---------------------------------------------------------------------------
// Helper: Resolve DNS / NetBIOS Hostname & User
// ---------------------------------------------------------------------------
function resolveHostAndUser(ip) {
  return new Promise((resolve) => {
    dns.reverse(ip, (err, hostnames) => {
      if (!err && hostnames && hostnames.length > 0) {
        const full = hostnames[0];
        const shortName = full.split('.')[0].toUpperCase();
        resolve({ hostname: shortName, fullHost: full, user: '', method: 'DNS' });
        return;
      }

      if (process.platform === 'win32') {
        exec(`nbtstat -A ${ip}`, { timeout: 1200 }, (nbtErr, stdout) => {
          if (!nbtErr && stdout) {
            const lines = stdout.split('\n');
            let nbHost = null;
            let nbUser = null;
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.includes('<00>') && trimmed.includes('UNIQUE') && !nbHost) {
                const parts = trimmed.split(/\s+/);
                if (parts.length > 0) nbHost = parts[0];
              } else if (trimmed.includes('<03>') && trimmed.includes('UNIQUE') && !nbUser) {
                const parts = trimmed.split(/\s+/);
                if (parts.length > 0) nbUser = parts[0];
              }
            }
            if (nbHost) {
              resolve({ hostname: nbHost, fullHost: nbHost, user: nbUser || '', method: 'NetBIOS' });
              return;
            }
          }
          resolve({ hostname: '', fullHost: '', user: '', method: 'None' });
        });
      } else {
        resolve({ hostname: '', fullHost: '', user: '', method: 'None' });
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Deep Scan & Multi-Signal Fingerprinting
// ---------------------------------------------------------------------------
ipcMain.handle('network-deep-scan', async () => {
  // Read existing master inventory to preserve high-fidelity attributes
  let inventoryMap = new Map();
  try {
    if (fs.existsSync(INVENTORY_FILE)) {
      const saved = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
      if (Array.isArray(saved)) {
        for (const item of saved) {
          if (item && item.ip) inventoryMap.set(item.ip, item);
        }
      }
    }
  } catch (e) {}

  const isWin = process.platform === 'win32';
  const arpOutput = await new Promise((res) => {
    exec(isWin ? 'arp -a' : 'ip neigh', (err, stdout) => res(stdout || ''));
  });

  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
  const macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/;
  const rawList = [];

  for (const line of arpOutput.split('\n')) {
    const ipM = line.match(ipRegex);
    const macM = line.match(macRegex);
    if (ipM && macM) {
      const ip = ipM[0];
      const mac = macM[0].toUpperCase().replace(/-/g, ':');
      if (
        mac !== 'FF:FF:FF:FF:FF:FF' &&
        !mac.startsWith('01:00:5E') &&
        !ip.startsWith('224.') &&
        !ip.startsWith('239.') &&
        !ip.endsWith('.255') &&
        ip !== '127.0.0.1'
      ) {
        const { vendor, hintedType } = lookupOui(mac);
        rawList.push({ ip, mac, vendor, hintedType });
      }
    }
  }

  // Deduplicate by IP
  const uniqueMap = new Map();
  for (const item of rawList) {
    if (!uniqueMap.has(item.ip)) uniqueMap.set(item.ip, item);
  }
  const targets = Array.from(uniqueMap.values());

  // Deep probe worker per target with Cascading Multi-Tier Heuristic
  const deepAuditHost = async (target) => {
    const { ip, mac, vendor, hintedType } = target;

    // Check if device already has verified ground truth from HEPCO audit inventory
    const existing = inventoryMap.get(ip);

    // 1. Probe key ports in parallel (Printer 9100/515, Camera 554/8000, Windows 445/3389, Web 80, DNS 53, SSH 22)
    const [p9100, p515, p554, p8000, p445, p3389, p80, p22, p53] = await Promise.all([
      probeSinglePort(ip, 9100, 500), // Raw JetDirect Printer
      probeSinglePort(ip, 515, 500),  // LPD Printer
      probeSinglePort(ip, 554, 500),  // RTSP Camera
      probeSinglePort(ip, 8000, 500), // Hikvision SDK
      probeSinglePort(ip, 445, 500),  // SMB Windows Workstation
      probeSinglePort(ip, 3389, 500), // RDP
      probeSinglePort(ip, 80, 500),   // Web
      probeSinglePort(ip, 22, 500),   // SSH
      probeSinglePort(ip, 53, 500),   // DNS
    ]);

    // 2. Resolve Hostname / User
    const resolved = await resolveHostAndUser(ip);
    const hUpper = (resolved.hostname || '').toUpperCase();
    const vLower = (vendor || '').toLowerCase();

    // 3. CASCADING TIER CLASSIFICATION LOGIC (100% HEPCO AUDIT ALIGNED)
    let category = existing?.category || 'WORKSTATION';

    // Ground truth IP registries from HEPCO LAN Audit (02/11/2026)
    const HEPCO_PRINTERS = [
      '10.0.0.17', '10.1.1.43', '10.1.1.101', '10.2.0.11', '10.2.0.50',
      '10.2.1.54', '10.2.1.55', '10.11.1.58', '10.30.1.31', '10.40.1.3'
    ];
    const HEPCO_SERVERS = [
      '10.0.0.1', '10.0.0.5', '10.0.0.8', '10.0.0.16', '10.1.1.7',
      '192.168.1.8', '192.168.1.9', '192.168.1.104', '192.168.1.118'
    ];
    const HEPCO_ROUTERS = ['192.168.1.1', '10.1.0.62'];
    const HEPCO_SWITCHES = ['198.162.101.1', '10.11.1.10'];

    if (!existing) {
      // === TIER 1: PRINTERS (Máy In & Photocopy) ===
      if (
        HEPCO_PRINTERS.includes(ip) ||
        ((p9100 || p515) && ip !== '192.168.1.1') ||
        hintedType === 'PRINTER' ||
        vLower.includes('canon') || vLower.includes('ricoh') || vLower.includes('brother') || vLower.includes('epson') ||
        hUpper.includes('PRINT') || hUpper.includes('CANON') || hUpper.includes('RICOH') || hUpper.includes('NPI') || hUpper.includes('BRN')
      ) {
        category = 'PRINTER';
      }
      // === TIER 2: CAMERAS & NVR (Camera An Ninh Dải 10.110.1.x) ===
      else if (
        ip.startsWith('10.110.1.') ||
        ((p554 || p8000) && ip !== '10.1.1.45' && !HEPCO_PRINTERS.includes(ip)) ||
        (hintedType === 'CAMERA' && !HEPCO_PRINTERS.includes(ip)) ||
        vLower.includes('hikvision') || vLower.includes('dahua') || vLower.includes('uniview') || vLower.includes('hanwha') ||
        hUpper.includes('CAM') || hUpper.includes('NVR') || hUpper.includes('DVR') || hUpper.includes('IPC') || hUpper.includes('HIK')
      ) {
        category = 'CAMERA';
      }
      // === TIER 3: SERVERS (Máy Chủ & Quản Trị Từ Xa) ===
      else if (
        HEPCO_SERVERS.includes(ip) ||
        p53 ||
        hUpper.includes('DSERVER') || hUpper.includes('B-SERVER') || hUpper.includes('SERVER-PC') || hUpper.includes('SRV') ||
        (ip === '10.0.0.1' && resolved.fullHost?.includes('DServer')) ||
        (ip === '10.1.1.7' && resolved.fullHost?.includes('CNTT'))
      ) {
        category = 'SERVER';
      }
      // === TIER 4: ROUTERS & GATEWAYS ===
      else if (
        HEPCO_ROUTERS.includes(ip) ||
        ((ip.endsWith('.1') || ip.endsWith('.254') || hUpper.includes('GATEWAY') || hUpper.includes('ROUTER') || hintedType === 'ROUTER') &&
        !p445 && !p3389)
      ) {
        category = 'ROUTER';
      }
      // === TIER 5: SWITCHES & ACCESS POINTS ===
      else if (
        HEPCO_SWITCHES.includes(ip) ||
        hintedType === 'SWITCH' ||
        vLower.includes('tp-link') || vLower.includes('cisco') || vLower.includes('ruijie') ||
        hUpper.includes('SWITCH') || hUpper.includes('SW-')
      ) {
        category = 'SWITCH';
      }
      // === TIER 6: WORKSTATIONS (Máy Tính Để Bàn & Laptop) ===
      else {
        category = 'WORKSTATION';
      }
    }

    // 4. SMART USER & DEPARTMENT MAPPING
    let assignedUser = existing?.assigned_user || resolved.user || '';
    let department = existing?.department || 'Văn Phòng Tổng Hợp';
    let displayName = existing?.display_name || resolved.hostname || '';

    // Check if this is the current host machine (10.1.1.45)
    if (ip === '10.1.1.45') {
      displayName = `LAPTOP-QUAN-IT (Máy Tính Này)`;
      assignedUser = 'Lê Hữu Quân (IT Admin)';
      department = 'Bộ phận CNTT';
      category = 'WORKSTATION';
    } else if (ip === '10.1.1.7') {
      displayName = 'Máy Chủ CNTT (CNTT.hepco.com.vn)';
      assignedUser = 'Quản trị hệ thống (Lê Hữu Quân)';
      department = 'Bộ phận CNTT';
      category = 'SERVER';
    } else if (ip === '10.0.0.1') {
      displayName = 'DServer Gateway (DServer.hepco.com.vn)';
      assignedUser = 'Bộ phận CNTT';
      department = 'Bộ phận CNTT';
      category = 'SERVER';
    } else {
      if (!displayName) {
        if (category === 'PRINTER') displayName = `Máy In ${vendor.split(' ')[0]} (${ip})`;
        else if (category === 'CAMERA') displayName = `Camera An Ninh ${vendor.split(' ')[0]} (${ip})`;
        else if (category === 'ROUTER') displayName = `Router Gateway (${ip})`;
        else if (category === 'SWITCH') displayName = `Switch Mạng Cisco (${ip})`;
        else if (category === 'SERVER') displayName = `Máy Chủ (${ip})`;
        else displayName = `PC-${vendor.split(' ')[0]}-${ip.split('.').pop()}`;
      }

      // Department inference from Hostname / Category
      if (hUpper.includes('KT') || hUpper.includes('KETOAN')) {
        department = 'Phòng Kế Toán';
        if (!assignedUser) assignedUser = 'Cán bộ P. Kế Toán';
      } else if (hUpper.includes('HC') || hUpper.includes('HANHCHINH')) {
        department = 'Phòng Hành Chính';
        if (!assignedUser) assignedUser = 'Cán bộ P. Hành Chính';
      } else if (hUpper.includes('CNTT') || hUpper.includes('IT')) {
        department = 'Bộ phận CNTT';
        if (!assignedUser) assignedUser = 'Lê Hữu Quân (IT Admin)';
      } else if (hUpper.includes('KD') || hUpper.includes('KINHDOANH')) {
        department = 'Phòng Kinh Doanh';
        if (!assignedUser) assignedUser = 'Cán bộ P. Kinh Doanh';
      } else if (hUpper.includes('BV') || hUpper.includes('BAOVE')) {
        department = 'Tổ Bảo Vệ';
        if (!assignedUser) assignedUser = 'Tổ Trưởng Bảo Vệ';
      } else if (category === 'PRINTER') {
        department = ip.startsWith('10.0.0.') ? 'Văn Phòng Tổng Hợp / Kế Toán' : 'Dùng chung phòng ban';
        if (!assignedUser) assignedUser = 'Dùng chung máy in mạng';
      } else if (category === 'CAMERA') {
        department = 'Tổ Bảo Vệ';
        if (!assignedUser) assignedUser = 'Camera an ninh giám sát';
      } else if (category === 'ROUTER' || category === 'SWITCH' || category === 'SERVER') {
        department = 'Bộ phận CNTT';
        if (!assignedUser) assignedUser = 'Quản trị hệ thống (SysAdmin)';
      } else {
        if (!assignedUser) assignedUser = 'Chưa định danh nhân viên';
      }
    }

    const openPorts = [];
    if (p22) openPorts.push(22);
    if (p53) openPorts.push(53);
    if (p80) openPorts.push(80);
    if (p445) openPorts.push(445);
    if (p554) openPorts.push(554);
    if (p3389) openPorts.push(3389);
    if (p9100) openPorts.push(9100);

    return {
      id: `dev-${ip.replace(/\./g, '-')}`,
      device_code: `TS-${category.substring(0, 2)}-${ip.split('.').pop()?.padStart(3, '0')}`,
      display_name: displayName,
      category,
      ip,
      mac,
      vendor,
      assigned_user: assignedUser,
      department,
      location: category === 'ROUTER' || category === 'SWITCH' || category === 'SERVER' ? 'Phòng Server / Tủ Rack' : 'Bàn làm việc nhân viên',
      status: 'ONLINE',
      last_seen: 'Vừa quét sâu thực tế',
      openPorts,
      notes: `Nhận diện qua ${hintedType ? 'OUI ' + vendor : resolved.method || 'ARP'} (Ports mở: ${openPorts.join(', ') || 'N/A'})`,
    };
  };

  // Run in chunks of 15 concurrency
  const batchSize = 15;
  const results = [];
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    const batchRes = await Promise.all(batch.map((t) => deepAuditHost(t)));
    results.push(...batchRes);
  }

  return { success: true, count: results.length, devices: results };
});

// Single Ping
ipcMain.handle('network-ping', async (_, host) => {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `ping -n 2 -w 800 ${host}` : `ping -c 2 -W 1 ${host}`;
    exec(cmd, (error, stdout) => {
      if (error) {
        resolve({ success: false, output: stdout || error.message, isAlive: false, latency: null });
      } else {
        const isAlive = !stdout.includes('Destination host unreachable') && !stdout.includes('100% loss');
        let latency = null;
        const avgMatch = stdout.match(/Average\s*=\s*(\d+)ms/i) || stdout.match(/time[=<](\d+)ms/i);
        if (avgMatch) latency = parseInt(avgMatch[1], 10);
        resolve({ success: true, output: stdout, isAlive, latency });
      }
    });
  });
});

// ARP Scan
ipcMain.handle('network-arp-scan', async () => {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    exec(isWin ? 'arp -a' : 'ip neigh', (error, stdout) => {
      if (error) {
        resolve({ success: false, devices: [], error: error.message });
        return;
      }
      const devices = [];
      const lines = stdout.split('\n');
      const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
      const macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/;

      for (const line of lines) {
        const ipMatch = line.match(ipRegex);
        const macMatch = line.match(macRegex);
        if (ipMatch && macMatch) {
          const ip = ipMatch[0];
          const mac = macMatch[0].toUpperCase().replace(/-/g, ':');
          if (
            mac !== 'FF:FF:FF:FF:FF:FF' &&
            !mac.startsWith('01:00:5E') &&
            !ip.startsWith('224.') &&
            !ip.startsWith('239.') &&
            !ip.endsWith('.255')
          ) {
            const { vendor } = lookupOui(mac);
            devices.push({ ip, mac, vendor, type: 'dynamic' });
          }
        }
      }
      resolve({ success: true, devices });
    });
  });
});

// Port Scan
ipcMain.handle('network-port-scan', async (_, { ip, ports }) => {
  const targetPorts = ports || [21, 22, 23, 53, 80, 443, 445, 554, 3389, 8080, 9100];
  const results = await Promise.all(targetPorts.map(async (p) => ({ port: p, isOpen: await probeSinglePort(ip, p) })));
  return { ip, openPorts: results.filter((r) => r.isOpen).map((r) => r.port) };
});

// Wake on LAN
ipcMain.handle('network-wake-on-lan', async (_, macAddress) => {
  return new Promise((resolve) => {
    try {
      const cleanMac = macAddress.replace(/[^0-9A-Fa-f]/g, '');
      if (cleanMac.length !== 12) {
        resolve({ success: false, error: 'Địa chỉ MAC không hợp lệ' });
        return;
      }
      const macBuffer = Buffer.from(cleanMac, 'hex');
      const magicPacket = Buffer.concat([Buffer.alloc(6, 0xff), ...Array(16).fill(macBuffer)]);

      const client = dgram.createSocket('udp4');
      client.bind(() => {
        client.setBroadcast(true);
        client.send(magicPacket, 0, magicPacket.length, 9, '255.255.255.255', (err) => {
          client.close();
          if (err) resolve({ success: false, error: err.message });
          else resolve({ success: true, message: `Đã phát Magic Packet Wake-on-LAN tới MAC ${macAddress}` });
        });
      });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
});

// Native Launchers
ipcMain.handle('network-launch-rdp', async (_, ip) => {
  if (process.platform === 'win32') {
    exec(`start mstsc /v:${ip}`);
    return { success: true };
  }
  return { success: false, error: 'RDP Native chỉ hỗ trợ trên Windows' };
});

ipcMain.handle('network-launch-ssh', async (_, ip) => {
  if (process.platform === 'win32') {
    exec(`start cmd.exe /k "echo Dang ket noi SSH toi ${ip}... && ssh admin@${ip}"`);
    return { success: true };
  }
  return { success: true };
});

ipcMain.handle('network-launch-web', async (_, ip) => {
  shell.openExternal(`http://${ip}`);
  return { success: true };
});

ipcMain.handle('network-traceroute', async (_, host) => {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `tracert -d -h 15 -w 500 ${host}` : `traceroute -n -m 15 -w 1 ${host}`;
    exec(cmd, (error, stdout) => resolve({ success: !error, output: stdout || error?.message }));
  });
});

ipcMain.handle('network-resolve-hostname', async (_, ip) => {
  const res = await resolveHostAndUser(ip);
  return { success: !!res.hostname, ...res };
});

// Storage Path Resolver for Packaged App (Portable & Installer) and Development
function getBundledInventoryPaths() {
  const paths = [];
  if (process.resourcesPath) {
    paths.push(path.join(process.resourcesPath, 'data', 'devices_inventory.json'));
  }
  paths.push(path.join(__dirname, '../../data/devices_inventory.json'));
  paths.push('F:\\LinhTinh\\APP_TuPhatTrien\\HEPCO-IT-COMMAND-CENTER\\data\\devices_inventory.json');
  try {
    paths.push(path.join(path.dirname(app.getPath('exe')), 'data', 'devices_inventory.json'));
  } catch {}
  return paths;
}

function getInventoryFilePaths() {
  const paths = [...getBundledInventoryPaths()];
  try {
    paths.push(path.join(app.getPath('userData'), 'devices_inventory.json'));
  } catch {}
  return paths;
}

ipcMain.handle('inventory-load', async () => {
  try {
    let bundledDevices = null;
    let sourcePath = '';
    for (const bp of getBundledInventoryPaths()) {
      if (fs.existsSync(bp)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(bp, 'utf-8'));
          if (Array.isArray(parsed) && parsed.length > 0) {
            bundledDevices = parsed;
            sourcePath = bp;
            break;
          }
        } catch {}
      }
    }

    let userDevices = null;
    try {
      const userInvPath = path.join(app.getPath('userData'), 'devices_inventory.json');
      if (fs.existsSync(userInvPath)) {
        const parsed = JSON.parse(fs.readFileSync(userInvPath, 'utf-8'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          userDevices = parsed;
          if (!sourcePath) sourcePath = userInvPath;
        }
      }
    } catch {}

    // Always prioritize bundled devices + merge any user-added devices so OTA/new builds never show stale data
    let devices = bundledDevices ? [...bundledDevices] : userDevices ? [...userDevices] : null;
    if (bundledDevices && userDevices) {
      const existingKeys = new Set(bundledDevices.map(d => d.ip || d.id));
      for (const ud of userDevices) {
        const k = ud.ip || ud.id;
        if (k && !existingKeys.has(k)) {
          devices.push(ud);
          existingKeys.add(k);
        }
      }
    }

    if (Array.isArray(devices)) {
      // Remove deleted device 10.2.1.154
      devices = devices.filter(d => d.ip !== '10.2.1.154');
      // Enforce correct Photocopier IPs (MP 7502 is 10.0.0.17, IM 5000 is 10.0.0.18)
      devices.forEach(d => {
        const name = (d.display_name || d.name || '').toLowerCase();
        if ((name.includes('7502') || name.includes('7503') || d.id === 'PRN-RICOH-7502') && d.category === 'PRINTER') {
          d.ip = '10.0.0.17';
        }
        if ((name.includes('im 5000') || name.includes('im5000') || d.id === 'PRN-RICOH-IM5000') && d.category === 'PRINTER') {
          d.ip = '10.0.0.18';
        }
      });
      // Remove any printer with old 10.1.1.17 or 10.1.1.18
      devices = devices.filter(d => !(
        (d.ip === '10.1.1.17' || d.ip === '10.1.1.18') &&
        (d.category === 'PRINTER' || (d.display_name && d.display_name.toLowerCase().includes('ricoh')))
      ));
      return { success: true, devices, source: sourcePath };
    }
    return { success: true, devices: null };
  } catch (err) {
    return { success: false, error: err.message, devices: null };
  }
});

ipcMain.handle('inventory-save', async (_, devices) => {
  try {
    const primary = path.join(app.getPath('userData'), 'devices_inventory.json');
    const dir = path.dirname(primary);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(primary, JSON.stringify(devices, null, 2), 'utf-8');

    // Also sync to dev location if exists
    for (const p of getInventoryFilePaths().slice(1)) {
      if (fs.existsSync(path.dirname(p))) {
        try { fs.writeFileSync(p, JSON.stringify(devices, null, 2), 'utf-8'); } catch {}
      }
    }
    return { success: true, savedPath: primary };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-system-info', async () => {
  const ifaces = os.networkInterfaces();
  let primaryIp = '10.1.1.45';
  const allIps = [];

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        allIps.push(iface.address);
        if (primaryIp === '10.1.1.45' || iface.address.startsWith('10.')) {
          primaryIp = iface.address;
        }
      }
    }
  }

  // Always include localhost in active IPs
  allIps.push('127.0.0.1');

  return {
    hostname: os.hostname(),
    primaryIp: primaryIp,
    allIps: Array.from(new Set(allIps)),
    platform: os.platform(),
    arch: os.arch(),
    totalMemGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
    freeMemGB: (os.freemem() / 1024 / 1024 / 1024).toFixed(1),
    networkInterfaces: os.networkInterfaces(),
  };
});

// ===========================================================================
// IP Access Whitelist Security Policy Engine
// ===========================================================================
const SECURITY_POLICY_FILE = path.join(app.getPath('userData'), 'security_policy.json');

ipcMain.handle('security-get-policy', async () => {
  try {
    if (fs.existsSync(SECURITY_POLICY_FILE)) {
      const data = JSON.parse(fs.readFileSync(SECURITY_POLICY_FILE, 'utf8'));
      return { success: true, policy: data };
    }
  } catch (e) {
    console.error('Error reading security policy:', e);
  }
  return {
    success: true,
    policy: {
      enabled: true,
      allowedIps: ['10.1.1.45', '127.0.0.1', '10.1.1.88'],
      bypassPin: 'hepco@2026',
      adminNote: 'Chỉ các địa chỉ IP được cấp phép mới được khởi chạy HEPCO COMMAND',
      userPermissions: [
        {
          id: 'admin-default',
          name: 'Lê Hồng Quân (Quản Trị Viên CNTT)',
          ip: '10.1.1.45',
          department: 'Bộ phận CNTT HEPCO',
          role: 'admin',
          allowedFeatures: [
            'dashboard', 'traffic', 'computers', 'printers', 'cameras',
            'pos', 'dispatches', 'switches', 'lookup', 'network-map', 'tracking', 'settings'
          ],
          note: 'Quản trị viên toàn quyền hệ thống'
        },
        {
          id: 'user-huy-vu',
          name: 'Trần Ngọc Huy Vũ',
          ip: '10.1.1.88',
          department: 'Phòng Kế Hoạch - Nghiệp Vụ',
          role: 'custom',
          allowedFeatures: ['cameras', 'computers', 'dispatches'],
          note: 'Được phân quyền xem Camera IP, Danh sách máy tính và Quản lý công văn'
        }
      ]
    }
  };
});

ipcMain.handle('security-save-policy', async (_, policy) => {
  try {
    fs.writeFileSync(SECURITY_POLICY_FILE, JSON.stringify(policy, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Error saving security policy:', err);
    return { success: false, error: err.message };
  }
});

// ===========================================================================
// Live OTA Hot-Update Engine (On-Premise LAN & Installed App Sync)
// ===========================================================================
ipcMain.handle('get-app-version', () => APP_VERSION);

ipcMain.handle('ota-check-update', async () => {
  try {
    let latestVersion = APP_VERSION;
    let hasUpdate = false;
    const devPkgPath = 'F:\\LinhTinh\\APP_TuPhatTrien\\HEPCO-IT-COMMAND-CENTER\\frontend\\package.json';
    if (fs.existsSync(devPkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(devPkgPath, 'utf-8'));
        if (pkg.version && pkg.version !== APP_VERSION) {
          latestVersion = pkg.version;
          hasUpdate = true;
        }
      } catch {}
    }

    const installedAsar = 'C:\\Program Files\\HEPCO COMMAND\\resources\\app.asar';
    const latestAsar = 'F:\\LinhTinh\\APP_TuPhatTrien\\HEPCO-IT-COMMAND-CENTER\\dist-app\\win-unpacked\\resources\\app.asar';
    if (fs.existsSync(installedAsar) && fs.existsSync(latestAsar)) {
      try {
        const stInst = fs.statSync(installedAsar);
        const stLatest = fs.statSync(latestAsar);
        if (stLatest.mtimeMs - stInst.mtimeMs > 5000) {
          hasUpdate = true;
        }
      } catch {}
    }

    return {
      success: true,
      currentVersion: APP_VERSION,
      latestVersion,
      hasUpdate,
      execPath: process.execPath,
      isPortable: !!process.env.PORTABLE_EXECUTABLE_FILE,
      channel: 'HEPCO On-Premise LAN',
      releaseNotes:
        'Phiên bản v1.1.0: Tích hợp công nghệ gốc Dahua NetSDK (dhnetsdk.dll Port 37777) xem trực tiếp Camera Bãi Rác, Live View 4/4 Camera Imou Cloud, bổ sung 4 Router Wi-Fi Tầng 2 và đồng bộ tự động giữa bản Cài Đặt & Portable.',
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('ota-apply-update', async (_, updatePayload) => {
  try {
    // 1. Clear stale userData inventory cache so newly bundled devices load immediately
    try {
      const userInvPath = path.join(app.getPath('userData'), 'devices_inventory.json');
      if (fs.existsSync(userInvPath)) {
        fs.unlinkSync(userInvPath);
      }
    } catch {}

    // 2. Clear Electron HTTP & Code Cache
    try {
      if (session.defaultSession) {
        await session.defaultSession.clearCache();
      }
    } catch {}

    // 3. Sync installed directories (%LOCALAPPDATA%\Programs\HEPCO COMMAND and C:\Program Files\HEPCO COMMAND)
    const userInstalledDir = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'HEPCO COMMAND');
    const progInstalledDir = 'C:\\Program Files\\HEPCO COMMAND';
    const unpackedDir = 'F:\\LinhTinh\\APP_TuPhatTrien\\HEPCO-IT-COMMAND-CENTER\\dist-app\\win-unpacked';
    const installerExe = 'F:\\LinhTinh\\APP_TuPhatTrien\\HEPCO-IT-COMMAND-CENTER\\dist-app\\HEPCO_COMMAND_Cai_Dat.exe';

    for (const targetDir of [userInstalledDir, progInstalledDir]) {
      if (
        targetDir &&
        fs.existsSync(targetDir) &&
        fs.existsSync(unpackedDir) &&
        !process.execPath.toLowerCase().startsWith(targetDir.toLowerCase())
      ) {
        try {
          exec(
            `powershell -NoProfile -ExecutionPolicy Bypass -Command "Copy-Item -Path '${unpackedDir}\\resources\\*' -Destination '${targetDir}\\resources\\' -Recurse -Force -ErrorAction SilentlyContinue"`,
            () => {}
          );
        } catch {}
      }
    }

    if (fs.existsSync(installerExe)) {
      try {
        const myAsar = path.join(process.resourcesPath || '', 'app.asar');
        if (
          fs.existsSync(myAsar) &&
          !process.env.PORTABLE_EXECUTABLE_FILE &&
          fs.statSync(installerExe).mtimeMs - fs.statSync(myAsar).mtimeMs > 15000
        ) {
          spawn(installerExe, ['/currentuser', '/S'], { detached: true, stdio: 'ignore' }).unref();
          setTimeout(() => app.quit(), 600);
          return { success: true, relaunchingInstaller: true, version: APP_VERSION };
        }
      } catch {}
    }

    if (
       mainWindow &&
      !mainWindow.isDestroyed() &&
      updatePayload &&
      updatePayload.forceReload === true
    ) {
      mainWindow.webContents.reloadIgnoringCache();
    }
    return { success: true, version: APP_VERSION };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ===========================================================================
// Hardware Remote Audit Engine (Live DCOM/WMI LAN Inspection)
// ===========================================================================
ipcMain.handle('audit-remote-hardware', async (_, ip) => {
  return new Promise((resolve) => {
    const psScript = `
      $ErrorActionPreference = 'SilentlyContinue'
      $opt = New-CimSessionOption -Protocol Dcom
      $session = $null
      try {
        if ('${ip}' -eq '10.1.1.45' -or '${ip}' -eq '127.0.0.1') {
          $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
          $mem = Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
          $os = Get-CimInstance Win32_OperatingSystem | Select-Object -First 1
          $board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
          $disk = Get-CimInstance Win32_DiskDrive | Select-Object -First 1
        } else {
          $session = New-CimSession -ComputerName '${ip}' -SessionOption $opt -OperationTimeoutSec 2
          $cpu = Get-CimInstance Win32_Processor -CimSession $session | Select-Object -First 1
          $mem = Get-CimInstance Win32_PhysicalMemory -CimSession $session | Measure-Object -Property Capacity -Sum
          $os = Get-CimInstance Win32_OperatingSystem -CimSession $session | Select-Object -First 1
          $board = Get-CimInstance Win32_BaseBoard -CimSession $session | Select-Object -First 1
          $disk = Get-CimInstance Win32_DiskDrive -CimSession $session | Select-Object -First 1
        }
        $ramGB = if ($mem.Sum) { [Math]::Round($mem.Sum / 1GB) } else { 0 }
        $diskGB = if ($disk) { [Math]::Round($disk.Size / 1GB) } else { 0 }
        [PSCustomObject]@{
          success = $true
          ip = '${ip}'
          cpu = if ($cpu) { $cpu.Name.Trim() } else { 'N/A' }
          ramGB = $ramGB
          mainboard = if ($board) { ($board.Manufacturer + ' ' + $board.Product).Trim() } else { 'N/A' }
          storage = if ($disk) { ($disk.Model + ' (' + $diskGB + ' GB)').Trim() } else { 'N/A' }
          os = if ($os) { $os.Caption.Trim() } else { 'N/A' }
        } | ConvertTo-Json -Compress
      } catch {
        [PSCustomObject]@{ success = $false; ip = '${ip}'; error = $_.Exception.Message } | ConvertTo-Json -Compress
      } finally {
        if ($session) { Remove-CimSession $session }
      }
    `.replace(/\r?\n/g, ' ');

    exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, (err, stdout) => {
      if (err || !stdout) {
        resolve({ success: false, ip, error: err?.message || 'Không thể kết nối RPC/WMI' });
      } else {
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch {
          resolve({ success: false, ip, error: 'Lỗi parse dữ liệu WMI' });
        }
      }
    });
  });
});

// ===========================================================================
// Camera Live Onlive Integration (HTTP Digest Auth, Native Dahua NetSDK & Imou)
// ===========================================================================
const NVR_CREDS = {
  '10.110.1.13': { user: 'admin', pass: 'hepco@12@12' },
  '10.110.1.80': { user: 'admin', pass: '@dmin123' },
  '113.161.8.149': { user: 'admin', pass: 'philonghue123', port: 83, tcpPort: 37777 },
  'IMOU_CLOUD': { user: 'hepco.camera@gmail.com', pass: 'Hepco@123' },
};

function getNvrCredsForIp(ip) {
  if (ip === '113.161.8.149') return NVR_CREDS['113.161.8.149'];
  if (ip === 'IMOU_CLOUD' || ip === 'imou.hepco.cloud') return NVR_CREDS['IMOU_CLOUD'];
  if (ip === '10.110.1.13' || ip.startsWith('10.110.1.1') || ip.startsWith('10.110.1.2') || ip.startsWith('10.110.1.5')) {
    return NVR_CREDS['10.110.1.13'];
  }
  return NVR_CREDS['10.110.1.80'];
}

// Persistent Dahua NetSDK (TCP 37777 HighLevelSecurity) Bridge Worker
let dahuaBridgeProc = null;
let dahuaBridgeReady = false;
const dahuaBridgeWaiters = new Map();
let dahuaStdoutBuf = '';

function findDahuaBridgeExe() {
  const candidates = [
    path.join(process.resourcesPath || '', 'dahua-sdk', 'DahuaBridge.exe'),
    path.join(__dirname, 'dahua-sdk', 'DahuaBridge.exe'),
    path.join(app.getAppPath(), 'electron', 'dahua-sdk', 'DahuaBridge.exe'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function ensureDahuaBridge() {
  if (dahuaBridgeProc && !dahuaBridgeProc.killed) return dahuaBridgeProc;
  const exePath = findDahuaBridgeExe();
  if (!exePath) return null;

  try {
    dahuaBridgeReady = false;
    dahuaStdoutBuf = '';
    dahuaBridgeProc = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      windowsHide: true,
    });

    dahuaBridgeProc.stdout.on('data', (chunk) => {
      dahuaStdoutBuf += chunk.toString();
      const lines = dahuaStdoutBuf.split(/\r?\n/);
      dahuaStdoutBuf = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.type === 'ready') {
            dahuaBridgeReady = true;
          } else if (msg.type === 'snap') {
            const ch = Number(msg.channel);
            const list = dahuaBridgeWaiters.get(ch);
            if (list && list.length > 0) {
              const resolver = list.shift();
              resolver(msg);
            }
          }
        } catch {}
      }
    });

    dahuaBridgeProc.on('exit', () => {
      dahuaBridgeProc = null;
      dahuaBridgeReady = false;
      for (const [, list] of dahuaBridgeWaiters) {
        while (list.length > 0) {
          const r = list.shift();
          r({ success: false, error: 'Bridge exited' });
        }
      }
    });

    return dahuaBridgeProc;
  } catch (err) {
    console.error('Failed to spawn DahuaBridge.exe:', err);
    dahuaBridgeProc = null;
    return null;
  }
}

function fetchDahuaNativeSnap(channelIdx) {
  return new Promise((resolve) => {
    const proc = ensureDahuaBridge();
    if (!proc) {
      resolve({ success: false, error: 'DahuaBridge not found' });
      return;
    }

    const ch = Math.max(0, Number(channelIdx) || 0);
    if (!dahuaBridgeWaiters.has(ch)) dahuaBridgeWaiters.set(ch, []);
    const timer = setTimeout(() => {
      const list = dahuaBridgeWaiters.get(ch) || [];
      const idx = list.indexOf(onResult);
      if (idx >= 0) list.splice(idx, 1);
      resolve({ success: false, error: 'Dahua SDK snap timeout' });
    }, 3500);

    function onResult(msg) {
      clearTimeout(timer);
      resolve(msg);
    }

    dahuaBridgeWaiters.get(ch).push(onResult);
    try {
      proc.stdin.write(`SNAP ${ch}\n`);
    } catch (e) {
      clearTimeout(timer);
      resolve({ success: false, error: e.message });
    }
  });
}

ipcMain.handle('camera-fetch-snapshot', async (_, payload) => {
  const ip = typeof payload === 'string' ? payload : payload.ip;
  const defaultCreds = getNvrCredsForIp(ip);
  const user = payload?.user || defaultCreds.user;
  const pass = payload?.pass || defaultCreds.pass;
  const port = payload?.port || defaultCreds.port || 80;

  // 1. Native Dahua NetSDK (CLIENT_LoginWithHighLevelSecurity + CLIENT_SnapPictureEx) for Camera Bãi Rác (113.161.8.149:37777)
  if (ip === '113.161.8.149') {
    const chZeroBased =
      typeof payload?.channel === 'number'
        ? payload.channel
        : payload?.path && /channels\/(\d)01/.test(payload.path)
        ? Math.max(0, parseInt(payload.path.match(/channels\/(\d)01/)[1], 10) - 1)
        : 0;

    const start = Date.now();
    const snapRes = await fetchDahuaNativeSnap(chZeroBased);
    const latencyMs = Date.now() - start;

    if (snapRes && snapRes.success && snapRes.dataUrl) {
      return {
        success: true,
        dataUrl: snapRes.dataUrl,
        authenticated: true,
        tcpOnline: true,
        latencyMs,
        channels: 7,
        protocol: 'Dahua NetSDK 37777 (HighLevelSecurity)',
      };
    }

    return {
      success: false,
      tcpOnline: true,
      latencyMs: latencyMs || 25,
      channels: 7,
      protocol: 'Dahua NetSDK 37777 (HighLevelSecurity)',
      error: snapRes?.error || 'Kênh không có tín hiệu',
    };
  }

  // 2. Imou Cloud Live Snapshot Sync (Checks C:\Users\Public\Imou_en\Capture & Record for newer captures)
  if (ip === 'IMOU_CLOUD' || ip === 'imou.hepco.cloud') {
    const chNum = Number(payload?.channel) || 1;
    try {
      const capDirs = [
        'C:\\Users\\Public\\Imou_en\\Capture',
        'C:\\Users\\Public\\Imou_en\\Record',
      ];
      let newestFiles = [];
      for (const baseDir of capDirs) {
        if (fs.existsSync(baseDir)) {
          const subDirs = fs.readdirSync(baseDir, { withFileTypes: true });
          for (const d of subDirs) {
            if (d.isDirectory()) {
              const fullSub = path.join(baseDir, d.name);
              const files = fs.readdirSync(fullSub)
                .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
                .map(f => {
                  const fp = path.join(fullSub, f);
                  const st = fs.statSync(fp);
                  return { path: fp, mtimeMs: st.mtimeMs, size: st.size };
                })
                .filter(x => x.size > 15000 && x.mtimeMs > Date.now() - 24 * 3600 * 1000);
              newestFiles.push(...files);
            }
          }
        }
      }
      if (newestFiles.length > 0) {
        newestFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
        const picked = newestFiles[(chNum - 1) % newestFiles.length];
        if (picked && fs.existsSync(picked.path)) {
          const b64 = fs.readFileSync(picked.path).toString('base64');
          return {
            success: true,
            dataUrl: `data:image/jpeg;base64,${b64}`,
            authenticated: true,
          };
        }
      }
    } catch {}
    return { success: false, useBundledFallback: true };
  }

  const snapPath = payload?.path || (ip.endsWith('.11') || ip.endsWith('.13') || ip.endsWith('.80')
    ? '/ISAPI/Streaming/channels/101/picture'
    : '/cgi-bin/snapshot.cgi');

  const crypto = require('crypto');
  const http = require('http');
  const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

  const tryHttpSnapshot = (targetPort, targetPath) =>
    new Promise((resolve) => {
      const req1 = http.get({ host: ip, port: targetPort, path: targetPath, timeout: 2500 }, (res1) => {
        if (res1.statusCode === 200) {
          const chunks = [];
          res1.on('data', c => chunks.push(c));
          res1.on('end', () => {
            const b64 = Buffer.concat(chunks).toString('base64');
            resolve({ success: true, dataUrl: `data:image/jpeg;base64,${b64}`, authenticated: false });
          });
          return;
        }

        if (res1.statusCode === 401 && pass) {
          const auth = res1.headers['www-authenticate'];
          if (auth && auth.includes('Digest')) {
            const realm = (auth.match(/realm="([^"]+)"/) || [])[1] || '';
            const nonce = (auth.match(/nonce="([^"]+)"/) || [])[1] || '';
            const qop = (auth.match(/qop="([^"]+)"/) || [])[1];
            const opaque = (auth.match(/opaque="([^"]+)"/) || [])[1];

            const ha1 = md5(`${user}:${realm}:${pass}`);
            const ha2 = md5(`GET:${targetPath}`);
            const nc = '00000001';
            const cnonce = 'abcdef01';
            const resp = qop
              ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
              : md5(`${ha1}:${nonce}:${ha2}`);

            let authHeader = `Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${targetPath}", response="${resp}"`;
            if (qop) authHeader += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
            if (opaque) authHeader += `, opaque="${opaque}"`;

            const req2 = http.get({ host: ip, port: targetPort, path: targetPath, headers: { Authorization: authHeader }, timeout: 3000 }, (res2) => {
              if (res2.statusCode === 200) {
                const chunks = [];
                res2.on('data', c => chunks.push(c));
                res2.on('end', () => {
                  const b64 = Buffer.concat(chunks).toString('base64');
                  resolve({ success: true, dataUrl: `data:image/jpeg;base64,${b64}`, authenticated: true });
                });
              } else {
                resolve({ success: false, statusCode: res2.statusCode, authRequired: true, error: 'Mật khẩu camera không chính xác' });
              }
            });
            req2.on('error', (e) => resolve({ success: false, error: e.message }));
            return;
          }
        }

        resolve({ success: false, statusCode: res1.statusCode, authRequired: res1.statusCode === 401 });
      });
      req1.on('error', (e) => resolve({ success: false, error: e.message }));
      req1.on('timeout', () => { req1.destroy(); resolve({ success: false, error: 'Timeout' }); });
    });

  return tryHttpSnapshot(port, snapPath);
});

ipcMain.handle('camera-open-viewer-window', async (_, { ip, name }) => {
  try {
    const isImou = ip === 'IMOU_CLOUD' || ip === 'imou.hepco.cloud';
    const isBaiRac = ip === '113.161.8.149';
    const creds = getNvrCredsForIp(ip);

    // If user installed native Imou PC Client or SmartPSS on this machine, launch/focus it directly when requested via native mode!
    if (isImou && name && name.includes('NATIVE_APP')) {
      const imouExe = 'C:\\Program Files\\Imou_en\\bin\\Imou_en.exe';
      if (fs.existsSync(imouExe)) {
        spawn(imouExe, [], { cwd: path.dirname(imouExe), detached: true, stdio: 'ignore' }).unref();
        return { success: true, launchedNative: 'Imou_en.exe' };
      }
    }
    if (isBaiRac && name && name.includes('NATIVE_APP')) {
      const spssExe = 'C:\\Program Files\\Smart Professional Surveillance System\\SmartPSS\\SmartPSS.exe';
      if (fs.existsSync(spssExe)) {
        spawn(spssExe, [], { cwd: path.dirname(spssExe), detached: true, stdio: 'ignore' }).unref();
        return { success: true, launchedNative: 'SmartPSS.exe' };
      }
    }

    const camWin = new BrowserWindow({
      width: 1240,
      height: 820,
      title: isImou
        ? 'HEPCO Camera Imou Cloud - TK: hepco.camera@gmail.com | MK: Hepco@123'
        : isBaiRac
        ? 'HEPCO Camera Bãi Rác (BaiRac) - IP: 113.161.8.149 | Port: 37777 / 3777 | TK: admin | MK: philonghue123'
        : `HEPCO CCTV Live - ${name || 'Camera'} (${ip})`,
      backgroundColor: '#0a0e17',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Auto-authenticate HTTP Basic / Digest prompts
    camWin.webContents.on('login', (event, authenticationResponseDetails, authInfo, callback) => {
      event.preventDefault();
      callback(creds.user, creds.pass);
    });

    const targetUrl = isImou
      ? 'https://www.imoulife.com/vn'
      : isBaiRac
      ? 'http://113.161.8.149:83'
      : `http://${ip}`;

    camWin.webContents.on('did-finish-load', () => {
      const userVal = JSON.stringify(creds.user);
      const passVal = JSON.stringify(creds.pass);
      const bannerLabel = isImou
        ? '☁️ IMOU CLOUD HEPCO — Tài khoản: hepco.camera@gmail.com | Mật khẩu: Hepco@123'
        : isBaiRac
        ? '📹 CAMERA BÃI RÁC (BaiRac) — IP: 113.161.8.149 | Port: 37777 (3777) / Web: 83 | TK: admin | MK: philonghue123'
        : `📹 ĐẦU GHI CAMERA (${ip}) — TK: ${creds.user} | MK: ${creds.pass}`;

      camWin.webContents
        .executeJavaScript(`
          (function() {
            try {
              const u = ${userVal};
              const p = ${passVal};
              function fillLogin() {
                const inputs = Array.from(document.querySelectorAll('input'));
                const uInput = inputs.find(el => el.type === 'text' || el.type === 'email' || (el.name && /user|email|account|login/i.test(el.name)) || (el.placeholder && /user|tài khoản|email/i.test(el.placeholder)));
                const pInput = inputs.find(el => el.type === 'password');
                if (uInput && !uInput.value) {
                  uInput.value = u;
                  uInput.dispatchEvent(new Event('input', { bubbles: true }));
                  uInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (pInput && !pInput.value) {
                  pInput.value = p;
                  pInput.dispatchEvent(new Event('input', { bubbles: true }));
                  pInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }
              fillLogin();
              setTimeout(fillLogin, 1200);
              setTimeout(fillLogin, 2800);

              if (!document.getElementById('hepco-cam-bar')) {
                const bar = document.createElement('div');
                bar.id = 'hepco-cam-bar';
                bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999999;background:rgba(15,23,42,0.95);color:#f8fafc;padding:8px 16px;font-family:monospace;font-size:12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #10b981;';
                bar.innerHTML = '<span>' + ${JSON.stringify(bannerLabel)} + '</span><div style="display:flex;gap:8px;"><button id="hepco-copy-u" style="background:#059669;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:bold;">Chép TK</button><button id="hepco-copy-p" style="background:#0284c7;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:bold;">Chép MK</button></div>';
                document.body.appendChild(bar);
                document.getElementById('hepco-copy-u').onclick = () => navigator.clipboard.writeText(u);
                document.getElementById('hepco-copy-p').onclick = () => navigator.clipboard.writeText(p);
              }
            } catch (e) {}
          })();
        `)
        .catch(() => {});
    });

    camWin.loadURL(targetUrl);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('camera-launch-stream', async (_, rtspUrl) => {
  try {
    // Check if VLC exists in standard locations
    const vlcPaths = [
      'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
      'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
    ];
    let vlcFound = null;
    for (const p of vlcPaths) {
      if (fs.existsSync(p)) { vlcFound = p; break; }
    }

    if (vlcFound) {
      spawn(vlcFound, [rtspUrl, '--network-caching=300'], { detached: true, stdio: 'ignore' }).unref();
      return { success: true, method: 'VLC' };
    } else {
      exec(`start "" "${rtspUrl}"`, () => {});
      return { success: true, method: 'DefaultPlayer' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ===========================================================================
// GPS Fleet Tracking Window Integration (VietMap, DSS Tracking & CMSV6 Camera)
// ===========================================================================
let trackingWindow = null;

ipcMain.handle('tracking-open-window', async (event, options = {}) => {
  try {
    const isVietMap = options.target === 'vietmap' || (options.url && options.url.includes('quanlyxe.vn'));
    const isCmsv6 = options.target === 'cmsv6' || (options.url && (options.url.includes('cam.tracking.vn') || options.url.includes('808gps')));
    
    let targetUrl = options.url;
    let username = options.username;
    let password = options.password;
    let windowTitle = '';

    if (isVietMap) {
      targetUrl = targetUrl || 'https://quanlyxe.vn/Account.aspx/LogOn';
      username = username || 'hepco';
      password = password || '123456';
      windowTitle = 'HEPCO - GIÁM SÁT ĐỘI XE VIETMAP (QUANLYXE.VN)';
    } else if (isCmsv6) {
      targetUrl = targetUrl || 'https://cam.tracking.vn:8080/808gps/login.html';
      username = username || 'moitruonghue';
      password = password || 'dss@12345';
      windowTitle = 'HEPCO - CAMERA GIÁM SÁT TRỰC TUYẾN XE CMSV6 (CAM.TRACKING.VN:8080)';
    } else {
      targetUrl = targetUrl || 'https://v5.tracking.vn/Account/LogIn';
      username = username || 'moitruonghue';
      password = password || 'dss@12345';
      windowTitle = 'HEPCO - GIÁM SÁT HÀNH TRÌNH XE RÁC DSS (V5.TRACKING.VN)';
    }

    const autoLogin = options.autoLogin !== false;

    if (trackingWindow && !trackingWindow.isDestroyed()) {
      trackingWindow.focus();
      trackingWindow.setTitle(windowTitle);
      trackingWindow.loadURL(targetUrl);
      return { success: true, message: 'Focused existing window' };
    }

    const icoPath = path.join(__dirname, 'icon.ico');
    const pngPath = path.join(__dirname, 'icon.png');
    const winIcon = fs.existsSync(icoPath) ? icoPath : pngPath;

    trackingWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 680,
      title: windowTitle,
      icon: winIcon,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        session: session.fromPartition('persist:tracking_fleet'),
      },
    });

    trackingWindow.loadURL(targetUrl);

    if (autoLogin) {
      trackingWindow.webContents.on('did-finish-load', () => {
        if (!trackingWindow || trackingWindow.isDestroyed()) return;
        const currentUrl = trackingWindow.webContents.getURL();
        if (isCmsv6 || currentUrl.includes('cam.tracking.vn') || currentUrl.includes('808gps')) {
          const injectScript = `
            (function() {
              try {
                const u = document.getElementById('loginAccount');
                const p = document.getElementById('loginPassword');
                const code = document.getElementById('phraseLogin');
                if (u && p) {
                  if (!u.value) u.value = '${username}';
                  if (!p.value) p.value = '${password}';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  if (code) {
                    code.focus();
                    code.addEventListener('input', function() {
                      if (this.value && this.value.length === 4) {
                        const btn = document.getElementById('loginSubmit') || document.querySelector('.btn-login');
                        if (btn) setTimeout(() => btn.click(), 300);
                      }
                    });
                    code.addEventListener('keydown', function(e) {
                      if (e.key === 'Enter') {
                        const btn = document.getElementById('loginSubmit') || document.querySelector('.btn-login');
                        if (btn) btn.click();
                      }
                    });
                  }
                }
              } catch(e) {}
            })();
          `;
          trackingWindow.webContents.executeJavaScript(injectScript).catch(() => {});
        } else if (isVietMap || currentUrl.includes('quanlyxe.vn')) {
          const injectScript = `
            (function() {
              try {
                const u = document.getElementById('UserName');
                const p = document.getElementById('Password');
                const chk = document.getElementById('RememberMe');
                if (chk) chk.checked = true;
                if (u && p && !u.value) {
                  u.value = '${username}';
                  p.value = '${password}';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  const btn = document.querySelector('input[name="login"]') || 
                              document.querySelector('input[type="submit"]');
                  if (btn) setTimeout(() => btn.click(), 300);
                }
              } catch(e) {}
            })();
          `;
          trackingWindow.webContents.executeJavaScript(injectScript).catch(() => {});
        } else {
          const injectScript = `
            (function() {
              try {
                const u = document.getElementById('UserName');
                const p = document.getElementById('Password');
                if (u && p && !u.value) {
                  u.value = '${username}';
                  p.value = '${password}';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  const btn = document.querySelector('input[type="submit"]') || 
                              document.querySelector('button[type="submit"]');
                  if (btn) setTimeout(() => btn.click(), 400);
                }
              } catch(e) {}
            })();
          `;
          trackingWindow.webContents.executeJavaScript(injectScript).catch(() => {});
        }
      });
    }

    trackingWindow.on('closed', () => {
      trackingWindow = null;
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('tracking-launch-cmsv6-app', async () => {
  try {
    const candidatePaths = [
      'C:\\Program Files (x86)\\CMSV6\\cmsv6.exe',
      'C:\\Program Files\\CMSV6\\cmsv6.exe',
      'C:\\Users\\Public\\Desktop\\CMSV6.lnk',
      path.join(app.getPath('downloads'), 'CMSV6_WIN_Setup.exe'),
      path.join(__dirname, '../../dist-app/CMSV6_WIN_Setup.exe')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        if (p.endsWith('.lnk')) {
          exec(`start "" "${p}"`, () => {});
        } else {
          spawn(p, [], {
            cwd: path.dirname(p),
            detached: true,
            stdio: 'ignore'
          }).unref();
        }
        return { success: true, path: p, isInstalled: p.endsWith('cmsv6.exe') || p.endsWith('.lnk') };
      }
    }
    return { success: false, error: 'Chưa tìm thấy phần mềm CMSV6 trên máy tính.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// =========================================================================
// NETWORK TRAFFIC ANOMALY DETECTION & REALTIME MONITORING ENGINE
// =========================================================================
let trafficThresholds = {
  enabled: false,         // Disabled traffic anomaly notifications per user request
  downLimitMbps: 50,      // Alert if download rate exceeds 50 Mbps
  upLimitMbps: 30,        // Alert if upload rate exceeds 30 Mbps
  broadcastLimitRate: 600,// Alert if non-unicast packet rate exceeds 600 pkts/s (storm)
  spikeRatio: 3.5,        // Alert if rate is > 350% of rolling 10-sample average
  alertCooldownSec: 15    // Min seconds between identical alerts
};

let lastTrafficSample = null;
let trafficHistory = []; // Last 20 samples for rolling charts & baseline calculation
let anomalyEvents = [];  // Stored anomaly log entries
let lastAlertTimestamp = 0;

function parseNetstatE(stdout) {
  const lines = stdout.split('\n');
  let bytesIn = 0, bytesOut = 0;
  let nonUnicastIn = 0, nonUnicastOut = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Bytes')) {
      const parts = trimmed.split(/\s+/);
      bytesIn = parseInt(parts[1], 10) || 0;
      bytesOut = parseInt(parts[2], 10) || 0;
    } else if (trimmed.startsWith('Non-unicast packets')) {
      const parts = trimmed.split(/\s+/);
      nonUnicastIn = parseInt(parts[2], 10) || 0;
      nonUnicastOut = parseInt(parts[3], 10) || 0;
    }
  }
  return { bytesIn, bytesOut, nonUnicastIn, nonUnicastOut, timestamp: Date.now() };
}

function startTrafficMonitor() {
  setInterval(() => {
    exec('netstat -e', (err, stdout) => {
      if (err || !stdout) return;
      const current = parseNetstatE(stdout);

      if (lastTrafficSample) {
        const deltaSec = Math.max(0.5, (current.timestamp - lastTrafficSample.timestamp) / 1000);
        const deltaBytesIn = Math.max(0, current.bytesIn - lastTrafficSample.bytesIn);
        const deltaBytesOut = Math.max(0, current.bytesOut - lastTrafficSample.bytesOut);
        const deltaNonUnicast = Math.max(0, current.nonUnicastIn - lastTrafficSample.nonUnicastIn);

        const downBps = deltaBytesIn / deltaSec;
        const upBps = deltaBytesOut / deltaSec;
        const downMbps = parseFloat(((downBps * 8) / (1024 * 1024)).toFixed(2));
        const upMbps = parseFloat(((upBps * 8) / (1024 * 1024)).toFixed(2));
        const downKBps = parseFloat((downBps / 1024).toFixed(1));
        const upKBps = parseFloat((upBps / 1024).toFixed(1));
        const broadcastRate = Math.round(deltaNonUnicast / deltaSec);

        const tickData = {
          time: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
          timestamp: current.timestamp,
          downMbps,
          upMbps,
          downKBps,
          upKBps,
          broadcastRate
        };

        // Maintain rolling history of 20 samples
        trafficHistory.push(tickData);
        if (trafficHistory.length > 20) trafficHistory.shift();

        // Calculate rolling baseline average
        const avgDown = trafficHistory.reduce((acc, cur) => acc + cur.downMbps, 0) / trafficHistory.length;
        const avgUp = trafficHistory.reduce((acc, cur) => acc + cur.upMbps, 0) / trafficHistory.length;

        // Check for anomalies only if notifications are enabled
        let anomalyDetected = null;

        if (trafficThresholds.enabled !== false) {
          if (downMbps > trafficThresholds.downLimitMbps) {
            anomalyDetected = {
              id: `ANOMALY-${Date.now()}`,
              type: 'DOWNLOAD_SPIKE',
              severity: downMbps > trafficThresholds.downLimitMbps * 2 ? 'CRITICAL' : 'WARNING',
              title: 'ĐỘT BIẾN LƯU LƯỢNG TẢI XUỐNG (DOWNLOAD SPIKE)',
              message: `Lưu lượng tải xuống đạt ${downMbps} Mbps (Vượt ngưỡng cảnh báo ${trafficThresholds.downLimitMbps} Mbps)`,
              measuredValue: `${downMbps} Mbps`,
              threshold: `${trafficThresholds.downLimitMbps} Mbps`,
              timestamp: new Date().toISOString()
            };
          } else if (upMbps > trafficThresholds.upLimitMbps) {
            anomalyDetected = {
              id: `ANOMALY-${Date.now()}`,
              type: 'UPLOAD_SPIKE',
              severity: upMbps > trafficThresholds.upLimitMbps * 2 ? 'CRITICAL' : 'WARNING',
              title: 'ĐỘT BIẾN LƯU LƯỢNG TẢI LÊN (UPLOAD SPIKE)',
              message: `Lưu lượng tải lên đạt ${upMbps} Mbps (Vượt ngưỡng cảnh báo ${trafficThresholds.upLimitMbps} Mbps)`,
              measuredValue: `${upMbps} Mbps`,
              threshold: `${trafficThresholds.upLimitMbps} Mbps`,
              timestamp: new Date().toISOString()
            };
          } else if (broadcastRate > trafficThresholds.broadcastLimitRate) {
            anomalyDetected = {
              id: `ANOMALY-${Date.now()}`,
              type: 'BROADCAST_STORM',
              severity: 'CRITICAL',
              title: 'CẢNH BÁO BÃO GÓI TIN BROADCAST / ARP STORM',
              message: `Tần suất gói tin Broadcast/Multicast đạt ${broadcastRate} gói/giây (Vượt ngưỡng ${trafficThresholds.broadcastLimitRate} pkts/s)`,
              measuredValue: `${broadcastRate} pkts/s`,
              threshold: `${trafficThresholds.broadcastLimitRate} pkts/s`,
              timestamp: new Date().toISOString()
            };
          } else if (downMbps > 15 && avgDown > 0.5 && downMbps > avgDown * trafficThresholds.spikeRatio) {
            anomalyDetected = {
              id: `ANOMALY-${Date.now()}`,
              type: 'BURST_TRAFFIC',
              severity: 'WARNING',
              title: 'TĂNG VỌT BẤT THƯỜNG SO VỚI MỨC NỀN',
              message: `Băng thông tăng đột ngột lên ${downMbps} Mbps (Gấp ${((downMbps / avgDown).toFixed(1))} lần mức nền trung bình)`,
              measuredValue: `${downMbps} Mbps`,
              threshold: `Trung bình: ${avgDown.toFixed(1)} Mbps`,
              timestamp: new Date().toISOString()
            };
          }
        }

        // Notify if cooldown has elapsed
        const now = Date.now();
        if (anomalyDetected && now - lastAlertTimestamp > trafficThresholds.alertCooldownSec * 1000) {
          lastAlertTimestamp = now;
          anomalyEvents.unshift(anomalyDetected);
          if (anomalyEvents.length > 50) anomalyEvents.pop();

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('traffic-anomaly-detected', anomalyDetected);
          }

          // Native Windows Notification
          try {
            if (Notification.isSupported()) {
              new Notification({
                title: '⚠️ CẢNH BÁO LƯU LƯỢNG MẠNG BẤT THƯỜNG - HEPCO',
                body: `${anomalyDetected.title}: ${anomalyDetected.message}`,
                icon: path.join(__dirname, 'icon.png')
              }).show();
            }
          } catch {}
        }

        // Send tick to active monitors
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('traffic-tick', {
            ...tickData,
            avgDown: parseFloat(avgDown.toFixed(2)),
            avgUp: parseFloat(avgUp.toFixed(2)),
            hasRecentAnomaly: !!anomalyDetected
          });
        }
      }

      lastTrafficSample = current;
    });
  }, 2000);
}

// IPC Handlers for Traffic Anomaly System
ipcMain.handle('traffic-get-current', async () => {
  return {
    success: true,
    history: trafficHistory,
    current: trafficHistory[trafficHistory.length - 1] || null,
    thresholds: trafficThresholds,
    anomalies: anomalyEvents
  };
});

ipcMain.handle('traffic-set-thresholds', async (_, newThresholds) => {
  trafficThresholds = { ...trafficThresholds, ...newThresholds };
  return { success: true, thresholds: trafficThresholds };
});

ipcMain.handle('traffic-get-anomalies', async () => {
  return { success: true, anomalies: anomalyEvents };
});

ipcMain.handle('traffic-clear-anomalies', async () => {
  anomalyEvents = [];
  return { success: true };
});

ipcMain.handle('traffic-simulate-anomaly', async () => {
  const simulated = {
    id: `ANOMALY-SIM-${Date.now()}`,
    type: 'SIMULATED_SPIKE',
    severity: 'WARNING',
    title: 'KIỂM THỬ ĐỘT BIẾN LƯU LƯỢNG MẠNG',
    message: 'Giả lập lưu lượng tải xuống tăng vọt lên 94.6 Mbps trên cổng Uplink Gateway',
    measuredValue: '94.6 Mbps',
    threshold: `${trafficThresholds.downLimitMbps} Mbps`,
    timestamp: new Date().toISOString(),
    topOffendingIps: [
      { ip: '10.2.1.34', name: 'PC Kế Toán Viên (TS-WS-141)', dept: 'Phòng Kế toán - Tài vụ', rate: '54.2 Mbps', usagePercent: 57 },
      { ip: '10.110.1.13', name: 'Đầu Ghi NVR 01 VP (10 Kênh Camera)', dept: 'Hạ Tầng An Ninh VP', rate: '22.8 Mbps', usagePercent: 24 },
      { ip: '10.0.0.8', name: 'B-SERVER QL Xe & Dữ Liệu', dept: 'Phòng Máy Chủ Trung Tâm', rate: '11.5 Mbps', usagePercent: 12 },
    ]
  };
  anomalyEvents.unshift(simulated);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('traffic-anomaly-detected', simulated);
  }
  try {
    if (Notification.isSupported()) {
      new Notification({
        title: '⚠️ [TEST] CẢNH BÁO LƯU LƯỢNG BẤT THƯỜNG',
        body: `${simulated.title}: ${simulated.message}`,
        icon: path.join(__dirname, 'icon.png')
      }).show();
    }
  } catch {}
  return { success: true, simulated };
});

ipcMain.handle('traffic-get-connections', async () => {
  return new Promise((resolve) => {
    exec('netstat -ano -p tcp', { timeout: 3000 }, (err, stdout) => {
      if (err || !stdout) {
        resolve({ success: false, connections: [], topIps: [] });
        return;
      }
      try {
        const lines = stdout.split('\n');
        const connections = [];
        const ipMap = {};
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('TCP')) {
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 5) {
              const proto = parts[0];
              const local = parts[1];
              const foreign = parts[2];
              const state = parts[3];
              const pid = parts[4];
              connections.push({ proto, local, foreign, state, pid });

              if (foreign && !foreign.startsWith('0.0.0.0') && !foreign.startsWith('127.0.0.1') && !foreign.startsWith('*')) {
                const ip = foreign.split(':')[0];
                if (ip && ip !== '0.0.0.0' && ip !== '[::]') {
                  ipMap[ip] = (ipMap[ip] || 0) + 1;
                }
              }
            }
          }
        }
        const topIps = Object.entries(ipMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([ip, count]) => ({ ip, connections: count }));

        resolve({ success: true, connections: connections.slice(0, 100), topIps });
      } catch (e) {
        resolve({ success: false, connections: [], topIps: [] });
      }
    });
  });
});

// ===========================================================================
// File Export & System Shell Integration (Open File, Show In Folder)
// ===========================================================================
ipcMain.handle('file-save-exported', async (_, { fileName, bufferBase64, promptLocation }) => {
  try {
    let targetPath;
    if (promptLocation) {
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.join(app.getPath('downloads'), fileName),
        filters: [
          { name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] },
          { name: 'Tất cả tập tin (*.*)', extensions: ['*'] }
        ]
      });
      if (canceled || !filePath) return { success: false, canceled: true };
      targetPath = filePath;
    } else {
      const downloadsDir = app.getPath('downloads');
      let candidate = path.join(downloadsDir, fileName);
      if (fs.existsSync(candidate)) {
        const ext = path.extname(fileName);
        const base = path.basename(fileName, ext);
        const d = new Date();
        const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
        candidate = path.join(downloadsDir, `${base}_${stamp}${ext}`);
      }
      targetPath = candidate;
    }

    const buffer = Buffer.from(bufferBase64, 'base64');
    fs.writeFileSync(targetPath, buffer);
    return {
      success: true,
      filePath: targetPath,
      fileName: path.basename(targetPath),
      fileSize: buffer.length
    };
  } catch (err) {
    console.error('Error saving exported file:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-open-path', async (_, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'Tập tin không tồn tại hoặc đã bị xóa.' };
    }
    const errMsg = await shell.openPath(filePath);
    if (errMsg) {
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-show-in-folder', async (_, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'Đường dẫn không tồn tại.' };
    }
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Single Instance Lock (Avoid duplicate apps eating CPU/RAM)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // App Lifecycle
  app.whenReady().then(() => {
    createWindow();
    startTrafficMonitor();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('before-quit', () => {
  try {
    if (dahuaBridgeProc && !dahuaBridgeProc.killed) {
      dahuaBridgeProc.stdin.write('QUIT\n');
      dahuaBridgeProc.kill();
    }
  } catch {}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
