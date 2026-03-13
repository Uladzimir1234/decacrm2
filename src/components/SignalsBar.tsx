import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Phone, Mail, MessageSquare, X, Clock, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.decacrm.com';
const API_KEY = 'deca-admin-2026-secure-api-key-8x9z4w3y2q1p';

interface Signal {
  id: number;
  contact_id: number;
  signal_type: string;
  priority: string;
  title: string;
  body?: string;
  created_at: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  owner_name?: string;
  metadata?: Record<string, unknown>;
}

const PRIORITY_STYLES = {
  HOT: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', badge: 'bg-red-500', pulse: 'animate-pulse' },
  WARM: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500', pulse: '' },
  INFO: { bg: 'bg-blue-500/8', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500', pulse: '' },
};

const TYPE_ICONS: Record<string, typeof Phone> = {
  inbound_call: Phone,
  missed_call: Phone,
  email_received: Mail,
  sms_received: MessageSquare,
  new_lead: AlertTriangle,
  follow_up_overdue: Clock,
  no_response: Clock,
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface SignalsBarProps {
  sellerId?: string; // filter by seller, undefined = all
  onSignalClick?: (signal: Signal) => void;
}

export default function SignalsBar({ sellerId, onSignalClick }: SignalsBarProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    try {
      const url = `${API_URL}/api/signals/unacknowledged${sellerId ? `?seller=${sellerId}` : ''}`;
      const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (data.ok) setSignals(data.signals || []);
    } catch (e) {
      console.error('Failed to fetch signals:', e);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const acknowledge = async (signalId: number, action: string) => {
    try {
      await fetch(`${API_URL}/api/signals/${signalId}/acknowledge`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setSignals(prev => prev.filter(s => s.id !== signalId));
    } catch (e) {
      console.error('Failed to acknowledge:', e);
    }
  };

  const hotCount = signals.filter(s => s.priority === 'HOT').length;
  const warmCount = signals.filter(s => s.priority === 'WARM').length;
  const totalCount = signals.length;

  if (loading || totalCount === 0) {
    return totalCount === 0 && !loading ? (
      <div className="flex items-center gap-2 px-4 py-2 mb-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
        <Bell size={14} className="text-emerald-400" />
        <span className="text-xs text-emerald-400/70">All clear — no pending signals</span>
      </div>
    ) : null;
  }

  return (
    <div className="mb-4">
      {/* Header bar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 rounded-t-xl border transition-all',
          hotCount > 0
            ? 'bg-red-500/10 border-red-500/30 animate-pulse'
            : 'bg-amber-500/8 border-amber-500/20'
        )}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} className={hotCount > 0 ? 'text-red-400' : 'text-amber-400'} />
          <span className="text-sm font-semibold text-gray-200">
            {totalCount} Signal{totalCount !== 1 ? 's' : ''} Pending
          </span>
          <div className="flex gap-1.5">
            {hotCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                {hotCount} HOT
              </span>
            )}
            {warmCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                {warmCount} WARM
              </span>
            )}
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
      </button>

      {/* Signals list */}
      {!collapsed && (
        <div className="border border-t-0 border-navy-700/30 rounded-b-xl bg-navy-900/50 max-h-[200px] overflow-y-auto divide-y divide-navy-700/20">
          {signals.map(signal => {
            const style = PRIORITY_STYLES[signal.priority as keyof typeof PRIORITY_STYLES] || PRIORITY_STYLES.INFO;
            const Icon = TYPE_ICONS[signal.signal_type] || AlertTriangle;
            return (
              <div
                key={signal.id}
                className={cn('flex items-center gap-3 px-4 py-2.5 hover:bg-navy-800/50 transition-colors cursor-pointer', style.pulse && signal.priority === 'HOT' ? 'bg-red-500/5' : '')}
                onClick={() => onSignalClick?.(signal)}
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', style.bg)}>
                  <Icon size={14} className={style.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200 truncate">{signal.contact_name || 'Unknown'}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white', style.badge)}>
                      {signal.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{signal.title}</p>
                </div>
                <span className="text-[10px] text-gray-500 flex-shrink-0">{timeAgo(signal.created_at)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); acknowledge(signal.id, 'dismissed'); }}
                  className="p-1 rounded hover:bg-navy-700 text-gray-600 hover:text-gray-400 flex-shrink-0"
                  title="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Export signal counts hook for tab badges
export function useSignalCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_URL}/api/signals/counts`, { headers: { 'x-api-key': API_KEY } });
        const data = await res.json();
        if (data.ok) {
          setCounts(data.counts || {});
          setTotal(data.total || 0);
        }
      } catch {}
    };
    fetch_();
    const interval = setInterval(fetch_, 15000);
    return () => clearInterval(interval);
  }, []);

  return { counts, total };
}
