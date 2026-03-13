import { api, isApiOffline } from '../lib/api';
import type { IntelligenceData } from '../types';

const emptyData: IntelligenceData = {
  urgent: [],
  opportunities: [],
  risks: [],
  wins: [],
  sellerScores: {},
  summary: {
    totalUrgent: 0,
    totalRisks: 0,
    urgentValue: 0,
    atRiskValue: 0,
    opportunityValue: 0,
  },
};

export async function getIntelligence(): Promise<IntelligenceData> {
  if (isApiOffline()) return emptyData;
  try {
    const { data } = await api.get('/api/intelligence');
    if (!data) return emptyData;
    return {
      urgent: data.urgent || [],
      opportunities: data.opportunities || [],
      risks: data.risks || [],
      wins: data.wins || [],
      sellerScores: data.sellerScores || {},
      summary: {
        totalUrgent: data.summary?.totalUrgent ?? 0,
        totalRisks: data.summary?.totalRisks ?? 0,
        urgentValue: data.summary?.urgentValue ?? 0,
        atRiskValue: data.summary?.atRiskValue ?? 0,
        opportunityValue: data.summary?.opportunityValue ?? 0,
      },
    };
  } catch {
    return emptyData;
  }
}
