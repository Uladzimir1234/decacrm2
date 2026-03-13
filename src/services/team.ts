import { api, isApiOffline } from '../lib/api';

export interface TeamSeller {
  id: string;
  name: string;
  role: string;
  today: {
    calls: number;
    callMinutes: number;
    smsOut: number;
    smsIn: number;
    lastActivity: string | null;
    lastActivityText: string | null;
  } | null;
  yesterday: {
    calls: number;
    callMinutes: number;
    smsOut: number;
    smsIn: number;
  } | null;
  period?: {
    label: string;
    calls: number;
    callMinutes: number;
    smsOut: number;
    smsIn: number;
    avgCallsPerDay: number;
    avgSmsPerDay: number;
    dailyBreakdown: Array<{
      date: string;
      calls: number;
      sms: number;
    }>;
  } | null;
  pipeline: {
    activeDeals: number;
    pipelineValue: number;
    newLeads: number;
    quoteSent: number;
    negotiating: number;
  };
  responsiveness: {
    avgResponseTimeHours: number | null;
    unansweredCount: number;
  } | null;
  signals: Array<{
    id: string;
    type: string;
    severity: 'red' | 'yellow' | 'green';
    title: string;
    message: string;
    dealId: string;
    dealName: string;
    seller: string;
    customer: string;
    customerPhone: string | null;
    waitingHours: number;
    createdAt: string;
  }>;
  error?: string;
}

export interface TeamActivityData {
  sellers: TeamSeller[];
  updatedAt: string;
}

// ============ TEAM HISTORY TYPES ============
export interface HistoryDayPhone {
  date: string;
  dayOfWeek: string;
  calls: number;
  completedCalls: number;
  callMinutes: number;
  voicemails: number;
  smsOut: number;
  smsIn: number;
  uniqueContacts: number;
  lastActivity: string | null;
  lastActivityText: string | null;
}

export interface HistoryDaySDR {
  date: string;
  dayOfWeek: string;
  dealsCreated: number;
  notesAdded: number;
}

export interface HistorySeller {
  id: string;
  name: string;
  role: string;
  pipeline: TeamSeller['pipeline'];
  days: (HistoryDayPhone | HistoryDaySDR)[];
  error?: string;
}

export interface TeamHistoryData {
  sellers: HistorySeller[];
  updatedAt: string;
}

export async function getTeamHistory(from: string, to: string): Promise<TeamHistoryData | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/team/history?from=${from}&to=${to}`, { timeout: 120000 });
    return data;
  } catch (error) {
    console.error('Failed to fetch team history:', error);
    return null;
  }
}

export async function getTeamActivity(period: string = 'today'): Promise<TeamActivityData | null> {
  if (isApiOffline()) return null;
  
  try {
    const { data } = await api.get(`/api/team?period=${period}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch team activity:', error);
    return null;
  }
}

// ============ DAY DRILL-DOWN TYPES ============
export interface CallDetail {
  time: string;
  direction: 'in' | 'out';
  contact: string | null;
  phone: string | null;
  duration: number;
  durationText: string;
  status: 'completed' | 'missed' | 'voicemail' | string;
  summary: string | null;
  nextSteps: string[] | null;
  voicemailUrl: string | null;
}

export interface SmsDetail {
  time: string;
  direction: 'in' | 'out';
  contact: string | null;
  phone: string | null;
  body: string;
  status: string;
}

export interface DayDrillDown {
  seller: string;
  date: string;
  collectedAt: string;
  summary: {
    calls: number;
    completedCalls: number;
    missedCalls: number;
    voicemails: number;
    callMinutes: number;
    smsOut: number;
    smsIn: number;
    uniqueContacts: number;
  };
  calls: CallDetail[];
  sms: SmsDetail[];
}

export async function getDayDrillDown(seller: string, date: string): Promise<DayDrillDown | null> {
  if (isApiOffline()) return null;
  try {
    const { data } = await api.get(`/api/team/${seller.toLowerCase()}/day/${date}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch day drill-down:', error);
    return null;
  }
}