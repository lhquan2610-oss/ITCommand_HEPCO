import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  Download,
  Plus,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  FileCheck,
  Send,
  Inbox,
  Building2,
  Calendar,
  Eye,
  Copy,
  Key,
  ShieldCheck,
  X,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import {
  HepcoApiService,
  DispatchItem,
  BaseRequestItem,
  BaseTaskItem,
  BaseOfficeHealth,
  getBaseToken,
  saveBaseToken,
  DEFAULT_BASE_TOKEN
} from '../../services/hepcoApi';
import { exportDispatchesToExcel } from '../../utils/excelExportEngine';

export const DispatchesPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing' | 'internal' | 'requests' | 'tasks'>('all');
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [requests, setRequests] = useState<BaseRequestItem[]>([]);
  const [tasks, setTasks] = useState<BaseTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<BaseOfficeHealth | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(getBaseToken());
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State for Create Dispatch
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'incoming',
    sender: '',
    receiver: 'Ban Lãnh Đạo - HEPCO',
    urgency: 'normal',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Export State & Modal
  const [isExporting, setIsExporting] = useState(false);
  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    fileName: string;
    filePath?: string;
    fileSize?: number;
    isBrowserDownload?: boolean;
  }>({ isOpen: false, fileName: '' });

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Health
      try {
        const h = await HepcoApiService.getBaseOfficeHealth();
        if (h?.data) setHealthStatus(h.data);
      } catch (e) {
        console.warn('Health check warning:', e);
      }

      // Dispatches
      const dispRes = await HepcoApiService.getDispatches({ limit: 100 });
      if (dispRes?.data) {
        setDispatches(dispRes.data);
      }

      // Requests
      try {
        const reqRes = await HepcoApiService.getBaseRequests({ limit: 50 });
        if (reqRes?.data) setRequests(reqRes.data);
      } catch {}

      // Tasks
      try {
        const taskRes = await HepcoApiService.getBaseTasks({ limit: 50 });
        if (taskRes?.data) setTasks(taskRes.data);
      } catch {}
    } catch (err: any) {
      console.error('Fetch base office error:', err);
      showNotify('Lỗi tải dữ liệu công văn: ' + (err.message || 'Không thể kết nối'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches.filter((d) => {
      // Tab filter
      if (activeTab === 'incoming' && d.type !== 'incoming') return false;
      if (activeTab === 'outgoing' && d.type !== 'outgoing') return false;
      if (activeTab === 'internal' && d.type !== 'internal') return false;

      // Urgency filter
      if (urgencyFilter !== 'ALL' && d.urgency !== urgencyFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'published' && d.status !== '1' && d.status !== 'completed') return false;
        if (statusFilter === 'pending' && d.status !== '0' && d.status !== 'pending') return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const code = (d.code || '').toLowerCase();
        const title = (d.title || '').toLowerCase();
        const sender = (d.sender || '').toLowerCase();
        const receiver = (d.receiver || '').toLowerCase();
        return code.includes(q) || title.includes(q) || sender.includes(q) || receiver.includes(q);
      }

      return true;
    });
  }, [dispatches, activeTab, urgencyFilter, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = dispatches.length;
    const incomingCount = dispatches.filter((d) => d.type === 'incoming').length;
    const outgoingCount = dispatches.filter((d) => d.type === 'outgoing').length;
    const internalCount = dispatches.filter((d) => d.type === 'internal').length;
    const withFileCount = dispatches.filter((d) => Boolean(d.file_url || d.file_name)).length;
    return { total, incomingCount, outgoingCount, internalCount, withFileCount };
  }, [dispatches]);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    showNotify(`Đã sao chép số hiệu: ${code}`);
  };

  // Open external file URL
  const handleOpenFile = (url?: string) => {
    if (!url) {
      alert('Văn bản này không có file đính kèm.');
      return;
    }
    if (window.hiccDesktop?.launchWeb) {
      window.hiccDesktop.launchWeb(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Submit Create Dispatch
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      alert('Vui lòng nhập trích yếu tiêu đề công văn.');
      return;
    }

    try {
      setIsSubmitting(true);
      await HepcoApiService.createDispatch({
        title: createForm.title.trim(),
        type: createForm.type,
        sender: createForm.sender.trim() || 'Bộ phận CNTT HEPCO',
        receiver: createForm.receiver.trim() || 'Ban Lãnh Đạo - HEPCO',
        content: createForm.content.trim(),
        urgency: createForm.urgency
      });

      showNotify('Tạo mới và gửi công văn lên Base Office thành công!');
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        type: 'incoming',
        sender: '',
        receiver: 'Ban Lãnh Đạo - HEPCO',
        urgency: 'normal',
        content: ''
      });
      fetchData();
    } catch (err: any) {
      alert('Lỗi tạo công văn: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save and Test Base Token
  const handleSaveBaseToken = async () => {
    try {
      setIsTestingToken(true);
      saveBaseToken(tokenInput.trim());
      const h = await HepcoApiService.getBaseOfficeHealth();
      if (h?.data?.connected) {
        setHealthStatus(h.data);
        showNotify('Đã lưu Token v2 và kiểm tra kết nối Base.vn thành công 100%!');
        setIsTokenModalOpen(false);
        fetchData();
      } else {
        alert('Lưu token thành công nhưng Base.vn chưa xác nhận kết nối. Vui lòng kiểm tra lại quyền của Token.');
      }
    } catch (err: any) {
      alert('Lỗi kiểm tra token: ' + (err.message || 'Không thể kết nối'));
    } finally {
      setIsTestingToken(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const targetDispatches = filteredDispatches.length > 0 ? filteredDispatches : dispatches;
      const res = await exportDispatchesToExcel(
        targetDispatches,
        activeTab === 'all' || activeTab === 'requests' || activeTab === 'tasks' ? undefined : activeTab
      );

      if (res.success) {
        setExportModal({
          isOpen: true,
          fileName: res.fileName || 'SO_THEO_DOI_CONG_VAN_HEPCO.xlsx',
          filePath: res.filePath,
          fileSize: res.fileSize,
          isBrowserDownload: res.isBrowserDownload
        });
      } else if (res.error && res.error !== 'Hủy lưu file') {
        showNotify('Lỗi xuất file: ' + res.error, 'error');
      }
    } catch (err: any) {
      console.error('Export error:', err);
      showNotify('Lỗi xuất file: ' + (err.message || ''), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto select-none font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-rose-600 text-white shadow-rose-600/30'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. TOP HEADER & LIVE BASE.VN API STATUS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-lg md:text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                Quản Lý Công Văn & Văn Bản Điều Hành
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 flex items-center gap-1.5 shrink-0 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Base Office Live
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Tra cứu công văn đến, công văn đi, văn bản nội bộ và tờ trình đồng bộ từ hệ thống Base Office</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Làm mới dữ liệu từ máy chủ Base.vn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Làm Mới</span>
          </button>

          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
            title="Cấu hình Access Token v2 của Base.vn"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Cấu Hình Token</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Xuất Sổ theo dõi công văn ra file Excel chuẩn"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Sổ Excel'}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tạo Công Văn Mới</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Documents */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Văn Bản</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {stats.total}
            </div>
          </div>
        </div>

        {/* Incoming Dispatches */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Công Văn Đến</div>
            <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
              {stats.incomingCount}
            </div>
          </div>
        </div>

        {/* Outgoing Dispatches */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Công Văn Đi</div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {stats.outgoingCount}
            </div>
          </div>
        </div>

        {/* Attached Files */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <Paperclip className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Có Đính Kèm File PDF</div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono">
              {stats.withFileCount}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION & SEARCH / FILTER TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Tất Cả Công Văn</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'incoming'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Công Văn Đến</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {stats.incomingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'outgoing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Công Văn Đi</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {stats.outgoingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('internal')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'internal'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Văn Bản Nội Bộ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {stats.internalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Tờ Trình (Request)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {requests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Nhiệm Vụ (Wework)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {tasks.length}
            </span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số hiệu, trích yếu, người gửi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800"
            />
          </div>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Độ Khẩn: Tất Cả</option>
            <option value="normal">Bình thường</option>
            <option value="high">Khẩn</option>
            <option value="urgent">Hỏa tốc</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Trạng Thái: Tất Cả</option>
            <option value="published">Đã ban hành</option>
            <option value="pending">Chờ duyệt / tiếp nhận</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN DATA VIEW: DISPATCHES TABLE OR REQUESTS / TASKS */}
      {activeTab === 'requests' ? (
        /* Base Request (Tờ trình) Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-['Times_New_Roman']">
              <thead>
                <tr className="bg-[#13522C] text-white border-b border-[#0F4022] font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-[#0F4022]">STT</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[130px]">Mã Tờ Trình</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[280px]">Tiêu Đề / Nội Dung Đề Xuất</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[150px]">Danh Mục</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[130px]">Người Trình</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[130px]">Ngày Gửi</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[120px]">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right min-w-[120px]">Kinh Phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Chưa có tờ trình nào được đồng bộ từ Base Request.
                    </td>
                  </tr>
                ) : (
                  requests.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-800 dark:text-amber-400 border-r border-slate-100 dark:border-slate-800">
                        {r.code || `REQ-${r.id}`}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800">
                        {r.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {r.category || 'Đề xuất chung'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {r.creator || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === '1' ? 'bg-emerald-100 text-emerald-800' : r.status === '2' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status === '1' ? 'Đã duyệt' : r.status === '2' ? 'Từ chối' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {r.amount || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'tasks' ? (
        /* Base Wework (Nhiệm vụ / Công việc) Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-['Times_New_Roman']">
              <thead>
                <tr className="bg-[#13522C] text-white border-b border-[#0F4022] font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-[#0F4022]">STT</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[280px]">Nhiệm Vụ / Công Việc</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[160px]">Dự Án / Phòng Ban</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[150px]">Người Phụ Trách</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[130px]">Thời Hạn</th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Tiến Độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Chưa có nhiệm vụ nào được đồng bộ từ Base Wework.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800">
                        {t.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {t.project || 'Base Wework'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {t.assignee || 'Chưa phân công'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800">
                        {t.due_date || 'Không có hạn'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {t.status || 'Đang thực hiện'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Base Office Dispatches (Sổ Theo Dõi Công Văn) Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-['Times_New_Roman']">
              <thead>
                {/* Section Banner matching Enterprise Sample */}
                <tr className="bg-[#EAEFF5] dark:bg-slate-800 border-y-2 border-slate-300 dark:border-slate-700">
                  <th colSpan={10} className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold flex items-center gap-2">
                        <span>HỆ THỐNG QUẢN LÝ CÔNG VĂN ĐẾN & ĐI (BASE OFFICE - LIVE SYNC)</span>
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold font-sans">
                        Hiển thị {filteredDispatches.length} / {dispatches.length} văn bản
                      </span>
                    </div>
                  </th>
                </tr>

                {/* Signature Forest Green Header Row */}
                <tr className="bg-[#13522C] text-white border-b border-[#0F4022] font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-[#0F4022]">STT</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[170px]">Số / Ký Hiệu Văn Bản</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[110px]">Ngày Ban Hành</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[340px]">Tên Loại & Trích Yếu Nội Dung</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[180px]">Đơn Vị Ban Hành / Người Gửi</th>
                  <th className="py-2.5 px-3 border-r border-[#0F4022] min-w-[180px]">Nơi Nhận</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[100px]">Phân Loại</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[95px]">Độ Khẩn</th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0F4022] min-w-[130px]">Tệp Đính Kèm</th>
                  <th className="py-2.5 px-3 text-right min-w-[110px]">Thao Tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading && dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Đang đồng bộ dữ liệu công văn từ máy chủ Base.vn...
                    </td>
                  </tr>
                ) : filteredDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Không tìm thấy công văn nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredDispatches.map((d, idx) => {
                    const isIncoming = d.type === 'incoming';
                    const isOutgoing = d.type === 'outgoing';

                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-200 dark:border-slate-800/80"
                      >
                        {/* STT */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-xs border-r border-slate-100 dark:border-slate-800">
                          {idx + 1}
                        </td>

                        {/* Document Code */}
                        <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                              {d.code || `ID-${d.id}`}
                            </span>
                            <button
                              onClick={() => handleCopyCode(d.code || d.id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                              title="Sao chép số hiệu văn bản"
                            >
                              {copiedCode === (d.code || d.id) ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300 text-xs border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '-'}
                        </td>

                        {/* Title / Description */}
                        <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800">
                          <div
                            onClick={() => setSelectedDispatch(d)}
                            className="font-bold text-slate-900 dark:text-slate-100 text-xs hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-2"
                            title={d.title}
                          >
                            {d.title}
                          </div>
                          {d.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{d.description}</p>
                          )}
                        </td>

                        {/* Sender */}
                        <td className="py-2.5 px-3 text-xs text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={d.sender}>
                              {d.sender || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Receiver */}
                        <td className="py-2.5 px-3 text-xs text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                          <span className="truncate max-w-[200px] block" title={d.receiver}>
                            {d.receiver || '-'}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-sans whitespace-nowrap ${
                              isIncoming
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200'
                                : isOutgoing
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200'
                            }`}
                          >
                            {isIncoming ? 'Công văn đến' : isOutgoing ? 'Công văn đi' : 'Nội bộ'}
                          </span>
                        </td>

                        {/* Urgency */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.urgency === 'urgent'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : d.urgency === 'high'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {d.urgency === 'urgent' ? 'Hỏa tốc' : d.urgency === 'high' ? 'Khẩn' : 'Bình thường'}
                          </span>
                        </td>

                        {/* Attached File */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          {d.file_url ? (
                            <button
                              onClick={() => handleOpenFile(d.file_url)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[10px] transition cursor-pointer max-w-[140px] truncate"
                              title={`Bấm để mở file gốc: ${d.file_name || 'Tệp đính kèm'}`}
                            >
                              <Paperclip className="w-3 h-3 text-rose-600 shrink-0" />
                              <span className="truncate">{d.file_name || 'Xem File PDF'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">— Không có —</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 font-sans">
                            <button
                              onClick={() => setSelectedDispatch(d)}
                              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                              title="Xem chi tiết nội dung công văn"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Xem</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: XEM CHI TIẾT CÔNG VĂN */}
      {/* ======================================================= */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-['Times_New_Roman']">
                  CHI TIẾT VĂN BẢN / CÔNG VĂN (BASE OFFICE)
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispatch(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs font-['Times_New_Roman'] max-h-[80vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-indigo-700 dark:text-indigo-400">
                    {selectedDispatch.code || `ID-${selectedDispatch.id}`}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                      selectedDispatch.type === 'incoming'
                        ? 'bg-indigo-100 text-indigo-800'
                        : selectedDispatch.type === 'outgoing'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {selectedDispatch.type === 'incoming'
                      ? 'Công văn đến'
                      : selectedDispatch.type === 'outgoing'
                      ? 'Công văn đi'
                      : 'Nội bộ'}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedDispatch.title}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-sans">Đơn vị ban hành (Người gửi)</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedDispatch.sender || '-'}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nơi nhận / Đơn vị tiếp nhận</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedDispatch.receiver || '-'}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-sans">Ngày ban hành / Đến</div>
                  <div className="font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
                    {selectedDispatch.created_at ? new Date(selectedDispatch.created_at).toLocaleString('vi-VN') : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-sans">Mức độ khẩn</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 capitalize font-sans">
                    {selectedDispatch.urgency === 'urgent' ? '🔴 Hỏa tốc' : selectedDispatch.urgency === 'high' ? '🟠 Khẩn' : '🟢 Bình thường'}
                  </div>
                </div>
              </div>

              {/* Attachment Card */}
              {selectedDispatch.file_url && (
                <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {selectedDispatch.file_name || 'Tệp đính kèm văn bản gốc'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        Máy chủ tệp Base.vn: filesvc.base.vn
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenFile(selectedDispatch.file_url)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0 font-sans"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Tệp PDF Trực Tiếp</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDispatch(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: TẠO CÔNG VĂN MỚI LÊN BASE OFFICE */}
      {/* ======================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Tạo Mới & Đăng Ký Công Văn Lên Base Office
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trích Yếu / Tiêu Đề Văn Bản <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Báo cáo kết quả kiểm tra hạ tầng CNTT quý 4/2026..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Loại Văn Bản
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none bg-white dark:bg-slate-800 cursor-pointer"
                  >
                    <option value="incoming">Công văn đến</option>
                    <option value="outgoing">Công văn đi</option>
                    <option value="internal">Văn bản nội bộ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mức Độ Khẩn
                  </label>
                  <select
                    value={createForm.urgency}
                    onChange={(e) => setCreateForm({ ...createForm, urgency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none bg-white dark:bg-slate-800 cursor-pointer"
                  >
                    <option value="normal">Bình thường</option>
                    <option value="high">Khẩn</option>
                    <option value="urgent">Hỏa tốc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn Vị Ban Hành / Người Gửi
                  </label>
                  <input
                    type="text"
                    placeholder="Bộ phận CNTT HEPCO"
                    value={createForm.sender}
                    onChange={(e) => setCreateForm({ ...createForm, sender: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nơi Nhận / Người Nhận
                  </label>
                  <input
                    type="text"
                    placeholder="Ban Lãnh Đạo - HEPCO"
                    value={createForm.receiver}
                    onChange={(e) => setCreateForm({ ...createForm, receiver: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nội Dung Chi Tiết / Ghi Chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Nội dung tóm tắt văn bản hoặc ghi chú chuyển giao..."
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Đăng Ký Công Văn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 3: CẤU HÌNH TOKEN V2 BASE.VN */}
      {/* ======================================================= */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Cấu Hình Access Token v2 (Base.vn)
                </h3>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500">
                Nhập chuỗi <strong>Access Token v2</strong> được cấp từ tài khoản quản trị Base Account (Mục <em>Tích hợp với bên thứ ba ver 2</em>). Token này dùng để lấy dữ liệu công văn thực tế từ Base Office.
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Access Token v2
                </label>
                <textarea
                  rows={4}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Dán token Base.vn tại đây (bắt đầu bằng 9386~...)"
                  className="w-full px-3.5 py-2 font-mono text-[11px] rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Trạng Thái Kết Nối Hiện Tại:</span>
                </div>
                <div className="font-mono">
                  {healthStatus?.connected ? '✅ Kết nối sẵn sàng (100% Real Live Data)' : '⚠️ Chưa kết nối'}
                </div>
              </div>

              <div className="pt-2 flex justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTokenInput(DEFAULT_BASE_TOKEN)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Khôi Phục Mặc Định
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTokenModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBaseToken}
                    disabled={isTestingToken}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isTestingToken ? 'Đang kiểm tra...' : 'Lưu & Kết Nối'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 4: POPUP SAU KHI XUẤT EXCEL THÀNH CÔNG */}
      {/* ======================================================= */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Xuất Sổ Công Văn Thành Công!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đã tạo file Excel định dạng chuẩn doanh nghiệp Times New Roman & Forest Green.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tên file:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                  {exportModal.fileName}
                </span>
              </div>
              {exportModal.filePath && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Đường dẫn:</span>
                  <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 truncate max-w-[240px]" title={exportModal.filePath}>
                    {exportModal.filePath}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (exportModal.filePath && window.hiccDesktop?.openFile) {
                    window.hiccDesktop.openFile(exportModal.filePath);
                  } else {
                    alert('Đã tải xuống file vào thư mục Downloads của bạn.');
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Mở File Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (exportModal.filePath && window.hiccDesktop?.showInFolder) {
                    window.hiccDesktop.showInFolder(exportModal.filePath);
                  } else {
                    alert('File được lưu trong thư mục Downloads của bạn.');
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span>Mở Thư Mục</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setExportModal({ ...exportModal, isOpen: false })}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
