import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  Layers,
  MapPin,
  Smartphone,
  User,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  UserCheck,
  PackageCheck,
  HandCoins,
  History,
  Edit3,
  Trash2,
  ExternalLink,
  Settings,
  X,
  Save,
  Check,
  Building2,
  FileText,
  Radio,
  Tag,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  HepcoApiService,
  PosDevice,
  PosStats,
  PosAssignment,
  PosBorrowing,
  EmployeeItem,
  PosPaperItem,
  PosPaperIssueRecord,
  getHepcoApiConfig,
  saveHepcoApiConfig
} from '../../services/hepcoApi';
import { exportPosDevicesToExcel } from '../../utils/excelExportEngine';
import { ExportSuccessModal } from '../../components/ExportSuccessModal';

export const PosDevicesPage: React.FC = () => {
  // Main Data States
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [stats, setStats] = useState<PosStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>('ALL'); // ALL, BSH, NSH
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // ALL, in_use, in_stock, borrowed, broken, retired
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Export Excel Modal State
  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    fileName: string;
    filePath?: string;
    fileSize?: number;
    isBrowserDownload?: boolean;
  }>({
    isOpen: false,
    fileName: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  // Employee list for assignment dropdown
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);

  // Modal States
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'ASSIGN' | 'UNASSIGN' | 'BORROW' | 'RETURN_BORROW' | 'HISTORY' | 'CREATE_EDIT' | 'PAPER' | 'CONFIG'
  >('NONE');
  const [selectedDevice, setSelectedDevice] = useState<PosDevice | null>(null);
  const [historyData, setHistoryData] = useState<{ assignments: PosAssignment[]; borrowings: PosBorrowing[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Forms
  const [assignForm, setAssignForm] = useState({
    employee_id: 0,
    employee_name: '',
    region: '',
    assigned_by: 'Bộ phận CNTT',
    assigned_date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [unassignForm, setUnassignForm] = useState({
    returned_date: new Date().toISOString().split('T')[0],
    note: 'Thu hồi về kho xí nghiệp'
  });

  const [borrowForm, setBorrowForm] = useState({
    borrower_name: '',
    employee_id: 0,
    expected_return_date: '',
    purpose: 'Mượn thay thế máy bảo hành',
    note: 'Mượn kho dự phòng'
  });

  const [returnBorrowForm, setReturnBorrowForm] = useState({
    note: 'Đã hoàn trả máy mượn dự phòng'
  });

  const [posForm, setPosForm] = useState<{
    id?: number;
    serial_number: string;
    imei: string;
    sim_number: string;
    sim_imei: string;
    telecom_plan: string;
    enterprise: string;
    region: string;
    status: string;
    notes: string;
  }>({
    serial_number: '',
    imei: '',
    sim_number: '',
    sim_imei: '',
    telecom_plan: 'Viettel 4G',
    enterprise: 'BSH',
    region: '',
    status: 'in_stock',
    notes: ''
  });

  // Paper Management States
  const [papers, setPapers] = useState<PosPaperItem[]>([]);
  const [paperIssues, setPaperIssues] = useState<PosPaperIssueRecord[]>([]);
  const [paperTab, setPaperTab] = useState<'STOCK' | 'ISSUES'>('STOCK');
  const [issuePaperForm, setIssuePaperForm] = useState({
    paper_id: 0,
    employee_id: 0,
    quantity: 10,
    issue_date: new Date().toISOString().split('T')[0],
    issued_by: 'Thủ kho Xí nghiệp',
    note: 'Cấp phát giấy in đợt mới'
  });
  const [newPaperForm, setNewPaperForm] = useState({
    paper_name: 'Giấy in nhiệt K57x38mm',
    code: 'PAP-K57',
    total_quantity: 500,
    unit_price: 6500,
    supplier_name: 'Công ty Giấy In',
    notes: 'Cuộn giấy in cho máy POS cầm tay'
  });

  // API Config State
  const [apiConfigForm, setApiConfigForm] = useState(getHepcoApiConfig());
  const [apiHealthStatus, setApiHealthStatus] = useState<{ connected: boolean; message: string; latency?: number } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch POS list & Employees
  const fetchPosData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await HepcoApiService.getPosDevices({
        limit: 200,
        enterprise: selectedEnterprise !== 'ALL' ? selectedEnterprise : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined
      });
      setDevices(res.data || []);
      if (res.meta?.stats) {
        setStats(res.meta.stats);
      }
    } catch (err: any) {
      console.error('Fetch POS error:', err);
      setError(err.message || 'Không thể kết nối đến HEPCO API');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await HepcoApiService.getEmployees({ limit: 300 });
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Fetch employees error:', err);
    }
  };

  const checkApiHealth = async () => {
    const t0 = performance.now();
    try {
      const res = await HepcoApiService.checkHealth();
      const latency = Math.round(performance.now() - t0);
      setApiHealthStatus({
        connected: res.status === 'healthy' || res.database === 'connected',
        message: `Máy chủ hoạt động tốt (${res.database || 'OK'})`,
        latency
      });
    } catch (err: any) {
      setApiHealthStatus({
        connected: false,
        message: err.message || 'Mất kết nối máy chủ'
      });
    }
  };

  useEffect(() => {
    fetchPosData();
    fetchEmployeesList();
    checkApiHealth();
  }, [selectedEnterprise, selectedStatus]);

  // Unique Regions for Filter dropdown
  const uniqueRegions = useMemo(() => {
    const rSet = new Set<string>();
    devices.forEach((d) => {
      if (d.region) rSet.add(d.region.trim());
    });
    return Array.from(rSet).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [devices]);

  // Filtered devices by search & region
  const filteredDevices = useMemo(() => {
    const q = search.toLowerCase().trim();
    return devices.filter((d) => {
      const matchSearch =
        !q ||
        d.serial_number?.toLowerCase().includes(q) ||
        d.imei?.toLowerCase().includes(q) ||
        d.asset_code?.toLowerCase().includes(q) ||
        d.sim_number?.toLowerCase().includes(q) ||
        d.region?.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q) ||
        d.assignments?.some((a) => a.employee_name?.toLowerCase().includes(q)) ||
        d.borrowings?.some((b) => b.borrower_name?.toLowerCase().includes(q));

      const matchRegion = selectedRegion === 'ALL' || d.region === selectedRegion;
      return matchSearch && matchRegion;
    });
  }, [devices, search, selectedRegion]);

  // Grouped by Enterprise matching official sample image
  const groupedSections = useMemo(() => {
    const bsh = filteredDevices.filter(
      (d) => d.enterprise === 'BSH' || (!d.enterprise && d.serial_number?.startsWith('V3022'))
    );
    const nsh = filteredDevices.filter(
      (d) => d.enterprise === 'NSH' || (!d.enterprise && !d.serial_number?.startsWith('V3022'))
    );
    const others = filteredDevices.filter(
      (d) => d.enterprise !== 'BSH' && d.enterprise !== 'NSH' && !bsh.includes(d) && !nsh.includes(d)
    );

    const res: Array<{ id: string; title: string; count: number; list: PosDevice[] }> = [];
    if (selectedEnterprise === 'BSH') {
      res.push({ id: 'BSH', title: 'XÍ NGHIỆP BẮC SÔNG HƯƠNG (KHỐI CHÍNH)', count: bsh.length, list: bsh });
    } else if (selectedEnterprise === 'NSH') {
      res.push({ id: 'NSH', title: 'XÍ NGHIỆP NAM SÔNG HƯƠNG (KHỐI CHÍNH)', count: nsh.length, list: nsh });
    } else {
      if (bsh.length > 0) {
        res.push({ id: 'BSH', title: 'XÍ NGHIỆP BẮC SÔNG HƯƠNG (KHỐI CHÍNH)', count: bsh.length, list: bsh });
      }
      if (nsh.length > 0) {
        res.push({ id: 'NSH', title: 'XÍ NGHIỆP NAM SÔNG HƯƠNG (KHỐI CHÍNH)', count: nsh.length, list: nsh });
      }
      if (others.length > 0) {
        res.push({ id: 'OTHERS', title: 'MÁY POS DỰ PHÒNG & KHO TRUNG TÂM', count: others.length, list: others });
      }
    }
    return res;
  }, [filteredDevices, selectedEnterprise]);

  // ---------------------------------------------------------
  // HANDLERS FOR ACTIONS
  // ---------------------------------------------------------
  const handleOpenAssign = (dev: PosDevice) => {
    setSelectedDevice(dev);
    setAssignForm({
      employee_id: 0,
      employee_name: '',
      region: dev.region || '',
      assigned_by: 'Bộ phận CNTT HEPCO',
      assigned_date: new Date().toISOString().split('T')[0],
      note: 'Cấp phát máy thu phí'
    });
    setActiveModal('ASSIGN');
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    if (!assignForm.employee_id) {
      alert('Vui lòng chọn nhân viên thu phí được cấp phát!');
      return;
    }
    try {
      await HepcoApiService.assignPos(selectedDevice.id, assignForm);
      showNotify(`Đã cấp phát máy POS [${selectedDevice.serial_number}] cho nhân viên thành công!`);
      setActiveModal('NONE');
      fetchPosData();
    } catch (err: any) {
      alert(`Lỗi cấp phát: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleOpenUnassign = (dev: PosDevice) => {
    setSelectedDevice(dev);
    setUnassignForm({
      returned_date: new Date().toISOString().split('T')[0],
      note: 'Nhân viên bàn giao máy về kho xí nghiệp'
    });
    setActiveModal('UNASSIGN');
  };

  const handleConfirmUnassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      await HepcoApiService.unassignPos(selectedDevice.id, unassignForm);
      showNotify(`Đã thu hồi máy POS [${selectedDevice.serial_number}] về kho thành công!`);
      setActiveModal('NONE');
      fetchPosData();
    } catch (err: any) {
      alert(`Lỗi thu hồi: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleOpenBorrow = (dev: PosDevice) => {
    setSelectedDevice(dev);
    setBorrowForm({
      borrower_name: '',
      employee_id: 0,
      expected_return_date: '',
      purpose: 'Mượn tạm do máy chính đang gửi bảo hành/sửa chữa',
      note: 'Mượn kho dự phòng'
    });
    setActiveModal('BORROW');
  };

  const handleConfirmBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    if (!borrowForm.borrower_name.trim()) {
      alert('Vui lòng nhập tên người mượn máy!');
      return;
    }
    try {
      await HepcoApiService.borrowPos(selectedDevice.id, borrowForm);
      showNotify(`Đã ghi nhận cho mượn máy POS [${selectedDevice.serial_number}] thành công!`);
      setActiveModal('NONE');
      fetchPosData();
    } catch (err: any) {
      alert(`Lỗi cho mượn: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleOpenReturnBorrow = (dev: PosDevice) => {
    setSelectedDevice(dev);
    setReturnBorrowForm({ note: 'Đã hoàn trả máy mượn dự phòng về kho nguyên vẹn' });
    setActiveModal('RETURN_BORROW');
  };

  const handleConfirmReturnBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      await HepcoApiService.returnBorrowPos(selectedDevice.id, returnBorrowForm);
      showNotify(`Đã nhận trả máy mượn [${selectedDevice.serial_number}] về kho thành công!`);
      setActiveModal('NONE');
      fetchPosData();
    } catch (err: any) {
      alert(`Lỗi trả máy: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleOpenHistory = async (dev: PosDevice) => {
    setSelectedDevice(dev);
    setActiveModal('HISTORY');
    setHistoryLoading(true);
    try {
      const res = await HepcoApiService.getPosHistory(dev.id);
      setHistoryData(res);
    } catch (err: any) {
      console.error(err);
      setHistoryData({ assignments: dev.assignments || [], borrowings: dev.borrowings || [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenCreatePos = () => {
    setPosForm({
      serial_number: '',
      imei: '',
      sim_number: '',
      sim_imei: '',
      telecom_plan: 'Viettel 4G',
      enterprise: 'BSH',
      region: '',
      status: 'in_stock',
      notes: ''
    });
    setActiveModal('CREATE_EDIT');
  };

  const handleOpenEditPos = (dev: PosDevice) => {
    setSelectedDevice(dev);
    setPosForm({
      id: dev.id,
      serial_number: dev.serial_number || '',
      imei: dev.imei || '',
      sim_number: dev.sim_number || '',
      sim_imei: dev.sim_imei || '',
      telecom_plan: dev.telecom_plan || 'Viettel 4G',
      enterprise: dev.enterprise || 'BSH',
      region: dev.region || '',
      status: dev.status || 'in_stock',
      notes: dev.notes || ''
    });
    setActiveModal('CREATE_EDIT');
  };

  const handleSavePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posForm.serial_number.trim() || !posForm.imei.trim()) {
      alert('Vui lòng nhập đầy đủ Số Serial và IMEI của máy POS!');
      return;
    }
    try {
      if (posForm.id) {
        await HepcoApiService.updatePos(posForm.id, posForm);
        showNotify(`Đã cập nhật máy POS [${posForm.serial_number}] thành công!`);
      } else {
        await HepcoApiService.createPos(posForm);
        showNotify(`Đã thêm máy POS [${posForm.serial_number}] mới thành công!`);
      }
      setActiveModal('NONE');
      fetchPosData();
    } catch (err: any) {
      alert(`Lỗi lưu máy POS: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeletePos = async (dev: PosDevice) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa máy POS [${dev.serial_number}] (Mã: ${dev.asset_code || dev.id})?`)) {
      return;
    }
    try {
      await HepcoApiService.deletePos(dev.id);
      showNotify(`Đã xóa máy POS [${dev.serial_number}] thành công!`);
      fetchPosData();
    } catch (err: any) {
      alert(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
    }
  };

  // Paper Handlers
  const handleOpenPaperModal = async () => {
    setActiveModal('PAPER');
    try {
      const pRes = await HepcoApiService.getPosPaper();
      setPapers(pRes.data || []);
      const iRes = await HepcoApiService.getPosPaperIssues();
      setPaperIssues(iRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssuePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuePaperForm.paper_id || !issuePaperForm.employee_id) {
      alert('Vui lòng chọn Loại giấy và Nhân viên nhận giấy!');
      return;
    }
    try {
      await HepcoApiService.issuePosPaper(issuePaperForm);
      showNotify(`Đã xuất ${issuePaperForm.quantity} cuộn giấy in cho nhân viên thành công!`);
      const pRes = await HepcoApiService.getPosPaper();
      setPapers(pRes.data || []);
      const iRes = await HepcoApiService.getPosPaperIssues();
      setPaperIssues(iRes.data || []);
    } catch (err: any) {
      alert(`Lỗi xuất giấy in: ${err.response?.data?.message || err.message}`);
    }
  };

  // Export Excel matching official corporate template
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const targetDevices = filteredDevices.length > 0 ? filteredDevices : devices;
      const res = await exportPosDevicesToExcel(
        targetDevices,
        selectedEnterprise === 'ALL' ? undefined : selectedEnterprise
      );

      if (res.success) {
        setExportModal({
          isOpen: true,
          fileName: res.fileName || 'DANH_SACH_MAY_POS_HEPCO.xlsx',
          filePath: res.filePath,
          fileSize: res.fileSize,
          isBrowserDownload: res.isBrowserDownload
        });
      } else if (res.error && res.error !== 'Hủy lưu file') {
        setNotification({ type: 'error', message: 'Lỗi xuất file: ' + res.error });
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setNotification({ type: 'error', message: 'Lỗi khi xuất file Excel: ' + (err.message || '') });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto select-none">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-rose-600 text-white shadow-rose-600/30'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. TOP HEADER & LIVE API STATUS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                QUẢN LÝ THIẾT BỊ MÁY POS THU PHÍ (HEPCO-API)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                API Vercel Live
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Đồng bộ 2 chiều dữ liệu máy POS thu tiền vệ sinh môi trường</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">https://hepco-api.vercel.app/api</span>
              {apiHealthStatus && (
                <span className="text-[10px] text-slate-400 font-mono">({apiHealthStatus.latency}ms)</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchPosData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Làm mới dữ liệu từ API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Làm Mới</span>
          </button>

          <button
            onClick={handleOpenPaperModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 font-bold text-xs border border-teal-200 dark:border-teal-800 transition cursor-pointer"
            title="Quản lý tồn kho & xuất cấp giấy in nhiệt POS"
          >
            <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Kho Giấy In POS</span>
          </button>

          <button
            onClick={handleOpenCreatePos}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Máy POS</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Xuất bảng kiểm kê thiết bị POS ra file Excel chuẩn doanh nghiệp"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>

          <button
            onClick={() => setActiveModal('CONFIG')}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Cấu hình thông tin kết nối API"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. STATS EXECUTIVE SUMMARY OVERVIEW BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tổng Hợp Hiện Trạng Quản Lý & Phân Bổ Thiết Bị POS
            </h2>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Tỷ lệ máy hoạt động ngoài tuyến: <b className="text-emerald-600 dark:text-emerald-400">
              {stats?.total ? Math.round(((stats.in_use || 0) / stats.total) * 100) : 96}%
            </b>
          </div>
        </div>

        {/* 6 Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
              <span>Tổng Số Máy POS</span>
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats?.total ?? devices.length}
              <span className="text-xs font-normal text-slate-400 ml-1">máy</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>BSH: <b>{stats?.BSH ?? devices.filter((d) => d.enterprise === 'BSH').length}</b></span>
              <span>NSH: <b>{stats?.NSH ?? devices.filter((d) => d.enterprise === 'NSH').length}</b></span>
            </div>
          </div>

          {/* Card 2: In Use */}
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between">
              <span>Đang Thu Phí</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
              {stats?.in_use ?? devices.filter((d) => d.status === 'in_use').length}
              <span className="text-xs font-normal text-emerald-600/70 ml-1">máy</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Trực tiếp ngoài địa bàn
            </div>
          </div>

          {/* Card 3: In Stock */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="text-[11px] text-blue-800 dark:text-blue-300 font-bold flex items-center justify-between">
              <span>Trong Kho Sẵn Sàng</span>
              <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">
              {stats?.in_stock ?? devices.filter((d) => d.status === 'in_stock').length}
              <span className="text-xs font-normal text-blue-600/70 ml-1">máy</span>
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
              Sẵn sàng cấp mới
            </div>
          </div>

          {/* Card 4: Borrowed */}
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-bold flex items-center justify-between">
              <span>Mượn Dự Phòng</span>
              <HandCoins className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-800 dark:text-amber-400 mt-1">
              {stats?.borrowed ?? devices.filter((d) => d.status === 'borrowed').length}
              <span className="text-xs font-normal text-amber-700/70 ml-1">máy</span>
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1">
              Thế máy tạm thời
            </div>
          </div>

          {/* Card 5: Broken */}
          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <div className="text-[11px] text-rose-800 dark:text-rose-300 font-bold flex items-center justify-between">
              <span>Báo Hỏng / Sửa</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-800 dark:text-rose-400 mt-1">
              {stats?.broken ?? devices.filter((d) => d.status === 'broken').length}
              <span className="text-xs font-normal text-rose-600/70 ml-1">máy</span>
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-1">
              Chờ bảo hành kỹ thuật
            </div>
          </div>

          {/* Card 6: Paper Inventory */}
          <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
            <div className="text-[11px] text-teal-800 dark:text-teal-300 font-bold flex items-center justify-between">
              <span>Giấy In Nhiệt</span>
              <Layers className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-extrabold text-teal-800 dark:text-teal-400 mt-1">
              {papers.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 150}
              <span className="text-xs font-normal text-teal-600/70 ml-1">cuộn</span>
            </div>
            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-1">
              Khổ chuẩn K57x38mm
            </div>
          </div>
        </div>

        {/* Visual Distribution Progress Bar */}
        <div className="pt-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 flex overflow-hidden">
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${
                  stats?.total
                    ? ((stats.in_use || 0) / stats.total) * 100
                    : (devices.filter((d) => d.status === 'in_use').length / Math.max(1, devices.length)) * 100
                }%`,
              }}
              title="Đang thu phí"
            ></div>
            <div
              className="bg-blue-500 h-full"
              style={{
                width: `${
                  stats?.total
                    ? ((stats.in_stock || 0) / stats.total) * 100
                    : (devices.filter((d) => d.status === 'in_stock').length / Math.max(1, devices.length)) * 100
                }%`,
              }}
              title="Trong kho"
            ></div>
            <div
              className="bg-amber-500 h-full"
              style={{
                width: `${
                  stats?.total
                    ? ((stats.borrowed || 0) / stats.total) * 100
                    : (devices.filter((d) => d.status === 'borrowed').length / Math.max(1, devices.length)) * 100
                }%`,
              }}
              title="Cho mượn"
            ></div>
            <div
              className="bg-rose-500 h-full"
              style={{
                width: `${
                  stats?.total
                    ? ((stats.broken || 0) / stats.total) * 100
                    : (devices.filter((d) => d.status === 'broken').length / Math.max(1, devices.length)) * 100
                }%`,
              }}
              title="Báo hỏng"
            ></div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTER BAR WITH VIEW MODE TOGGLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm Serial, IMEI, SIM, tên nhân viên, địa bàn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
          {/* Enterprise */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setSelectedEnterprise('ALL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedEnterprise === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất Cả XN
            </button>
            <button
              onClick={() => setSelectedEnterprise('BSH')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedEnterprise === 'BSH'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bắc Sông Hương
            </button>
            <button
              onClick={() => setSelectedEnterprise('NSH')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedEnterprise === 'NSH'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nam Sông Hương
            </button>
          </div>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Mọi Trạng Thái</option>
            <option value="in_use">Đang Thu Phí (in_use)</option>
            <option value="in_stock">Trong Kho Sẵn Sàng (in_stock)</option>
            <option value="borrowed">Cho Mượn Dự Phòng (borrowed)</option>
            <option value="broken">Báo Hỏng (broken)</option>
            <option value="retired">Đã Thanh Lý (retired)</option>
          </select>

          {/* Region Select */}
          {uniqueRegions.length > 0 && (
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-500 max-w-[180px] cursor-pointer"
            >
              <option value="ALL">Tất Cả Địa Bàn ({uniqueRegions.length})</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng Bảng Chi Tiết"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng Lưới Thẻ Trực Quan"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Lưới Thẻ</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono pl-1">
            (<strong>{filteredDevices.length}</strong> máy)
          </div>
        </div>
      </div>

      {/* 4. MAIN POS DEVICES VIEW: TABLE VIEW OR GRID CARD VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-['Times_New_Roman']">
              {loading && devices.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Đang tải danh sách máy POS từ máy chủ HEPCO...
                    </td>
                  </tr>
                </tbody>
              ) : filteredDevices.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Không tìm thấy máy POS nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                </tbody>
              ) : (
                groupedSections.map((sec) => (
                  <React.Fragment key={sec.id}>
                    {/* Section Banner matching Enterprise Sample */}
                    <thead>
                      <tr className="bg-[#EAEFF5] dark:bg-slate-800 border-y-2 border-slate-300 dark:border-slate-700">
                        <th
                          colSpan={10}
                          className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold">{sec.title}</span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold font-sans">
                              {sec.list.length} thiết bị
                            </span>
                          </div>
                        </th>
                      </tr>
                      {/* Signature Forest Green Header Row matching Sample Image */}
                      <tr className="bg-[#13522C] text-white border-b border-[#0F4022] font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <th className="py-2.5 px-3 text-center w-12 border-r border-[#0F4022] whitespace-nowrap">STT</th>
                        <th className="py-2.5 px-3 border-r border-[#0F4022] whitespace-nowrap min-w-[160px]">Họ và Tên Nhân Viên/Người Mượn</th>
                        <th className="py-2.5 px-3 border-r border-[#0F4022] whitespace-nowrap min-w-[140px]">Địa Bàn Phụ Trách</th>
                        <th className="py-2.5 px-3 text-center border-r border-[#0F4022] whitespace-nowrap min-w-[110px]">Serial POS</th>
                        <th className="py-2.5 px-3 text-center border-r border-[#0F4022] whitespace-nowrap min-w-[120px]">IMEI POS</th>
                        <th className="py-2.5 px-3 text-center border-r border-[#0F4022] whitespace-nowrap min-w-[110px]">Số Điện Thoại SIM</th>
                        <th className="py-2.5 px-3 text-center border-r border-[#0F4022] whitespace-nowrap min-w-[120px]">IMEI SIM</th>
                        <th className="py-2.5 px-3 text-center border-r border-[#0F4022] whitespace-nowrap min-w-[90px]">Gói Cước</th>
                        <th className="py-2.5 px-3 text-center border-r border-[#0F4022] whitespace-nowrap min-w-[115px]">Trạng Thái</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[220px]">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {sec.list.map((dev, idx) => {
                        const currentAssign = dev.assignments && dev.assignments.length > 0 ? dev.assignments[0] : null;
                        const currentBorrow = dev.borrowings && dev.borrowings.length > 0 ? dev.borrowings[0] : null;

                        return (
                          <tr
                            key={dev.id}
                            className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-200 dark:border-slate-800/80"
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-xs border-r border-slate-100 dark:border-slate-800">
                              {idx + 1}
                            </td>

                            {/* Assigned Employee / Borrower */}
                            <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800">
                              {dev.status === 'in_use' && currentAssign ? (
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                                    <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{currentAssign.employee_name || currentAssign.employee?.full_name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-sans flex items-center gap-2 mt-0.5">
                                    {currentAssign.employee?.employee_code && (
                                      <span className="font-mono">{currentAssign.employee.employee_code}</span>
                                    )}
                                    {currentAssign.employee?.phone && (
                                      <span className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-mono">
                                        <Phone className="w-2.5 h-2.5" />
                                        {currentAssign.employee.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : dev.status === 'borrowed' && currentBorrow ? (
                                <div>
                                  <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 text-xs">
                                    <HandCoins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>Mượn: {currentBorrow.borrower_name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{currentBorrow.purpose}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">— Chưa cấp phát (Kho) —</span>
                              )}
                            </td>

                            {/* Region */}
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 text-xs">
                              {dev.region ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span className="max-w-[200px]" title={dev.region}>
                                    {dev.region}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Serial */}
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800 text-xs">
                              {dev.serial_number}
                              {dev.asset_code && (
                                <div className="text-[10px] font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                                  {dev.asset_code}
                                </div>
                              )}
                            </td>

                            {/* IMEI */}
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300 text-xs border-r border-slate-100 dark:border-slate-800">
                              {dev.imei || '-'}
                            </td>

                            {/* SIM Number */}
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs border-r border-slate-100 dark:border-slate-800">
                              {dev.sim_number || '-'}
                            </td>

                            {/* SIM IMEI */}
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400 text-[11px] border-r border-slate-100 dark:border-slate-800 max-w-[150px] truncate" title={dev.sim_imei || ''}>
                              {dev.sim_imei || '-'}
                            </td>

                            {/* Plan */}
                            <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 text-xs border-r border-slate-100 dark:border-slate-800">
                              {dev.telecom_plan || 'Gói ezCom90'}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap min-w-[115px]">
                              <span
                                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border font-sans whitespace-nowrap shrink-0 min-w-[95px] shadow-2xs ${
                                  dev.status === 'in_use'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                    : dev.status === 'in_stock'
                                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                    : dev.status === 'borrowed'
                                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                    : dev.status === 'broken'
                                    ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    dev.status === 'in_use'
                                      ? 'bg-emerald-600'
                                      : dev.status === 'in_stock'
                                      ? 'bg-blue-600'
                                      : dev.status === 'borrowed'
                                      ? 'bg-amber-600'
                                      : 'bg-rose-600'
                                  }`}
                                ></span>
                                <span className="whitespace-nowrap">
                                  {dev.status === 'in_use'
                                    ? 'Đang Cấp Phát'
                                    : dev.status === 'in_stock'
                                    ? 'Trong Kho'
                                    : dev.status === 'borrowed'
                                    ? 'Cho Mượn'
                                    : dev.status === 'broken'
                                    ? 'Báo Hỏng'
                                    : 'Thanh Lý'}
                                </span>
                              </span>
                            </td>

                            {/* Actions - Single Line Sleek Toolbar */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap min-w-[220px]">
                              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap font-sans shrink-0">
                                <button
                                  onClick={() => handleOpenEditPos(dev)}
                                  className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap"
                                  title="Chỉnh sửa thông tin máy POS"
                                >
                                  <Edit3 className="w-3 h-3 text-emerald-600" />
                                  <span>Sửa</span>
                                </button>

                                {dev.status === 'in_stock' && (
                                  <>
                                    <button
                                      onClick={() => handleOpenAssign(dev)}
                                      className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                                      title="Cấp phát máy cho nhân viên thu phí"
                                    >
                                      <UserCheck className="w-3 h-3" />
                                      <span>Cấp</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenBorrow(dev)}
                                      className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                                      title="Cho mượn máy dự phòng"
                                    >
                                      <HandCoins className="w-3 h-3" />
                                      <span>Mượn</span>
                                    </button>
                                  </>
                                )}

                                {dev.status === 'in_use' && (
                                  <button
                                    onClick={() => handleOpenUnassign(dev)}
                                    className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                                    title="Thu hồi máy về kho"
                                  >
                                    <RotateCcw className="w-3 h-3 text-emerald-600" />
                                    <span>Thu hồi</span>
                                  </button>
                                )}

                                {dev.status === 'borrowed' && (
                                  <button
                                    onClick={() => handleOpenReturnBorrow(dev)}
                                    className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                                    title="Nhận trả lại máy mượn"
                                  >
                                    <PackageCheck className="w-3 h-3" />
                                    <span>Nhận trả</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenHistory(dev)}
                                  className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                                  title="Xem lịch sử cấp phát"
                                >
                                  <History className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={() => handleDeletePos(dev)}
                                  className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                                  title="Xóa máy POS"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </React.Fragment>
                ))
              )}
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW: HIGHLY VISUAL CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => {
            const currentAssign = dev.assignments && dev.assignments.length > 0 ? dev.assignments[0] : null;
            const currentBorrow = dev.borrowings && dev.borrowings.length > 0 ? dev.borrowings[0] : null;

            return (
              <div
                key={dev.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                          {dev.serial_number}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {dev.asset_code || `POS-ID-${dev.id}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[9px] border ${
                          dev.enterprise === 'BSH'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {dev.enterprise === 'BSH' ? 'Bắc Sông Hương' : 'Nam Sông Hương'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          dev.status === 'in_use'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : dev.status === 'in_stock'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            : dev.status === 'borrowed'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {dev.status === 'in_use'
                          ? 'Đang Thu Phí'
                          : dev.status === 'in_stock'
                          ? 'Trong Kho'
                          : dev.status === 'borrowed'
                          ? 'Cho Mượn'
                          : 'Báo Hỏng'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>Mã IMEI:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{dev.imei || '-'}</span>
                    </div>

                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>SIM 4G:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {dev.sim_number || 'Chưa gắn'} ({dev.telecom_plan || 'Viettel 4G'})
                      </span>
                    </div>

                    {/* Assigned Employee */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Nhân viên quản lý:
                      </div>
                      {dev.status === 'in_use' && currentAssign ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                              {(currentAssign.employee_name || 'U').charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {currentAssign.employee_name || currentAssign.employee?.full_name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {currentAssign.employee?.employee_code}
                              </div>
                            </div>
                          </div>
                          {currentAssign.employee?.phone && (
                            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                              <Phone className="w-3 h-3" />
                              {currentAssign.employee.phone}
                            </span>
                          )}
                        </div>
                      ) : dev.status === 'borrowed' && currentBorrow ? (
                        <div className="text-amber-800 dark:text-amber-300 font-medium">
                          Mượn: <b>{currentBorrow.borrower_name}</b> ({currentBorrow.purpose})
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">— Sẵn sàng trong kho —</div>
                      )}
                    </div>

                    {dev.region && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{dev.region}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleOpenEditPos(dev)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa Nhanh</span>
                  </button>

                  {dev.status === 'in_stock' && (
                    <button
                      onClick={() => handleOpenAssign(dev)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                      title="Cấp máy cho nhân viên"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {dev.status === 'in_use' && (
                    <button
                      onClick={() => handleOpenUnassign(dev)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      title="Thu hồi máy về kho"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenHistory(dev)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Lịch sử điều chuyển"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeletePos(dev)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Xóa máy POS"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CẤP PHÁT MÁY POS CHO NHÂN VIÊN */}
      {/* ========================================================= */}
      {activeModal === 'ASSIGN' && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Cấp Phát Máy POS Cho Nhân Viên</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                Thiết bị: <strong className="text-slate-800">{selectedDevice.serial_number}</strong> ({selectedDevice.asset_code || 'Chưa gán mã TS'})
              </div>
              <div>
                IMEI: <span className="font-mono text-slate-600">{selectedDevice.imei}</span> · Xí nghiệp:{' '}
                <strong className="text-emerald-700">{selectedDevice.enterprise}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Chọn Nhân Viên Thu Phí <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignForm.employee_id}
                  onChange={(e) => {
                    const empId = Number(e.target.value);
                    const emp = employees.find((x) => x.id === empId);
                    setAssignForm({
                      ...assignForm,
                      employee_id: empId,
                      employee_name: emp ? emp.full_name : ''
                    });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value={0}>-- Chọn nhân viên từ danh bạ HEPCO --</option>
                  {employees
                    .filter((e) => e.employee_type === 1 || e.position?.toLowerCase().includes('thu'))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code}) - {emp.department?.name || 'Xí nghiệp'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tuyến / Địa Bàn Thu Phí Phụ Trách</label>
                <input
                  type="text"
                  placeholder="VD: Tuyến Phường Vỹ Dạ, Phú Hội..."
                  value={assignForm.region}
                  onChange={(e) => setAssignForm({ ...assignForm, region: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Cấp Phát</label>
                  <input
                    type="date"
                    value={assignForm.assigned_date}
                    onChange={(e) => setAssignForm({ ...assignForm, assigned_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người Cấp Phát</label>
                  <input
                    type="text"
                    value={assignForm.assigned_by}
                    onChange={(e) => setAssignForm({ ...assignForm, assigned_by: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú Cấp Phát</label>
                <textarea
                  rows={2}
                  value={assignForm.note}
                  onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Xác Nhận Cấp Phát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: THU HỒI MÁY POS VỀ KHO */}
      {/* ========================================================= */}
      {activeModal === 'UNASSIGN' && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Thu Hồi Máy POS Về Kho</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              Thu hồi máy: <strong className="text-slate-800">{selectedDevice.serial_number}</strong> từ nhân viên{' '}
              <strong className="text-emerald-700">{selectedDevice.assignments?.[0]?.employee_name || 'Đang sử dụng'}</strong>. Máy sẽ trở về trạng thái trong kho (in_stock).
            </div>

            <form onSubmit={handleConfirmUnassign} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày Thu Hồi</label>
                <input
                  type="date"
                  value={unassignForm.returned_date}
                  onChange={(e) => setUnassignForm({ ...unassignForm, returned_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú Kiểm Tra Thiết Bị</label>
                <textarea
                  rows={2}
                  value={unassignForm.note}
                  onChange={(e) => setUnassignForm({ ...unassignForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Xác Nhận Thu Hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CHO MƯỢN MÁY POS DỰ PHÒNG */}
      {/* ========================================================= */}
      {activeModal === 'BORROW' && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-800">Cho Mượn Máy POS Từ Kho Dự Phòng</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBorrow} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Họ Tên Người Mượn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên người mượn hoặc nhân viên..."
                  value={borrowForm.borrower_name}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrower_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày Dự Kiến Hoàn Trả</label>
                <input
                  type="date"
                  value={borrowForm.expected_return_date}
                  onChange={(e) => setBorrowForm({ ...borrowForm, expected_return_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mục Đích Mượn</label>
                <input
                  type="text"
                  value={borrowForm.purpose}
                  onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú</label>
                <textarea
                  rows={2}
                  value={borrowForm.note}
                  onChange={(e) => setBorrowForm({ ...borrowForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Xác Nhận Cho Mượn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: NHẬN TRẢ MÁY MƯỢN */}
      {/* ========================================================= */}
      {activeModal === 'RETURN_BORROW' && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Nhận Trả Máy POS Mượn Dự Phòng</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnBorrow} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú Nhận Lại Máy</label>
                <textarea
                  rows={2}
                  value={returnBorrowForm.note}
                  onChange={(e) => setReturnBorrowForm({ note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Hoàn Trả Về Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: THÊM MỚI / CHỈNH SỬA THÔNG TIN MÁY POS */}
      {/* ========================================================= */}
      {activeModal === 'CREATE_EDIT' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {posForm.id ? `Chỉnh Sửa Thông Tin Máy POS: ${posForm.serial_number}` : 'Thêm Mới Thiết Bị POS Vào Hệ Thống'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cập nhật thông tin phần cứng, xí nghiệp quản lý và SIM kết nối
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePos} className="space-y-4 text-xs font-serif">
              {/* SECTION 1: HARDWARE IDENTITY */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Định Danh Phần Cứng Máy POS</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Số Serial <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: VB54238F20735"
                      value={posForm.serial_number}
                      onChange={(e) => setPosForm({ ...posForm, serial_number: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Số IMEI <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 865817064366397"
                      value={posForm.imei}
                      onChange={(e) => setPosForm({ ...posForm, imei: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ENTERPRISE & REGION */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Đơn Vị Quản Lý & Tuyến Thu Phí</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Xí Nghiệp Quản Lý</label>
                    <select
                      value={posForm.enterprise}
                      onChange={(e) => setPosForm({ ...posForm, enterprise: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="BSH">Xí nghiệp Môi trường Bắc Sông Hương (BSH)</option>
                      <option value="NSH">Xí nghiệp Môi trường Nam Sông Hương (NSH)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa Bàn Thu Phí Phân Công</label>
                    <input
                      type="text"
                      placeholder="VD: Phước Vĩnh, Thủy Xuân, Thủy Biều..."
                      value={posForm.region}
                      onChange={(e) => setPosForm({ ...posForm, region: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SIM & 4G TELECOM */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 text-purple-600" />
                  <span>3. Kết Nối Viễn Thông & SIM 4G</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Số Điện Thoại SIM</label>
                    <input
                      type="text"
                      placeholder="VD: 0919257169"
                      value={posForm.sim_number}
                      onChange={(e) => setPosForm({ ...posForm, sim_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">SIM IMEI / Số Seri</label>
                    <input
                      type="text"
                      placeholder="VD: 898402..."
                      value={posForm.sim_imei}
                      onChange={(e) => setPosForm({ ...posForm, sim_imei: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Gói Cước Viễn Thông</label>
                    <input
                      type="text"
                      placeholder="VD: Viettel 4G, ezCom90"
                      value={posForm.telecom_plan}
                      onChange={(e) => setPosForm({ ...posForm, telecom_plan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: STATUS & TECHNICAL NOTES */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. Trạng Thái Hoạt Động & Ghi Chú</span>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Trạng Thái Thiết Bị</label>
                  <select
                    value={posForm.status}
                    onChange={(e) => setPosForm({ ...posForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="in_stock">Trong Kho Sẵn Sàng (in_stock)</option>
                    <option value="in_use">Đang Sử Dụng Thu Phí (in_use)</option>
                    <option value="borrowed">Cho Mượn Dự Phòng (borrowed)</option>
                    <option value="broken">Báo Hỏng Cần Sửa (broken)</option>
                    <option value="retired">Đã Thanh Lý (retired)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Ghi Chú Kỹ Thuật & Phụ Kiện</label>
                  <textarea
                    rows={2}
                    value={posForm.notes}
                    onChange={(e) => setPosForm({ ...posForm, notes: e.target.value })}
                    placeholder="Ghi chú về pin, cáp sạc, adapter, tình trạng máy..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{posForm.id ? 'Lưu Thay Đổi' : 'Tạo Máy POS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: LỊCH SỬ CẤP PHÁT & MƯỢN TRẢ MÁY POS */}
      {/* ========================================================= */}
      {activeModal === 'HISTORY' && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Lịch Sử Vòng Đời Máy POS: {selectedDevice.serial_number} ({selectedDevice.asset_code || `ID-${selectedDevice.id}`})
                </h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {historyLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                  Đang tải lịch sử từ API...
                </div>
              ) : (
                <>
                  {/* Assignments Section */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Lịch Sử Cấp Phát Cho Nhân Viên ({historyData?.assignments?.length || 0})</span>
                    </h4>
                    {!historyData?.assignments || historyData.assignments.length === 0 ? (
                      <p className="text-slate-400 italic py-2">Chưa có lịch sử cấp phát nào được ghi nhận.</p>
                    ) : (
                      <div className="space-y-2">
                        {historyData.assignments.map((a) => (
                          <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{a.employee_name || a.employee?.full_name || 'Nhân viên'}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {a.assigned_date ? new Date(a.assigned_date).toLocaleDateString('vi-VN') : '-'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Địa bàn: <span className="font-semibold text-slate-700">{a.region || 'Không có'}</span> · Người cấp: {a.assigned_by || 'Admin'}
                            </div>
                            {a.returned_date ? (
                              <div className="text-[10px] text-emerald-700 font-semibold">
                                ✓ Đã hoàn trả kho ngày {new Date(a.returned_date).toLocaleDateString('vi-VN')}
                              </div>
                            ) : (
                              <div className="text-[10px] text-amber-700 font-bold">
                                ⚑ Đang trực tiếp giữ máy thu phí
                              </div>
                            )}
                            {a.note && <div className="text-[10px] text-slate-400 italic">Ghi chú: {a.note}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Borrowings Section */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                      <HandCoins className="w-4 h-4 text-amber-600" />
                      <span>Lịch Sử Cho Mượn Dự Phòng ({historyData?.borrowings?.length || 0})</span>
                    </h4>
                    {!historyData?.borrowings || historyData.borrowings.length === 0 ? (
                      <p className="text-slate-400 italic py-2">Chưa có lượt mượn dự phòng nào.</p>
                    ) : (
                      <div className="space-y-2">
                        {historyData.borrowings.map((b) => (
                          <div key={b.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                            <div className="flex items-center justify-between font-bold text-amber-900">
                              <span>Người mượn: {b.borrower_name}</span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {b.borrowed_date ? new Date(b.borrowed_date).toLocaleDateString('vi-VN') : '-'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">Mục đích: {b.purpose}</div>
                            {b.returned_date ? (
                              <div className="text-[10px] text-emerald-700 font-semibold">
                                ✓ Đã trả lại kho ngày {new Date(b.returned_date).toLocaleDateString('vi-VN')}
                              </div>
                            ) : (
                              <div className="text-[10px] text-amber-800 font-bold">
                                ⚑ Đang mượn (Dự kiến trả: {b.expected_return_date ? new Date(b.expected_return_date).toLocaleDateString('vi-VN') : 'Chưa định'})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: QUẢN LÝ TỒN KHO & XUẤT GIẤY IN POS */}
      {/* ========================================================= */}
      {activeModal === 'PAPER' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-800">Quản Lý Kho Giấy In Nhiệt POS & Xuất Cấp</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 shrink-0">
              <button
                onClick={() => setPaperTab('STOCK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  paperTab === 'STOCK' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Kho Giấy In & Tồn Kho ({papers.length})
              </button>
              <button
                onClick={() => setPaperTab('ISSUES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  paperTab === 'ISSUES' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Lịch Sử Xuất Cấp Cho Nhân Viên ({paperIssues.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {paperTab === 'STOCK' ? (
                <div className="space-y-4">
                  {/* Issue Paper Quick Form */}
                  <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-3">
                    <h4 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Xuất Cấp Giấy In Nhiệt Cho Nhân Viên Thu Phí</span>
                    </h4>
                    <form onSubmit={handleIssuePaper} className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Loại Giấy In</label>
                        <select
                          value={issuePaperForm.paper_id}
                          onChange={(e) => setIssuePaperForm({ ...issuePaperForm, paper_id: Number(e.target.value) })}
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value={0}>-- Chọn loại giấy --</option>
                          {papers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.paper_name} (Tồn: {p.in_stock_quantity} cuộn)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nhân Viên Nhận</label>
                        <select
                          value={issuePaperForm.employee_id}
                          onChange={(e) => setIssuePaperForm({ ...issuePaperForm, employee_id: Number(e.target.value) })}
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value={0}>-- Chọn nhân viên --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.employee_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Số Cuộn Cấp</label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={issuePaperForm.quantity}
                          onChange={(e) => setIssuePaperForm({ ...issuePaperForm, quantity: Number(e.target.value) })}
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm transition cursor-pointer"
                        >
                          Xuất Cấp Giấy
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Stock table */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Tên Loại Giấy</th>
                        <th className="py-2.5 px-3">Mã</th>
                        <th className="py-2.5 px-3 text-right">Tổng Nhập</th>
                        <th className="py-2.5 px-3 text-right">Đã Cấp</th>
                        <th className="py-2.5 px-3 text-right text-teal-700 font-bold">Còn Tồn Kho</th>
                        <th className="py-2.5 px-3">Nhà Cung Cấp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {papers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Chưa có dữ liệu kho giấy in trên API.
                          </td>
                        </tr>
                      ) : (
                        papers.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-800">{p.paper_name}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{p.code || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{p.total_quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">{p.issued_quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700 text-sm">
                              {p.in_stock_quantity}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{p.supplier_name || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Issues table */
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Ngày Cấp</th>
                      <th className="py-2.5 px-3">Nhân Viên Nhận</th>
                      <th className="py-2.5 px-3">Loại Giấy</th>
                      <th className="py-2.5 px-3 text-right font-bold text-teal-700">Số Lượng</th>
                      <th className="py-2.5 px-3">Người Xuất Cấp</th>
                      <th className="py-2.5 px-3">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paperIssues.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Chưa có lịch sử xuất cấp giấy in nào.
                        </td>
                      </tr>
                    ) : (
                      paperIssues.map((iss) => (
                        <tr key={iss.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {iss.issue_date ? new Date(iss.issue_date).toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {iss.employee?.full_name || `ID ${iss.employee_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{iss.paper?.paper_name || 'Giấy in nhiệt'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700 text-xs">
                            {iss.quantity} cuộn
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{iss.issued_by || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-400 italic">{iss.note || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: CẤU HÌNH THÔNG TIN KẾT NỐI API */}
      {/* ========================================================= */}
      {activeModal === 'CONFIG' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Cấu Hình Kết Nối HEPCO API</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span>Trạng thái kết nối máy chủ:</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    apiHealthStatus?.connected ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      apiHealthStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  ></span>
                  {apiHealthStatus?.connected ? 'Online 200 OK' : 'Mất Kết Nối'}
                </span>
              </div>
              {apiHealthStatus?.latency && (
                <div className="text-[11px] text-slate-400">Độ trễ API: {apiHealthStatus.latency} ms</div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveHepcoApiConfig(apiConfigForm);
                showNotify('Đã lưu cấu hình API HEPCO thành công!');
                setActiveModal('NONE');
                fetchPosData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">API Base URL</label>
                <input
                  type="text"
                  value={apiConfigForm.baseUrl}
                  onChange={(e) => setApiConfigForm({ ...apiConfigForm, baseUrl: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tài Khoản Đăng Nhập (Username)</label>
                <input
                  type="text"
                  value={apiConfigForm.username}
                  onChange={(e) => setApiConfigForm({ ...apiConfigForm, username: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mật Khẩu (Password)</label>
                <input
                  type="password"
                  value={apiConfigForm.password}
                  onChange={(e) => setApiConfigForm({ ...apiConfigForm, password: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu & Kết Nối Lại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Success Modal with Open File & Open Folder options */}
      <ExportSuccessModal
        isOpen={exportModal.isOpen}
        onClose={() => setExportModal((prev) => ({ ...prev, isOpen: false }))}
        fileName={exportModal.fileName}
        filePath={exportModal.filePath}
        fileSize={exportModal.fileSize}
        isBrowserDownload={exportModal.isBrowserDownload}
      />
    </div>
  );
};
