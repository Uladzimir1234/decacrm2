import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Phone } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import type { IntelligenceInsight } from '../../types';

interface InsightCardProps {
  insight: IntelligenceInsight;
  accentColor: 'red' | 'amber' | 'emerald' | 'sky';
  onViewDeal: (dealId: string) => void;
}

const borderMap = {
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
  emerald: 'border-l-emerald-500',
  sky: 'border-l-sky-500',
};

const dotMap = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
};

const sellerBgMap = {
  red: 'bg-red-500/10 text-red-300 border-red-500/30',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
};

export default function InsightCard({ insight, accentColor, onViewDeal }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'card border-l-[3px] p-4 transition-all duration-200 hover:border-navy-500/50',
        borderMap[accentColor]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', dotMap[accentColor])} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-100 truncate">
                  {insight.dealName}
                </span>
                <span className="text-sm font-bold text-gray-300">
                  {formatCurrency(insight.amount)}
                </span>
              </div>
              {insight.stage && (
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {insight.stage}
                  {insight.daysSinceContact > 0 && (
                    <> &middot; {insight.daysSinceContact}d since contact</>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-md border',
                  sellerBgMap[accentColor]
                )}
              >
                {insight.seller}
              </span>
              <button
                onClick={() => onViewDeal(insight.dealId)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-navy-700 transition-colors"
                title="View deal"
              >
                <ExternalLink size={13} />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed mt-1">
            {insight.message}
          </p>

          {insight.suggestion && (
            <p className="text-xs text-gray-500 italic mt-2 flex items-start gap-1.5">
              <Phone size={10} className="mt-0.5 flex-shrink-0 text-gray-600" />
              {insight.suggestion}
            </p>
          )}

          {insight.lastCallSummary && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-400 transition-colors uppercase tracking-wider font-medium"
              >
                Last call
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              {expanded && (
                <p className="text-xs text-gray-500 mt-1.5 pl-3 border-l border-navy-600/50 leading-relaxed animate-fade-in">
                  {insight.lastCallSummary}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
