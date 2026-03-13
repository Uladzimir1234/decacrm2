import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  triggerEnrichment,
  getEnrichedProfile,
  getCacheAge,
  clearEnrichmentCache,
} from '../../services/enrich';
import type { EnrichedProfile } from '../../types';

interface DeepDiveButtonProps {
  dealId: string;
  onLoaded: (profile: EnrichedProfile) => void;
  onClear: () => void;
}

export default function DeepDiveButton({
  dealId,
  onLoaded,
  onClear,
}: DeepDiveButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded'>('idle');
  const [cacheAgeLabel, setCacheAgeLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('idle');
    setCacheAgeLabel(null);

    getEnrichedProfile(dealId).then((profile) => {
      if (cancelled) return;
      if (profile) {
        setStatus('loaded');
        onLoaded(profile);
        updateCacheLabel(dealId);
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [dealId]);

  function updateCacheLabel(id: string) {
    const age = getCacheAge(id);
    if (age === null) return;
    const mins = Math.floor(age / 60000);
    setCacheAgeLabel(mins < 1 ? 'just now' : `${mins}m ago`);
  }

  async function handleClick() {
    setStatus('loading');
    onClear();
    clearEnrichmentCache(dealId);
    const profile = await triggerEnrichment(dealId);
    if (profile) {
      setStatus('loaded');
      onLoaded(profile);
      updateCacheLabel(dealId);
    } else {
      setStatus('idle');
    }
  }

  if (status === 'loaded') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-medium">
          <CheckCircle size={15} />
          Profile Loaded
          {cacheAgeLabel && (
            <span className="text-emerald-500/60 text-xs ml-1">
              {cacheAgeLabel}
            </span>
          )}
        </div>
        <button
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-navy-700 text-gray-400 border border-navy-600 hover:bg-navy-600 hover:text-gray-200 transition-all duration-200"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 border',
        status === 'loading'
          ? 'bg-accent/10 border-accent/25 text-accent cursor-wait'
          : 'bg-accent/15 border-accent/30 text-accent-light hover:bg-accent/25 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10'
      )}
    >
      {status === 'loading' ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Loading full profile...
        </>
      ) : (
        <>
          <Search size={15} />
          Deep Dive
        </>
      )}
    </button>
  );
}
