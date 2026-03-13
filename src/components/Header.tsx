import { RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { lastUpdated, triggerRefresh } = useApp();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-100">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 hidden sm:inline">
          Last synced: {timeAgo(lastUpdated.toISOString())}
        </span>
        <button
          onClick={triggerRefresh}
          className="btn-ghost p-2 rounded-lg"
          title="Refresh data"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
