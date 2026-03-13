import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Zap, Bell, BarChart3, Clock, Menu, X, Crosshair } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

const MAIN_ITEMS = [
  { path: '/command-center', icon: Crosshair, label: 'Command' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/nurture', icon: Zap, label: 'Nurture', badgeKey: 'nurture' as const },
];

const MORE_ITEMS = [
  { path: '/reminders', icon: Clock, label: 'Reminders' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { alertCount, nurtureCount } = useApp();
  const location = useLocation();

  const isMoreActive = MORE_ITEMS.some(item => location.pathname === item.path);

  function getBadge(key?: string): number {
    if (key === 'alert') return alertCount;
    if (key === 'nurture') return nurtureCount;
    return 0;
  }

  function getBadgeColor(key?: string): string {
    if (key === 'nurture') return 'bg-accent';
    return 'bg-status-red';
  }

  const moreBadgeTotal = MORE_ITEMS.reduce((sum, item) => sum + (item.badgeKey ? getBadge(item.badgeKey) : 0), 0);

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-16 left-0 right-0 bg-navy-900 border-t border-navy-700/50 rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-3">
              {MORE_ITEMS.map((item) => {
                const count = item.badgeKey ? getBadge(item.badgeKey) : 0;
                const badgeColor = getBadgeColor(item.badgeKey);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-colors relative',
                        isActive ? 'text-accent-light bg-accent/10' : 'text-gray-400 hover:text-gray-300 hover:bg-navy-800'
                      )
                    }
                  >
                    <item.icon size={22} />
                    <span>{item.label}</span>
                    {item.badgeKey && count > 0 && (
                      <span className={cn('absolute top-1 right-2 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center', badgeColor)}>
                        {count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-900 border-t border-navy-700/50 z-50">
        <div className="flex items-center justify-around py-1">
          {MAIN_ITEMS.map((item) => {
            const count = item.badgeKey ? getBadge(item.badgeKey) : 0;
            const badgeColor = getBadgeColor(item.badgeKey);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors relative',
                    isActive ? 'text-accent-light' : 'text-gray-500'
                  )
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.badgeKey && count > 0 && (
                  <span className={cn('absolute top-1 right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center', badgeColor)}>
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors relative',
              moreOpen || isMoreActive ? 'text-accent-light' : 'text-gray-500'
            )}
          >
            {moreOpen ? <X size={20} /> : <Menu size={20} />}
            <span>More</span>
            {!moreOpen && moreBadgeTotal > 0 && (
              <span className="absolute top-1 right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center bg-accent">
                {moreBadgeTotal}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
