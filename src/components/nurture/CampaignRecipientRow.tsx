import { cn } from '../../lib/utils';
import { timeAgo } from '../../lib/utils';
import type { CampaignRecipient } from '../../services/nurture';

interface CampaignRecipientRowProps {
  recipient: CampaignRecipient;
  onContactClick?: (dealId: string | null) => void;
}

function StatusDot({ recipient }: { recipient: CampaignRecipient }) {
  if (recipient.unsubscribed) return <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />;
  if (recipient.bounced) return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />;
  if (recipient.clicked) return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />;
  if (recipient.opened) return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />;
}

const badgeStyles: Record<string, string> = {
  CLICKED: 'text-teal-400 bg-teal-500/10 border-teal-500/25',
  OPENED: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  DELIVERED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  BOUNCED: 'text-red-400 bg-red-500/10 border-red-500/25',
  UNSUB: 'text-gray-400 bg-gray-500/10 border-gray-500/25',
};

function EngagementBadges({ recipient }: { recipient: CampaignRecipient }) {
  const badges: string[] = [];
  if (recipient.clicked) badges.push('CLICKED');
  if (recipient.opened) badges.push('OPENED');
  if (recipient.delivered) badges.push('DELIVERED');
  if (recipient.bounced) badges.push('BOUNCED');
  if (recipient.unsubscribed) badges.push('UNSUB');

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b}
          className={cn(
            'text-[9px] font-semibold px-1.5 py-0.5 rounded border',
            badgeStyles[b]
          )}
        >
          {b}
        </span>
      ))}
    </div>
  );
}

export default function CampaignRecipientRow({ recipient, onContactClick }: CampaignRecipientRowProps) {
  const hasName = !!recipient.contactName;
  const isClickable = !!recipient.dealId;

  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700/20 rounded transition-colors">
      <StatusDot recipient={recipient} />

      <div className="flex-1 min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContactClick?.(recipient.dealId);
          }}
          disabled={!isClickable}
          className={cn(
            'text-left text-sm font-medium truncate block max-w-full',
            isClickable
              ? 'text-accent-light hover:text-accent hover:underline cursor-pointer'
              : 'text-gray-400 cursor-default'
          )}
        >
          {hasName ? recipient.contactName : recipient.email}
        </button>
        {hasName && (
          <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
        )}
      </div>

      <div className="hidden sm:flex">
        <EngagementBadges recipient={recipient} />
      </div>

      <span className="text-xs text-gray-600 whitespace-nowrap shrink-0">
        {timeAgo(recipient.lastEvent)}
      </span>

      <div className="sm:hidden mt-1.5">
        <EngagementBadges recipient={recipient} />
      </div>
    </div>
  );
}
