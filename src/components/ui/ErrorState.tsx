import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="card p-8 text-center">
      <AlertTriangle size={32} className="mx-auto text-status-yellow mb-3" />
      <p className="text-sm text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm inline-flex items-center gap-2">
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
