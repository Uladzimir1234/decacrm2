import { AlertTriangle, Clock } from 'lucide-react';
import { timeAgo } from '../../lib/utils';
import type { Alert } from '../../types';

interface AlertFeedProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

export default function AlertFeed({ alerts, onAlertClick }: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-gray-500">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          onClick={() => onAlertClick(alert)}
          className="card-hover px-4 py-3 flex items-center gap-3 cursor-pointer"
        >
          <div
            className={`w-1 h-8 rounded-full flex-shrink-0 ${
              alert.severity === 'red' ? 'bg-status-red' : 'bg-status-yellow'
            }`}
          />
          <AlertTriangle
            size={14}
            className={
              alert.severity === 'red'
                ? 'text-status-red flex-shrink-0'
                : 'text-status-yellow flex-shrink-0'
            }
          />
          <p className="text-sm text-gray-300 flex-1 min-w-0 truncate">
            {alert.message}
          </p>
          <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <Clock size={10} />
            {timeAgo(alert.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
}
