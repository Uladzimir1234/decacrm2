import { api, isApiOffline } from '../lib/api';
import type { SDRContact, SDRContactInteractionsResponse } from '../types';

function normalizeContact(raw: Record<string, unknown>): SDRContact {
  return {
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    firstName: String(raw.firstName || raw.first_name || ''),
    lastName: String(raw.lastName || raw.last_name || ''),
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    company: String(raw.company || ''),
    city: String(raw.city || ''),
    state: String(raw.state || ''),
    source: String(raw.source || ''),
    sourceDetail: String(raw.sourceDetail || raw.source_detail || ''),
    status: (raw.status as SDRContact['status']) || 'new',
    riskLevel: (raw.riskLevel as SDRContact['riskLevel']) || (raw.risk_level as SDRContact['riskLevel']) || 'green',
    assignedTo: (raw.assignedTo as string) || (raw.assigned_to as string) || null,
    assignedDealId: (raw.assignedDealId as string) || (raw.assigned_deal_id as string) || null,
    assignedDealStage: (raw.assignedDealStage as string) || (raw.assigned_deal_stage as string) || null,
    created: String(raw.created || raw.created_at || raw.createdAt || ''),
    lastContacted: (raw.lastContacted as string) || (raw.last_contacted as string) || null,
    daysSinceCreated: Number(raw.daysSinceCreated ?? raw.days_since_created ?? 0),
    daysSinceContact: Number(raw.daysSinceContact ?? raw.days_since_contact ?? 0),
    numContactedNotes: Number(raw.numContactedNotes ?? raw.num_contacted_notes ?? 0),
  };
}

export async function getSellerContacts(sellerId: string): Promise<SDRContact[]> {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get(`/api/sellers/${sellerId}/contacts`);
    if (Array.isArray(data)) {
      return data.map((d: Record<string, unknown>) => normalizeContact(d));
    }
    return [];
  } catch {
    return [];
  }
}

export async function getContactInteractions(
  contactId: string
): Promise<SDRContactInteractionsResponse | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/contacts/${contactId}/interactions`);
    if (!data) return null;
    return {
      contactId: String(data.contactId || contactId),
      contactName: String(data.contactName || ''),
      contactEmail: String(data.contactEmail || ''),
      contactPhone: String(data.contactPhone || ''),
      totalInteractions: Number(data.totalInteractions ?? 0),
      breakdown: {
        calls: Number(data.breakdown?.calls ?? 0),
        sms: Number(data.breakdown?.sms ?? 0),
        emails: Number(data.breakdown?.emails ?? 0),
        notes: Number(data.breakdown?.notes ?? 0),
      },
      interactions: Array.isArray(data.interactions)
        ? data.interactions.map((i: Record<string, unknown>) => ({
            id: String(i.id || crypto.randomUUID()),
            type: String(i.type || 'note') as 'call' | 'sms' | 'email' | 'note',
            icon: String(i.icon || ''),
            label: String(i.label || ''),
            direction: String(i.direction || 'outbound') as 'inbound' | 'outbound',
            summary: String(i.summary || ''),
            callSummary: (i.callSummary as string) || undefined,
            duration: (i.duration as number) || undefined,
            date: String(i.date || ''),
            source: String(i.source || ''),
            metadata: (i.metadata as Record<string, unknown>) || undefined,
          }))
        : [],
    };
  } catch {
    return null;
  }
}
