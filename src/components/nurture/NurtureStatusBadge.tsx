import { useState, useEffect, useRef } from 'react';
import { Mail, Pause, Play, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  getNurtureStatus,
  enrollDeal,
  pauseNurture,
  unenrollDeal,
} from '../../services/nurture';
import type { NurtureEnrollment, NurtureSequence } from '../../types';

interface NurtureStatusBadgeProps {
  dealId: string;
}

export default function NurtureStatusBadge({ dealId }: NurtureStatusBadgeProps) {
  const [enrollment, setEnrollment] = useState<NurtureEnrollment | null>(null);
  const [sequences, setSequences] = useState<NurtureSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNurtureData();
  }, [dealId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNurtureData() {
    try {
      setLoading(true);
      const status = await getNurtureStatus();
      if (status) {
        const found = status.enrollments.find((e) => e.dealId === dealId);
        setEnrollment(found || null);
        setSequences(status.sequences);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(sequenceId: string) {
    setActionLoading(true);
    setDropdownOpen(false);
    await enrollDeal(dealId, sequenceId);
    await loadNurtureData();
    setActionLoading(false);
  }

  async function handlePause() {
    setActionLoading(true);
    await pauseNurture(dealId);
    await loadNurtureData();
    setActionLoading(false);
  }

  async function handleRemove() {
    setActionLoading(true);
    await unenrollDeal(dealId);
    await loadNurtureData();
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs">Loading nurture status...</span>
      </div>
    );
  }

  function getSequenceName(seqId: string): string {
    return sequences.find((s) => s.id === seqId)?.name || seqId;
  }

  if (enrollment) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/25 text-sm">
          <Mail size={13} className="text-accent-light flex-shrink-0" />
          <span className="text-accent-light font-medium">
            {getSequenceName(enrollment.sequence)}
          </span>
          <span className="text-gray-500">--</span>
          <span className="text-gray-400">
            Step {enrollment.step}/{enrollment.totalSteps}
          </span>
          <div className="flex items-center gap-0.5 ml-1">
            {Array.from({ length: enrollment.totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  i < enrollment.step ? 'bg-accent' : 'bg-navy-600'
                )}
              />
            ))}
          </div>
          {enrollment.paused && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider">
              Paused
            </span>
          )}
        </div>
        <button
          onClick={handlePause}
          disabled={actionLoading}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-navy-700 transition-colors"
          title={enrollment.paused ? 'Resume' : 'Pause'}
        >
          {actionLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : enrollment.paused ? (
            <Play size={14} />
          ) : (
            <Pause size={14} />
          )}
        </button>
        <button
          onClick={handleRemove}
          disabled={actionLoading}
          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Remove from sequence"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={actionLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-navy-800 border border-navy-600/50 text-gray-400 hover:text-gray-200 hover:border-navy-500 transition-all"
      >
        {actionLoading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Mail size={13} />
        )}
        Enroll in Sequence
        <ChevronDown size={12} className={cn('transition-transform', dropdownOpen && 'rotate-180')} />
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-navy-800 border border-navy-600/50 rounded-lg shadow-xl shadow-black/30 z-20 py-1 animate-fade-in">
          {sequences.map((seq) => (
            <button
              key={seq.id}
              onClick={() => handleEnroll(seq.id)}
              className="w-full text-left px-3 py-2.5 hover:bg-navy-700 transition-colors"
            >
              <span className="text-sm text-gray-200 block">{seq.name}</span>
              <span className="text-[10px] text-gray-500">{seq.steps} steps</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
