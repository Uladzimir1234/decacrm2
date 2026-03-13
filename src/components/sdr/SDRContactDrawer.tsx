import { useEffect, useRef, useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import StatusDot from '../ui/StatusDot';
import SDRContactTimeline from './SDRContactTimeline';
import { cn, formatDate, timeAgo } from '../../lib/utils';
import { getContactInteractions } from '../../services/contacts';
import type { SDRContact, SDRContactInteraction } from '../../types';

interface SDRContactDrawerProps {
  contact: SDRContact | null;
  onClose: () => void;
}

function getStatusConfig(contact: SDRContact) {
  if (contact.status === 'assigned' && contact.assignedTo) {
    return {
      label: `Assigned to ${contact.assignedTo}`,
      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    };
  }
  if (contact.status === 'contacted') {
    return {
      label: 'In Progress',
      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    };
  }
  return {
    label: 'New',
    cls: 'bg-red-500/10 text-red-400 border-red-500/25',
  };
}

function formatSource(source: string): string {
  return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SDRContactDrawer({ contact, onClose }: SDRContactDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [interactions, setInteractions] = useState<SDRContactInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<{ calls: number; sms: number; emails: number; notes: number } | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (contact) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [contact, onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    if (!contact) {
      setInteractions([]);
      setBreakdown(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setInteractions([]);
    setBreakdown(null);

    getContactInteractions(contact.id).then((result) => {
      if (!cancelled && result) {
        const sorted = [...result.interactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setInteractions(sorted);
        setBreakdown(result.breakdown);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [contact?.id]);

  const status = contact ? getStatusConfig(contact) : null;

  return (
    <>
      <div
        onClick={handleBackdropClick}
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          contact ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-navy-900 border-l border-navy-600/40 z-50',
          'shadow-2xl shadow-black/40 overflow-y-auto',
          'transition-transform duration-300 ease-out',
          contact ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {contact && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-navy-600/40">
              <div className="flex items-center gap-3 min-w-0">
                <StatusDot status={contact.riskLevel} pulse={contact.riskLevel === 'red'} />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-100 truncate">
                    {contact.name}
                  </h2>
                  {contact.company && (
                    <p className="text-xs text-gray-500 truncate">{contact.company}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-navy-700 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-5 space-y-5 overflow-y-auto">
              <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium', status!.cls)}>
                {contact.status === 'assigned' && <ArrowRight size={12} />}
                {status!.label}
              </div>

              <div className="card p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact Details
                </h3>
                <div className="space-y-2.5">
                  <DetailRow icon={User} label="Name" value={contact.name} />
                  {contact.email && <DetailRow icon={Mail} label="Email" value={contact.email} />}
                  {contact.phone && <DetailRow icon={Phone} label="Phone" value={contact.phone} />}
                  {contact.company && <DetailRow icon={Building2} label="Company" value={contact.company} />}
                  {(contact.city || contact.state) && (
                    <DetailRow
                      icon={MapPin}
                      label="Location"
                      value={[contact.city, contact.state].filter(Boolean).join(', ')}
                    />
                  )}
                  {contact.source && <DetailRow icon={Globe} label="Source" value={formatSource(contact.source)} />}
                </div>
              </div>

              <div className="card p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Timeline
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-navy-800/50 rounded-lg p-2.5">
                    <span className="text-gray-600 block">Created</span>
                    <span className="text-gray-300 font-medium">
                      {formatDate(contact.created)} ({timeAgo(contact.created)})
                    </span>
                  </div>
                  <div className="bg-navy-800/50 rounded-lg p-2.5">
                    <span className="text-gray-600 block">Last Contact</span>
                    <span className="text-gray-300 font-medium">
                      {contact.lastContacted ? timeAgo(contact.lastContacted) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {breakdown && (
                <div className="flex gap-2">
                  <MiniStat label="Calls" value={breakdown.calls} color="text-sky-400" />
                  <MiniStat label="SMS" value={breakdown.sms} color="text-emerald-400" />
                  <MiniStat label="Emails" value={breakdown.emails} color="text-amber-400" />
                  <MiniStat label="Notes" value={breakdown.notes} color="text-gray-400" />
                </div>
              )}

              {contact.status === 'assigned' && contact.assignedDealStage && (
                <div className="card p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Assignment
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <ArrowRight size={14} className="text-emerald-400" />
                    <span className="text-gray-300">
                      Assigned to <span className="text-gray-100 font-medium">{contact.assignedTo}</span>
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="text-emerald-400 font-medium">{contact.assignedDealStage}</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={24} className="text-accent animate-spin mb-3" />
                  <p className="text-xs text-gray-500">Loading interactions...</p>
                </div>
              ) : (
                <SDRContactTimeline interactions={interactions} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={13} className="text-gray-600 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider block">{label}</span>
        <span className="text-sm text-gray-300">{value}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 card p-2.5 text-center">
      <span className={cn('text-lg font-bold tabular-nums', color)}>{value}</span>
      <span className="text-[10px] text-gray-600 block uppercase tracking-wider">{label}</span>
    </div>
  );
}
