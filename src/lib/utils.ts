import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function formatCurrency(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatCurrencyK(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return formatCurrency(val);
}

export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Unknown';
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(seconds: number | null | undefined): string {
  const val = typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0;
  const mins = Math.floor(val / 60);
  const secs = val % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function getRiskColor(risk: string | null | undefined): string {
  switch (risk) {
    case 'red':
      return 'text-status-red';
    case 'yellow':
      return 'text-status-yellow';
    default:
      return 'text-status-green';
  }
}

export function getRiskBg(risk: string | null | undefined): string {
  switch (risk) {
    case 'red':
      return 'bg-red-500/10 border-red-500/30';
    case 'yellow':
      return 'bg-yellow-500/10 border-yellow-500/30';
    default:
      return 'bg-emerald-500/10 border-emerald-500/30';
  }
}

export function getStageBadgeColor(stage: string | null | undefined): string {
  switch (stage) {
    case 'New Lead':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'No Response':
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    case 'Appointment Scheduled / Qualified':
      return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    case 'Quote Sent':
      return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
    case 'Negotiating':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Decision Maker Brought In':
      return 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30';
    case 'Contract Sent':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Closed Won':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Closed Lost':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  }
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
