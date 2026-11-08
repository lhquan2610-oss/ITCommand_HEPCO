import React, { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Printer, Network, Video, RefreshCw } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { SecurityLockoutScreen } from './components/SecurityLockoutScreen';
import { FeatureKey } from './types/electron';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { FooterBar } from './components/FooterBar';
import { DashboardPage } from './pages/Dashboard';
import { DeviceCategoryPage } from './pages/DeviceCategoryPage';
import { getDashboardSummary } from './services/api';
import { loadInventoryFast } from './utils/inventoryCache';

// Code-split heavy modules for faster initial startup & smaller main bundle
const ComputerInventoryPage = lazy(() =>
  import('./pages/ComputerInventoryPage').then((m) => ({ default: m.ComputerInventoryPage }))
);
const PosDevicesPage = lazy(() =>
  import('./pages/PosInventory').then((m) => ({ default: m.PosDevicesPage }))
);
const DispatchesPage = lazy(() =>
  import('./pages/Dispatches').then((m) => ({ default: m.DispatchesPage }))
);
const IpMacLookupPage = lazy(() =>
  import('./pages/IpMacLookup').then((m) => ({ default: m.IpMacLookupPage }))
);
const NetworkMapPage = lazy(() =>
  import('./pages/NetworkMap').then((m) => ({ default: m.NetworkMapPage }))
);
const FleetTrackingPage = lazy(() =>
  import('./pages/FleetTracking').then((m) => ({ default: m.FleetTrackingPage }))
);
const TrafficMonitorPage = lazy(() =>
  import('./pages/TrafficMonitor').then((m) => ({ default: m.TrafficMonitorPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.SettingsPage }))
);

const FEATURE_ROUTE_MAP: Record<FeatureKey, string> = {
  dashboard: '/',
  traffic: '/traffic',
  computers: '/computers',
  printers: '/printers',
  cameras: '/cameras',
  pos: '/pos',
  dispatches: '/dispatches',
  switches: '/switches',
  lookup: '/lookup',
  'network-map': '/network-map',
  tracking: '/tracking',
  settings: '/settings',
};

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64 text-xs font-semibold text-slate-500 dark:text-slate-400 gap-2">
    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
    <span>Đang tải phân hệ...</span>
  </div>
);

const ProtectedRoute: React.FC<{ feature: FeatureKey; children: React.ReactNode }> = ({
  feature,
  children,
}) => {
  const { canAccessFeature, currentUserPermission } = useSecurity();

  if (!canAccessFeature(feature)) {
    const firstAllowed = currentUserPermission.allowedFeatures[0];
    const fallbackPath = firstAllowed ? FEATURE_ROUTE_MAP[firstAllowed] || '/cameras' : '/cameras';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

const RootRoute: React.FC = () => {
  const { canAccessFeature, currentUserPermission } = useSecurity();
  if (canAccessFeature('dashboard')) {
    return <DashboardPage />;
  }
  const first = currentUserPermission.allowedFeatures[0];
  const target = first ? FEATURE_ROUTE_MAP[first] || '/cameras' : '/cameras';
  return <Navigate to={target} replace />;
};

const MainLayout: React.FC = () => {
  const { t } = useApp();
  const { isBlocked, loading: securityLoading } = useSecurity();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAlertCount = async () => {
    try {
      await getDashboardSummary();
    } catch {
      // Backend maybe loading or offline - keep default
    }
  };

  useEffect(() => {
    // Pre-warm inventory cache immediately on startup
    loadInventoryFast();
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadInventoryFast(true), fetchAlertCount()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!securityLoading && isBlocked) {
    return <SecurityLockoutScreen />;
  }

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      {/* Workspace Body: Sidebar + Main Content sitting naturally side-by-side */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar (w-56 shrink-0) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
          <Navbar onRefresh={handleGlobalRefresh} isRefreshing={isRefreshing} />
          <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-y-auto">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route
                  path="/traffic"
                  element={
                    <ProtectedRoute feature="traffic">
                      <TrafficMonitorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/computers"
                  element={
                    <ProtectedRoute feature="computers">
                      <ComputerInventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/printers"
                  element={
                    <ProtectedRoute feature="printers">
                      <DeviceCategoryPage
                        categoryCode="PRINTER"
                        title={t('nav_printers', 'Quản Lý Máy In & Máy Photocopy')}
                        description="Theo dõi trạng thái kết nối và địa chỉ IP của hệ thống máy in, máy photocopy tại các phòng ban"
                        icon={Printer}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cameras"
                  element={
                    <ProtectedRoute feature="cameras">
                      <DeviceCategoryPage
                        categoryCode="CAMERA"
                        title={t('nav_cameras', 'Hệ Thống Camera An Ninh & Đầu Ghi NVR')}
                        description="Xem trực tiếp và giám sát trạng thái 20 kênh camera thuộc 02 đầu ghi trung tâm (Văn phòng & Xí nghiệp)"
                        icon={Video}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute feature="pos">
                      <PosDevicesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dispatches"
                  element={
                    <ProtectedRoute feature="dispatches">
                      <DispatchesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/switches"
                  element={
                    <ProtectedRoute feature="switches">
                      <DeviceCategoryPage
                        categoryCode="SWITCH"
                        title={t('nav_switches', 'Thiết Bị Mạng Switch, Router & Wi-Fi')}
                        description="Quản lý trạng thái kết nối các thiết bị chuyển mạch, định tuyến và phát sóng không dây toàn công ty"
                        icon={Network}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lookup"
                  element={
                    <ProtectedRoute feature="lookup">
                      <IpMacLookupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/network-map"
                  element={
                    <ProtectedRoute feature="network-map">
                      <NetworkMapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tracking"
                  element={
                    <ProtectedRoute feature="tracking">
                      <FleetTrackingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute feature="settings">
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>

      {/* Modern Status Footer: Language, Live Clock, Client Machine/IP, Dark/Light Mode */}
      <FooterBar />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <SecurityProvider>
          <MainLayout />
        </SecurityProvider>
      </AppProvider>
    </HashRouter>
  );
};

export default App;
