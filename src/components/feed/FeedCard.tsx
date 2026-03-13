import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  RefreshCw,
  ArrowRightLeft,
  Phone,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { timeAgo, formatDateTime, cn } from '../../lib/utils';
import type { FeedItem } from '../../types';

const ICON_MAP: Record<string, { icon: typeof UserPlus; color: string }> = {
  new_lead: { icon: UserPlus, color: 'text-emerald-400 bg-emerald-500/10' },
  new_contact: { icon: User, color: 'text-sky-400 bg-sky-500/10' },
  stage_change: { icon: RefreshCw, color: 'text-amber-400 bg-amber-500/10' },
  owner_change: { icon: ArrowRightLeft, color: 'text-cyan-400 bg-cyan-500/10' },
  call: { icon: Phone, color: 'text-sky-400 bg-sky-500/10' },
  sms: { icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10' },
  deal_updated: { icon: Zap, color: 'text-amber-400 bg-amber-500/10' },
};

const SELLER_COLORS: Record<string, string> = {
  Eric: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  Paul: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Ilya: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

function getSellerPill(name: string): string {
  for (const [key, cls] of Object.entries(SELLER_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return 'bg-gray-500/15 text-gray-400 border-gray-500/25';
}

const SUMMARY_PREVIEW_LENGTH = 100;

interface FeedCardProps {
  item: FeedItem;
}

export default function FeedCard({ item }: FeedCardProps) {
  const navigate = useNavigate();
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const config = ICON_MAP[item.type] || { icon: Zap, color: 'text-gray-400 bg-gray-500/10' };
  const Icon = config.icon;
  const clickable = !!item.dealId;

  const callSummary = item.type === 'call'
    ? (item.metadata?.summary as string) || ''
    : '';
  const isLong = callSummary.length > SUMMARY_PREVIEW_LENGTH;

  function handleClick() {
    if (item.dealId) {
      navigate(`/deals/${item.dealId}`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150',
        'bg-navy-800/60 border-navy-600/30',
        clickable && 'cursor-pointer hover:bg-navy-800 hover:border-navy-500/40 hover:shadow-lg hover:shadow-navy-950/30'
      )}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', config.color)}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed truncate">{item.description}</p>
        )}

        {callSummary && (
          <div className="mt-1.5">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {summaryExpanded || !isLong
                ? callSummary
                : `${callSummary.slice(0, SUMMARY_PREVIEW_LENGTH)}...`}
            </p>
            {isLong && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSummaryExpanded(!summaryExpanded);
                }}
                className="text-[10px] text-accent-light hover:text-accent transition-colors mt-0.5"
              >
                {summaryExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {item.sellerName && (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', getSellerPill(item.sellerName))}>
              {item.sellerName}
            </span>
          )}
          <span className="text-[10px] text-gray-600" title={item.timestamp ? formatDateTime(item.timestamp) : ''}>
            {item.timestamp ? timeAgo(item.timestamp) : ''}
          </span>
        </div>
      </div>

      <span className="text-[10px] text-gray-600 flex-shrink-0 mt-1 hidden sm:block" title={item.timestamp ? formatDateTime(item.timestamp) : ''}>
        {item.timestamp ? timeAgo(item.timestamp) : ''}
      </span>
    </div>
  );
}
