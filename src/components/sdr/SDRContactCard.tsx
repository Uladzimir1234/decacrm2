import { Phone, Mail, Building2, Globe } from 'lucide-react';
import StatusDot from '../ui/StatusDot';
import { cn, timeAgo, formatDate } from '../../lib/utils';
import type { SDRContact } from '../../types';

function formatSource(source: string): string {
  return source
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusBadge(contact: SDRContact) {
  if (contact.status === 'assigned' && contact.assignedTo) {
    return {
      text: `Assigned to ${contact.assignedTo}`,
      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    };
  }
  if (contact.status === 'contacted') {
    return {
      text: 'In Progress',
      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    };
  }
  return {
    text: 'New',
    cls: 'bg-red-500/10 text-red-400 border-red-500/25',
  };
}

interface SDRContactCardProps {
  contact: SDRContact;
  onClick: () => void;
}

export default function SDRContactCard({ contact, onClick }: SDRContactCardProps) {
  const badge = getStatusBadge(contact);
  const isAssigned = contact.status === 'assigned';

  return (
    <div
      className="card-hover p-4 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <StatusDot
          status={contact.riskLevel}
          pulse={contact.riskLevel === 'red'}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-gray-100 group-hover:text-white transition-colors">
              {contact.name}
            </span>
            <span className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
              badge.cls
            )}>
              {badge.text}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mb-2">
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail size={10} />
                <span className="truncate max-w-[180px]">{contact.email}</span>
              </span>
            )}
            {contact.company && (
              <span className="flex items-center gap-1">
                <Building2 size={10} />
                {contact.company}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Globe size={10} />
              {formatSource(contact.source)}
            </span>
            <span>Created {formatDate(contact.created)} ({timeAgo(contact.created)})</span>
            <span>
              Last Contact:{' '}
              {contact.lastContacted
                ? timeAgo(contact.lastContacted)
                : 'Never'}
            </span>
          </div>

          {isAssigned && contact.assignedDealStage && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span className="text-emerald-400 font-medium">
                Deal: {contact.assignedDealStage}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {contact.phone && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Phone size={10} />
              {contact.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
