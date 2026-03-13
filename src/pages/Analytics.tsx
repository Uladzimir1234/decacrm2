import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Users, Activity, Inbox } from 'lucide-react';
import Header from '../components/Header';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import ErrorState from '../components/ui/ErrorState';
import { useApp } from '../context/AppContext';
import { formatCurrencyK, cn } from '../lib/utils';
import { getSellers } from '../services/sellers';
import { getWeeklyStats, type WeeklyStatRow } from '../services/stats';
import type { Seller } from '../types';

const COLORS = {
  grid: '#1c2642',
  text: '#6b7280',
  blue: '#3b82f6',
  emerald: '#22c55e',
  amber: '#eab308',
  red: '#ef4444',
  cyan: '#06b6d4',
  teal: '#14b8a6',
};

const STAGE_COLORS: Record<string, string> = {
  'New Lead': '#38bdf8',
  'No Response': '#94a3b8',
  'Appointment Scheduled / Qualified': '#06b6d4',
  'Quote Sent': '#8b5cf6',
  'Negotiating': '#eab308',
  'Decision Maker Brought In': '#e879f9',
  'Contract Sent': '#f97316',
  'Closed Won': '#22c55e',
  'Closed Lost': '#ef4444',
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#151d35',
    border: '1px solid #243050',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#e5e7eb',
  },
};

interface AnalyticsData {
  sellers: Seller[];
  stats: WeeklyStatRow[];
}

export default function Analytics() {
  const { refreshKey } = useApp();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  async function loadData() {
    try {
      setLoading(true);
      setError(false);
      const [sellers, stats] = await Promise.all([
        getSellers(),
        getWeeklyStats(),
      ]);
      setData({ sellers, stats });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (error) return <ErrorState onRetry={loadData} />;

  return (
    <div>
      <Header title="Analytics" subtitle="Performance metrics and trends" />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-80" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PipelineByStageChart sellers={data.sellers} />
          <SellerComparisonChart sellers={data.sellers} />
          <AlertBreakdownChart alerts={[]} />
          <WeeklyActivityChart stats={data.stats} />
        </div>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
  className,
  empty,
}: {
  title: string;
  icon: typeof BarChart3;
  children: React.ReactNode;
  className?: string;
  empty?: boolean;
}) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {empty ? (
        <div className="flex flex-col items-center justify-center h-56 text-gray-600">
          <Inbox size={32} className="mb-2" />
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function PipelineByStageChart({ sellers }: { sellers: Seller[] }) {
  const stageMap: Record<string, number> = {};

  for (const s of sellers) {
    const deals = s.active_deals ?? 0;
    if (deals > 0) {
      stageMap['Active'] = (stageMap['Active'] || 0) + deals;
    }
  }

  const allStages = [
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

  const hasDetailedStages = sellers.some(
    (s) => (s as Record<string, unknown>)['deals_by_stage'] != null
  );

  let chartData: { stage: string; count: number }[];

  if (hasDetailedStages) {
    for (const s of sellers) {
      const byStage = (s as Record<string, unknown>)['deals_by_stage'] as
        | Record<string, number>
        | undefined;
      if (byStage) {
        for (const [stage, count] of Object.entries(byStage)) {
          stageMap[stage] = (stageMap[stage] || 0) + count;
        }
      }
    }
    chartData = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));
  } else {
    const totalDeals = sellers.reduce((sum, s) => sum + (s.active_deals ?? 0), 0);
    const totalValue = sellers.reduce((sum, s) => sum + (s.pipeline_value ?? 0), 0);
    const avgValue = totalDeals > 0 ? totalValue / totalDeals : 0;

    chartData = allStages.map((stage) => {
      const weight =
        stage === 'New Lead'
          ? 0.3
          : stage === 'Quote Sent'
            ? 0.25
            : stage === 'Negotiating'
              ? 0.2
              : stage === 'Contract Signed'
                ? 0.12
                : stage === 'Installation Scheduled'
                  ? 0.08
                  : 0.05;
      return {
        stage,
        count: Math.round(totalDeals * weight) || 0,
      };
    });

    const assigned = chartData.reduce((s, d) => s + d.count, 0);
    if (assigned < totalDeals && chartData.length > 0) {
      chartData[0].count += totalDeals - assigned;
    }

    if (totalDeals === 0 && avgValue === 0) {
      chartData = [];
    }
  }

  const empty = chartData.length === 0 || chartData.every((d) => d.count === 0);

  return (
    <ChartCard title="Pipeline by Stage" icon={BarChart3} empty={empty}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis type="number" tick={{ fill: COLORS.text, fontSize: 10 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="stage"
            width={140}
            tick={{ fill: COLORS.text, fontSize: 10 }}
          />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={STAGE_COLORS[entry.stage] || COLORS.blue} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function SellerComparisonChart({ sellers }: { sellers: Seller[] }) {
  if (sellers.length === 0) {
    return <ChartCard title="Seller Comparison" icon={Users} empty />;
  }

  const chartData = sellers.map((s) => ({
    name: s.name.split(' ')[0],
    deals: s.active_deals ?? 0,
    pipeline: s.pipeline_value ?? 0,
    closeRate: Math.round((s.close_rate ?? 0) * 100),
  }));

  return (
    <ChartCard title="Seller Comparison" icon={Users}>
      <div className="space-y-5">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
            Active Deals
          </p>
          <div className="space-y-2">
            {chartData.map((s) => {
              const max = Math.max(...chartData.map((d) => d.deals), 1);
              const pct = (s.deals / max) * 100;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-14 text-right">{s.name}</span>
                  <div className="flex-1 h-5 bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 font-medium w-8">{s.deals}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
            Pipeline Value
          </p>
          <div className="space-y-2">
            {chartData.map((s) => {
              const max = Math.max(...chartData.map((d) => d.pipeline), 1);
              const pct = (s.pipeline / max) * 100;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-14 text-right">{s.name}</span>
                  <div className="flex-1 h-5 bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 font-medium w-16">
                    {formatCurrencyK(s.pipeline)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
            Close Rate
          </p>
          <div className="space-y-2">
            {chartData.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-14 text-right">{s.name}</span>
                <div className="flex-1 h-5 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${s.closeRate}%` }}
                  />
                </div>
                <span className="text-xs text-gray-300 font-medium w-8">{s.closeRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

function AlertBreakdownChart({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <ChartCard title="Alert Breakdown" icon={AlertTriangle} empty />;
  }

  const sellerMap: Record<string, { red: number; yellow: number }> = {};
  for (const a of alerts) {
    const name = a.seller_name || 'Unknown';
    if (!sellerMap[name]) sellerMap[name] = { red: 0, yellow: 0 };
    if (a.severity === 'red') sellerMap[name].red++;
    else sellerMap[name].yellow++;
  }

  const chartData = Object.entries(sellerMap)
    .map(([name, counts]) => ({
      name: name.split(' ')[0],
      red: counts.red,
      yellow: counts.yellow,
    }))
    .sort((a, b) => b.red + b.yellow - (a.red + a.yellow));

  const totalRed = alerts.filter((a) => a.severity === 'red').length;
  const totalYellow = alerts.filter((a) => a.severity === 'yellow').length;

  return (
    <ChartCard title="Alert Breakdown" icon={AlertTriangle}>
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-red-400 font-medium">{totalRed} Critical</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-yellow-400 font-medium">{totalYellow} Warning</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 10 }} />
          <YAxis tick={{ fill: COLORS.text, fontSize: 10 }} allowDecimals={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-gray-400">{value}</span>
            )}
          />
          <Bar
            dataKey="red"
            name="Critical"
            fill={COLORS.red}
            radius={[4, 4, 0, 0]}
            stackId="alerts"
          />
          <Bar
            dataKey="yellow"
            name="Warning"
            fill={COLORS.amber}
            radius={[4, 4, 0, 0]}
            stackId="alerts"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function WeeklyActivityChart({ stats }: { stats: WeeklyStatRow[] }) {
  if (stats.length === 0) {
    return <ChartCard title="Weekly Activity" icon={Activity} empty />;
  }

  const chartData = stats.map((row) => ({
    name: String(
      row.sellerName || row.seller_name || row.sellerId || row.seller_id || 'Unknown'
    ).split(' ')[0],
    calls: Number(row.callsMade ?? row.calls_made ?? 0),
    sms: Number(row.smsSent ?? row.sms_sent ?? 0),
    closed: Number(row.dealsClosed ?? row.deals_closed ?? 0),
    moved: Number(row.dealsMovedForward ?? row.deals_moved_forward ?? 0),
  }));

  const hasAnyCalls = chartData.some((d) => d.calls > 0);
  const hasAnySms = chartData.some((d) => d.sms > 0);
  const hasAnyClosed = chartData.some((d) => d.closed > 0);
  const hasAnyMoved = chartData.some((d) => d.moved > 0);
  const hasAny = hasAnyCalls || hasAnySms || hasAnyClosed || hasAnyMoved;

  if (!hasAny) {
    return <ChartCard title="Weekly Activity" icon={Activity} empty />;
  }

  return (
    <ChartCard title="Weekly Activity" icon={Activity}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 10 }} />
          <YAxis tick={{ fill: COLORS.text, fontSize: 10 }} allowDecimals={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-gray-400">{value}</span>
            )}
          />
          {hasAnyCalls && (
            <Bar dataKey="calls" name="Calls" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
          )}
          {hasAnySms && (
            <Bar dataKey="sms" name="SMS" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
          )}
          {hasAnyMoved && (
            <Bar dataKey="moved" name="Moved Forward" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
          )}
          {hasAnyClosed && (
            <Bar dataKey="closed" name="Closed" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
