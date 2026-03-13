import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext: string;
  color: string;
  secondIcon?: LucideIcon;
  onClick?: () => void;
}

export default function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  secondIcon: SecondIcon,
  onClick,
}: SummaryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-4 lg:p-5',
        onClick && 'cursor-pointer hover:border-navy-500/50 transition-all duration-200'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        <Icon size={16} className={color} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl lg:text-3xl font-bold text-gray-100">
          {value}
        </span>
        {SecondIcon && <SecondIcon size={14} className="text-emerald-400 mb-1" />}
      </div>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  );
}
