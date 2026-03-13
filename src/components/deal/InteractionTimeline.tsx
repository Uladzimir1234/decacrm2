import { useState } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { formatDateTime, formatDuration, cn } from '../../lib/utils';
import type { Interaction } from '../../types';

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Phone; bg: string; label: string }
> = {
  call: { icon: Phone, bg: 'bg-sky-500/15 text-sky-400', label: 'Call' },
  sms: {
    icon: MessageSquare,
    bg: 'bg-emerald-500/15 text-emerald-400',
    label: 'SMS',
  },
  email: { icon: Mail, bg: 'bg-amber-500/15 text-amber-400', label: 'Email' },
  note: {
    icon: FileText,
    bg: 'bg-gray-500/15 text-gray-400',
    label: 'Note',
  },
};

const CALL_SUMMARY_PREVIEW = 100;

function CallSummarySnippet({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > CALL_SUMMARY_PREVIEW;

  return (
    <div className="mt-1.5 pl-0.5">
      <p className="text-[11px] text-gray-500 leading-relaxed">
        {expanded || !isLong ? text : `${text.slice(0, CALL_SUMMARY_PREVIEW)}...`}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-accent-light hover:text-accent transition-colors mt-0.5"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

interface InteractionTimelineProps {
  interactions: Interaction[];
}

export default function InteractionTimeline({
  interactions,
}: InteractionTimelineProps) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Interaction Timeline
      </h3>

      {interactions.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No interactions recorded
        </p>
      ) : (
        <div className="relative">
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-navy-600/50" />

          <div className="space-y-4">
            {interactions.map((interaction) => {
              const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note;
              const Icon = config.icon;
              const DirectionIcon =
                interaction.direction === 'outbound'
                  ? ArrowUpRight
                  : ArrowDownLeft;

              const callSummaryText =
                interaction.type === 'call' && interaction.callSummary
                  ? interaction.callSummary
                  : null;

              return (
                <div key={interaction.id} className="flex gap-3 relative">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                      config.bg
                    )}
                  >
                    <Icon size={14} />
                  </div>

                  <div
                    className={cn(
                      'flex-1 rounded-lg p-3 border',
                      interaction.type === 'call'
                        ? 'bg-sky-500/5 border-sky-500/10'
                        : interaction.type === 'email'
                          ? 'bg-amber-500/5 border-amber-500/10'
                          : interaction.type === 'sms'
                            ? 'bg-emerald-500/5 border-emerald-500/10'
                            : 'bg-navy-800/50 border-navy-700/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400">
                        {config.label}
                      </span>
                      <DirectionIcon
                        size={10}
                        className={
                          interaction.direction === 'outbound'
                            ? 'text-sky-400'
                            : 'text-emerald-400'
                        }
                      />
                      <span className="text-[10px] text-gray-600">
                        {interaction.direction === 'outbound'
                          ? 'Outbound'
                          : 'Inbound'}
                      </span>
                      {interaction.duration && (
                        <span className="text-[10px] text-gray-500 ml-auto tabular-nums">
                          {formatDuration(interaction.duration)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {(interaction.summary || '').replace(/<[^>]*>/g, '').trim()}
                    </p>
                    {callSummaryText && (
                      <CallSummarySnippet text={callSummaryText} />
                    )}
                    <p className="text-[10px] text-gray-600 mt-2">
                      {formatDateTime(interaction.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
