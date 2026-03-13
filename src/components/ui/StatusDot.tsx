import { cn } from '../../lib/utils';

interface StatusDotProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const SIZE_MAP: Record<string, string> = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const COLOR_MAP: Record<string, string> = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  red: 'bg-status-red',
};

const PULSE_MAP: Record<string, string> = {
  green: 'shadow-[0_0_8px_rgba(34,197,94,0.5)]',
  yellow: 'shadow-[0_0_8px_rgba(234,179,8,0.5)]',
  red: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]',
};

export default function StatusDot({
  status,
  size = 'md',
  pulse = false,
}: StatusDotProps) {
  const safeStatus = (status in COLOR_MAP) ? status : 'green';
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        SIZE_MAP[size] || SIZE_MAP.md,
        COLOR_MAP[safeStatus],
        pulse && PULSE_MAP[safeStatus],
        pulse && 'animate-pulse'
      )}
    />
  );
}
