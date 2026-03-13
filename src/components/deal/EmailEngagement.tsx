import { useEffect, useState } from 'react';
import { Mail, Loader2, Flame, Eye, MousePointerClick } from 'lucide-react';
import { cn, formatDateTime } from '../../lib/utils';
import { getEmailTrackingByEmail } from '../../services/emailTracking';
import type { EmailTrackingDetail } from '../../types';

interface EmailEngagementProps {
  email: string;
}

export default function EmailEngagement({ email }: EmailEngagementProps) {
  const [tracking, setTracking] = useState<EmailTrackingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEmailTrackingByEmail(email).then((data) => {
      if (!cancelled) {
        setTracking(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [email]);

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 size={12} className="animate-spin" />
          Loading email engagement...
        </div>
      </div>
    );
  }

  if (!tracking || (tracking.opens === 0 && tracking.delivered === 0 && tracking.bounces === 0)) {
    return null;
  }

  const levelConfig = getLevelConfig(tracking.engagementLevel);

  return (
    <div className={cn('card p-4 space-y-2 border-l-[3px]', levelConfig.border)}>
      <div className="flex items-center gap-2">
        <Mail size={13} className="text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Email Engagement
        </h3>
        {tracking.engagementLevel === 'hot' && (
          <Flame size={12} className="text-orange-400 animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-sm text-gray-300">
        {tracking.opens > 0 && (
          <span className="flex items-center gap-1">
            <Eye size={12} className="text-emerald-400" />
            {tracking.opens} open{tracking.opens !== 1 ? 's' : ''}
          </span>
        )}
        {tracking.clicks > 0 && (
          <span className="flex items-center gap-1">
            <MousePointerClick size={12} className="text-orange-400" />
            {tracking.clicks} click{tracking.clicks !== 1 ? 's' : ''}
          </span>
        )}
        {tracking.lastEvent && (
          <span className="text-gray-500 text-xs">
            Last: {formatDateTime(tracking.lastEvent)}
          </span>
        )}
      </div>

      {tracking.subject && (
        <p className="text-xs text-gray-500 italic truncate">
          &quot;{tracking.subject}&quot;
        </p>
      )}
    </div>
  );
}

function getLevelConfig(level: string) {
  switch (level) {
    case 'hot':
      return { border: 'border-l-orange-500' };
    case 'warm':
      return { border: 'border-l-yellow-500' };
    case 'interested':
      return { border: 'border-l-emerald-500' };
    case 'bounced':
      return { border: 'border-l-red-500' };
    default:
      return { border: 'border-l-gray-600' };
  }
}
