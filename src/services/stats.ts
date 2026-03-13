import { api, isApiOffline } from '../lib/api';
import type { DashboardStats } from '../types';

interface SellerStats {
  sellerId?: string;
  sellerName?: string;
  dealsClosed?: number;
  dealsMovedForward?: number;
  callsMade?: number;
  avgResponseTime?: number;
  [key: string]: unknown;
}

function aggregateStats(rows: SellerStats[]): DashboardStats {
  let totalDealsClosed = 0;
  let totalCalls = 0;
  let totalResponseTime = 0;
  let responseTimeCount = 0;

  for (const row of rows) {
    totalDealsClosed += Number(row.dealsClosed ?? row.deals_closed ?? 0);
    totalCalls += Number(row.callsMade ?? row.calls_made ?? 0);
    const rt = Number(row.avgResponseTime ?? row.avg_response_time ?? 0);
    if (rt > 0) {
      totalResponseTime += rt;
      responseTimeCount++;
    }
  }

  return {
    total_active_deals: 0,
    total_pipeline_value: 0,
    alert_count: 0,
    avg_response_time: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
    calls_this_week: totalCalls,
    deals_closed_this_week: totalDealsClosed,
  };
}

const emptyStats: DashboardStats = {
  total_active_deals: 0,
  total_pipeline_value: 0,
  alert_count: 0,
  avg_response_time: 0,
  calls_this_week: 0,
  deals_closed_this_week: 0,
};

export async function getStats(): Promise<DashboardStats> {
  if (isApiOffline()) return emptyStats;
  try {
    const { data } = await api.get('/api/stats');
    if (Array.isArray(data)) {
      return aggregateStats(data);
    }
    return aggregateStats([data]);
  } catch {
    return emptyStats;
  }
}

export interface WeeklyStatRow {
  sellerId?: string;
  sellerName?: string;
  seller_id?: string;
  seller_name?: string;
  callsMade?: number;
  calls_made?: number;
  smsSent?: number;
  sms_sent?: number;
  dealsClosed?: number;
  deals_closed?: number;
  dealsMovedForward?: number;
  deals_moved_forward?: number;
  week?: string;
  [key: string]: unknown;
}

export async function getWeeklyStats(): Promise<WeeklyStatRow[]> {
  if (isApiOffline()) return [];
  try {
    const { data } = await api.get('/api/stats');
    return Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }
}
