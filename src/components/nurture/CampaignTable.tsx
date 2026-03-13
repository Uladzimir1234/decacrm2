import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import { Mail, ChevronRight, Loader2, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCampaignRecipients } from '../../services/nurture';
import type { CampaignRecipient } from '../../services/nurture';
import type { NurtureCampaign } from '../../types';
import CampaignRecipientRow from './CampaignRecipientRow';

interface CampaignTableProps {
  campaigns: NurtureCampaign[];
  onContactClick?: (dealId: string | null) => void;
}

function RateBadge({ value, thresholds }: { value: number; thresholds: [number, number] }) {
  const color =
    value >= thresholds[1]
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
      : value >= thresholds[0]
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
        : 'text-red-400 bg-red-500/10 border-red-500/25';

  return (
    <span
      className={cn(
        'inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border',
        color
      )}
    >
      {value.toFixed(1)}%
    </span>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

interface RecipientCache {
  recipients: CampaignRecipient[];
  total: number;
}

function ExpandedSection({ subject, isOpen, onContactClick }: { subject: string; isOpen: boolean; onContactClick?: (dealId: string | null) => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecipientCache | null>(null);
  const [filter, setFilter] = useState('');
  const fetched = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (isOpen && !fetched.current) {
      fetched.current = true;
      setLoading(true);
      getCampaignRecipients(subject).then((result) => {
        if (result) {
          setData({ recipients: result.recipients, total: result.total });
        } else {
          setData({ recipients: [], total: 0 });
        }
        setLoading(false);
      });
    }
  }, [isOpen, subject]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [isOpen, data, loading, filter]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!filter) return data.recipients;
    const q = filter.toLowerCase();
    return data.recipients.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.contactName && r.contactName.toLowerCase().includes(q))
    );
  }, [data, filter]);

  return (
    <tr>
      <td colSpan={8} className="p-0">
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isOpen ? maxHeight + 16 : 0 }}
        >
          <div ref={contentRef} className="bg-gray-800/50 rounded-lg mx-4 mb-3 p-3 border-t border-gray-700/50">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-gray-500" />
              </div>
            ) : data && data.recipients.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recipient data available</p>
            ) : data ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">
                    Showing {filtered.length} of {data.total} recipients
                  </span>
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-300 pl-6 pr-2 py-1 w-40 focus:outline-none focus:border-gray-600"
                    />
                  </div>
                </div>
                <div className="space-y-0.5 max-h-72 overflow-y-auto">
                  {filtered.map((r, i) => (
                    <CampaignRecipientRow key={i} recipient={r} onContactClick={onContactClick} />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function CampaignTable({ campaigns, onContactClick }: CampaignTableProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (campaigns.length === 0) return null;

  function handleRowClick(index: number) {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-navy-600/30 flex items-center gap-2">
        <Mail size={14} className="text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Campaign Performance
        </h3>
        <span className="text-gray-600 font-normal text-xs ml-1">{campaigns.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider">
              <th className="w-8 px-2 py-2.5" />
              <th className="text-left px-4 py-2.5 font-medium">Campaign</th>
              <th className="text-right px-4 py-2.5 font-medium">Sent</th>
              <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">Delivered</th>
              <th className="text-right px-4 py-2.5 font-medium">Opened</th>
              <th className="text-right px-4 py-2.5 font-medium">Clicked</th>
              <th className="text-right px-4 py-2.5 font-medium">Open Rate</th>
              <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">Click Rate</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const isExpanded = expandedIndex === i;
              return (
                <Fragment key={i}>
                  <tr
                    onClick={() => handleRowClick(i)}
                    className="border-t border-navy-700/30 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-2 py-3">
                      <ChevronRight
                        size={14}
                        className={cn(
                          'text-gray-600 transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-[300px]">
                      <span title={c.subject}>{truncate(c.subject, 50)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 text-right tabular-nums">
                      {c.sent}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 text-right tabular-nums hidden md:table-cell">
                      {c.delivered}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 text-right tabular-nums">
                      {c.opened}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 text-right tabular-nums">
                      {c.clicked}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RateBadge value={c.openRate} thresholds={[20, 40]} />
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <RateBadge value={c.clickRate} thresholds={[2, 5]} />
                    </td>
                  </tr>
                  <ExpandedSection subject={c.subject} isOpen={isExpanded} onContactClick={onContactClick} />
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
