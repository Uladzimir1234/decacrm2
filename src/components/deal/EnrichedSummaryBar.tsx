import {
  Phone,
  MessageSquare,
  FileText,
  Mail,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import type { EnrichedSummary } from '../../types';

interface EnrichedSummaryBarProps {
  summary: EnrichedSummary;
}

const ITEMS: {
  key: keyof EnrichedSummary;
  icon: typeof Phone;
  label: string;
  color: string;
}[] = [
  { key: 'totalCalls', icon: Phone, label: 'calls', color: 'text-sky-400' },
  { key: 'totalSMS', icon: MessageSquare, label: 'SMS', color: 'text-emerald-400' },
  { key: 'totalNotes', icon: FileText, label: 'notes', color: 'text-gray-400' },
  { key: 'totalEmails', icon: Mail, label: 'emails', color: 'text-amber-400' },
  { key: 'totalMeetings', icon: Calendar, label: 'meetings', color: 'text-blue-400' },
  { key: 'totalTasks', icon: CheckSquare, label: 'tasks', color: 'text-teal-400' },
];

export default function EnrichedSummaryBar({ summary }: EnrichedSummaryBarProps) {
  return (
    <div className="card px-4 py-3">
      <div className="flex items-center gap-1 flex-wrap">
        {ITEMS.map(({ key, icon: Icon, label, color }, i) => {
          const count = Number(summary[key]) || 0;
          return (
            <span key={key} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-navy-600 mx-1 select-none">|</span>
              )}
              <Icon size={12} className={color} />
              <span className="text-sm font-semibold text-gray-200">
                {count}
              </span>
              <span className="text-xs text-gray-500">{label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
