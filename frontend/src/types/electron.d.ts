export type FeatureKey =
  | 'dashboard'
  | 'traffic'
  | 'computers'
  | 'printers'
  | 'cameras'
  | 'pos'
  | 'dispatches'
  | 'switches'
  | 'lookup'
  | 'network-map'
  | 'tracking'
  | 'settings';

export interface IpUserPermission {
  id: string;
  name: string;
  ip: string;
  department?: string;
  role: 'admin' | 'custom';
  allowedFeatures: FeatureKey[];
  note?: string;
  createdAt?: string;
}

export interface IpSecurityPolicy {
  enabled: boolean;
  allowedIps: string[];
  bypassPin: string;
  adminNote?: string;
  userPermissions?: IpUserPermission[];
}

export interface ExportFileResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  canceled?: boolean;
  error?: string;
}

declare global {
  interface Window {
    hiccDesktop?: {
      isElectron?: boolean;
      // Window controls
      minimize?: () => Promise<void>;
      maximizeToggle?: () => Promise<boolean>;
      close?: () => Promise<void>;
      isMaximized?: () => Promise<boolean>;
      onMaximizedState?: (callback: (state: boolean) => void) => void;
      // Network
      ping?: (host: string) => Promise<{ success: boolean; output: string; isAlive: boolean; latency?: number | null }>;
      arpScan?: () => Promise<{ success: boolean; devices: Array<{ ip: string; mac: string; vendor?: string; type?: string }> }>;
      deepScan?: () => Promise<{ success: boolean; count: number; devices: any[] }>;
      portScan?: (ip: string, ports?: number[]) => Promise<{ ip: string; openPorts: number[] }>;
      subnetSweep?: (baseIp: string, start?: number, end?: number) => Promise<{ success: boolean; activeHosts: Array<{ ip: string; isAlive: boolean; rtt?: number }>; scannedCount?: number }>;
      traceroute?: (host: string) => Promise<{ success: boolean; output: string }>;
      wakeOnLan?: (mac: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      launchRdp?: (ip: string) => Promise<{ success: boolean; error?: string }>;
      launchSsh?: (ip: string) => Promise<{ success: boolean }>;
      launchWeb?: (ip: string) => Promise<{ success: boolean }>;
      resolveHostname?: (ip: string) => Promise<{ success: boolean; hostname: string; fullHost?: string; user?: string; method?: string }>;
      loadInventory?: () => Promise<{ success: boolean; devices: any[] | null }>;
      saveInventory?: (devices: any[]) => Promise<{ success: boolean; error?: string }>;
      startPingStream?: (host: string) => Promise<{ success: boolean }>;
      stopPingStream?: () => Promise<{ success: boolean }>;
      onPingStreamTick?: (callback: (data: { raw: string; rtt: number | null; timestamp: number }) => void) => void;
      onPingStreamEnd?: (callback: () => void) => void;
      // Camera
      cameraFetchSnapshot?: (payload: any) => Promise<any>;
      cameraLaunchStream?: (rtspUrl: string) => Promise<any>;
      cameraOpenViewerWindow?: (param: any) => Promise<any>;
      // Fleet & GPS
      openTrackingWindow?: (options?: any) => Promise<any>;
      launchCmsv6App?: () => Promise<any>;
      // Traffic
      getTrafficCurrent?: () => Promise<any>;
      setTrafficThresholds?: (thresholds: any) => Promise<any>;
      getTrafficAnomalies?: () => Promise<any>;
      clearTrafficAnomalies?: () => Promise<any>;
      simulateTrafficAnomaly?: () => Promise<any>;
      getTrafficConnections?: () => Promise<any>;
      onTrafficAnomaly?: (callback: (data: any) => void) => void;
      onTrafficTick?: (callback: (data: any) => void) => void;
      getSystemInfo?: () => Promise<any>;
      // File Export & Shell Integration
      saveExportedFile?: (data: { fileName: string; bufferBase64: string; promptLocation?: boolean }) => Promise<ExportFileResult>;
      openPath?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      showItemInFolder?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      // IP Whitelist Security Policy
      getSecurityPolicy?: () => Promise<{ success: boolean; policy: IpSecurityPolicy }>;
      saveSecurityPolicy?: (policy: IpSecurityPolicy) => Promise<{ success: boolean; error?: string }>;
      // OTA
      getAppVersion?: () => Promise<any>;
      checkOtaUpdate?: () => Promise<any>;
      applyOtaUpdate?: (payload: any) => Promise<any>;
    };
  }
}
