import { useState, useMemo } from 'react';
import { Pause, Play, Trash2, Loader2, ArrowUpDown } from 'lucide-react';
import { cn, timeAgo } from '../../lib/utils';
import { pauseNurture, unenrollDeal } from '../../services/nurture';
import EmailStatusBadge from './EmailStatusBadge';
import ContactPreviewTooltip from './ContactPreviewTooltip';
import type { NurtureEnrollment, NurtureSequence, EmailTrackingContact } from '../../types';

type SortOption = 'default' | 'engagement';

interface EnrollmentsTableProps {
  enrollments: NurtureEnrollment[];
  sequences: NurtureSequence[];
  onRefresh: () => void;
  trackingMap?: Map<string, EmailTrackingContact>;
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            i < current ? 'bg-accent' : 'bg-navy-600'
          )}
        />
      ))}
      <span className="text-[10px] text-gray-500 ml-1.5">
        {current}/{total}
      </span>
    </div>
  );
}

export default function EnrollmentsTable({
  enrollments,
  sequences,
  onRefresh,
  trackingMap,
}: EnrollmentsTableProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  function getSequenceName(seqId: string): string {
    return sequences.find((s) => s.id === seqId)?.name || seqId;
  }

  function getTracking(enrollment: NurtureEnrollment): EmailTrackingContact | undefined {
    if (!trackingMap) return undefined;
    const email = enrollment.emailStatus?.email;
    if (!email) return undefined;
    return trackingMap.get(email.toLowerCase());
  }

  const sortedEnrollments = useMemo(() => {
    if (sortBy === 'engagement' && trackingMap) {
      return [...enrollments].sort((a, b) => {
        const ta = getTracking(a);
        const tb = getTracking(b);
        return (tb?.engagementScore ?? -1) - (ta?.engagementScore ?? -1);
      });
    }
    return enrollments;
  }, [enrollments, sortBy, trackingMap]);

  async function handlePause(dealId: string) {
    setLoadingAction(`pause-${dealId}`);
    await pauseNurture(dealId);
    onRefresh();
    setLoadingAction(null);
  }

  async function handleRemove(dealId: string) {
    setLoadingAction(`remove-${dealId}`);
    await unenrollDeal(dealId);
    onRefresh();
    setLoadingAction(null);
  }

  if (enrollments.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Active Enrollments
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">
          No active enrollments
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-navy-600/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Active Enrollments
          <span className="text-gray-600 font-normal ml-2">{enrollments.length}</span>
        </h3>
        {trackingMap && trackingMap.size > 0 && (
          <button
            onClick={() => setSortBy(sortBy === 'engagement' ? 'default' : 'engagement')}
            className={cn(
              'flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all',
              sortBy === 'engagement'
                ? 'text-accent-light bg-accent/10 border-accent/30'
                : 'text-gray-500 bg-navy-800/50 border-navy-600/30 hover:text-gray-400 hover:border-navy-500/40'
            )}
          >
            <ArrowUpDown size={10} />
            {sortBy === 'engagement' ? 'Sorted by Engagement' : 'Sort by Engagement'}
          </button>
        )}
      </div>

      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">Contact</th>
              <th className="text-left px-4 py-2.5 font-medium">Sequence</th>
              <th className="text-left px-4 py-2.5 font-medium">Email Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Progress</th>
              <th className="text-left px-4 py-2.5 font-medium">Enrolled</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-right px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEnrollments.map((e) => (
              <tr
                key={e.dealId}
                className="border-t border-navy-700/30 hover:bg-navy-800/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <ContactPreviewTooltip enrollment={e} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {getSequenceName(e.sequence)}
                </td>
                <td className="px-4 py-3">
                  <EmailStatusBadge emailStatus={e.emailStatus} tracking={getTracking(e)} />
                </td>
                <td className="px-4 py-3">
                  <ProgressDots current={e.step} total={e.totalSteps} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {timeAgo(e.enrolledAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                      e.paused
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                    )}
                  >
                    {e.paused ? 'Paused' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handlePause(e.dealId)}
                      disabled={loadingAction === `pause-${e.dealId}`}
                      className="p-1.5 rounded text-gray-500 hover:text-gray-300 hover:bg-navy-700 transition-colors"
                      title={e.paused ? 'Resume' : 'Pause'}
                    >
                      {loadingAction === `pause-${e.dealId}` ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : e.paused ? (
                        <Play size={13} />
                      ) : (
                        <Pause size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemove(e.dealId)}
                      disabled={loadingAction === `remove-${e.dealId}`}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove"
                    >
                      {loadingAction === `remove-${e.dealId}` ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-navy-700/30">
        {sortedEnrollments.map((e) => (
          <div key={e.dealId} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <ContactPreviewTooltip enrollment={e} />
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                  e.paused
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                )}
              >
                {e.paused ? 'Paused' : 'Active'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{getSequenceName(e.sequence)}</span>
              <ProgressDots current={e.step} total={e.totalSteps} />
            </div>
            <div className="flex items-center justify-between">
              <EmailStatusBadge emailStatus={e.emailStatus} tracking={getTracking(e)} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-gray-600">{timeAgo(e.enrolledAt)}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePause(e.dealId)}
                  disabled={loadingAction === `pause-${e.dealId}`}
                  className="p-1.5 rounded text-gray-500 hover:text-gray-300 hover:bg-navy-700 transition-colors"
                >
                  {loadingAction === `pause-${e.dealId}` ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : e.paused ? (
                    <Play size={13} />
                  ) : (
                    <Pause size={13} />
                  )}
                </button>
                <button
                  onClick={() => handleRemove(e.dealId)}
                  disabled={loadingAction === `remove-${e.dealId}`}
                  className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  {loadingAction === `remove-${e.dealId}` ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
