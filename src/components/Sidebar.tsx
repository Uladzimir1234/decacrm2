import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout, displayName } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside className="hidden lg:flex flex-col items-center w-16 bg-sidebar-bg border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-sidebar-border w-full">
        <span className="text-base font-bold text-sidebar-text-active tracking-tight">D</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: avatar + settings + logout */}
      <div className="flex flex-col items-center gap-1 pb-3">
        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full bg-sidebar-active flex items-center justify-center text-[10px] font-semibold text-sidebar-text-active"
          title={displayName || ''}
        >
          {initials}
        </div>
        <button
          className="p-2 rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-status-red transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
