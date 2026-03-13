import { useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { WifiOff, RefreshCw, LogOut, Database, Users, Factory, Settings } from 'lucide-react';
import MobileNav from '../components/MobileNav';
import CommandPalette from '../components/CommandPalette';
import MetricsBangs from '../components/MetricsBangs';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getStoredToken } from '../services/auth';
import { retryConnection } from '../lib/api';
import { cn } from '../lib/utils';

const TABS = [
  { path: '/', label: 'Database', icon: Database, end: true },
  { path: '/board', label: 'Sellers', icon: Users, end: false },
  { path: '/production/dashboard', label: 'Production', icon: Factory, end: false, external: true },
];

export default function DashboardLayout() {
  const { isOffline, triggerRefresh } = useApp();
  const { logout, isAdmin } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const location = useLocation();

  const handleRetry = async () => {
    setRetrying(true);
    const online = await retryConnection();
    if (online) triggerRefresh();
    setRetrying(false);
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Left sidebar — logo + nav tabs + logout */}
      <aside className="hidden lg:flex flex-col w-16 bg-sidebar-bg border-r border-sidebar-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center h-10 border-b border-sidebar-border">
          <span className="text-sm font-bold text-sidebar-text-active tracking-wider">D</span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex flex-col items-center gap-1 py-3 px-1.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            if (tab.external) {
              const handleExternalClick = (e: React.MouseEvent) => {
                e.preventDefault();
                const token = getStoredToken();
                const url = token ? `${tab.path}?sso=${encodeURIComponent(token)}` : tab.path;
                window.location.href = url;
              };
              return (
                <a
                  key={tab.path}
                  href={tab.path}
                  onClick={handleExternalClick}
                  title={tab.label}
                  className={cn(
                    'w-full flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg transition-colors',
                    'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-[9px] font-medium leading-none">{tab.label}</span>
                </a>
              );
            }
            const isActive = tab.end
              ? location.pathname === tab.path
              : location.pathname.startsWith(tab.path);
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                title={tab.label}
                className={cn(
                  'w-full flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover'
                )}
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium leading-none">{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings + Logout */}
        <div className="border-t border-sidebar-border p-2 flex flex-col gap-1">
          {isAdmin && (
            <NavLink
              to="/settings"
              title="Settings"
              className={cn(
                'flex flex-col items-center gap-0.5 w-full py-2 rounded-md transition-colors',
                location.pathname === '/settings'
                  ? 'bg-accent text-white'
                  : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover'
              )}
            >
              <Settings size={18} />
              <span className="text-[9px] font-medium leading-none">Settings</span>
            </NavLink>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center justify-center w-full py-2 rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-status-red transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        {/* Metrics "bangs" — pull-down dashboard */}
        <MetricsBangs />

        {/* Offline banner */}
        {isOffline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-center gap-2 flex-wrap flex-shrink-0">
            <WifiOff size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">API unavailable — using cached data</span>
            <button onClick={handleRetry} disabled={retrying}
              className="ml-2 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1 disabled:opacity-50">
              <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Main content — full screen, scrollable for pages that need it */}
        <main className="flex-1 min-h-0 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <CommandPalette />
    </div>
  );
}
