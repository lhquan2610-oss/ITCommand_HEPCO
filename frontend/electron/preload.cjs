const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hiccDesktop', {
  isElectron: true,
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window-maximize-toggle'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedState: (callback) => {
    ipcRenderer.on('window-maximized-state', (_, state) => callback(state));
  },

  // Native Network Tools
  ping: (host) => ipcRenderer.invoke('network-ping', host),
  arpScan: () => ipcRenderer.invoke('network-arp-scan'),
  deepScan: () => ipcRenderer.invoke('network-deep-scan'),
  portScan: (ip, ports) => ipcRenderer.invoke('network-port-scan', { ip, ports }),
  subnetSweep: (baseIp, start, end) => ipcRenderer.invoke('network-subnet-sweep', { baseIp, start, end }),
  traceroute: (host) => ipcRenderer.invoke('network-traceroute', host),
  wakeOnLan: (mac) => ipcRenderer.invoke('network-wake-on-lan', mac),
  launchRdp: (ip) => ipcRenderer.invoke('network-launch-rdp', ip),
  launchSsh: (ip) => ipcRenderer.invoke('network-launch-ssh', ip),
  launchWeb: (ip) => ipcRenderer.invoke('network-launch-web', ip),
  resolveHostname: (ip) => ipcRenderer.invoke('network-resolve-hostname', ip),

  // Persistent Local Inventory Storage
  loadInventory: () => ipcRenderer.invoke('inventory-load'),
  saveInventory: (devices) => ipcRenderer.invoke('inventory-save', devices),

  // Hardware Audit Engine
  auditRemoteHardware: (ip) => ipcRenderer.invoke('audit-remote-hardware', ip),
  auditAllHardware: () => ipcRenderer.invoke('audit-all-hardware'),

  // Camera Live Onlive Integration
  cameraFetchSnapshot: (payload) => ipcRenderer.invoke('camera-fetch-snapshot', payload),
  cameraLaunchStream: (rtspUrl) => ipcRenderer.invoke('camera-launch-stream', rtspUrl),
  cameraOpenViewerWindow: (param) => ipcRenderer.invoke('camera-open-viewer-window', param),

  // Continuous Ping Stream
  startPingStream: (host) => ipcRenderer.invoke('network-start-ping-stream', host),
  stopPingStream: () => ipcRenderer.invoke('network-stop-ping-stream'),
  onPingStreamTick: (callback) => {
    ipcRenderer.on('ping-stream-tick', (_, data) => callback(data));
  },
  onPingStreamEnd: (callback) => {
    ipcRenderer.on('ping-stream-end', () => callback());
  },

  // GPS Fleet Tracking Integration
  openTrackingWindow: (options) => ipcRenderer.invoke('tracking-open-window', options),

  // Realtime Traffic Anomaly Monitoring & Alerting
  getTrafficCurrent: () => ipcRenderer.invoke('traffic-get-current'),
  setTrafficThresholds: (thresholds) => ipcRenderer.invoke('traffic-set-thresholds', thresholds),
  getTrafficAnomalies: () => ipcRenderer.invoke('traffic-get-anomalies'),
  clearTrafficAnomalies: () => ipcRenderer.invoke('traffic-clear-anomalies'),
  simulateTrafficAnomaly: () => ipcRenderer.invoke('traffic-simulate-anomaly'),
  getTrafficConnections: () => ipcRenderer.invoke('traffic-get-connections'),
  onTrafficAnomaly: (callback) => {
    ipcRenderer.on('traffic-anomaly-detected', (_, data) => callback(data));
  },
  onTrafficTick: (callback) => {
    ipcRenderer.on('traffic-tick', (_, data) => callback(data));
  },

  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  // File Export & Shell Integration
  saveExportedFile: (data) => ipcRenderer.invoke('file-save-exported', data),
  openPath: (filePath) => ipcRenderer.invoke('file-open-path', filePath),
  showItemInFolder: (filePath) => ipcRenderer.invoke('file-show-in-folder', filePath),

  // IP Whitelist Security Policy
  getSecurityPolicy: () => ipcRenderer.invoke('security-get-policy'),
  saveSecurityPolicy: (policy) => ipcRenderer.invoke('security-save-policy', policy),

  // Live OTA Hot Update
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkOtaUpdate: () => ipcRenderer.invoke('ota-check-update'),
  applyOtaUpdate: (payload) => ipcRenderer.invoke('ota-apply-update', payload),
});
