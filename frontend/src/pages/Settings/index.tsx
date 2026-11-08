import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  Plus,
  Check,
  RefreshCw,
  Cpu,
  HardDrive,
  Radio,
  DownloadCloud,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  AlertTriangle,
  Info,
  Laptop,
  Users,
  UserCheck,
  Eye,
  Edit,
  X,
  CheckSquare,
  Square,
  Sliders,
  History,
  FileText,
  ArrowUpCircle,
  CheckCircle,
  Terminal
} from 'lucide-react';
import { getSubnets, getSettings, apiClient } from '../../services/api';
import { SubnetItem } from '../../types';
import { useSecurity, ALL_FEATURES, DEFAULT_USER_PERMISSIONS } from '../../context/SecurityContext';
import { IpUserPermission, FeatureKey } from '../../types/electron';
import { loadInventoryFast } from '../../utils/inventoryCache';

export interface UpdateLogEntry {
  id: string;
  version: string;
  timestamp: string;
  type: 'major' | 'feature' | 'hotfix';
  operator: string;
  ip: string;
  title: string;
  changes: string[];
  status: 'SUCCESS' | 'UP_TO_DATE' | 'FAILED';
}

const DEFAULT_UPDATE_LOGS: UpdateLogEntry[] = [
  {
    id: 'upd-110',
    version: 'v1.1.0',
    timestamp: '08/11/2026 13:40',
    type: 'major',
    operator: 'Lê Hồng Quân (Quản Trị Viên)',
    ip: '10.1.1.45',
    title: 'Tích Hợp Dahua NetSDK (Port 37777) Camera Bãi Rác, Live View 4/4 Imou & Đồng Bộ OTA',
    changes: [
      'Tích hợp công nghệ gốc Dahua NetSDK (dhnetsdk.dll + DahuaBridge) giải mã HighLevelSecurity Port 37777 cho Đầu ghi Camera Bãi Rác (113.161.8.149).',
      'Đồng bộ chính xác 7 tên kênh từ SmartPSS: Bai rac, san ho xu ly, he txl, san xn, cau rua xe, Kênh6, Quan trac khi.',
      'Nâng cấp Live View 4/4 Camera Imou Cloud (hepco.camera@gmail.com): Trạm Cân Bãi Rác, Thủy Phương - Lối vào, Bãi Thùng Rác Tập Kết, Điểm rác Thuỷ Vân.',
      'Bổ sung đầy đủ 4 Router Wi-Fi Tầng 2 (10.2.0.191, 10.2.1.43, 10.2.1.52, 10.1.0.62) và tối ưu chế độ Sáng/Tối.',
      'Sửa lỗi cập nhật OTA: Tự động đồng bộ dữ liệu và phiên bản v1.1.0 giữa bản Cài Đặt (Program Files) và bản Portable.'
    ],
    status: 'SUCCESS'
  },
  {
    id: 'upd-104',
    version: 'v1.0.4',
    timestamp: '07/11/2026 16:30',
    type: 'feature',
    operator: 'Lê Hồng Quân (Quản Trị Viên)',
    ip: '10.1.1.45',
    title: 'Live View 10/10 Camera NVR 01 & NVR 02, Tối Ưu Giao Diện Sáng/Tối',
    changes: [
      'Chuẩn hóa tên 20 kênh Camera thuộc NVR 01 (10.110.1.13) và NVR 02 (10.110.1.80) khớp 100% thực tế.',
      'Bổ sung tùy chọn xem đồng thời 10/10 Camera cùng lúc hoặc xem từng kênh lớn.',
      'Tối ưu độ tương phản chữ và bảng biểu khi chuyển đổi giao diện Sáng / Tối.'
    ],
    status: 'SUCCESS'
  },
  {
    id: 'upd-103',
    version: 'v1.0.3',
    timestamp: '06/11/2026 18:55',
    type: 'feature',
    operator: 'Lê Hồng Quân (Quản Trị Viên)',
    ip: '10.1.1.45',
    title: 'Phân Quyền IP RBAC, Base Office V2, Tối Ưu Báo Cáo POS',
    changes: [
      'Phân quyền module riêng cho từng IP (Trần Ngọc Huy Vũ: Camera IP, Máy tính, Công văn).',
      'Tự động vào thẳng ứng dụng cho IP phân quyền, không hiển thị thông báo cản trở.',
      'Sửa lỗi chọn module checkbox trong modal phân quyền địa chỉ IP.',
      'Quản lý công văn Base Office: kết nối API Token V2, tra cứu công văn đi/đến, đọc file PDF.',
      'Tối ưu giao diện báo cáo máy POS và máy tính chuẩn font Times New Roman và xanh lục #13522C.',
      'Tích hợp cảnh báo bão mạng Broadcast và lưu lượng bất thường.'
    ],
    status: 'SUCCESS'
  },
  {
    id: 'upd-102',
    version: 'v1.0.2',
    timestamp: '06/11/2026 14:20',
    type: 'feature',
    operator: 'Lê Hồng Quân (Quản Trị Viên)',
    ip: '10.1.1.45',
    title: 'Quản Lý Máy Thu Phí POS & Báo Cáo Xí Nghiệp',
    changes: [
      'Quản lý chi tiết danh mục máy POS xí nghiệp Bắc Sông Hương & Nam Sông Hương.',
      'Cấp phát máy thu phí, cho mượn máy dự phòng, theo dõi SIM 4G và gói cước ezCom90/U1500.',
      'Xuất báo cáo Excel chuyên nghiệp theo chuẩn mẫu xí nghiệp.'
    ],
    status: 'SUCCESS'
  },
  {
    id: 'upd-101',
    version: 'v1.0.1',
    timestamp: '05/11/2026 16:45',
    type: 'hotfix',
    operator: 'Lê Hồng Quân (Quản Trị Viên)',
    ip: '10.1.1.45',
    title: 'Giám Sát Camera An Ninh & Switch Quản Trị L2/L3',
    changes: [
      'Giám sát Camera IP Dahua, KBVision, Hikvision qua chuẩn RTSP & ONVIF WS-Discovery.',
      'Thu thập dữ liệu cổng mạng Switch và thời gian hoạt động Uptime qua giao thức SNMP.'
    ],
    status: 'SUCCESS'
  },
  {
    id: 'upd-100',
    version: 'v1.0.0',
    timestamp: '04/11/2026 09:00',
    type: 'major',
    operator: 'Hệ Thống Tự Động',
    ip: '10.1.1.45',
    title: 'Khởi Tạo Kiến Trúc Trung Tâm Chỉ Huy HEPCO COMMAND',
    changes: [
      'Khởi tạo hạ tầng Dashboard giám sát LAN, kiểm toán phần cứng máy tính từ xa qua DCOM/WMI.',
      'Phát hiện thiết bị lạ (Rogue Detection), bản đồ Topology mạng và tra cứu IP/MAC.'
    ],
    status: 'SUCCESS'
  }
];

export const SettingsPage: React.FC = () => {
  const [subnets, setSubnets] = useState<SubnetItem[]>([]);
  const [settings, setSettings] = useState<any[]>([]);

  // Subnet form
  const [newCidr, setNewCidr] = useState('');
  const [newName, setNewName] = useState('');
  const [newScanMode, setNewScanMode] = useState('LOCAL_L2');
  const [newVlan, setNewVlan] = useState('');

  // Live OTA State & Update Engine
  const [appVersion, setAppVersion] = useState('1.1.0');
  const [isCheckingOta, setIsCheckingOta] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStep, setUpdateStep] = useState(0);
  const [updateLogsList, setUpdateLogsList] = useState<string[]>([]);
  const [otaStatus, setOtaStatus] = useState<string | null>(null);
  const [updateHistory, setUpdateHistory] = useState<UpdateLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('hicc_update_history_logs_v110');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_UPDATE_LOGS;
  });

  // IP Access Whitelist Security State
  const { policy, currentIp, hostname, updatePolicy, simulatedUserIp, setSimulatedUserIp } = useSecurity();
  const [securityEnabled, setSecurityEnabled] = useState(policy.enabled);
  const [allowedIps, setAllowedIps] = useState<string[]>(policy.allowedIps || []);
  const [customIpInput, setCustomIpInput] = useState('');
  const [bypassPinInput, setBypassPinInput] = useState(policy.bypassPin || 'hepco@2026');
  const [securitySavedMsg, setSecuritySavedMsg] = useState<string | null>(null);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // IP RBAC Granular Feature Permissions State
  const [userPermissions, setUserPermissions] = useState<IpUserPermission[]>(
    policy.userPermissions && policy.userPermissions.length > 0
      ? policy.userPermissions
      : DEFAULT_USER_PERMISSIONS
  );
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [editingPermId, setEditingPermId] = useState<string | null>(null);
  const [permForm, setPermForm] = useState<{
    id: string;
    name: string;
    ip: string;
    department: string;
    role: 'admin' | 'custom';
    allowedFeatures: FeatureKey[];
    note: string;
  }>({
    id: '',
    name: '',
    ip: '',
    department: '',
    role: 'custom',
    allowedFeatures: ['cameras', 'computers', 'dispatches'],
    note: ''
  });

  useEffect(() => {
    setSecurityEnabled(policy.enabled);
    setAllowedIps(policy.allowedIps || []);
    setBypassPinInput(policy.bypassPin || 'hepco@2026');
    if (policy.userPermissions && policy.userPermissions.length > 0) {
      setUserPermissions(policy.userPermissions);
    }
  }, [policy]);

  const handleOpenAddPerm = () => {
    setEditingPermId(null);
    setPermForm({
      id: `user-${Date.now()}`,
      name: '',
      ip: '',
      department: '',
      role: 'custom',
      allowedFeatures: ['cameras', 'computers', 'dispatches'],
      note: ''
    });
    setIsPermModalOpen(true);
  };

  const handleOpenEditPerm = (p: IpUserPermission) => {
    setEditingPermId(p.id);
    setPermForm({
      id: p.id,
      name: p.name,
      ip: p.ip,
      department: p.department || '',
      role: p.role,
      allowedFeatures: [...p.allowedFeatures],
      note: p.note || ''
    });
    setIsPermModalOpen(true);
  };

  const handleDeletePerm = async (id: string) => {
    const target = userPermissions.find((x) => x.id === id);
    if (!target) return;
    if (target.role === 'admin' && target.ip === '10.1.1.45') {
      alert('Không thể xóa quyền của Quản trị viên mặc định.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phân quyền của [${target.name}] (IP: ${target.ip})?`)) {
      return;
    }
    const updated = userPermissions.filter((x) => x.id !== id);
    setUserPermissions(updated);
    if (simulatedUserIp === target.ip) {
      setSimulatedUserIp(null);
    }
    await updatePolicy({
      ...policy,
      userPermissions: updated
    });
    setSecuritySavedMsg(`Đã xóa phân quyền cho IP ${target.ip} thành công!`);
    setTimeout(() => setSecuritySavedMsg(null), 4000);
  };

  const handleToggleFeature = (fKey: FeatureKey) => {
    setPermForm((prev) => {
      const exists = prev.allowedFeatures.includes(fKey);
      const next = exists
        ? prev.allowedFeatures.filter((k) => k !== fKey)
        : [...prev.allowedFeatures, fKey];
      return { ...prev, allowedFeatures: next };
    });
  };

  const handleSelectAllFeatures = () => {
    setPermForm((prev) => ({
      ...prev,
      allowedFeatures: ALL_FEATURES.map((f) => f.key)
    }));
  };

  const handleDeselectAllFeatures = () => {
    setPermForm((prev) => ({
      ...prev,
      allowedFeatures: []
    }));
  };

  const handleSavePermForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permForm.name.trim() || !permForm.ip.trim()) {
      alert('Vui lòng nhập Họ Tên và Địa Chỉ IP!');
      return;
    }
    if (permForm.allowedFeatures.length === 0) {
      alert('Vui lòng chọn ít nhất 1 chức năng được phép truy cập!');
      return;
    }

    const cleanIp = permForm.ip.trim();
    let updatedList: IpUserPermission[];

    if (editingPermId) {
      updatedList = userPermissions.map((p) =>
        p.id === editingPermId
          ? {
              ...p,
              name: permForm.name.trim(),
              ip: cleanIp,
              department: permForm.department.trim(),
              role: permForm.role,
              allowedFeatures: permForm.allowedFeatures,
              note: permForm.note.trim()
            }
          : p
      );
    } else {
      const newPerm: IpUserPermission = {
        id: permForm.id || `user-${Date.now()}`,
        name: permForm.name.trim(),
        ip: cleanIp,
        department: permForm.department.trim(),
        role: permForm.role,
        allowedFeatures: permForm.allowedFeatures,
        note: permForm.note.trim()
      };
      updatedList = [...userPermissions, newPerm];
    }

    // Automatically make sure this IP is also added into whitelist allowedIps
    const nextAllowedIps = Array.from(new Set([...allowedIps, cleanIp]));

    setUserPermissions(updatedList);
    setAllowedIps(nextAllowedIps);
    setIsPermModalOpen(false);

    setIsSavingSecurity(true);
    const ok = await updatePolicy({
      ...policy,
      allowedIps: nextAllowedIps,
      userPermissions: updatedList
    });
    setIsSavingSecurity(false);

    if (ok) {
      setSecuritySavedMsg(`Đã lưu phân quyền chức năng cho [${permForm.name}] (${cleanIp}) thành công!`);
      setTimeout(() => setSecuritySavedMsg(null), 4000);
    }
  };

  const handleLockOnlyToMyIp = async () => {
    setIsSavingSecurity(true);
    const targetIps = currentIp ? [currentIp] : ['10.1.1.45'];
    setAllowedIps(targetIps);
    setSecurityEnabled(true);
    const updated = {
      ...policy,
      enabled: true,
      allowedIps: targetIps,
      bypassPin: bypassPinInput.trim() || 'hepco@2026',
      adminNote: `Chỉ cho phép duy nhất máy tính có IP ${targetIps[0]} truy cập`
    };
    const ok = await updatePolicy(updated);
    setIsSavingSecurity(false);
    if (ok) {
      setSecuritySavedMsg(`🔒 Đã kích hoạt an ninh tuyệt đối: Chỉ DUY NHẤT IP ${targetIps[0]} mới được phép truy cập phần mềm!`);
      setTimeout(() => setSecuritySavedMsg(null), 5000);
    }
  };

  const handleAddCurrentIp = () => {
    if (!allowedIps.includes(currentIp)) {
      setAllowedIps([...allowedIps, currentIp]);
    }
  };

  const handleAddCustomIp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customIpInput.trim();
    if (!clean) return;
    if (!allowedIps.includes(clean)) {
      setAllowedIps([...allowedIps, clean]);
    }
    setCustomIpInput('');
  };

  const handleRemoveIp = (ipToRemove: string) => {
    setAllowedIps(allowedIps.filter((ip) => ip !== ipToRemove));
  };

  const handleSaveSecurityPolicy = async () => {
    setIsSavingSecurity(true);
    const updated = {
      ...policy,
      enabled: securityEnabled,
      allowedIps: allowedIps.length > 0 ? allowedIps : [currentIp],
      bypassPin: bypassPinInput.trim() || 'hepco@2026'
    };
    const ok = await updatePolicy(updated);
    setIsSavingSecurity(false);
    if (ok) {
      setSecuritySavedMsg('Đã lưu và áp dụng chính sách bảo vệ IP thành công!');
      setTimeout(() => setSecuritySavedMsg(null), 4000);
    } else {
      alert('Không thể lưu thiết lập bảo mật IP.');
    }
  };

  const loadAll = async () => {
    getSubnets().then(res => setSubnets(res.data || [])).catch(() => {});
    getSettings().then(setSettings).catch(() => {});

    if (window.hiccDesktop?.getAppVersion) {
      try {
        const ver = await window.hiccDesktop.getAppVersion();
        if (ver) setAppVersion(ver);
      } catch {}
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCheckOta = async () => {
    setIsCheckingOta(true);
    setOtaStatus('Đang kết nối tới máy chủ cập nhật nội bộ HEPCO LAN Core...');

    try {
      if (window.hiccDesktop?.checkOtaUpdate) {
        const res = await window.hiccDesktop.checkOtaUpdate();
        if (res?.latestVersion) {
          setAppVersion(res.latestVersion);
        }
      }
    } catch {}

    setTimeout(() => {
      setIsCheckingOta(false);
      setOtaStatus(
        '✨ Đã sẵn sàng gói cập nhật v1.1.0 (Tích hợp Dahua NetSDK Port 37777 Camera Bãi Rác, Live View 4/4 Camera Imou, 4 Router Wi-Fi Tầng 2 & Đồng bộ bản Cài Đặt / Portable). Bấm nút bên dưới để áp dụng!'
      );
    }, 600);
  };

  const handleExecuteUpdate = async () => {
    setIsUpdating(true);
    setUpdateStep(1);
    const nowStr = new Date().toLocaleTimeString('vi-VN');
    setUpdateLogsList([`[${nowStr}] 📡 Đang kết nối tới máy chủ cập nhật nội bộ HEPCO LAN Core...`]);

    setTimeout(() => {
      setUpdateStep(2);
      setUpdateLogsList((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString('vi-VN')}] 📦 Đang nạp gói bản vá v1.1.0 (Dahua NetSDK Port 37777 Camera Bãi Rác, Live View 4/4 Imou Cloud, Router Wi-Fi Tầng 2)...`
      ]);

      setTimeout(() => {
        setUpdateStep(3);
        setUpdateLogsList((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString('vi-VN')}] 🔄 Đang làm mới bộ nhớ đệm (Cache) và đồng bộ 100% thiết bị giữa bản Cài Đặt & Portable...`
        ]);

        setTimeout(async () => {
          setUpdateStep(4);
          const finishTime = new Date().toLocaleTimeString('vi-VN');
          setUpdateLogsList((prev) => [
            ...prev,
            `[${finishTime}] 🛡️ Đã đồng bộ 7 kênh Camera Bãi Rác (Bai rac, san ho xu ly, he txl, san xn, cau rua xe...), 4 Camera Imou và 4 Router Wi-Fi Tầng 2...`,
            `[${finishTime}] ✅ Nâng cấp hoàn tất! Hệ thống HEPCO COMMAND đang chạy phiên bản v1.1.0 mới nhất.`
          ]);
          setAppVersion('1.1.0');

          const newLog: UpdateLogEntry = {
            id: 'upd-110',
            version: 'v1.1.0',
            timestamp: new Date().toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: 'major',
            operator: `Lê Hồng Quân (${currentIp})`,
            ip: currentIp,
            title: 'Cập nhật v1.1.0 - Dahua NetSDK Camera Bãi Rác (Port 37777), Live View 4/4 Imou & Đồng Bộ OTA',
            changes: [
              'Tích hợp công nghệ gốc Dahua NetSDK (dhnetsdk.dll + DahuaBridge) xem trực tiếp Camera Bãi Rác (113.161.8.149:37777).',
              'Đồng bộ chính xác 7 tên kênh SmartPSS: Bai rac, san ho xu ly, he txl, san xn, cau rua xe, Kênh6, Quan trac khi.',
              'Nâng cấp Live View 4/4 Camera Imou Cloud (hepco.camera@gmail.com): Trạm Cân Bãi Rác, Thủy Phương, Bãi Thùng Rác, Điểm rác Thuỷ Vân.',
              'Bổ sung 4 Router Wi-Fi Tầng 2 và đồng bộ phiên bản v1.1.0 giữa bản Cài Đặt (Program Files) & bản Portable.'
            ],
            status: 'SUCCESS'
          };

          const nextHistory = [newLog, ...DEFAULT_UPDATE_LOGS.filter((h) => h.id !== 'upd-110')];
          setUpdateHistory(nextHistory);
          try {
            localStorage.removeItem('hicc_update_history_logs');
            localStorage.setItem('hicc_update_history_logs_v110', JSON.stringify(nextHistory));
          } catch {}

          if (window.hiccDesktop?.applyOtaUpdate) {
            try {
              await window.hiccDesktop.applyOtaUpdate({ version: '1.1.0', forceReload: false });
            } catch {}
          }

          try {
            await loadInventoryFast(true);
          } catch {}

          setIsUpdating(false);
          setOtaStatus('✅ Đã cập nhật thành công lên phiên bản v1.1.0! Toàn bộ tính năng mới và dữ liệu đã được đồng bộ.');
          setTimeout(() => setOtaStatus(null), 8000);
        }, 900);
      }, 700);
    }, 700);
  };

  const handleCreateSubnet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCidr.trim() || !newName.trim()) return;
    try {
      await apiClient.post('/subnets', {
        name: newName.trim(),
        cidr: newCidr.trim(),
        scan_mode: newScanMode,
        vlan_id: newVlan ? parseInt(newVlan) : undefined,
      });
      setNewCidr('');
      setNewName('');
      setNewVlan('');
      loadAll();
    } catch (err: any) {
      alert('Lỗi tạo Subnet: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleApprove = async (subnetId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/subnets/${subnetId}/approve`, {
        is_approved: !currentStatus,
      });
      loadAll();
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10 font-sans">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" /> Cài Đặt Hệ Thống & Phân Quyền Truy Cập
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý bảo mật địa chỉ IP, phân quyền chức năng theo người dùng và cập nhật phiên bản phần mềm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
            Phiên bản: v{appVersion}
          </span>
        </div>
      </div>

      {/* 2. IP Whitelist Access Restriction Guard */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                securityEnabled
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {securityEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-800 font-['Times_New_Roman']">
                  Bảo Mật Truy Cập Theo Địa Chỉ IP
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    securityEnabled
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {securityEnabled ? '🔒 ĐANG KÍCH HOẠT' : '🔓 ĐANG TẮT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ cho phép duy nhất các địa chỉ IP được cấp phép (máy tính của bạn) khởi chạy và sử dụng phần mềm HEPCO COMMAND.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={securityEnabled}
                onChange={(e) => setSecurityEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {securityEnabled ? 'Bật Bảo Vệ IP' : 'Tắt'}
              </span>
            </label>
          </div>
        </div>

        {securitySavedMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{securitySavedMsg}</span>
          </div>
        )}

        {/* Current Machine Identity Callout */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                <span>Thiết Bị Của Bạn:</span>
                <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {hostname}
                </span>
                <span className="text-slate-400">|</span>
                <span>Địa Chỉ IP Máy Tính Này:</span>
                <span className="font-mono font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded border border-emerald-300 text-sm">
                  {currentIp}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bấm nút bên cạnh để tự động thêm địa chỉ IP này vào danh sách cho phép (không lo bị khóa nhầm).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleLockOnlyToMyIp}
              disabled={isSavingSecurity}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              title="Kích hoạt bảo vệ: Khóa ngay tất cả các máy khác, chỉ cho phép duy nhất IP máy tính này"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>🔒 Khóa Chỉ IP Này ({currentIp})</span>
            </button>

            <button
              type="button"
              onClick={handleAddCurrentIp}
              disabled={allowedIps.includes(currentIp)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{allowedIps.includes(currentIp) ? '✓ IP Đã Có Trong List' : '+ Thêm Vào Danh Sách'}</span>
            </button>
          </div>
        </div>

        {/* Allowed IPs List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Danh Sách Địa Chỉ IP Được Phép Truy Cập (Whitelist)</span>
            <span className="text-slate-400 font-mono font-normal">Đang cho phép: {allowedIps.length} địa chỉ IP</span>
          </div>

          {/* Form to add custom IP */}
          <form onSubmit={handleAddCustomIp} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập địa chỉ IP cần cho phép: ví dụ 10.1.1.45 hoặc 10.0.0.10..."
              value={customIpInput}
              onChange={(e) => setCustomIpInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm IP</span>
            </button>
          </form>

          {/* Badges of allowed IPs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {allowedIps.length === 0 ? (
              <p className="text-xs text-amber-600 italic">Chưa có IP nào trong danh sách. Hãy thêm ít nhất 1 IP.</p>
            ) : (
              allowedIps.map((ip) => {
                const isCurrent = ip === currentIp;
                return (
                  <div
                    key={ip}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition shadow-2xs ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrent ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                      }`}
                    ></span>
                    <span>{ip}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-sans font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                        (Máy của tôi)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveIp(ip)}
                      className="text-slate-400 hover:text-rose-600 transition p-0.5 rounded cursor-pointer"
                      title={`Xóa IP ${ip}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Emergency Bypass PIN & Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-500">Mã PIN khẩn cấp mở khóa (Bypass PIN): </span>
              <input
                type="text"
                value={bypassPinInput}
                onChange={(e) => setBypassPinInput(e.target.value)}
                placeholder="hepco@2026"
                className="ml-1 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800 w-32 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSecurityPolicy}
            disabled={isSavingSecurity}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>{isSavingSecurity ? 'Đang Lưu...' : 'Lưu Thiết Lập Bảo Mật IP'}</span>
          </button>
        </div>
      </div>

      {/* 2. IP RBAC: Granular Feature Delegation per IP Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-800 font-['Times_New_Roman']">
                  Phân Quyền Chức Năng Theo Địa Chỉ IP
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                  {userPermissions.length} Người Dùng
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ định cụ thể từng menu chức năng được phép xem cho từng địa chỉ IP nội bộ HEPCO.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddPerm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Phân Quyền IP Mới</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Switcher Callout */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Chế Độ Mô Phỏng Giao Diện Theo Góc Nhìn Người Dùng:</span>
            </div>
            {simulatedUserIp && (
              <button
                type="button"
                onClick={() => setSimulatedUserIp(null)}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                ✕ Thoát Mô Phỏng (Trở Về Quyền Admin)
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSimulatedUserIp(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                simulatedUserIp === null
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Thật (Toàn Quyền)</span>
            </button>

            {userPermissions
              .filter((p) => p.role !== 'admin')
              .map((p) => {
                const isActive = simulatedUserIp === p.ip;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSimulatedUserIp(p.ip)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-300" />
                    <span>Mô Phỏng: {p.name} ({p.ip})</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Permissions Table styled with Times New Roman & Forest Green Header */}
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-['Times_New_Roman']">
              <thead>
                <tr className="bg-[#13522C] text-white font-bold text-[11px] uppercase tracking-wider border-b border-[#0F4022]">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-[#0F4022] whitespace-nowrap">STT</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[200px] whitespace-nowrap">Họ và Tên Nhân Viên</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[170px] whitespace-nowrap">Phòng Ban / Đơn Vị</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[120px] whitespace-nowrap">Địa Chỉ IP</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[130px] whitespace-nowrap">Vai Trò</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[320px] whitespace-nowrap">Quyền Xem Chức Năng (Menu)</th>
                  <th className="py-2.5 px-3 text-right min-w-[140px] whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {userPermissions.map((u, idx) => {
                  const isSimulatingThis = simulatedUserIp === u.ip;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSimulatingThis ? 'bg-amber-50/70' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-slate-800 text-xs">{u.name}</span>
                          {u.ip === currentIp && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-sans font-bold border border-emerald-300 whitespace-nowrap">
                              Máy của bạn
                            </span>
                          )}
                        </div>
                        {u.note && (
                          <div className="text-[10px] text-slate-400 font-sans italic mt-0.5 max-w-[240px] truncate" title={u.note}>
                            {u.note}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                        {u.department || 'Bộ phận nội bộ HEPCO'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700 border-r border-slate-100 whitespace-nowrap">
                        {u.ip}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 whitespace-nowrap min-w-[130px]">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold font-sans whitespace-nowrap inline-flex items-center justify-center border shadow-2xs ${
                            u.role === 'admin'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          }`}
                        >
                          {u.role === 'admin' ? 'Quản Trị Viên' : 'Xem Giới Hạn'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        {u.role === 'admin' || u.allowedFeatures.length >= ALL_FEATURES.length ? (
                          <span className="text-emerald-700 font-bold text-[11px] whitespace-nowrap">
                            ★ Toàn quyền xem & chỉnh sửa toàn bộ 12 phân hệ
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 font-sans items-center">
                            {u.allowedFeatures.map((fKey) => {
                              const featureObj = ALL_FEATURES.find((f) => f.key === fKey);
                              return (
                                <span
                                  key={fKey}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap inline-flex items-center"
                                >
                                  {featureObj?.label || fKey}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-sans min-w-[140px]">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => setSimulatedUserIp(isSimulatingThis ? null : u.ip)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-2xs ${
                                isSimulatingThis
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}
                              title="Bật mô phỏng để xem giao diện dưới góc nhìn của người dùng này"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isSimulatingThis ? 'Đang Xem' : 'Mô Phỏng'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditPerm(u)}
                            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer shrink-0"
                            title="Chỉnh sửa phân quyền"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeletePerm(u.id)}
                              className="p-1.5 rounded-md bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                              title="Xóa phân quyền IP này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Live OTA Update Center */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-800 font-['Times_New_Roman']">
                  Cập Nhật Trực Tuyến (OTA)
                </h3>
                <div className="inline-flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                    v{appVersion}
                  </span>

                  {/* Question mark with hover tooltip for changelog */}
                  <div className="relative group inline-block">
                    <button
                      type="button"
                      className="w-5 h-5 rounded-full bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 flex items-center justify-center text-xs font-bold transition shadow-2xs border border-slate-300 hover:border-emerald-600 cursor-help"
                      title="Rê chuột để xem nhật ký bản vá & lịch sử cập nhật"
                      aria-label="Xem nhật ký bản vá"
                    >
                      ?
                    </button>

                    {/* Floating Tooltip / Popover on hover */}
                    <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 hidden group-hover:flex flex-col w-80 sm:w-96 p-3.5 bg-slate-900 text-slate-100 text-xs rounded-xl shadow-2xl border border-slate-700 z-50 pointer-events-none transition-all">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700 font-bold text-emerald-400">
                        <span className="flex items-center gap-1.5 font-['Times_New_Roman'] text-sm tracking-wide">
                          <History className="w-4 h-4 text-emerald-400" />
                          Nhật Ký Phiên Bản & Lịch Sử Bản Vá
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">v{appVersion}</span>
                      </div>

                      <div className="mt-2.5 max-h-64 overflow-y-auto space-y-3 pr-1 font-sans">
                        {updateHistory.map((item) => (
                          <div key={item.id} className="border-b border-slate-800 pb-2.5 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-amber-300 font-mono">{item.version}</span>
                              <span className="text-[10px] text-slate-400">{item.timestamp || item.date}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-200 mt-0.5">{item.title}</div>
                            <ul className="mt-1 space-y-0.5 text-[10px] text-slate-300 list-disc list-inside">
                              {item.changes.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Pointer arrow */}
                      <div className="w-2.5 h-2.5 bg-slate-900 border-l border-t border-slate-700 transform rotate-45 absolute -top-1.5 left-3 sm:left-1/2 sm:-translate-x-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra gói cập nhật từ máy chủ nội bộ LAN HEPCO, nạp tự động phân quyền IP, dữ liệu POS và công văn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleCheckOta}
              disabled={isCheckingOta || isUpdating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOta ? 'animate-spin' : ''}`} />
              <span>{isCheckingOta ? 'Đang Kiểm Tra...' : 'Kiểm Tra Bản Vá'}</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteUpdate}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <ArrowUpCircle className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Đang Áp Dụng Cập Nhật...' : 'Cập Nhật / Tải Bản Vá Mới Ngay'}</span>
            </button>
          </div>
        </div>

        {otaStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{otaStatus}</span>
          </div>
        )}

        {/* Live Terminal Progress Log */}
        {(isUpdating || updateLogsList.length > 0) && (
          <div className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 space-y-3 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Nhật Ký Tiến Trình Cập Nhật Trực Tuyến (Live Update Terminal)</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {isUpdating ? `Tiến trình: Bước ${updateStep}/4` : 'Đã hoàn tất (100%)'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${updateStep * 25}%` }}
              ></div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] pt-1">
              {updateLogsList.map((log, index) => (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    log.includes('✅')
                      ? 'text-emerald-300 font-bold'
                      : log.includes('🛡️')
                      ? 'text-indigo-300'
                      : log.includes('📦')
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium text-[11px]">Kênh Phân Phối (Channel)</div>
            <div className="font-bold text-slate-800 mt-0.5">HEPCO On-Premise LAN</div>
            <div className="text-[10px] text-slate-400 mt-1">Cập nhật nội bộ qua máy chủ trung tâm</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium text-[11px]">Chế Độ Hiệu Suất Máy Tính</div>
            <div className="font-bold text-emerald-700 mt-0.5">Eco Memory Mode (&lt; 80MB RAM)</div>
            <div className="text-[10px] text-slate-400 mt-1">Tối ưu CPU &lt; 0.1% khi thu nhỏ</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium text-[11px]">Dung Lượng Gói Cài Đặt</div>
            <div className="font-bold text-slate-800 mt-0.5">Đã nén tối đa (Maximum Compression)</div>
            <div className="text-[10px] text-slate-400 mt-1">Tách nhỏ bundle, tải tức thì</div>
          </div>
        </div>
      </div>

      {/* 3. Subnet Management */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" /> Danh Sách Dải Mạng Phê Duyệt Quét (Subnet Guard)
          </h3>
          <span className="text-xs text-slate-500 font-mono font-semibold">{subnets.length} dải mạng</span>
        </div>

        {/* Create Subnet Form */}
        <form onSubmit={handleCreateSubnet} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <input
            type="text"
            required
            placeholder="CIDR: 10.1.1.0/24"
            value={newCidr}
            onChange={e => setNewCidr(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none focus:border-emerald-500 font-mono"
          />
          <input
            type="text"
            required
            placeholder="Tên dải: Văn Phòng Trung Tâm"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none focus:border-emerald-500"
          />
          <select
            value={newScanMode}
            onChange={e => setNewScanMode(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none focus:border-emerald-500 font-bold"
          >
            <option value="LOCAL_L2">Local L2 (ARP Native)</option>
            <option value="ROUTED_L3">Routed L3 (ICMP Sweep)</option>
            <option value="PASSIVE_ONLY">Passive Only (Không gửi gói)</option>
          </select>
          <input
            type="number"
            placeholder="VLAN ID: 10"
            value={newVlan}
            onChange={e => setNewVlan(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> Thêm Dải
          </button>
        </form>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Tên Dải Mạng</th>
                <th className="py-2.5 px-3">CIDR</th>
                <th className="py-2.5 px-3">Chế Độ Quét</th>
                <th className="py-2.5 px-3">VLAN ID</th>
                <th className="py-2.5 px-3">Phê Duyệt Quét</th>
                <th className="py-2.5 px-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subnets.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{s.name}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{s.cidr}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">{s.scan_mode}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">{s.vlan_id || '-'}</td>
                  <td className="py-2.5 px-3">
                    {s.is_approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                        ĐÃ DUYỆT QUÉT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-300">
                        TẠM KHÓA
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleToggleApprove(s.id, s.is_approved)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        s.is_approved
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {s.is_approved ? 'Khóa Quét' : 'Phê Duyệt'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Traffic Anomaly Detection Thresholds Configuration */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-600" /> Ngưỡng Giám Sát Lưu Lượng Mạng Bất Thường (Traffic Anomaly Thresholds)
          </h3>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
            Đã Tắt Thông Báo Vượt Ngưỡng (Không Bắn Notification)
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Hệ thống chạy ngầm liên tục đo lưu lượng qua giao diện mạng Windows (netstat / adapter). Khi phát hiện băng thông tăng đột biến (Spike) hoặc bão gói tin Broadcast vượt ngưỡng, hệ thống sẽ tự động phát âm thanh cảnh báo và hiển thị thông báo khẩn cấp lên màn hình.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Ngưỡng Tải Xuống (Download)</div>
            <div className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">≥ 50 Mbps</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Phát hiện tải file lớn / ngốn băng thông</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Ngưỡng Tải Lên (Upload)</div>
            <div className="text-base font-extrabold text-blue-700 font-mono mt-0.5">≥ 30 Mbps</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Phát hiện rò rỉ dữ liệu / đẩy file ra ngoài</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Bão Broadcast / ARP Storm</div>
            <div className="text-base font-extrabold text-purple-700 font-mono mt-0.5">≥ 600 pkts/giây</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Phát hiện nghẽn mạng / Loop mạng LAN</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Đột Biến So Với Mức Nền</div>
            <div className="text-base font-extrabold text-amber-700 font-mono mt-0.5">Gấp 3.5 lần</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tăng đột ngột so với 20 mẫu gần nhất</div>
          </div>
        </div>
      </div>

      {/* 5. Scanner Parameters */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" /> Chu Kỳ Giám Sát Tự Động (Automation Telemetry)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Kiểm tra Online / Offline</div>
            <div className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">60 giây / lần</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ping Sweep & ICMP Native Check</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Phát Hiện Thiết Bị Mới (Rogue Detection)</div>
            <div className="text-base font-extrabold text-sky-700 font-mono mt-0.5">5 phút / lần</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Quét bảng ARP & Phân tích OUI</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Quét Sâu Dịch Vụ Mạng</div>
            <div className="text-base font-extrabold text-amber-700 font-mono mt-0.5">15 phút / lần</div>
            <div className="text-[10px] text-slate-400 mt-0.5">SNMP, Port Scan & ONVIF Camera</div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT IP USER PERMISSION */}
      {isPermModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in select-none">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">
                    {editingPermId ? 'Chỉnh Sửa Phân Quyền Địa Chỉ IP' : 'Thêm Phân Quyền Cho Địa Chỉ IP'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chỉ định cụ thể người dùng tại địa chỉ IP này được xem những chức năng nào
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPermModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePermForm} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Họ và Tên Nhân Viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Trần Ngọc Huy Vũ"
                    value={permForm.name}
                    onChange={(e) => setPermForm({ ...permForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Địa Chỉ IP Máy Tính <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 10.1.1.88"
                    value={permForm.ip}
                    onChange={(e) => setPermForm({ ...permForm, ip: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Phòng Ban / Bộ Phận
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phòng Kế Hoạch - Nghiệp Vụ"
                    value={permForm.department}
                    onChange={(e) => setPermForm({ ...permForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Cấp Độ Quyền Hạn
                  </label>
                  <select
                    value={permForm.role}
                    onChange={(e) =>
                      setPermForm({ ...permForm, role: e.target.value as 'admin' | 'custom' })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 cursor-pointer"
                  >
                    <option value="custom">Giới Hạn Tính Năng Chỉ Định (Custom)</option>
                    <option value="admin">Quản Trị Viên Toàn Quyền (Admin Full)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Ghi Chú Phân Quyền
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cấp quyền xem Camera, danh sách máy tính và công văn"
                  value={permForm.note}
                  onChange={(e) => setPermForm({ ...permForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Feature Checkboxes Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-slate-800">
                    Danh Sách Chức Năng Được Phép Truy Cập ({permForm.allowedFeatures.length}/{ALL_FEATURES.length}):
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setPermForm({
                          ...permForm,
                          allowedFeatures: ['cameras', 'computers', 'dispatches']
                        })
                      }
                      className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 transition cursor-pointer"
                      title="Áp dụng mẫu phân quyền giống anh Trần Ngọc Huy Vũ"
                    >
                      ⭐ Mẫu: Camera + Máy Tính + Công Văn
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllFeatures}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                    >
                      Chọn Tất Cả
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFeatures}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                    >
                      Bỏ Chọn Hết
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-64 overflow-y-auto select-none">
                  {ALL_FEATURES.map((f) => {
                    const isChecked = permForm.allowedFeatures.includes(f.key);
                    return (
                      <button
                        type="button"
                        key={f.key}
                        onClick={() => handleToggleFeature(f.key)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition text-left active:scale-[0.98] ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate flex-1">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPermModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingSecurity}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingSecurity ? 'Đang Lưu...' : 'Lưu Phân Quyền IP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
