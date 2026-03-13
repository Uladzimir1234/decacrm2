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
import type { SDRContactInteraction } from '../../types';

const TYPE_CONFIG: Record<string, { icon: typeof Phone; bg: string; label: string }> = {
  call: { icon: Phone, bg: 'bg-sky-500/15 text-sky-400', label: 'Call' },
  sms: { icon: MessageSquare, bg: 'bg-emerald-500/15 text-emerald-400', label: 'SMS' },
  email: { icon: Mail, bg: 'bg-amber-500/15 text-amber-400', label: 'Email' },
  note: { icon: FileText, bg: 'bg-gray-500/15 text-gray-400', label: 'Note' },
};

const PREVIEW_LEN = 120;

function ExpandableSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > PREVIEW_LEN;

  return (
    <div className="mt-1.5">
      <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-wrap">
        {expanded || !isLong ? text : `${text.slice(0, PREVIEW_LEN)}...`}
      </p>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-[10px] text-accent-light hover:text-accent transition-colors mt-0.5"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

interface SDRContactTimelineProps {
  interactions: SDRContactInteraction[];
}

export default function SDRContactTimeline({ interactions }: SDRContactTimelineProps) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Communication Timeline
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
              const DirectionIcon = interaction.direction === 'outbound' ? ArrowUpRight : ArrowDownLeft;

              const callerName = interaction.metadata?.callerName as string | undefined;

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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-gray-400">
                        {interaction.label || config.label}
                      </span>
                      <DirectionIcon
                        size={10}
                        className={interaction.direction === 'outbound' ? 'text-sky-400' : 'text-emerald-400'}
                      />
                      <span className="text-[10px] text-gray-600">
                        {interaction.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                      </span>
                      {callerName && (
                        <span className="text-[10px] text-gray-500 bg-navy-700/50 px-1.5 py-0.5 rounded">
                          {callerName}
                        </span>
                      )}
                      {interaction.source && (
                        <span className="text-[10px] text-gray-600 ml-auto">
                          via {interaction.source}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">
                      {(interaction.summary || '').replace(/<[^>]*>/g, '').trim()}
                    </p>

                    {interaction.callSummary && (
                      <ExpandableSummary text={interaction.callSummary} />
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-600">
                        {formatDateTime(interaction.date)}
                      </span>
                      {interaction.duration && interaction.duration > 0 && (
                        <span className="text-[10px] text-gray-500 tabular-nums">
                          {formatDuration(interaction.duration)}
                        </span>
                      )}
                    </div>
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
