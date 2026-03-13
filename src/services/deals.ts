import { api, isApiOffline } from '../lib/api';
import type {
  Deal,
  Interaction,
  DealAnalysis,
  AdminNote,
  Reminder,
  CallHistoryResponse,
  LastContact,
} from '../types';

const VALID_RISK_LEVELS = new Set(['green', 'yellow', 'red']);

function toRiskLevel(val: unknown): Deal['risk_level'] {
  const str = String(val || '').toLowerCase();
  if (VALID_RISK_LEVELS.has(str)) return str as Deal['risk_level'];
  return 'green';
}

function normalizeDeal(raw: Record<string, unknown>): Deal {
  return {
    id: String(raw.id || ''),
    seller_id: String(raw.seller_id || raw.sellerId || ''),
    contact_name:
      String(raw.contact_name || raw.contactName || raw.dealname || 'Unknown'),
    company_name:
      String(raw.company_name || raw.companyName || ''),
    phone:
      String(raw.phone || raw.contact_phone || raw.contactPhone || ''),
    email:
      String(raw.email || raw.contact_email || raw.contactEmail || ''),
    amount: Number(raw.amount) || 0,
    stage: String(raw.stage || 'New Lead'),
    risk_level: toRiskLevel(raw.risk_level ?? raw.riskLevel ?? raw.riskScore),
    days_in_pipeline: Number(raw.days_in_pipeline ?? raw.daysInPipeline) || 0,
    days_in_stage: Number(raw.days_in_stage ?? raw.daysInStage) || 0,
    last_contact_date:
      String(raw.last_contact_date || raw.lastContactDate || raw.updated_at || ''),
    last_interaction_type: String(raw.last_interaction_type || 'none'),
    created_at:
      String(raw.created_at || raw.createdAt || new Date().toISOString()),
    updated_at: String(raw.updated_at || new Date().toISOString()),
    seller_name: (raw.seller_name || raw.sellerName) ? String(raw.seller_name || raw.sellerName) : undefined,
  };
}

export async function getDealById(id: string): Promise<Deal | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/deals/${id}`);
    if (!data) return null;
    return normalizeDeal(data);
  } catch {
    return null;
  }
}

export { normalizeDeal };

interface InteractionsResult {
  interactions: Interaction[];
  lastContact: LastContact | null;
}

export async function getDealInteractions(
  dealId: string
): Promise<InteractionsResult> {
  const empty: InteractionsResult = { interactions: [], lastContact: null };
  if (isApiOffline()) return empty;
  try {
    const { data } = await api.get(`/api/deals/${dealId}/interactions`);
    let interactions: Interaction[] = [];
    let lastContact: LastContact | null = null;

    if (Array.isArray(data)) {
      interactions = data;
    } else if (data && Array.isArray(data.interactions)) {
      interactions = data.interactions.map((i: Record<string, unknown>) => ({
        id: i.id ?? crypto.randomUUID(),
        deal_id: dealId,
        type: i.type ?? 'note',
        direction: i.direction ?? 'outbound',
        summary: i.summary ?? '',
        callSummary: (i.callSummary as string) ?? null,
        duration: (i.duration as number) ?? null,
        created_at: (i.date as string) ?? (i.created_at as string) ?? new Date().toISOString(),
      }));
      if (data.lastContact) {
        lastContact = data.lastContact;
      }
    }

    return { interactions, lastContact };
  } catch {
    return empty;
  }
}

export async function getDealAnalysis(dealId: string): Promise<DealAnalysis> {
  const empty: DealAnalysis = {
    risk_score: 'green',
    days_since_contact: 0,
    suggested_action: 'No data available',
    signals: [],
  };
  if (isApiOffline()) return empty;
  try {
    const { data } = await api.get(`/api/deals/${dealId}/analysis`);
    if (!data) return empty;
    return {
      risk_score: data.risk_score || data.riskScore || 'green',
      days_since_contact: data.days_since_contact ?? data.daysSinceLastContact ?? 0,
      suggested_action: data.suggested_action || data.suggestedNextAction || 'No data',
      signals: data.signals || [],
    };
  } catch {
    return empty;
  }
}

export async function addNote(dealId: string, text: string): Promise<void> {
  if (isApiOffline()) return;
  await api.post(`/api/deals/${dealId}/notes`, { text });
}

export async function getDealNotes(dealId: string): Promise<AdminNote[]> {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get(`/api/deals/${dealId}/notes`);
    return data || [];
  } catch {
    return [];
  }
}

export async function changeStage(
  dealId: string,
  stage: string
): Promise<void> {
  if (isApiOffline()) return;
  await api.post(`/api/deals/${dealId}/stage`, { stage });
}

export async function setReminder(
  dealId: string,
  reminderDate: string,
  text: string
): Promise<void> {
  if (isApiOffline()) return;
  await api.post(`/api/deals/${dealId}/remind`, {
    text,
    remindAt: new Date(reminderDate).toISOString(),
  });
}

export async function getDealReminders(dealId: string): Promise<Reminder[]> {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get(`/api/deals/${dealId}/reminders`);
    return data || [];
  } catch {
    return [];
  }
}

export async function getDealCalls(dealId: string): Promise<CallHistoryResponse | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/deals/${dealId}/calls`);
    return data || null;
  } catch {
    return null;
  }
}
