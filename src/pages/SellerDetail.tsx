import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Phone,
  Clock,
  TrendingUp,
  Target,
  Search,
  Bell,
  Mail,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import Header from '../components/Header';
import StatusDot from '../components/ui/StatusDot';
import Badge from '../components/ui/Badge';
import { SkeletonCard, SkeletonList } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import DealDrawer from '../components/deal/DealDrawer';
import PipelineFunnel from '../components/seller/PipelineFunnel';
import SDRDashboard from './SDRDashboard';
import { getSellerById, getSellerDeals } from '../services/sellers';
import { nudgeSeller } from '../services/notify';
import {
  formatCurrency,
  formatCurrencyK,
  timeAgo,
  getStageBadgeColor,
  cn,
} from '../lib/utils';
import { useApp } from '../context/AppContext';
import type { Seller, Deal } from '../types';

const STAGES = [
  'New Lead',
  'No Response',
  'Appointment Scheduled / Qualified',
  'Quote Sent',
  'Negotiating',
  'Decision Maker Brought In',
  'Contract Sent',
  'Closed Won',
  'Closed Lost',
];

const RISK_LEVELS = ['red', 'yellow', 'green'] as const;

const INTERACTION_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
};

export default function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const { refreshKey } = useApp();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState('');
  const [sortBy, setSortBy] = useState<string>('risk_level');
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [nudging, setNudging] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const closeDrawer = useCallback(() => setSelectedDeal(null), []);

  useEffect(() => {
    if (id) loadData();
  }, [id, refreshKey]);

  async function loadData() {
    try {
      setError(false);
      const sellerData = await getSellerById(id!);
      setSeller(sellerData);

      if (sellerData?.role !== 'SDR') {
        const dealsData = await getSellerDeals(id!);
        setDeals(dealsData);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (error) return <ErrorState onRetry={loadData} />;

  if (loading) {
    return (
      <div>
        <Header title="Loading..." subtitle="" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (seller?.role === 'SDR') {
    return <SDRDashboard seller={seller} />;
  }

  return (
    <SellerDealsView
      seller={seller}
      deals={deals}
      search={search}
      setSearch={setSearch}
      stageFilter={stageFilter}
      setStageFilter={setStageFilter}
      riskFilter={riskFilter}
      setRiskFilter={setRiskFilter}
      sortBy={sortBy}
      setSortBy={setSortBy}
      pipelineStage={pipelineStage}
      setPipelineStage={setPipelineStage}
      nudging={nudging}
      setNudging={setNudging}
      selectedDeal={selectedDeal}
      setSelectedDeal={setSelectedDeal}
      closeDrawer={closeDrawer}
    />
  );
}

interface SellerDealsViewProps {
  seller: Seller | null;
  deals: Deal[];
  search: string;
  setSearch: (v: string) => void;
  stageFilter: string[];
  setStageFilter: (v: string[]) => void;
  riskFilter: string;
  setRiskFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  pipelineStage: string | null;
  setPipelineStage: (v: string | null) => void;
  nudging: string | null;
  setNudging: (v: string | null) => void;
  selectedDeal: Deal | null;
  setSelectedDeal: (v: Deal | null) => void;
  closeDrawer: () => void;
}

function SellerDealsView({
  seller,
  deals,
  search,
  setSearch,
  stageFilter,
  setStageFilter,
  riskFilter,
  setRiskFilter,
  sortBy,
  setSortBy,
  pipelineStage,
  setPipelineStage,
  nudging,
  setNudging,
  selectedDeal,
  setSelectedDeal,
  closeDrawer,
}: SellerDealsViewProps) {
  async function handleNudge(deal: Deal) {
    setNudging(deal.id);
    await nudgeSeller(deal.id, deal.seller_id);
    setTimeout(() => setNudging(null), 2000);
  }

  const filteredDeals = useMemo(() => {
    let result = [...deals];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (d) =>
          (d.contact_name || '').toLowerCase().includes(s) ||
          (d.company_name || '').toLowerCase().includes(s)
      );
    }
    if (pipelineStage) {
      result = result.filter(
        (d) => (d.stage || '').toLowerCase() === pipelineStage.toLowerCase()
      );
    }
    if (stageFilter.length > 0) {
      result = result.filter((d) => stageFilter.includes(d.stage));
    }
    if (riskFilter) {
      result = result.filter((d) => d.risk_level === riskFilter);
    }

    const riskOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
    switch (sortBy) {
      case 'risk_level':
        result.sort((a, b) => (riskOrder[a.risk_level] ?? 3) - (riskOrder[b.risk_level] ?? 3));
        break;
      case 'days_since_contact':
        result.sort(
          (a, b) =>
            new Date(a.last_contact_date || 0).getTime() -
            new Date(b.last_contact_date || 0).getTime()
        );
        break;
      case 'amount':
        result.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case 'stage':
        result.sort(
          (a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage)
        );
        break;
    }

    return result;
  }, [deals, search, pipelineStage, stageFilter, riskFilter, sortBy]);

  return (
    <div>
      <Header
        title={seller?.name || 'Seller'}
        subtitle={seller ? `${seller.active_deals || deals.length} active deals` : ''}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Target}
          label="Active Deals"
          value={(seller?.active_deals || deals.length).toString()}
          color="text-accent-light"
        />
        <StatCard
          icon={TrendingUp}
          label="Pipeline"
          value={formatCurrencyK(seller?.pipeline_value || 0)}
          color="text-emerald-400"
        />
        <StatCard
          icon={Clock}
          label="Avg Response"
          value={`${seller?.avg_response_time || 0}h`}
          color="text-amber-400"
        />
        <StatCard
          icon={Phone}
          label="Close Rate"
          value={`${Math.round((seller?.close_rate || 0) * 100)}%`}
          color="text-sky-400"
        />
      </div>

      <ErrorBoundary>
        <PipelineFunnel
          deals={deals}
          activeStage={pipelineStage}
          onStageClick={setPipelineStage}
        />
      </ErrorBoundary>

      {pipelineStage && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">
            Showing: <span className="font-medium text-gray-200">{pipelineStage}</span>
          </span>
          <button
            onClick={() => setPipelineStage(null)}
            className="w-4 h-4 rounded-full bg-navy-600 flex items-center justify-center hover:bg-navy-500 transition-colors"
          >
            <X size={10} className="text-gray-400" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark w-full pl-8 text-sm"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="input-dark text-sm"
        >
          <option value="">All Risk Levels</option>
          {RISK_LEVELS.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={stageFilter.join(',')}
          onChange={(e) =>
            setStageFilter(e.target.value ? e.target.value.split(',') : [])
          }
          className="input-dark text-sm"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-dark text-sm"
        >
          <option value="risk_level">Sort: Risk Level</option>
          <option value="days_since_contact">Sort: Last Contact</option>
          <option value="amount">Sort: Amount</option>
          <option value="stage">Sort: Stage</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredDeals.map((deal) => {
          const InteractionIcon =
            INTERACTION_ICONS[deal.last_interaction_type] || Phone;
          return (
            <div
              key={deal.id}
              className="card-hover p-4 flex items-center gap-3 lg:gap-4 cursor-pointer"
              onClick={() => setSelectedDeal(deal)}
            >
              <StatusDot
                status={deal.risk_level || 'green'}
                pulse={deal.risk_level === 'red'}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-100">
                    {deal.contact_name || 'Unknown Contact'}
                  </span>
                  {deal.company_name && (
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {deal.company_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <InteractionIcon size={10} />
                  <span>{timeAgo(deal.last_contact_date)}</span>
                  <span>&middot;</span>
                  <span>{deal.days_in_stage ?? 0}d in stage</span>
                </div>
              </div>

              <span className="text-sm font-semibold text-gray-200 hidden sm:block">
                {formatCurrency(deal.amount ?? 0)}
              </span>

              <Badge className={cn(getStageBadgeColor(deal.stage || ''), 'hidden sm:inline-flex')}>
                {deal.stage || 'Unknown'}
              </Badge>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNudge(deal);
                }}
                disabled={nudging === deal.id}
                className={cn(
                  'flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200',
                  nudging === deal.id
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-navy-700 text-gray-400 border-navy-600 hover:text-gray-200 hover:bg-navy-600'
                )}
              >
                <Bell size={12} className="inline mr-1" />
                {nudging === deal.id ? 'Sent!' : 'Nudge'}
              </button>
            </div>
          );
        })}
        {filteredDeals.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500">
              No deals match your filters
            </p>
          </div>
        )}
      </div>

      <DealDrawer deal={selectedDeal} onClose={closeDrawer} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold text-gray-100">{value}</span>
    </div>
  );
}
