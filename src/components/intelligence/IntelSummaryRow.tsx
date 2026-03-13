import { Flame, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrencyK } from '../../lib/utils';
import type { IntelligenceSummary } from '../../types';

interface IntelSummaryRowProps {
  summary: IntelligenceSummary;
  winsCount: number;
}

const cards = [
  {
    key: 'urgent',
    label: 'URGENT NOW',
    icon: Flame,
    getValue: (s: IntelligenceSummary) => s.totalUrgent.toString(),
    getSub: (s: IntelligenceSummary) => formatCurrencyK(s.urgentValue),
    bg: 'bg-red-500/10 border-red-500/25',
    iconColor: 'text-red-400',
    valueColor: 'text-red-300',
  },
  {
    key: 'opportunity',
    label: 'OPPORTUNITY',
    icon: DollarSign,
    getValue: (_s: IntelligenceSummary) => '',
    getSub: (s: IntelligenceSummary) => 'closeable pipeline',
    getValueFormatted: (s: IntelligenceSummary) => formatCurrencyK(s.opportunityValue),
    bg: 'bg-emerald-500/10 border-emerald-500/25',
    iconColor: 'text-emerald-400',
    valueColor: 'text-emerald-300',
  },
  {
    key: 'risk',
    label: 'AT RISK',
    icon: AlertTriangle,
    getValue: (s: IntelligenceSummary) => s.totalRisks.toString(),
    getSub: (s: IntelligenceSummary) => formatCurrencyK(s.atRiskValue),
    bg: 'bg-amber-500/10 border-amber-500/25',
    iconColor: 'text-amber-400',
    valueColor: 'text-amber-300',
  },
] as const;

export default function IntelSummaryRow({ summary, winsCount }: IntelSummaryRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.key}
          className={`rounded-xl border p-4 lg:p-5 ${c.bg} transition-all duration-200`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {c.label}
            </span>
            <c.icon size={16} className={c.iconColor} />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-2xl lg:text-3xl font-bold ${c.valueColor}`}>
              {'getValueFormatted' in c && c.getValueFormatted
                ? c.getValueFormatted(summary)
                : c.getValue(summary)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {'getValueFormatted' in c ? c.getSub(summary) : c.getSub(summary)}
          </p>
        </div>
      ))}

      <div className="rounded-xl border p-4 lg:p-5 bg-sky-500/10 border-sky-500/25 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            MOMENTUM
          </span>
          <TrendingUp size={16} className="text-sky-400" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl lg:text-3xl font-bold text-sky-300">
            {winsCount}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">positive signals</p>
      </div>
    </div>
  );
}
