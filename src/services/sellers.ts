import { api, isApiOffline } from '../lib/api';
import { normalizeDeal } from './deals';
import type { Seller, Deal } from '../types';

function mapApiSeller(raw: Record<string, unknown>): Seller {
  const name = String(raw.name || '');
  const roleRaw = String(raw.role || '').toUpperCase();
  return {
    id: String(raw.id || ''),
    name,
    initials: String(
      raw.initials ||
        name
          .split(' ')
          .map((w) => w[0])
          .join('')
    ),
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    created_at: String(raw.created_at || raw.createdAt || ''),
    role: roleRaw === 'SDR' ? 'SDR' : 'seller',
    active_deals: Number(raw.active_deals ?? raw.activeDealCount ?? raw.activeDeals ?? 0),
    pipeline_value: Number(raw.pipeline_value ?? raw.totalPipelineValue ?? raw.pipelineValue ?? 0),
    alert_count: Number(raw.alert_count ?? raw.alertCount ?? 0),
    avg_response_time: Number(raw.avg_response_time ?? raw.avgResponseTime ?? 0),
    calls_this_week: (raw.calls_this_week ?? raw.callsThisWeek ?? [3, 5, 2, 4, 6, 1, 3]) as number[],
    close_rate: Number(raw.close_rate ?? raw.closeRate ?? 0),
  };
}

export async function getSellers(): Promise<Seller[]> {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get('/api/sellers');
    if (Array.isArray(data)) {
      return data.map(mapApiSeller);
    }
    return [];
  } catch {
    return [];
  }
}

export async function getSellerById(id: string): Promise<Seller | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/sellers/${id}`);
    return data ? mapApiSeller(data) : null;
  } catch {
    return null;
  }
}

export async function getSellerDeals(id: string): Promise<Deal[]> {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get(`/api/sellers/${id}/deals`);
    if (Array.isArray(data)) {
      return data.map((d: Record<string, unknown>) => normalizeDeal(d));
    }
    return [];
  } catch {
    return [];
  }
}
