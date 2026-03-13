import { api, isApiOffline } from '../lib/api';
import type { EnrichedProfile } from '../types';

const CACHE_TTL = 30 * 60 * 1000;

interface CacheEntry {
  data: EnrichedProfile;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(dealId: string): EnrichedProfile | null {
  const entry = cache.get(dealId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL) {
    cache.delete(dealId);
    return null;
  }
  return entry.data;
}

function setCache(dealId: string, data: EnrichedProfile) {
  cache.set(dealId, { data, fetchedAt: Date.now() });
}

export function getCacheAge(dealId: string): number | null {
  const entry = cache.get(dealId);
  if (!entry) return null;
  return Date.now() - entry.fetchedAt;
}

export async function getEnrichedProfile(
  dealId: string
): Promise<EnrichedProfile | null> {
  const cached = getCached(dealId);
  if (cached) return cached;

  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/deals/${dealId}/enriched`);
    if (data && data.deal) {
      setCache(dealId, data);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function triggerEnrichment(
  dealId: string
): Promise<EnrichedProfile | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.post(`/api/deals/${dealId}/enrich`);
    if (data && data.deal) {
      setCache(dealId, data);
      return data;
    }
    const fetched = await getEnrichedProfile(dealId);
    return fetched;
  } catch {
    return null;
  }
}

export function clearEnrichmentCache(dealId: string) {
  cache.delete(dealId);
}
