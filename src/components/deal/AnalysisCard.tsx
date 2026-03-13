import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DealAnalysis } from '../../types';

const SCORE_CONFIG = {
  green: {
    bg: 'bg-emerald-500/20 border-emerald-500/40',
    text: 'text-emerald-400',
    label: 'Healthy',
    icon: CheckCircle,
  },
  yellow: {
    bg: 'bg-amber-500/20 border-amber-500/40',
    text: 'text-amber-400',
    label: 'Attention',
    icon: Clock,
  },
  red: {
    bg: 'bg-red-500/20 border-red-500/40',
    text: 'text-red-400',
    label: 'At Risk',
    icon: AlertTriangle,
  },
};

interface AnalysisCardProps {
  analysis: DealAnalysis;
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const config = SCORE_CONFIG[analysis.risk_score];
  const Icon = config.icon;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        AI Analysis
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center',
            config.bg
          )}
        >
          <Icon size={20} className={config.text} />
          <span className={cn('text-[10px] font-bold mt-0.5', config.text)}>
            {config.label}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-300">
            <strong className="text-gray-100">
              {analysis.days_since_contact}
            </strong>{' '}
            days since last contact
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
          Suggested Action
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          {analysis.suggested_action}
        </p>
      </div>

      {(analysis.signals || []).length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Key Signals
          </p>
          <ul className="space-y-1.5">
            {(analysis.signals || []).map((signal, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-400"
              >
                <span className="w-1 h-1 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
