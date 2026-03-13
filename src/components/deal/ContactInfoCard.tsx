import { useState } from 'react';
import { Phone, Mail, Building2, Calendar, Clock, MessageSquare } from 'lucide-react';
import { formatCurrency, getStageBadgeColor, formatDate, formatDuration, timeAgo, cn } from '../../lib/utils';
import { changeStage } from '../../services/deals';
import type { Deal, LastContact } from '../../types';

const STAGES = [
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

const LAST_CONTACT_PREVIEW = 150;

interface ContactInfoCardProps {
  deal: Deal;
  lastContact?: LastContact | null;
  onStageChange: () => void;
}

export default function ContactInfoCard({ deal, lastContact, onStageChange }: ContactInfoCardProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  async function handleStageChange(newStage: string) {
    await changeStage(deal.id, newStage);
    onStageChange();
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-100">
            {deal.contact_name || 'Unknown Contact'}
          </h2>
          {deal.company_name && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5">
              <Building2 size={12} />
              {deal.company_name}
            </div>
          )}
        </div>
        <span className="text-xl font-bold text-gray-100">
          {formatCurrency(deal.amount ?? 0)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {deal.phone ? (
          <a
            href={`tel:${deal.phone}`}
            className="flex items-center gap-2 text-sm text-accent-light hover:text-accent transition-colors"
          >
            <Phone size={14} />
            {deal.phone}
          </a>
        ) : (
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} />
            No phone
          </span>
        )}
        {deal.email ? (
          <a
            href={`mailto:${deal.email}`}
            className="flex items-center gap-2 text-sm text-accent-light hover:text-accent transition-colors"
          >
            <Mail size={14} />
            <span className="truncate">{deal.email}</span>
          </a>
        ) : (
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={14} />
            No email
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-navy-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Stage:</span>
          <select
            value={deal.stage}
            onChange={(e) => handleStageChange(e.target.value)}
            className={`text-xs font-medium px-2 py-1 rounded-md border bg-transparent cursor-pointer ${getStageBadgeColor(deal.stage || '')}`}
          >
            {STAGES.map((s) => (
              <option key={s} value={s} className="bg-navy-800 text-gray-200">
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar size={11} />
          {deal.days_in_pipeline ?? 0}d in pipeline
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={11} />
          {deal.days_in_stage ?? 0}d in stage
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-navy-700/50">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-1.5">Last Contact</p>
        {lastContact ? (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {lastContact.type === 'call' ? (
                <Phone size={12} className="text-sky-400 flex-shrink-0" />
              ) : (
                <MessageSquare size={12} className="text-emerald-400 flex-shrink-0" />
              )}
              <span className="text-xs font-medium text-gray-300">
                {lastContact.label}
              </span>
              <span className="text-[10px] text-gray-500">
                {formatDate(lastContact.date)} ({timeAgo(lastContact.date)})
              </span>
              {lastContact.type === 'call' && lastContact.duration && (
                <span className="text-[10px] text-gray-500 tabular-nums">
                  {formatDuration(lastContact.duration)}
                </span>
              )}
            </div>
            {lastContact.summary && (
              <div className="mt-1 ml-5">
                <p className="text-[11px] text-gray-500 italic leading-relaxed">
                  &ldquo;{summaryExpanded || lastContact.summary.length <= LAST_CONTACT_PREVIEW
                    ? lastContact.summary
                    : `${lastContact.summary.slice(0, LAST_CONTACT_PREVIEW)}...`}&rdquo;
                </p>
                {lastContact.summary.length > LAST_CONTACT_PREVIEW && (
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="text-[10px] text-accent-light hover:text-accent transition-colors mt-0.5"
                  >
                    {summaryExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className={cn('text-xs', deal.last_contact_date ? 'text-gray-500' : 'text-gray-600')}>
            {deal.last_contact_date
              ? `${formatDate(deal.last_contact_date)} (${timeAgo(deal.last_contact_date)})`
              : 'No calls or messages recorded'}
          </p>
        )}
      </div>
    </div>
  );
}
