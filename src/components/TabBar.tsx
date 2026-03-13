import { NavLink } from 'react-router-dom';
import { Database, Users, BarChart3, Building2 } from 'lucide-react';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

interface TabItem {
  path: string;
  icon: typeof Database;
  label: string;
  roles?: string[];
}

const ALL_TABS: TabItem[] = [
  { path: '/', icon: Database, label: 'Database', roles: ['admin'] },
  { path: '/board', icon: Users, label: 'Seller Board' },
  { path: '/dealers', icon: Building2, label: 'Dealers', roles: ['admin'] },
  { path: '/pipeline', icon: BarChart3, label: 'Pipeline', roles: ['admin'] },
];

export default function TabBar() {
  const { role } = useAuth();

  const tabs = useMemo(() =>
    ALL_TABS.filter(item => !item.roles || (role && item.roles.includes(role))),
    [role]
  );

  return (
    <div className="flex items-end gap-0 bg-surface-raised border-b border-surface-border px-2 pt-1.5">
      {tabs.map(tab => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border border-b-0 ${
              isActive
                ? 'bg-surface-card text-content-primary border-surface-border -mb-px z-10'
                : 'text-content-tertiary hover:text-content-secondary bg-transparent border-transparent hover:bg-surface-hover'
            }`
          }
        >
          <tab.icon size={14} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
