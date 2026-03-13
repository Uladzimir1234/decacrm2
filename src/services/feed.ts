import { api, isApiOffline } from '../lib/api';
import type { FeedResponse } from '../types';

export async function getFeed(hours: number = 24, sellerId?: string): Promise<FeedResponse | null> {
  if (isApiOffline()) return null;
  try {
    const params: Record<string, string> = { hours: String(hours) };
    if (sellerId) params.sellerId = sellerId;
    const { data } = await api.get('/api/feed', { params });
    return data;
  } catch {
    return null;
  }
}

export async function triggerFeedScan(): Promise<boolean> {
  if (isApiOffline()) return false;
  try {
    await api.post('/api/feed/scan');
    return true;
  } catch {
    return false;
  }
}
