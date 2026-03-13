import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { formatDate, cn } from '../../lib/utils';
import type { Reminder } from '../../types';

interface RemindersCardProps {
  reminders: Reminder[];
}

export default function RemindersCard({ reminders }: RemindersCardProps) {
  const active = reminders.filter((r) => r.status === 'active');

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Reminders
      </h3>

      {active.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No active reminders</p>
      ) : (
        <div className="space-y-2">
          {active.map((reminder) => {
            const isPast =
              new Date(reminder.reminder_date).getTime() < Date.now();
            return (
              <div
                key={reminder.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  isPast
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-navy-900/50 border-navy-700/30'
                )}
              >
                {isPast ? (
                  <CalendarClock
                    size={14}
                    className="text-amber-400 mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <CheckCircle2
                    size={14}
                    className="text-gray-500 mt-0.5 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{reminder.text}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      isPast ? 'text-amber-400' : 'text-gray-500'
                    )}
                  >
                    {formatDate(reminder.reminder_date)}
                    {isPast && ' (overdue)'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
