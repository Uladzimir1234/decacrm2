import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import InsightCard from './InsightCard';
import { cn } from '../../lib/utils';
import type { IntelligenceInsight } from '../../types';

interface InsightSectionProps {
  title: string;
  icon: LucideIcon;
  insights: IntelligenceInsight[];
  accentColor: 'red' | 'amber' | 'emerald' | 'sky';
  bgTint: string;
  onViewDeal: (dealId: string) => void;
  defaultCollapsed?: boolean;
}

export default function InsightSection({
  title,
  icon: Icon,
  insights,
  accentColor,
  bgTint,
  onViewDeal,
  defaultCollapsed = false,
}: InsightSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (insights.length === 0) return null;

  const iconColorMap = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    sky: 'text-sky-400',
  };

  const countBgMap = {
    red: 'bg-red-500/15 text-red-400',
    amber: 'bg-amber-500/15 text-amber-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    sky: 'bg-sky-500/15 text-sky-400',
  };

  return (
    <div className={cn('rounded-xl p-4 lg:p-5 transition-colors', bgTint)}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={16} className={iconColorMap[accentColor]} />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider group-hover:text-gray-200 transition-colors">
            {title}
          </h2>
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
              countBgMap[accentColor]
            )}
          >
            {insights.length}
          </span>
        </div>
        <div className="text-gray-500 group-hover:text-gray-400 transition-colors">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {insights.map((insight) => (
            <InsightCard
              key={insight.dealId + insight.type}
              insight={insight}
              accentColor={accentColor}
              onViewDeal={onViewDeal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
