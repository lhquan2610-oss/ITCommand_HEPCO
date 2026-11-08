import React, { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, AlertTriangle, X, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { HEPCO_LOGO } from '../assets/logoBase64';

export const SecurityLockoutScreen: React.FC = () => {
  const { currentIp, hostname, verifyPin } = useSecurity();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pin.trim()) {
      setErrorMsg('Vui lòng nhập mật mã quản trị viên.');
      return;
    }

    const success = verifyPin(pin);
    if (!success) {
      setErrorMsg('Mật mã quản trị không chính xác. Vui lòng thử lại.');
      setPin('');
    }
  };

  const handleQuit = () => {
    if (window.hiccDesktop?.close) {
      window.hiccDesktop.close();
    } else {
      window.location.href = 'about:blank';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 font-['Times_New_Roman'] select-none">
      {/* Background ambient red glow */}
      <div className="absolute inset-0 bg-radial-gradient from-rose-950/30 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-rose-600/70 rounded-3xl shadow-2xl p-7 text-center space-y-5 backdrop-blur-md">
        {/* Brand & Security Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-900/50 animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-rose-500">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 p-0.5 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <img src={HEPCO_LOGO} alt="HEPCO" className="w-full h-full rounded-md object-contain sharp-logo" />
              </div>
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                HEPCO IT COMMAND CENTER
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-wide uppercase">
              Truy Cập Bị Giới Hạn Theo IP
            </h1>
          </div>
        </div>

        {/* Warning Callout Box */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-left space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>THIẾT BỊ KHÔNG NẰM TRONG DANH SÁCH CHO PHÉP (WHITELIST)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Hệ thống đã bật chế độ bảo mật nghiêm ngặt. Chỉ các địa chỉ IP được Quản trị viên CNTT HEPCO phê duyệt mới được phép sử dụng phần mềm.
          </p>

          <div className="pt-2 border-t border-rose-900/50 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block font-sans">Tên máy tính:</span>
              <span className="font-bold text-slate-200">{hostname}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">IP máy tính này:</span>
              <span className="font-bold text-rose-300 bg-rose-900/50 px-1.5 py-0.5 rounded border border-rose-800/60 inline-block">
                {currentIp}
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Bypass Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-3 font-sans">
          <div className="text-left">
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Mở Khóa Khẩn Cấp (Admin Master PIN)
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Chỉ dành cho Quản trị viên</span>
            </label>

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Nhập mã PIN quản trị (mặc định: hepco@2026)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-bold bg-rose-950/60 py-1.5 px-3 rounded-lg border border-rose-800/60 text-center animate-shake">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleQuit}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
            >
              Thoát Phần Mềm
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/40 transition cursor-pointer"
            >
              <span>Xác Thực Mở Khóa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-500 font-sans">
          Liên hệ Quản trị viên CNTT HEPCO (Lê Hồng Quân) để bổ sung IP của bạn vào danh sách được cấp phép.
        </p>
      </div>
    </div>
  );
};
