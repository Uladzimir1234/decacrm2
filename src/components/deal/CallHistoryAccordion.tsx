import { useState, useEffect } from 'react';
import {
  Phone,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime, formatDuration, cn } from '../../lib/utils';
import { getDealCalls } from '../../services/deals';
import type { CallRecord } from '../../types';

interface CallHistoryAccordionProps {
  dealId: string;
}

export default function CallHistoryAccordion({ dealId }: CallHistoryAccordionProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadCalls();
  }, [dealId]);

  async function loadCalls() {
    setLoading(true);
    setError(false);
    const result = await getDealCalls(dealId);
    if (result) {
      const sorted = [...result.calls].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setCalls(sorted);
      setTotalCalls(result.totalCalls);
    } else {
      setError(true);
    }
    setLoading(false);
  }

  const hasCalls = totalCalls > 0;
  const label = hasCalls
    ? `Call History (${totalCalls} call${totalCalls !== 1 ? 's' : ''})`
    : 'Call History (No calls)';

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => hasCalls && setExpanded(!expanded)}
        disabled={!hasCalls && !error}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
          hasCalls && 'hover:bg-navy-800/40 cursor-pointer'
        )}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500/10 text-sky-400 flex-shrink-0">
          <Phone size={15} />
        </div>
        <span className="text-sm font-semibold text-gray-200 flex-1">{label}</span>
        {loading && <Loader2 size={14} className="text-gray-500 animate-spin" />}
        {error && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadCalls();
            }}
            className="flex items-center gap-1.5 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
          >
            <RefreshCw size={11} />
            Retry
          </button>
        )}
        {hasCalls && !loading && (
          <ChevronRight
            size={16}
            className={cn(
              'text-gray-500 transition-transform duration-200',
              expanded && 'rotate-90'
            )}
          />
        )}
      </button>

      {error && !loading && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-400/80">Unable to load call history</p>
        </div>
      )}

      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-navy-700/30">
          {calls.map((call) => (
            <div
              key={call.id}
              className="px-4 py-3 border-b border-navy-700/20 last:border-b-0 hover:bg-navy-800/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className={cn(
                  'w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
                  call.direction === 'outbound'
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                )}>
                  {call.direction === 'outbound' ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowDownLeft size={13} />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-300">
                    {formatDateTime(call.date)}
                  </span>
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                    {call.direction}
                  </span>
                </div>
                <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                  {formatDuration(call.duration)}
                </span>
              </div>
              <p className={cn(
                'text-xs leading-relaxed ml-9',
                call.summary ? 'text-gray-400' : 'text-gray-600 italic'
              )}>
                {call.summary || 'No summary available'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
