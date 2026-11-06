import React, { useState } from 'react';
import {
  Truck,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Compass,
  Sparkles,
  Info,
  Navigation,
  Layers,
  Video,
  Server
} from 'lucide-react';

interface TrackingProvider {
  id: 'vietmap' | 'dss' | 'cmsv6';
  name: string;
  vendor: string;
  url: string;
  server?: string;
  username: string;
  password: string;
  badge: string;
  description: string;
}

const PROVIDERS: Record<'vietmap' | 'dss' | 'cmsv6', TrackingProvider> = {
  vietmap: {
    id: 'vietmap',
    name: 'VietMap Tracking',
    vendor: 'VietMap GPS Solution',
    url: 'https://quanlyxe.vn/Account.aspx/LogOn',
    username: 'hepco',
    password: '123456',
    badge: 'VietMap quanlyxe.vn',
    description: 'Hệ thống định vị & quản lý hành trình xe chuyên dùng VietMap (quanlyxe.vn) - Tự động đăng nhập.'
  },
  dss: {
    id: 'dss',
    name: 'DSS Tracking V5',
    vendor: 'DSS Tracking Global',
    url: 'https://v5.tracking.vn/Account/LogIn',
    username: 'moitruonghue',
    password: 'dss@12345',
    badge: 'DSS v5.tracking.vn',
    description: 'Hệ thống định vị vệ tinh GPS V5 Tracking (v5.tracking.vn) - Giám sát vận tốc, vị trí dừng đỗ và lộ trình.'
  },
  cmsv6: {
    id: 'cmsv6',
    name: 'CMSV6 Camera Xe Trực Tuyến',
    vendor: 'CMSV6 / 808GPS Video Gateway',
    server: 'cam.tracking.vn (Cổng 8080 HTTPS)',
    url: 'https://cam.tracking.vn:8080/808gps/login.html',
    username: 'moitruonghue',
    password: 'dss@12345',
    badge: 'CMSV6 cam.tracking.vn:8080',
    description: 'Hệ thống camera giám sát video hành trình và GPS trực tuyến xe rác (CMSV6) - Máy chủ: cam.tracking.vn (Hỗ trợ cả Web & App Client chuyên dụng)'
  }
};

export const FleetTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vietmap' | 'dss' | 'cmsv6'>('vietmap');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const webviewRef = React.useRef<any>(null);

  const current = PROVIDERS[activeTab];

  // Auto-fill and auto-login directly inside embedded webview
  React.useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const runAutoFill = () => {
      try {
        let script = '';
        if (activeTab === 'cmsv6') {
          script = `
            (function() {
              try {
                const u = document.getElementById('loginAccount');
                const p = document.getElementById('loginPassword');
                const code = document.getElementById('phraseLogin');
                if (u && p) {
                  if (!u.value) u.value = '${current.username}';
                  if (!p.value) p.value = '${current.password}';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  if (code) {
                    code.focus();
                    if (!code.dataset.bound) {
                      code.dataset.bound = '1';
                      code.addEventListener('input', function() {
                        if (this.value && this.value.length === 4) {
                          const btn = document.getElementById('loginSubmit') || document.querySelector('.btn-login') || document.querySelector('button[type="submit"]');
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
                }
              } catch(e) {}
            })();
          `;
        } else if (activeTab === 'vietmap') {
          script = `
            (function() {
              try {
                const u = document.getElementById('UserName') || document.querySelector('input[name="UserName"]');
                const p = document.getElementById('Password') || document.querySelector('input[name="Password"]');
                const chk = document.getElementById('RememberMe');
                if (chk) chk.checked = true;
                if (u && p && !u.value) {
                  u.value = '${current.username}';
                  p.value = '${current.password}';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  const btn = document.querySelector('input[name="login"]') || 
                              document.querySelector('input[type="submit"]') ||
                              document.querySelector('button[type="submit"]');
                  if (btn && !window.__autoRan) {
                    window.__autoRan = true;
                    setTimeout(() => btn.click(), 400);
                  }
                }
              } catch(e) {}
            })();
          `;
        } else {
          script = `
            (function() {
              try {
                const u = document.getElementById('UserName') || document.querySelector('input[name="UserName"]');
                const p = document.getElementById('Password') || document.querySelector('input[name="Password"]');
                if (u && p && !u.value) {
                  u.value = '${current.username}';
                  p.value = '${current.password}';
                  u.dispatchEvent(new Event('input', { bubbles: true }));
                  p.dispatchEvent(new Event('input', { bubbles: true }));
                  const btn = document.querySelector('input[type="submit"]') || 
                              document.querySelector('button[type="submit"]') ||
                              document.getElementById('btnLogin');
                  if (btn && !window.__autoRan) {
                    window.__autoRan = true;
                    setTimeout(() => btn.click(), 400);
                  }
                }
              } catch(e) {}
            })();
          `;
        }
        wv.executeJavaScript(script).catch(() => {});
      } catch (err) {}
    };

    wv.addEventListener('dom-ready', runAutoFill);
    wv.addEventListener('did-finish-load', runAutoFill);

    return () => {
      try {
        wv.removeEventListener('dom-ready', runAutoFill);
        wv.removeEventListener('did-finish-load', runAutoFill);
      } catch (err) {}
    };
  }, [activeTab, iframeKey, current]);

  const handleCopy = (text: string, type: 'user' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleLaunchCmsv6App = async () => {
    if (window.hiccDesktop?.launchCmsv6App) {
      try {
        const res = await window.hiccDesktop.launchCmsv6App();
        if (res.success) {
          setStatusMessage('Đã khởi chạy phần mềm CMSV6 Client chuyên dụng trên Windows!');
          setTimeout(() => setStatusMessage(null), 4000);
        } else {
          alert(res.error || 'Chưa tìm thấy phần mềm CMSV6 trên máy tính.');
        }
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      window.open('https://cam.tracking.vn:8080/808gps/login.html', '_blank');
    }
  };

  const handleLaunchDedicatedWindow = async () => {
    setIsLaunching(true);
    setStatusMessage(`Đang mở cửa sổ giám sát ${current.name} và tự động đăng nhập...`);
    
    if (window.hiccDesktop?.openTrackingWindow) {
      try {
        await window.hiccDesktop.openTrackingWindow({
          target: current.id,
          url: current.url,
          username: current.username,
          password: current.password,
          autoLogin: true
        });
        setStatusMessage(`Đã khởi chạy cửa sổ giám sát ${current.name} thành công!`);
      } catch (err: any) {
        setStatusMessage(`Lỗi mở cửa sổ: ${err.message}`);
      }
    } else {
      window.open(current.url, '_blank');
      setStatusMessage('Đã mở liên kết trong tab trình duyệt mới.');
    }
    
    setTimeout(() => {
      setIsLaunching(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }, 1000);
  };

  const handleOpenExternal = () => {
    if (window.hiccDesktop?.launchWeb) {
      window.hiccDesktop.launchWeb(current.url);
    } else {
      window.open(current.url, '_blank');
    }
  };

  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full space-y-3 max-w-[1600px] mx-auto select-none">
      {/* 1. Header & System Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Branding & Multi-System Selector */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 whitespace-nowrap font-['Times_New_Roman'] tracking-tight">
                  Giám Sát Hành Trình Đội Xe (GPS)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Trực Tuyến 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xl">
                {current.description}
              </p>
            </div>
          </div>

          {/* Right: Actions - Fixed Alignment Never Broken */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap self-start sm:self-auto">
            {activeTab === 'cmsv6' && (
              <button
                onClick={handleLaunchCmsv6App}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Khởi chạy trực tiếp phần mềm CMSV6 chuyên dụng đã cài đặt trên máy tính"
              >
                <Video className="w-3.5 h-3.5 text-amber-300" />
                <span>Mở App CMSV6</span>
              </button>
            )}

            <button
              onClick={handleLaunchDedicatedWindow}
              disabled={isLaunching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
              title={`Mở cửa sổ ${current.name} độc lập, tự động đăng nhập`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isLaunching ? 'Đang mở...' : 'Mở Cửa Sổ Riêng'}</span>
            </button>

            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer whitespace-nowrap shrink-0"
              title="Mở bằng trình duyệt web bên ngoài"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Trình Duyệt Ngoài</span>
            </button>

            <button
              onClick={handleRefreshIframe}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
              title="Tải lại giao diện web"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation between VietMap, DSS Tracking and CMSV6 */}
        <div className="mt-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap">
          <button
            onClick={() => { setActiveTab('vietmap'); setIframeKey(k => k + 1); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              activeTab === 'vietmap'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>1. VietMap Tracking (quanlyxe.vn)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">hepco</span>
          </button>

          <button
            onClick={() => { setActiveTab('dss'); setIframeKey(k => k + 1); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              activeTab === 'dss'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. DSS Tracking (v5.tracking.vn)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">moitruonghue</span>
          </button>

          <button
            onClick={() => { setActiveTab('cmsv6'); setIframeKey(k => k + 1); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              activeTab === 'cmsv6'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>3. CMSV6 Camera Trực Tuyến (cam.tracking.vn)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">cam.tracking.vn</span>
          </button>
        </div>

        {/* Status Alert if triggered */}
        {statusMessage && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 animate-fadeIn">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {statusMessage}
          </div>
        )}

        {/* Credentials Pill Strip */}
        <div className="mt-2.5 pt-1 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              Cổng dịch vụ:
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
              {current.url}
            </span>

            {current.server && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                <Server className="w-3 h-3 text-amber-600" />
                <span>Máy chủ: {current.server}</span>
              </div>
            )}

            {/* Account pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 text-[11px]">Tài khoản:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">{current.username}</span>
              <button
                onClick={() => handleCopy(current.username, 'user')}
                className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Sao chép tài khoản"
              >
                {copiedUser ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* Password pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 text-[11px]">Mật khẩu:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {showPassword ? current.password : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleCopy(current.password, 'pass')}
                className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Sao chép mật khẩu"
              >
                {copiedPass ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* Auto Login active badge */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Tự Động Đăng Nhập Đang Bật
            </span>
          </div>

          <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
            <Info className="w-3 h-3 text-emerald-600 shrink-0" />
            Hệ thống tự động điền tài khoản, mật khẩu và đăng nhập ngay khi mở.
          </div>
        </div>
      </div>

      {/* 2. Embedded Web View Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col relative min-h-[550px]">
        {/* Top Control Bar of the Viewer */}
        <div className="h-9 px-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px]">
              Giao Diện Bản Đồ Trực Tuyến - {current.badge}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              Đang kết nối tới máy chủ GPS <strong className="text-emerald-700 dark:text-emerald-400">{current.vendor}</strong>
            </span>
            <button
              onClick={handleRefreshIframe}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-700 hover:bg-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
              title="Tải lại khung nhìn nếu gặp sự cố kết nối"
            >
              <RefreshCw className="w-3 h-3 text-emerald-600" />
              <span>Làm mới khung nhìn</span>
            </button>
          </div>
        </div>

        {/* Notice for CMSV6 Captcha */}
        {activeTab === 'cmsv6' && (
          <div className="bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-800 px-3.5 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Hệ thống CMSV6 yêu cầu Mã Xác Nhận:</strong> Tài khoản (<code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 rounded">moitruonghue</code>) và Mật khẩu (<code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 rounded">dss@12345</code>) đã được hệ thống tự động điền sẵn. Bạn chỉ cần <strong>nhìn 4 chữ số trên ảnh xác nhận và gõ vào ô Mã xác nhận</strong>, hệ thống sẽ tự động đăng nhập ngay!
              </span>
            </div>
          </div>
        )}

        {/* Live Frame / Webview Container */}
        <div className="flex-1 w-full h-full relative bg-slate-50 dark:bg-slate-950">
          {window.hiccDesktop ? (
            <webview
              ref={webviewRef}
              key={`${activeTab}-${iframeKey}`}
              src={current.url}
              partition="persist:tracking_fleet"
              className="w-full h-full border-0 absolute inset-0"
              allowpopups="true"
            />
          ) : (
            <iframe
              key={`${activeTab}-${iframeKey}`}
              src={current.url}
              className="w-full h-full border-0 absolute inset-0"
              title={`HEPCO Fleet Tracking - ${current.name}`}
              allow="geolocation; autoplay; fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetTrackingPage;
