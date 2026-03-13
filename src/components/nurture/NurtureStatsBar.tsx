import { Send, Inbox, Eye, MousePointerClick, TrendingUp, Target } from 'lucide-react';

interface NurtureStatsBarProps {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  totalBounced: number;
  totalUnsubscribed: number;
}

export default function NurtureStatsBar({
  totalSent,
  totalDelivered,
  totalOpened,
  totalClicked,
  openRate,
  clickRate,
  totalBounced,
  totalUnsubscribed,
}: NurtureStatsBarProps) {
  const cards = [
    {
      icon: Send,
      label: 'Emails Sent',
      value: String(totalSent),
      color: 'text-blue-400',
      sub: `${totalBounced} bounced`,
    },
    {
      icon: Inbox,
      label: 'Delivered',
      value: String(totalDelivered),
      color: 'text-emerald-400',
      sub: `${totalUnsubscribed} unsub`,
    },
    {
      icon: Eye,
      label: 'Opened',
      value: String(totalOpened),
      color: 'text-amber-400',
      sub: null,
    },
    {
      icon: MousePointerClick,
      label: 'Clicked',
      value: String(totalClicked),
      color: 'text-teal-400',
      sub: null,
    },
    {
      icon: TrendingUp,
      label: 'Open Rate',
      value: `${openRate.toFixed(1)}%`,
      color: 'text-sky-400',
      sub: null,
    },
    {
      icon: Target,
      label: 'Click Rate',
      value: `${clickRate.toFixed(1)}%`,
      color: 'text-rose-400',
      sub: null,
    },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ icon: Icon, label, value, color, sub }) => (
        <div key={label} className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={14} className={color} />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              {label}
            </span>
          </div>
          <span className="text-xl font-bold text-gray-100">{value}</span>
          {sub && (
            <p className="text-[10px] text-gray-600 mt-1">{sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
