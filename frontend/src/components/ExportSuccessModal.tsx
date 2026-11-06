import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FolderOpen,
  ExternalLink,
  CheckCircle2,
  X,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  isBrowserDownload?: boolean;
}

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
  isOpen,
  onClose,
  fileName,
  filePath,
  fileSize,
  isBrowserDownload
}) => {
  const [copied, setCopied] = useState(false);
  const [openingFile, setOpeningFile] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyPath = () => {
    if (filePath) {
      navigator.clipboard.writeText(filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenFile = async () => {
    if (!filePath || !window.hiccDesktop?.openPath) return;
    setOpeningFile(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await window.hiccDesktop.openPath(filePath);
      if (res.success) {
        setActionMessage('Đã mở file Excel trên máy tính của bạn.');
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        setActionError(res.error || 'Không thể mở file. Hãy kiểm tra ứng dụng đọc Excel.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Lỗi mở file');
    } finally {
      setOpeningFile(false);
    }
  };

  const handleOpenFolder = async () => {
    if (!filePath || !window.hiccDesktop?.showItemInFolder) return;
    setOpeningFolder(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await window.hiccDesktop.showItemInFolder(filePath);
      if (res.success) {
        setActionMessage('Đã mở thư mục chứa file trong File Explorer.');
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        setActionError(res.error || 'Không thể mở thư mục');
      }
    } catch (err: any) {
      setActionError(err.message || 'Lỗi mở thư mục');
    } finally {
      setOpeningFolder(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isDesktop = typeof window !== 'undefined' && !!window.hiccDesktop && !isBrowserDownload;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-['Times_New_Roman']">
        {/* Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-wide">Xuất File Excel Thành Công!</h3>
              <p className="text-xs text-emerald-100/90 font-sans">
                Định dạng chuẩn doanh nghiệp HEPCO (XLSX)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* File Card Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                    {fileName}
                  </span>
                  {fileSize && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {formatFileSize(fileSize)}
                    </span>
                  )}
                </div>
                {filePath && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all mt-1 select-all">
                    {filePath}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Copy Path Button */}
            {filePath && (
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Đường dẫn lưu trên ổ đĩa:</span>
                <button
                  onClick={handleCopyPath}
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-sans font-medium cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép đường dẫn</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Toast / Status Notification */}
          {actionMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{actionMessage}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Action Buttons for Desktop / Web */}
          {isDesktop ? (
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleOpenFile}
                  disabled={openingFile}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{openingFile ? 'Đang mở...' : 'Mở File Ngay'}</span>
                </button>

                <button
                  onClick={handleOpenFolder}
                  disabled={openingFolder}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <span>{openingFolder ? 'Đang mở...' : 'Mở Thư Mục'}</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Đóng thông báo
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tập tin Excel đã được tải xuống tự động vào thư mục Downloads của trình duyệt.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition cursor-pointer"
              >
                Đã hiểu / Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
