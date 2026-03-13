import { cn, formatCurrencyK } from '../../lib/utils';
import type { SellerScore } from '../../types';

interface SellerScoreCardsProps {
  scores: Record<string, SellerScore>;
}

const gradeColors: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-500/30' },
  B: { bg: 'bg-sky-500', text: 'text-white', ring: 'ring-sky-500/30' },
  C: { bg: 'bg-amber-500', text: 'text-navy-950', ring: 'ring-amber-500/30' },
  D: { bg: 'bg-red-500', text: 'text-white', ring: 'ring-red-500/30' },
  F: { bg: 'bg-red-700', text: 'text-white', ring: 'ring-red-700/30' },
};

function getGradeStyle(grade: string) {
  return gradeColors[grade.toUpperCase()] || gradeColors.C;
}

export default function SellerScoreCards({ scores }: SellerScoreCardsProps) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Seller Scorecards
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map(([id, score]) => {
          const style = getGradeStyle(score.grade);
          return (
            <div key={id} className="card p-4 transition-all duration-200 hover:border-navy-500/50">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ring-2',
                    style.bg,
                    style.text,
                    style.ring
                  )}
                >
                  {score.grade}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-200 truncate">
                    {score.name}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {score.contacted3d}/{score.activeDeals} contacted in 3 days ({score.contactRate3d}%)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                    Active
                  </span>
                  <span className="text-sm font-semibold text-gray-300">
                    {score.activeDeals} deals
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                    Pipeline
                  </span>
                  <span className="text-sm font-semibold text-gray-300">
                    {formatCurrencyK(score.totalValue)}
                  </span>
                </div>
              </div>

              {(score.urgentCount ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-red-400 font-medium">
                    {score.urgentCount} urgent
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
