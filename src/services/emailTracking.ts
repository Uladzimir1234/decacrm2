import { api, isApiOffline } from '../lib/api';
import type { EmailTrackingBulk, EmailTrackingDetail } from '../types';

export async function getEmailTrackingBulk(): Promise<EmailTrackingBulk | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get('/api/email-tracking-bulk');
    return data || null;
  } catch {
    return null;
  }
}

export async function getEmailTrackingByEmail(email: string): Promise<EmailTrackingDetail | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/email-tracking/${encodeURIComponent(email)}`);
    return data || null;
  } catch {
    return null;
  }
}
