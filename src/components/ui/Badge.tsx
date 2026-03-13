import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

const VARIANT_MAP = {
  default: 'bg-navy-700 text-gray-300 border-navy-600',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function Badge({
  children,
  className,
  variant = 'default',
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
        VARIANT_MAP[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
