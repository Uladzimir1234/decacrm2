import { api, isApiOffline } from '../lib/api';
import type { NurtureStatus, NurtureHistoryItem, NurtureCampaign } from '../types';

export interface CampaignRecipient {
  email: string;
  contactName: string | null;
  contactId: string | null;
  dealId: string | null;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
  unsubscribed: boolean;
  lastEvent: string;
}

export async function getCampaignRecipients(subject: string): Promise<{
  campaign: NurtureCampaign;
  recipients: CampaignRecipient[];
  total: number;
} | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get('/api/brevo/stats/campaign', {
      params: { subject },
    });
    return data;
  } catch {
    return null;
  }
}

export async function getNurtureStatus(): Promise<NurtureStatus | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get('/api/nurture/status');
    if (!data) return null;
    const enrollments = (data.enrollments || []).map((e: Record<string, unknown>) => ({
      ...e,
      emailStatus: e.emailStatus || undefined,
      phone: e.phone || '',
      dealAmount: e.dealAmount ?? e.amount ?? 0,
    }));
    return {
      ...data,
      enrollments,
      emailStats: data.emailStats || undefined,
    };
  } catch {
    return null;
  }
}

export async function getNurtureSequences() {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get('/api/nurture/sequences');
    return data;
  } catch {
    return [];
  }
}

export async function enrollDeal(dealId: string, sequence: string): Promise<boolean> {
  if (isApiOffline()) return false;
  try {
    await api.post('/api/nurture/enroll', { dealId, sequence });
    return true;
  } catch {
    return false;
  }
}

export async function pauseNurture(dealId: string): Promise<boolean> {
  if (isApiOffline()) return false;
  try {
    await api.post('/api/nurture/pause', { dealId });
    return true;
  } catch {
    return false;
  }
}

export async function resumeNurture(dealId: string): Promise<boolean> {
  if (isApiOffline()) return false;
  try {
    await api.post('/api/nurture/pause', { dealId });
    return true;
  } catch {
    return false;
  }
}

export async function unenrollDeal(dealId: string): Promise<boolean> {
  if (isApiOffline()) return false;
  try {
    await api.post('/api/nurture/unenroll', { dealId });
    return true;
  } catch {
    return false;
  }
}

export async function getNurtureHistory(dealId: string): Promise<NurtureHistoryItem[]> {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get(`/api/nurture/history/${dealId}`);
    return Array.isArray(data) ? data : data?.history || [];
  } catch {
    return [];
  }
}

export async function triggerNurtureScan(): Promise<{ processed?: number; enrolled?: number } | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.post('/api/nurture/scan');
    return data;
  } catch {
    return null;
  }
}

export interface LeadEvent {
  type: string;
  date: string;
  subject: string;
  url?: string;
}

export interface Lead {
  email: string;
  name: string;
  contactId: string | null;
  dealId: string | null;
  temperature: 'hot' | 'warm' | 'cooling' | 'cold';
  lastActivity: string | null;
  totalOpens: number;
  totalClicks: number;
  campaigns: string[];
  events: LeadEvent[];
  signal: string;
}

export interface LeadRecoveryData {
  leads: Lead[];
  summary: {
    hot: number;
    warm: number;
    cooling: number;
    cold: number;
  };
}

export async function getNurtureLeads(): Promise<LeadRecoveryData | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get('/api/nurture/leads');
    return data;
  } catch {
    return null;
  }
}

export async function getLeadProfile(email: string) {
  if (isApiOffline()) throw new Error('API is offline');
  try {
    const { data } = await api.get(`/api/leads/${encodeURIComponent(email)}/profile`);
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch lead profile');
  }
}
