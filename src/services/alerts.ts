import { api } from '../lib/api';

export interface Alert {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
}

export async function getAlerts(): Promise<Alert[]> {
  try {
    const r = await api.get('/api/alerts');
    return r.data.alerts || [];
  } catch {
    return [];
  }
}
