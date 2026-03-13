import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import {
  X,
  User,
  DollarSign,
  Layers,
  AlertTriangle,
  Clock,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import Badge from '../ui/Badge';
import StatusDot from '../ui/StatusDot';
import InteractionTimeline from './InteractionTimeline';
import DeepDiveButton from './DeepDiveButton';
import EnrichedContactCard from './EnrichedContactCard';
import EnrichedSummaryBar from './EnrichedSummaryBar';
import EnrichedTimeline from './EnrichedTimeline';
import NurtureStatusBadge from '../nurture/NurtureStatusBadge';
import NurtureHistory from '../nurture/NurtureHistory';
import EmailEngagement from './EmailEngagement';
import {
  formatCurrency,
  formatDate,
  timeAgo,
  getStageBadgeColor,
  getRiskBg,
  cn,
} from '../../lib/utils';
import { getDealInteractions } from '../../services/deals';
import type { Deal, Interaction, EnrichedProfile } from '../../types';

interface DealDrawerProps {
  deal: Deal | null;
  onClose: () => void;
}

export default function DealDrawer({ deal, onClose }: DealDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedProfile | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (deal) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deal, onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    if (!deal) {
      setInteractions([]);
      setEnriched(null);
      return;
    }

    let cancelled = false;
    setLoadingInteractions(true);
    setInteractions([]);

    getDealInteractions(deal.id).then((result) => {
      if (!cancelled) {
        const items = result?.interactions || [];
        const sorted = [...items].sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
        });
        setInteractions(sorted);
        setLoadingInteractions(false);
      }
    }).catch(() => {
      if (!cancelled) setLoadingInteractions(false);
    });

    return () => {
      cancelled = true;
    };
  }, [deal?.id]);

  const riskLabel =
    deal?.risk_level === 'red'
      ? 'High Risk'
      : deal?.risk_level === 'yellow'
        ? 'Medium Risk'
        : 'Low Risk';

  return (
    <>
      <div
        onClick={handleBackdropClick}
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          deal ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-navy-900 border-l border-navy-600/40 z-50',
          'shadow-2xl shadow-black/40 overflow-y-auto',
          'transition-transform duration-300 ease-out',
          deal ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {deal && (
          <DrawerErrorBoundary dealId={deal.id} onClose={onClose}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b border-navy-600/40">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusDot status={deal.risk_level || 'green'} pulse={deal.risk_level === 'red'} />
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-100 truncate">
                      {deal.contact_name || 'Unknown Contact'}
                    </h2>
                    {deal.company_name && (
                      <p className="text-xs text-gray-500 truncate">{deal.company_name}</p>
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
                <DeepDiveButton
                  dealId={deal.id}
                  onLoaded={setEnriched}
                  onClear={() => setEnriched(null)}
                />

                <NurtureStatusBadge dealId={deal.id} />

                <div className="grid grid-cols-2 gap-3">
                  <InfoTile
                    icon={DollarSign}
                    label="Amount"
                    value={formatCurrency(deal.amount ?? 0)}
                    color="text-emerald-400"
                  />
                  <InfoTile
                    icon={Layers}
                    label="Stage"
                    value={deal.stage || 'Unknown'}
                    color="text-sky-400"
                    badge
                    badgeClass={getStageBadgeColor(deal.stage || '')}
                  />
                  <InfoTile
                    icon={AlertTriangle}
                    label="Risk Level"
                    value={riskLabel}
                    color={
                      deal.risk_level === 'red'
                        ? 'text-red-400'
                        : deal.risk_level === 'yellow'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }
                    badge
                    badgeClass={getRiskBg(deal.risk_level || 'green')}
                  />
                  <InfoTile
                    icon={Clock}
                    label="Days in Stage"
                    value={`${deal.days_in_stage ?? 0} days`}
                    color="text-amber-400"
                  />
                </div>

                {enriched ? (
                  <>
                    <EnrichedContactCard
                      contact={enriched.contact}
                      company={enriched.company}
                      existingDeal={deal}
                    />
                    <EnrichedSummaryBar summary={enriched.summary} />
                  </>
                ) : (
                  <div className="card p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact Details
                    </h3>
                    <div className="space-y-2">
                      <DetailRow icon={User} label="Name" value={deal.contact_name || 'Unknown'} />
                      {deal.company_name && (
                        <DetailRow icon={Layers} label="Company" value={deal.company_name} />
                      )}
                    </div>
                  </div>
                )}

                {deal.email && <EmailEngagement email={deal.email} />}

                <div className="card p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Timeline
                  </h3>
                  <div className="space-y-2">
                    <DetailRow
                      icon={CalendarDays}
                      label="Last Contact"
                      value={deal.last_contact_date ? `${formatDate(deal.last_contact_date)} (${timeAgo(deal.last_contact_date)})` : 'No contact recorded'}
                    />
                    <DetailRow
                      icon={Clock}
                      label="In Pipeline"
                      value={`${deal.days_in_pipeline ?? (deal.created_at ? Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0)} days`}
                    />
                    <DetailRow
                      icon={Clock}
                      label="In Current Stage"
                      value={`${deal.days_in_stage ?? 0} days`}
                    />
                  </div>
                </div>

                {enriched ? (
                  <EnrichedTimeline profile={enriched} />
                ) : loadingInteractions ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 size={24} className="text-accent animate-spin mb-3" />
                    <p className="text-xs text-gray-500">Loading interactions...</p>
                  </div>
                ) : (
                  <InteractionTimeline interactions={interactions} />
                )}

                <NurtureHistory dealId={deal.id} />
              </div>
            </div>
          </DrawerErrorBoundary>
        )}
      </div>
    </>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  color,
  badge,
  badgeClass,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: string;
  badge?: boolean;
  badgeClass?: string;
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={12} className={color} />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      {badge ? (
        <Badge className={cn(badgeClass, 'text-xs')}>{value}</Badge>
      ) : (
        <span className="text-sm font-semibold text-gray-100">{value}</span>
      )}
    </div>
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
        <span className="text-[10px] text-gray-600 uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-sm text-gray-300">{value}</span>
      </div>
    </div>
  );
}

interface DrawerErrorBoundaryProps {
  dealId: string;
  onClose: () => void;
  children: ReactNode;
}

interface DrawerErrorBoundaryState {
  hasError: boolean;
}

class DrawerErrorBoundary extends Component<DrawerErrorBoundaryProps, DrawerErrorBoundaryState> {
  constructor(props: DrawerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): DrawerErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DealDrawer render error:', error, info);
  }

  componentDidUpdate(prevProps: DrawerErrorBoundaryProps) {
    if (prevProps.dealId !== this.props.dealId && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col h-full items-center justify-center p-8">
          <AlertTriangle size={28} className="text-amber-400 mb-3" />
          <p className="text-gray-400 mb-4 text-sm">Error loading deal details</p>
          <button
            onClick={this.props.onClose}
            className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
