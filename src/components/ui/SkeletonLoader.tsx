import { cn } from '../../lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card p-4 animate-pulse', className)}>
      <div className="h-4 bg-navy-700 rounded w-1/3 mb-3" />
      <div className="h-8 bg-navy-700 rounded w-1/2 mb-2" />
      <div className="h-3 bg-navy-700 rounded w-2/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="card p-4 animate-pulse flex items-center gap-4">
      <div className="w-3 h-3 bg-navy-700 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-navy-700 rounded w-1/4 mb-2" />
        <div className="h-3 bg-navy-700 rounded w-1/2" />
      </div>
      <div className="h-6 bg-navy-700 rounded w-16" />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
