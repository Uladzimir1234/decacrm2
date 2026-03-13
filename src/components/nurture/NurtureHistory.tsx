import { useEffect, useState } from 'react';
import { Mail, MessageSquare, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { timeAgo, formatDateTime, cn } from '../../lib/utils';
import { getNurtureHistory } from '../../services/nurture';
import type { NurtureHistoryItem } from '../../types';

interface NurtureHistoryProps {
  dealId: string;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

function HistoryEntry({ item }: { item: NurtureHistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const isEmail = item.type?.toLowerCase() === 'email';
  const Icon = isEmail ? Mail : MessageSquare;
  const iconColor = isEmail ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10';
  const body = item.body ? stripHtml(item.body) : '';
  const isLong = body.length > 100;

  return (
    <div className="flex gap-3">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', iconColor)}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-xs font-medium text-gray-400 capitalize">
            {item.type || 'Message'}
          </span>
          <span className="text-[10px] text-gray-600">{item.step}</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded border',
              item.status === 'sent' || item.status === 'delivered'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                : item.status === 'failed'
                  ? 'text-red-400 bg-red-500/10 border-red-500/25'
                  : 'text-gray-400 bg-gray-500/10 border-gray-500/25'
            )}
          >
            {item.status}
          </span>
        </div>
        {item.subject && (
          <p className="text-sm text-gray-300 font-medium">{item.subject}</p>
        )}
        {body && (
          <div className="mt-1">
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
              {expanded || !isLong ? body : `${body.slice(0, 100)}...`}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] text-accent-light hover:text-accent mt-1 transition-colors"
              >
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {expanded ? 'Less' : 'More'}
              </button>
            )}
          </div>
        )}
        {item.sentAt && (
          <p className="text-[10px] text-gray-600 mt-1" title={formatDateTime(item.sentAt)}>
            {timeAgo(item.sentAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NurtureHistory({ dealId }: NurtureHistoryProps) {
  const [history, setHistory] = useState<NurtureHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNurtureHistory(dealId).then((data) => {
      if (!cancelled) {
        setHistory(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [dealId]);

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Nurture History
        </h3>
        <div className="flex items-center justify-center py-6">
          <Loader2 size={18} className="text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div className="card p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Nurture History
        <span className="text-gray-600 font-normal ml-2">{history.length} messages</span>
      </h3>
      <div className="space-y-3">
        {history.map((item) => (
          <HistoryEntry key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
