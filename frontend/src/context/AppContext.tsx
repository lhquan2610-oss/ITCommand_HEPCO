import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';
export type Theme = 'light' | 'dark';

export interface SystemClientInfo {
  hostname: string;
  ip: string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Nav items
    nav_dashboard: 'Bảng Điều Khiển',
    nav_traffic: 'Giám Sát Lưu Lượng',
    nav_computers: 'Máy Tính & Máy Chủ',
    nav_printers: 'Máy In & Photocopy',
    nav_cameras: 'Camera IP & NVR',
    nav_pos: 'Máy POS Thu Phí',
    nav_dispatches: 'Quản Lý Công Văn',
    nav_switches: 'Switch & Mạng Lõi',
    nav_lookup: 'Tra Cứu IP & MAC',
    nav_network_map: 'Sơ Đồ Mạng (Map)',
    nav_tracking: 'Giám Sát Xe Rác (GPS)',
    nav_settings: 'Cài Đặt Hệ Thống',
    nav_section_mgmt: 'PHÂN HỆ QUẢN TRỊ',

    // Status bar & Footer
    status_stable: 'Hạ Tầng LAN Hoạt Động Ổn Định',
    status_ready: 'SẴN SÀNG',
    status_offline_capable: 'Hoạt động 100% Offline',
    status_refresh: 'Làm Mới',
    status_user_dept: 'Bộ phận CNTT',
    client_label: 'Máy đang truy cập',

    // Themes
    theme_light: 'Sáng',
    theme_dark: 'Tối',
    theme_switch_to_dark: 'Chuyển sang chế độ Tối',
    theme_switch_to_light: 'Chuyển sang chế độ Sáng',

    // Languages
    lang_vietnamese: 'Tiếng Việt',
    lang_english: 'English',
    lang_toggle_tip: 'Chuyển đổi ngôn ngữ (VI / EN)',
  },
  en: {
    // Nav items
    nav_dashboard: 'Dashboard',
    nav_traffic: 'Traffic & Anomaly',
    nav_computers: 'Computers & Servers',
    nav_printers: 'Printers & Copiers',
    nav_cameras: 'IP Cameras & NVR',
    nav_pos: 'Fee POS Devices',
    nav_dispatches: 'Base Office Dispatches',
    nav_switches: 'Switches & Core Net',
    nav_lookup: 'IP / MAC Lookup',
    nav_network_map: 'Network Topology',
    nav_tracking: 'Garbage Fleet GPS',
    nav_settings: 'System Settings',
    nav_section_mgmt: 'ADMINISTRATION MODULES',

    // Status bar & Footer
    status_stable: 'LAN Infrastructure Healthy',
    status_ready: 'READY',
    status_offline_capable: '100% Offline Capable',
    status_refresh: 'Refresh',
    status_user_dept: 'IT Department',
    client_label: 'Current Client',

    // Themes
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_switch_to_dark: 'Switch to Dark Mode',
    theme_switch_to_light: 'Switch to Light Mode',

    // Languages
    lang_vietnamese: 'Tiếng Việt',
    lang_english: 'English',
    lang_toggle_tip: 'Switch language (VI / EN)',
  },
};

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  clientInfo: SystemClientInfo;
  t: (key: string, fallback?: string) => string;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('hicc_lang') as Language) || 'vi';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('hicc_theme') as Theme) || 'light';
  });

  const [clientInfo, setClientInfo] = useState<SystemClientInfo>({
    hostname: 'LHQUAN',
    ip: '10.1.1.45',
  });

  // Apply Theme to DOM root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('hicc_theme', theme);
  }, [theme]);

  // Persist language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hicc_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Detect Hostname & IP
  useEffect(() => {
    const detectClient = async () => {
      if (typeof window !== 'undefined' && window.hiccDesktop?.getSystemInfo) {
        try {
          const info = await window.hiccDesktop.getSystemInfo();
          if (info?.hostname) {
            setClientInfo({
              hostname: info.hostname,
              ip: info.primaryIp || '10.1.1.45',
            });
          }
        } catch {
          // fallback remains LHQUAN / 10.1.1.45
        }
      }
    };
    detectClient();
  }, []);

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        toggleTheme,
        clientInfo,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
