import { useState } from 'react';
import {
  Phone,
  MessageSquare,
  FileText,
  Mail,
  Calendar,
  CheckSquare,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { timeAgo, formatDateTime, formatDuration, cn } from '../../lib/utils';
import type { EnrichedProfile } from '../../types';

interface TimelineItem {
  id: string;
  type: 'call' | 'sms' | 'note' | 'email' | 'meeting' | 'task';
  date: string;
  title: string;
  subtitle?: string;
  body?: string;
  direction?: string;
  duration?: number;
  status?: string;
  priority?: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Phone; bg: string; label: string }
> = {
  call: { icon: Phone, bg: 'bg-sky-500/15 text-sky-400', label: 'Call' },
  sms: { icon: MessageSquare, bg: 'bg-emerald-500/15 text-emerald-400', label: 'SMS' },
  note: { icon: FileText, bg: 'bg-gray-500/15 text-gray-400', label: 'Note' },
  email: { icon: Mail, bg: 'bg-amber-500/15 text-amber-400', label: 'Email' },
  meeting: { icon: Calendar, bg: 'bg-blue-500/15 text-blue-400', label: 'Meeting' },
  task: { icon: CheckSquare, bg: 'bg-teal-500/15 text-teal-400', label: 'Task' },
};

function buildTimeline(profile: EnrichedProfile): TimelineItem[] {
  const items: TimelineItem[] = [];

  (profile.calls || []).forEach((c) =>
    items.push({
      id: c.id,
      type: 'call',
      date: c.date,
      title: `${c.direction === 'INBOUND' || c.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call`,
      subtitle: c.status,
      duration: c.duration,
      direction: c.direction,
    })
  );

  (profile.sms || []).forEach((s) =>
    items.push({
      id: s.id,
      type: 'sms',
      date: s.date,
      title: `${s.direction === 'INBOUND' || s.direction === 'inbound' ? 'Inbound' : 'Outbound'} SMS`,
      body: s.text,
      direction: s.direction,
    })
  );

  (profile.notes || []).forEach((n) =>
    items.push({
      id: n.id,
      type: 'note',
      date: n.date,
      title: 'Note',
      body: n.text,
    })
  );

  (profile.emails || []).forEach((e) =>
    items.push({
      id: e.id,
      type: 'email',
      date: e.date,
      title: e.subject || 'Email',
      subtitle: `${e.from} -> ${e.to}`,
      body: e.body,
      direction: e.direction,
    })
  );

  (profile.meetings || []).forEach((m) =>
    items.push({
      id: m.id,
      type: 'meeting',
      date: m.startTime,
      title: m.title,
      body: m.body,
    })
  );

  (profile.tasks || []).forEach((t) =>
    items.push({
      id: t.id,
      type: 'task',
      date: '',
      title: t.subject,
      status: t.status,
      priority: t.priority,
    })
  );

  items.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return items;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

function isInbound(direction?: string): boolean {
  if (!direction) return false;
  return direction.toLowerCase() === 'inbound';
}

function TimelineEntry({ item }: { item: TimelineItem }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;
  const hasBody = item.body && stripHtml(item.body).length > 0;
  const truncatedBody = hasBody ? stripHtml(item.body!) : '';
  const isLong = truncatedBody.length > 120;

  const borderColor =
    item.type === 'call'
      ? 'bg-sky-500/5 border-sky-500/10'
      : item.type === 'sms'
        ? 'bg-emerald-500/5 border-emerald-500/10'
        : item.type === 'email'
          ? 'bg-amber-500/5 border-amber-500/10'
          : item.type === 'meeting'
            ? 'bg-blue-500/5 border-blue-500/10'
            : item.type === 'task'
              ? 'bg-teal-500/5 border-teal-500/10'
              : 'bg-navy-800/50 border-navy-700/30';

  return (
    <div className="flex gap-3 relative">
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10',
          config.bg
        )}
      >
        <Icon size={14} />
      </div>

      <div className={cn('flex-1 rounded-lg p-3 border', borderColor)}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-gray-400">
            {config.label}
          </span>

          {item.direction && (
            <>
              {isInbound(item.direction) ? (
                <ArrowDownLeft size={10} className="text-emerald-400" />
              ) : (
                <ArrowUpRight size={10} className="text-sky-400" />
              )}
              <span className="text-[10px] text-gray-600">
                {isInbound(item.direction) ? 'Inbound' : 'Outbound'}
              </span>
            </>
          )}

          {item.duration !== undefined && item.duration > 0 && (
            <span className="text-[10px] text-gray-500 ml-auto">
              {formatDuration(item.duration)}
            </span>
          )}

          {item.status && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-700 text-gray-400 border border-navy-600/50">
              {item.status}
            </span>
          )}

          {item.priority && (
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border',
                item.priority.toLowerCase() === 'high'
                  ? 'bg-red-500/10 text-red-400 border-red-500/25'
                  : item.priority.toLowerCase() === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/25'
              )}
            >
              {item.priority}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-300 font-medium">{item.title}</p>

        {item.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
        )}

        {hasBody && (
          <div className="mt-2">
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
              {expanded || !isLong
                ? truncatedBody
                : `${truncatedBody.slice(0, 120)}...`}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-accent-light hover:text-accent mt-1.5 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={12} />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {item.date && (
          <p className="text-[10px] text-gray-600 mt-2" title={formatDateTime(item.date)}>
            {timeAgo(item.date)}
          </p>
        )}
      </div>
    </div>
  );
}

interface EnrichedTimelineProps {
  profile: EnrichedProfile;
}

export default function EnrichedTimeline({ profile }: EnrichedTimelineProps) {
  const items = buildTimeline(profile);
  const [visibleCount, setVisibleCount] = useState(20);

  if (items.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Communication Timeline
        </h3>
        <p className="text-sm text-gray-500 py-4 text-center">
          No communications found
        </p>
      </div>
    );
  }

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Communication Timeline
        <span className="text-gray-600 font-normal ml-2">
          {items.length} items
        </span>
      </h3>

      <div className="relative">
        <div className="absolute left-[17px] top-2 bottom-2 w-px bg-navy-600/50" />

        <div className="space-y-4">
          {visible.map((item) => (
            <TimelineEntry key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setVisibleCount((c) => c + 20)}
            className="w-full mt-4 py-2.5 text-sm text-accent-light hover:text-accent bg-navy-900/50 rounded-lg border border-navy-700/30 hover:border-accent/30 transition-all"
          >
            Show more ({items.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
