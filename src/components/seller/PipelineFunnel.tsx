import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Deal } from '../../types';

const PIPELINE_STAGES = [
  { key: 'New Lead', label: 'New Lead', color: '#3B82F6', outcome: false },
  { key: 'No Response', label: 'No Response', color: '#94A3B8', outcome: false },
  { key: 'Appointment Scheduled / Qualified', label: 'Appt Scheduled', color: '#06B6D4', outcome: false },
  { key: 'Quote Sent', label: 'Quote Sent', color: '#8B5CF6', outcome: false },
  { key: 'Negotiating', label: 'Negotiating', color: '#F59E0B', outcome: false },
  { key: 'Decision Maker Brought In', label: 'Decision Maker', color: '#E879F9', outcome: false },
  { key: 'Contract Sent', label: 'Contract Sent', color: '#F97316', outcome: false },
  { key: 'Closed Won', label: 'Won', color: '#10B981', outcome: true },
  { key: 'Closed Lost', label: 'Lost', color: '#EF4444', outcome: true },
];

interface PipelineFunnelProps {
  deals: Deal[];
  activeStage: string | null;
  onStageClick: (stage: string | null) => void;
}

export default function PipelineFunnel({ deals, activeStage, onStageClick }: PipelineFunnelProps) {
  const counts: Record<string, number> = {};
  for (const d of deals) {
    const stage = d.stage || 'New Lead';
    const matched = PIPELINE_STAGES.find(
      (s) => s.key.toLowerCase() === stage.toLowerCase()
    );
    const key = matched ? matched.key : stage;
    counts[key] = (counts[key] || 0) + 1;
  }

  const activeStages = PIPELINE_STAGES.filter((s) => !s.outcome);
  const outcomeStages = PIPELINE_STAGES.filter((s) => s.outcome);

  function handleClick(stageKey: string) {
    onStageClick(activeStage === stageKey ? null : stageKey);
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-0.5 overflow-x-auto pb-2 scrollbar-thin">
        {activeStages.map((stage, i) => {
          const count = counts[stage.key] || 0;
          const isActive = activeStage === stage.key;
          const dimmed = count === 0 && !isActive;

          return (
            <div key={stage.key} className="flex items-center flex-shrink-0">
              <button
                onClick={() => handleClick(stage.key)}
                className={cn(
                  'relative rounded-lg px-3 py-2.5 border transition-all duration-200 min-w-[90px]',
                  'flex flex-col items-center gap-0.5',
                  dimmed && 'opacity-40',
                  isActive
                    ? 'ring-1 shadow-lg'
                    : 'hover:brightness-125'
                )}
                style={{
                  backgroundColor: `${stage.color}15`,
                  borderColor: isActive ? stage.color : `${stage.color}30`,
                  boxShadow: isActive ? `0 0 12px ${stage.color}25` : undefined,
                  ringColor: isActive ? stage.color : undefined,
                }}
              >
                <span className="text-[10px] text-gray-400 uppercase tracking-wider leading-tight whitespace-nowrap">
                  {stage.label}
                </span>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: count > 0 || isActive ? stage.color : '#6B7280' }}
                >
                  {count}
                </span>
              </button>

              {i < activeStages.length - 1 && (
                <ChevronRight
                  size={14}
                  className="text-gray-600 mx-0.5 flex-shrink-0"
                />
              )}
            </div>
          );
        })}

        <div className="w-px h-10 bg-navy-600/50 mx-2 flex-shrink-0" />

        {outcomeStages.map((stage, i) => {
          const count = counts[stage.key] || 0;
          const isActive = activeStage === stage.key;
          const dimmed = count === 0 && !isActive;

          return (
            <div key={stage.key} className="flex items-center flex-shrink-0">
              <button
                onClick={() => handleClick(stage.key)}
                className={cn(
                  'relative rounded-lg px-3 py-2.5 border transition-all duration-200 min-w-[80px]',
                  'flex flex-col items-center gap-0.5',
                  dimmed && 'opacity-40',
                  isActive
                    ? 'ring-1 shadow-lg'
                    : 'hover:brightness-125'
                )}
                style={{
                  backgroundColor: `${stage.color}15`,
                  borderColor: isActive ? stage.color : `${stage.color}30`,
                  boxShadow: isActive ? `0 0 12px ${stage.color}25` : undefined,
                }}
              >
                <span className="text-[10px] text-gray-400 uppercase tracking-wider leading-tight whitespace-nowrap">
                  {stage.label}
                </span>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: count > 0 || isActive ? stage.color : '#6B7280' }}
                >
                  {count}
                </span>
              </button>

              {i < outcomeStages.length - 1 && (
                <ChevronRight
                  size={14}
                  className="text-gray-600 mx-0.5 flex-shrink-0"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
