import { cn } from '../../lib/utils';
import type { SDRContactStatus } from '../../types';

interface StatusConfig {
  key: SDRContactStatus;
  label: string;
  color: string;
  activeColor: string;
  dotColor: string;
}

const STATUSES: StatusConfig[] = [
  {
    key: 'new',
    label: 'New',
    color: 'text-red-400 border-red-500/30 bg-red-500/5',
    activeColor: 'text-red-300 border-red-500/60 bg-red-500/15 shadow-lg shadow-red-500/10',
    dotColor: 'bg-red-500',
  },
  {
    key: 'contacted',
    label: 'In Progress',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    activeColor: 'text-amber-300 border-amber-500/60 bg-amber-500/15 shadow-lg shadow-amber-500/10',
    dotColor: 'bg-amber-500',
  },
  {
    key: 'assigned',
    label: 'Assigned',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    activeColor: 'text-emerald-300 border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-500/10',
    dotColor: 'bg-emerald-500',
  },
];

interface SDRStatusFilterProps {
  active: SDRContactStatus | null;
  counts: Record<SDRContactStatus, number>;
  onSelect: (status: SDRContactStatus | null) => void;
}

export default function SDRStatusFilter({ active, counts, onSelect }: SDRStatusFilterProps) {
  return (
    <div className="flex gap-2 mb-4">
      {STATUSES.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(isActive ? null : s.key)}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
              isActive ? s.activeColor : s.color,
              'hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dotColor)} />
            <span>{s.label}</span>
            <span className={cn(
              'text-xs font-semibold px-1.5 py-0.5 rounded-md tabular-nums',
              isActive ? 'bg-white/10' : 'bg-white/5'
            )}>
              {counts[s.key] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
