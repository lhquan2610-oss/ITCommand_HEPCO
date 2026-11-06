export interface Device {
  id: string;
  device_code: string | null;
  hostname: string | null;
  discovered_hostname: string | null;
  display_name: string | null;
  device_type_code: string;
  device_type_name: string;
  is_type_locked: boolean;
  confidence_score: number;
  manufacturer: string | null;
  model: string | null;
  department_id: string | null;
  department_name: string | null;
  assigned_user: string | null;
  location: string | null;
  notes: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'UNREACHABLE' | 'UNKNOWN' | 'MAINTENANCE';
  is_new: boolean;
  is_authorized: boolean;
  icmp_blocked: boolean;
  last_ip_address: string | null;
  last_mac_address: string | null;
  first_seen: string;
  last_seen: string | null;
}

export interface DashboardSummary {
  metrics: {
    total_devices: number;
    online: number;
    offline: number;
    unknown: number;
    new_devices: number;
    open_alerts_total: number;
    critical_alerts: number;
    high_alerts: number;
    warning_alerts: number;
  };
  last_scan: {
    id: string;
    target_cidr: string;
    job_type: string;
    status: string;
    hosts_up: number;
    duration_ms: number;
    started_at: string;
  } | null;
}

export interface AlertItem {
  id: string;
  device_id: string | null;
  dedup_key: string;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SUPPRESSED';
  occurrence_count: number;
  detected_at: string;
  last_occurred_at: string;
  resolution_note?: string;
}

export interface ScanJobItem {
  id: string;
  job_type: string;
  target_cidr: string;
  trigger_source: string;
  scanner_host: string;
  status: string;
  total_hosts_scanned: number;
  hosts_up: number;
  hosts_down: number;
  new_devices_found: number;
  alerts_generated: number;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface SubnetItem {
  id: string;
  name: string;
  cidr: string;
  gateway_ip: string | null;
  vlan_id: number | null;
  scan_mode: string;
  is_approved: boolean;
  is_active: boolean;
  last_scanned_at: string | null;
  device_count: number;
}

declare global {
  interface Window {
    hiccDesktop?: {
      isElectron: boolean;
      minimize: () => Promise<void>;
      maximizeToggle: () => Promise<boolean>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      onMaximizedState: (callback: (state: boolean) => void) => void;
      ping: (host: string) => Promise<{ success: boolean; output: string; isAlive: boolean; latency?: number | null }>;
      arpScan: () => Promise<{ success: boolean; devices: Array<{ ip: string; mac: string; vendor?: string; type?: string }> }>;
      deepScan: () => Promise<{ success: boolean; count: number; devices: any[] }>;
      portScan: (ip: string, ports?: number[]) => Promise<{ ip: string; openPorts: number[] }>;
      subnetSweep: (baseIp: string, start?: number, end?: number) => Promise<{ success: boolean; activeHosts: Array<{ ip: string; isAlive: boolean; rtt?: number }>; scannedCount?: number }>;
      traceroute: (host: string) => Promise<{ success: boolean; output: string }>;
      wakeOnLan: (mac: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      launchRdp: (ip: string) => Promise<{ success: boolean; error?: string }>;
      launchSsh: (ip: string) => Promise<{ success: boolean }>;
      launchWeb: (ip: string) => Promise<{ success: boolean }>;
      resolveHostname: (ip: string) => Promise<{ success: boolean; hostname: string; fullHost?: string; user?: string; method?: string }>;
      loadInventory: () => Promise<{ success: boolean; devices: any[] | null }>;
      saveInventory: (devices: any[]) => Promise<{ success: boolean; error?: string }>;
      auditRemoteHardware: (ip: string) => Promise<{ success: boolean; ip: string; cpu?: string; ramGB?: number; mainboard?: string; storage?: string; os?: string; error?: string }>;
      auditAllHardware?: () => Promise<any>;
      cameraFetchSnapshot: (payload: { ip: string; user?: string; pass?: string; path?: string } | string) => Promise<{ success: boolean; dataUrl?: string; statusCode?: number; authRequired?: boolean; error?: string }>;
      cameraLaunchStream: (rtspUrl: string) => Promise<{ success: boolean; method?: string; error?: string }>;
      cameraOpenViewerWindow: (param: { ip: string; name?: string }) => Promise<{ success: boolean; error?: string }>;
      startPingStream: (host: string) => Promise<{ success: boolean }>;
      stopPingStream: () => Promise<{ success: boolean }>;
      onPingStreamTick: (callback: (data: { raw: string; rtt: number | null; timestamp: number }) => void) => void;
      onPingStreamEnd: (callback: () => void) => void;
      getSystemInfo: () => Promise<any>;
      getAppVersion: () => Promise<string>;
      checkOtaUpdate: () => Promise<any>;
      applyOtaUpdate: (payload: any) => Promise<any>;
      openTrackingWindow?: (options: {
        target?: string;
        url?: string;
        username?: string;
        password?: string;
        autoLogin?: boolean;
      }) => Promise<{ success: boolean; message?: string; error?: string }>;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }
}
