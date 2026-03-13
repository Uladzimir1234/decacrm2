import { Mail, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import type { NurtureSequence } from '../../types';

interface SequenceCardsProps {
  sequences: NurtureSequence[];
}

const SEQUENCE_META: Record<string, { icon: typeof Mail; color: string; desc: string }> = {
  NEW_LEAD: {
    icon: Mail,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    desc: 'Automated welcome flow for new leads entering the pipeline',
  },
  QUOTE_FOLLOWUP: {
    icon: MessageSquare,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    desc: 'Follow-up sequence after a quote has been sent',
  },
  STALLED_DEAL: {
    icon: Clock,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    desc: 'Re-engagement flow for deals that have gone quiet',
  },
  DORMANT_REVIVAL: {
    icon: ArrowRight,
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    desc: 'Revival sequence for long-dormant leads',
  },
};

export default function SequenceCards({ sequences }: SequenceCardsProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Sequences
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sequences.map((seq) => {
          const meta = SEQUENCE_META[seq.id] || {
            icon: Mail,
            color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
            desc: seq.description || 'Automated nurture sequence',
          };
          const Icon = meta.icon;

          return (
            <div key={seq.id} className={`card p-4 border ${meta.color.split(' ').slice(1).join(' ')}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color.split(' ')[1]}`}>
                  <Icon size={14} className={meta.color.split(' ')[0]} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-200 truncate">{seq.name}</h4>
                  <span className="text-[10px] text-gray-500">{seq.steps} steps</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {seq.description || meta.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
