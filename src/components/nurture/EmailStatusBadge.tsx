import { Flame, Eye, Mail, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { EmailStatus, EmailTrackingContact } from '../../types';

interface EmailStatusBadgeProps {
  emailStatus?: EmailStatus;
  tracking?: EmailTrackingContact;
}

export default function EmailStatusBadge({ emailStatus, tracking }: EmailStatusBadgeProps) {
  if (tracking) {
    return <TrackingBadge tracking={tracking} email={emailStatus?.email} />;
  }

  if (!emailStatus) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-gray-400 bg-gray-500/10 border-gray-500/25">
          Pending
        </span>
      </div>
    );
  }

  if (emailStatus.bounced) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-red-400 bg-red-500/10 border-red-500/25">
          <XCircle size={10} />
          Bounced
        </span>
        {emailStatus.email && (
          <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[160px] line-through">{emailStatus.email}</p>
        )}
      </div>
    );
  }

  if (emailStatus.opened) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/25">
          <Eye size={10} />
          Opened
        </span>
        {emailStatus.email && (
          <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[160px]">{emailStatus.email}</p>
        )}
      </div>
    );
  }

  if (emailStatus.delivered) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-sky-400 bg-sky-500/10 border-sky-500/25">
          <Mail size={10} />
          Delivered
        </span>
        {emailStatus.email && (
          <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[160px]">{emailStatus.email}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-gray-400 bg-gray-500/10 border-gray-500/25">
        Pending
      </span>
      {emailStatus.email && (
        <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[160px]">{emailStatus.email}</p>
      )}
    </div>
  );
}

function TrackingBadge({ tracking, email }: { tracking: EmailTrackingContact; email?: string }) {
  const { engagementLevel, opens, clicks } = tracking;

  const config = getEngagementConfig(engagementLevel, opens, clicks);

  return (
    <div>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
          config.classes,
          engagementLevel === 'hot' && 'animate-pulse'
        )}
      >
        <config.icon size={10} />
        {config.label}
      </span>
      {config.detail && (
        <p className="text-[10px] text-gray-500 mt-1">{config.detail}</p>
      )}
      {email && engagementLevel === 'bounced' && (
        <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[160px] line-through">{email}</p>
      )}
    </div>
  );
}

function getEngagementConfig(
  level: string,
  opens: number,
  clicks: number
): { icon: typeof Flame; label: string; classes: string; detail: string | null } {
  switch (level) {
    case 'hot':
      return {
        icon: Flame,
        label: 'HOT',
        classes: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
        detail: `${opens} open${opens !== 1 ? 's' : ''}${clicks > 0 ? `, ${clicks} click${clicks !== 1 ? 's' : ''}` : ''}`,
      };
    case 'warm':
      return {
        icon: Eye,
        label: 'WARM',
        classes: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30',
        detail: `${opens} opens`,
      };
    case 'interested':
      return {
        icon: Eye,
        label: 'OPENED',
        classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        detail: `${opens} open${opens !== 1 ? 's' : ''}`,
      };
    case 'delivered':
      return {
        icon: Mail,
        label: 'DELIVERED',
        classes: 'text-gray-400 bg-gray-500/10 border-gray-500/25',
        detail: null,
      };
    case 'bounced':
      return {
        icon: XCircle,
        label: 'BOUNCED',
        classes: 'text-red-400 bg-red-500/10 border-red-500/25',
        detail: null,
      };
    default:
      return {
        icon: Mail,
        label: 'NOT SENT',
        classes: 'text-gray-500 bg-gray-500/5 border-gray-600/20',
        detail: null,
      };
  }
}
