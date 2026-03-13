// DECA Hub Design System — Theme Constants

export const ACTIVITY_INDICATORS = {
  active: { color: 'bg-status-green', textColor: 'text-status-green', label: 'Active', thresholdMinutes: 60 },
  recent: { color: 'bg-status-yellow', textColor: 'text-status-yellow', label: 'Recent', thresholdMinutes: 1440 },
  quiet: { color: 'bg-content-tertiary', textColor: 'text-content-tertiary', label: 'Quiet' },
} as const;

export function getActivityIndicator(lastActionAt: string | null): typeof ACTIVITY_INDICATORS[keyof typeof ACTIVITY_INDICATORS] {
  if (!lastActionAt) return ACTIVITY_INDICATORS.quiet;
  const minutesAgo = (Date.now() - new Date(lastActionAt).getTime()) / 60000;
  if (minutesAgo < ACTIVITY_INDICATORS.active.thresholdMinutes) return ACTIVITY_INDICATORS.active;
  if (minutesAgo < ACTIVITY_INDICATORS.recent.thresholdMinutes) return ACTIVITY_INDICATORS.recent;
  return ACTIVITY_INDICATORS.quiet;
}

export const STAGES = [
  'lead', 'qualified', 'quoted', 'contracted',
  'production', 'shipped', 'installed', 'service'
] as const;

export type Stage = typeof STAGES[number];

export const STAGE_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  // HubSpot stages
  appointmentscheduled: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Appointment', icon: '📅' },
  qualifiedtobuy: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Qualified', icon: '✅' },
  presentationscheduled: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Presentation', icon: '📊' },
  decisionmakerboughtin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Decision', icon: '🤝' },
  contractsent: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Contract', icon: '📝' },
  invoicesent: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Invoice', icon: '📄' },
  closedwon: { bg: 'bg-green-100', text: 'text-green-700', label: 'Won', icon: '🏆' },
  closedlost: { bg: 'bg-red-100', text: 'text-red-600', label: 'Lost', icon: '❌' },
  // Internal stages
  lead: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Lead', icon: '🔵' },
  qualify: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Qualify', icon: '✅' },
  qualified: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Qualified', icon: '✅' },
  measure: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Measure', icon: '📐' },
  quoted: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Quoted', icon: '💰' },
  quote: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Quote', icon: '💰' },
  contracted: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Contracted', icon: '📝' },
  production: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Production', icon: '🏭' },
  shipped: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Shipped', icon: '🚚' },
  installed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Installed', icon: '🔧' },
  service: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Service', icon: '🛠️' },
};

export function getStageConfig(stage: string | null | undefined) {
  if (!stage) return null;
  return STAGE_CONFIG[stage.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600', label: stage, icon: '📌' };
}

export const ACTION_ICONS: Record<string, string> = {
  call: '📞',
  email: '📧',
  sms: '💬',
  note: '📝',
  task: '📋',
  meeting: '🤝',
  deal: '💼',
  wave_invoice: '💰',
  qb_invoice: '💰',
  order: '🏭',
  form_submission: '📋',
  chat: '💬',
};

export function formatRelativeTime(date: string | null): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatCurrency(amount: number | string | null): string {
  if (amount === null || amount === undefined) return '$0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
  return `$${num.toFixed(0)}`;
}
