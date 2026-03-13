import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline';

const variantClasses: Record<Variant, string> = {
  default:     'border-sky-500/30     bg-sky-500/15     text-sky-400',
  secondary:   'border-navy-600       bg-navy-700       text-gray-300',
  destructive: 'border-red-500/30     bg-red-500/15     text-red-400',
  success:     'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  warning:     'border-amber-500/30   bg-amber-500/15   text-amber-400',
  info:        'border-violet-500/30  bg-violet-500/15  text-violet-400',
  outline:     'border-navy-600       bg-transparent    text-gray-400',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
