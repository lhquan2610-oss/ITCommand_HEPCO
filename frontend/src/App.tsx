import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Printer, Network, Video, ShieldAlert } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { SecurityLockoutScreen } from './components/SecurityLockoutScreen';
import { FeatureKey } from './types/electron';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { FooterBar } from './components/FooterBar';
import { DashboardPage } from './pages/Dashboard';
import { ComputerInventoryPage } from './pages/ComputerInventoryPage';
import { DeviceCategoryPage } from './pages/DeviceCategoryPage';
import { PosDevicesPage } from './pages/PosInventory';
import { DispatchesPage } from './pages/Dispatches';
import { IpMacLookupPage } from './pages/IpMacLookup';
import { NetworkMapPage } from './pages/NetworkMap';
import { FleetTrackingPage } from './pages/FleetTracking';
import { TrafficMonitorPage } from './pages/TrafficMonitor';
import { SettingsPage } from './pages/Settings';
import { getDashboardSummary } from './services/api';

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

const ProtectedRoute: React.FC<{ feature: FeatureKey; children: React.ReactNode }> = ({
  feature,
  children
}) => {
  const { canAccessFeature, currentUserPermission } = useSecurity();

  if (!canAccessFeature(feature)) {
    // Tự động chuyển hướng êm đẹp vào phân hệ được phép đầu tiên, không hiển thị thông báo cản trở
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
  const [alertCount, setAlertCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAlertCount = async () => {
    try {
      const summary = await getDashboardSummary();
      if (summary?.metrics?.open_alerts_total !== undefined) {
        setAlertCount(summary.metrics.open_alerts_total);
      }
    } catch {
      // Backend maybe loading or offline - keep default
    }
  };

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlertCount();
    setTimeout(() => setIsRefreshing(false), 800);
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
          <main className="flex-1 p-5 overflow-y-auto">
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
                      title={t('nav_printers', 'Máy In & Photocopy Mạng')}
                      description="Giám sát máy in HP, Canon, Brother, Ricoh (Port 9100 / IPP / SNMP)"
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
                      title={t('nav_cameras', 'Camera IP & Đầu Ghi NVR')}
                      description="Giám sát camera an ninh hỗ trợ ONVIF WS-Discovery (UDP 3702) & RTSP (TCP 554)"
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
                      title={t('nav_switches', 'Switch & Thiết Bị Mạng Lõi')}
                      description="Giám sát switch quản trị L2/L3, thu thập cổng mạng và uptime qua SNMP"
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
