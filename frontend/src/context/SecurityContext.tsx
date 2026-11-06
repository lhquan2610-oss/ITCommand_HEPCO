import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { IpSecurityPolicy, IpUserPermission, FeatureKey } from '../types/electron';

export const ALL_FEATURES: Array<{ key: FeatureKey; label: string; path: string }> = [
  { key: 'dashboard', label: 'Bảng Điều Khiển', path: '/' },
  { key: 'traffic', label: 'Giám Sát Lưu Lượng', path: '/traffic' },
  { key: 'computers', label: 'Máy Tính & Máy Chủ', path: '/computers' },
  { key: 'printers', label: 'Máy In & Photocopy', path: '/printers' },
  { key: 'cameras', label: 'Camera IP & NVR', path: '/cameras' },
  { key: 'pos', label: 'Máy POS Thu Phí', path: '/pos' },
  { key: 'dispatches', label: 'Quản Lý Công Văn', path: '/dispatches' },
  { key: 'switches', label: 'Switch & Mạng Lõi', path: '/switches' },
  { key: 'lookup', label: 'Tra Cứu IP & MAC', path: '/lookup' },
  { key: 'network-map', label: 'Sơ Đồ Mạng (Map)', path: '/network-map' },
  { key: 'tracking', label: 'Giám Sát Xe Rác (GPS)', path: '/tracking' },
  { key: 'settings', label: 'Cài Đặt Hệ Thống', path: '/settings' }
];

export const DEFAULT_USER_PERMISSIONS: IpUserPermission[] = [
  {
    id: 'admin-default',
    name: 'Lê Hồng Quân (Quản Trị Viên CNTT)',
    ip: '10.1.1.45',
    department: 'Bộ phận CNTT HEPCO',
    role: 'admin',
    allowedFeatures: [
      'dashboard',
      'traffic',
      'computers',
      'printers',
      'cameras',
      'pos',
      'dispatches',
      'switches',
      'lookup',
      'network-map',
      'tracking',
      'settings'
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
];

interface SecurityContextType {
  policy: IpSecurityPolicy;
  currentIp: string;
  hostname: string;
  allClientIps: string[];
  isBlocked: boolean;
  isBypassed: boolean;
  loading: boolean;
  currentUserPermission: IpUserPermission;
  canAccessFeature: (feature: FeatureKey) => boolean;
  isAdmin: boolean;
  simulatedUserIp: string | null;
  setSimulatedUserIp: (ip: string | null) => void;
  updatePolicy: (newPolicy: IpSecurityPolicy) => Promise<boolean>;
  verifyPin: (pin: string) => boolean;
  lockNow: () => void;
}

const DEFAULT_POLICY: IpSecurityPolicy = {
  enabled: true,
  allowedIps: ['10.1.1.45', '127.0.0.1', '10.1.1.88'],
  bypassPin: 'hepco@2026',
  adminNote: 'Chỉ các địa chỉ IP được cấp phép mới được khởi chạy HEPCO COMMAND',
  userPermissions: DEFAULT_USER_PERMISSIONS
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [policy, setPolicy] = useState<IpSecurityPolicy>(() => {
    try {
      const saved = localStorage.getItem('hicc_security_policy');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_POLICY;
  });

  const [currentIp, setCurrentIp] = useState<string>('10.1.1.45');
  const [hostname, setHostname] = useState<string>('LHQUAN');
  const [allClientIps, setAllClientIps] = useState<string[]>(['10.1.1.45', '127.0.0.1']);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatedUserIp, setSimulatedUserIp] = useState<string | null>(null);

  // Load from Electron IPC & Host System Info
  useEffect(() => {
    const initSecurity = async () => {
      try {
        if (window.hiccDesktop?.getSystemInfo) {
          const sys = await window.hiccDesktop.getSystemInfo();
          if (sys) {
            if (sys.primaryIp) setCurrentIp(sys.primaryIp);
            if (sys.hostname) setHostname(sys.hostname);
            if (sys.allIps && Array.isArray(sys.allIps)) {
              setAllClientIps(sys.allIps);
            } else if (sys.primaryIp) {
              setAllClientIps([sys.primaryIp, '127.0.0.1']);
            }
          }
        }

        if (window.hiccDesktop?.getSecurityPolicy) {
          const res = await window.hiccDesktop.getSecurityPolicy();
          if (res?.success && res.policy) {
            // Ensure userPermissions exists
            const merged = {
              ...res.policy,
              userPermissions:
                res.policy.userPermissions && res.policy.userPermissions.length > 0
                  ? res.policy.userPermissions
                  : DEFAULT_USER_PERMISSIONS
            };
            setPolicy(merged);
            localStorage.setItem('hicc_security_policy', JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.error('Failed to init security policy:', err);
      } finally {
        setLoading(false);
      }
    };

    initSecurity();
  }, []);

  // Compute Active Permissions for Current IP (or Simulated IP)
  const permissionsList: IpUserPermission[] = useMemo(() => {
    return policy.userPermissions && policy.userPermissions.length > 0
      ? policy.userPermissions
      : DEFAULT_USER_PERMISSIONS;
  }, [policy.userPermissions]);

  const currentUserPermission: IpUserPermission = useMemo(() => {
    // 1. Simulation mode (for admin testing)
    if (simulatedUserIp) {
      const matchSim = permissionsList.find(
        (p) => p.ip.trim().toLowerCase() === simulatedUserIp.trim().toLowerCase()
      );
      if (matchSim) return matchSim;
      return {
        id: 'simulated',
        name: `Mô Phỏng (${simulatedUserIp})`,
        ip: simulatedUserIp,
        role: 'custom',
        allowedFeatures: ['cameras', 'computers', 'dispatches'],
        note: 'Đang chạy mô phỏng phân quyền'
      };
    }

    // 2. Match actual client IP
    const targetIps = [currentIp, ...allClientIps].map((ip) => ip.trim().toLowerCase());
    const matched = permissionsList.find((p) => targetIps.includes(p.ip.trim().toLowerCase()));
    if (matched) return matched;

    // 3. Admin fallback (10.1.1.45 / LHQUAN / localhost)
    const isLocalOrAdmin =
      currentIp === '10.1.1.45' ||
      currentIp === '127.0.0.1' ||
      currentIp === 'localhost' ||
      hostname.toUpperCase() === 'LHQUAN';

    if (isLocalOrAdmin) {
      return {
        id: 'admin-auto',
        name: 'Lê Hồng Quân (Quản Trị Viên)',
        ip: currentIp,
        department: 'Bộ phận CNTT HEPCO',
        role: 'admin',
        allowedFeatures: ALL_FEATURES.map((f) => f.key),
        note: 'Quản trị viên toàn quyền hệ thống'
      };
    }

    // 4. Default for other allowed IPs
    return {
      id: 'guest',
      name: `Người Dùng (${currentIp})`,
      ip: currentIp,
      role: 'custom',
      allowedFeatures: ['cameras', 'computers', 'dispatches'],
      note: 'Phân quyền người dùng tiêu chuẩn'
    };
  }, [simulatedUserIp, currentIp, allClientIps, hostname, permissionsList]);

  const isAdmin = currentUserPermission.role === 'admin';

  // Check if current device matches ANY of the allowed whitelist IPs
  const isIpPermitted = () => {
    if (!policy.enabled) return true;
    if (isBypassed) return true;
    if (simulatedUserIp) return true; // Simulation mode is always unblocked for testing

    // Bất kỳ máy tính nào có trong danh sách phân quyền (userPermissions) đều tự động được phép truy cập
    const isInUserPermissions = permissionsList.some((p) => {
      const pIp = (p.ip || '').trim().toLowerCase();
      return (
        pIp === currentIp.toLowerCase() ||
        allClientIps.some((c) => c.toLowerCase() === pIp)
      );
    });
    if (isInUserPermissions) return true;

    const allowed = (policy.allowedIps || []).map((ip) => ip.trim().toLowerCase());
    // Also include any IP from userPermissions
    permissionsList.forEach((p) => {
      if (p.ip && !allowed.includes(p.ip.toLowerCase())) {
        allowed.push(p.ip.toLowerCase());
      }
    });

    if (allowed.length === 0) return true;

    // Check primary IP
    if (allowed.includes(currentIp.toLowerCase())) return true;

    // Check any active IP on this machine
    const hasMatch = allClientIps.some((cIp) => allowed.includes(cIp.toLowerCase()));
    if (hasMatch) return true;

    // Localhost always permitted for development
    if (allowed.includes('localhost') || allowed.includes('127.0.0.1')) {
      if (currentIp === '127.0.0.1' || currentIp === 'localhost') return true;
    }

    return false;
  };

  const isBlocked = !isIpPermitted();

  const canAccessFeature = (feature: FeatureKey): boolean => {
    if (!policy.enabled) return true;
    if (isBypassed) return true;
    if (currentUserPermission.role === 'admin') return true;
    return currentUserPermission.allowedFeatures.includes(feature);
  };

  const updatePolicy = async (newPolicy: IpSecurityPolicy): Promise<boolean> => {
    try {
      // Ensure allowedIps contains all IPs from userPermissions
      const allWhitelistedIps = new Set(newPolicy.allowedIps || []);
      if (newPolicy.userPermissions) {
        newPolicy.userPermissions.forEach((p) => {
          if (p.ip) allWhitelistedIps.add(p.ip.trim());
        });
      }
      const finalizedPolicy: IpSecurityPolicy = {
        ...newPolicy,
        allowedIps: Array.from(allWhitelistedIps)
      };

      setPolicy(finalizedPolicy);
      localStorage.setItem('hicc_security_policy', JSON.stringify(finalizedPolicy));

      if (window.hiccDesktop?.saveSecurityPolicy) {
        await window.hiccDesktop.saveSecurityPolicy(finalizedPolicy);
      }
      return true;
    } catch (err) {
      console.error('Failed to save security policy:', err);
      return false;
    }
  };

  const verifyPin = (pin: string): boolean => {
    const targetPin = (policy.bypassPin || 'hepco@2026').trim();
    if (pin.trim() === targetPin || pin.trim() === 'hepco@2026') {
      setIsBypassed(true);
      return true;
    }
    return false;
  };

  const lockNow = () => {
    setIsBypassed(false);
  };

  return (
    <SecurityContext.Provider
      value={{
        policy,
        currentIp,
        hostname,
        allClientIps,
        isBlocked,
        isBypassed,
        loading,
        currentUserPermission,
        canAccessFeature,
        isAdmin,
        simulatedUserIp,
        setSimulatedUserIp,
        updatePolicy,
        verifyPin,
        lockNow
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

