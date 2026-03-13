import { useState, useEffect, useCallback } from 'react';
import { Search, Phone, Mail, User, ArrowRight, ChevronDown, ChevronUp, Clock, Filter, Loader2, CheckCircle, AlertTriangle, MessageSquare, Building2, MapPin, Zap, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.decacrm.com';
const API_KEY = 'deca-admin-2026-secure-api-key-8x9z4w3y2q1p';

const SELLERS = [
  { id: 2, name: 'Eric', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { id: 3, name: 'Paul', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
];

const FILTERS = [
  { key: 'all', label: 'All', icon: User },
  { key: 'new', label: 'New Leads', icon: Zap },
  { key: 'unassigned', label: 'Unassigned', icon: AlertTriangle },
  { key: 'qualified', label: 'Qualified', icon: CheckCircle },
];

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  state?: string;
  source?: string;
  lifecycle_stage: string;
  current_owner_id?: number;
  created_at: string;
  owner_name?: string;
  comm_count: number;
  last_comm_at?: string;
  last_comm_type?: string;
  deal_title?: string;
  deal_amount?: number;
  deal_stage?: string;
  metadata?: Record<string, unknown>;
}

interface Stats {
  total_queue: string;
  unassigned: string;
  new_leads: string;
  qualified: string;
  today: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LeadQueue() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [qualifyId, setQualifyId] = useState<number | null>(null);
  const [qualForm, setQualForm] = useState({ budget: '', timeline: '', project_type: '', windows_count: '', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const LIMIT = 25;

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: filter, limit: String(LIMIT), page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/api/sdr/queue?${params}`, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (data.ok) { setContacts(data.contacts); setTotal(data.total); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filter, page, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/sdr/stats`, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch {}
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);
  useEffect(() => { fetchStats(); const i = setInterval(fetchStats, 30000); return () => clearInterval(i); }, [fetchStats]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const assignContact = async (contactId: number, sellerId: number) => {
    setAssigning(contactId);
    try {
      await fetch(`${API_URL}/api/sdr/assign`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, to_seller_id: sellerId }),
      });
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setTotal(prev => prev - 1);
      fetchStats();
    } catch (e) { console.error(e); }
    setAssigning(null);
  };

  const submitQualification = async () => {
    if (!qualifyId) return;
    try {
      await fetch(`${API_URL}/api/sdr/qualify`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: qualifyId, ...qualForm }),
      });
      setQualifyId(null);
      setQualForm({ budget: '', timeline: '', project_type: '', windows_count: '', notes: '' });
      fetchQueue();
    } catch (e) { console.error(e); }
  };

  const deleteContact = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/api/sdr/delete`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: deleteTarget.id }),
      });
      setContacts(prev => prev.filter(c => c.id !== deleteTarget.id));
      setTotal(prev => prev - 1);
      fetchStats();
    } catch (e) { console.error(e); }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Zap size={20} className="text-amber-400" />
            Lead Queue
            <span className="text-sm font-normal text-gray-500">— Ilya's workspace</span>
          </h1>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Queue', value: stats.total_queue, color: 'text-gray-200', bg: 'bg-navy-800/50' },
            { label: 'New Leads', value: stats.new_leads, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Unassigned', value: stats.unassigned, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Qualified', value: stats.qualified, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Today', value: stats.today, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-xl border border-navy-700/30 p-4', s.bg)}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={cn('text-2xl font-bold tabular-nums', s.color)}>{Number(s.value).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-navy-800/50 rounded-lg p-1 gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                filter === f.key ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700'
              )}
            >
              <f.icon size={12} />
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search name, email, phone, company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-navy-800/50 border border-navy-700/30 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent/50"
          />
        </div>
        <span className="text-xs text-gray-500">{total.toLocaleString()} contacts</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-gray-500 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-navy-700/30 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_180px_120px_100px_80px_80px_80px] gap-2 px-4 py-2.5 bg-navy-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>Contact</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Source</span>
            <span>Activity</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-navy-700/20">
            {contacts.map(c => (
              <div key={c.id}>
                <div
                  className={cn(
                    'grid grid-cols-[1fr_180px_120px_100px_80px_80px_80px] gap-2 px-4 py-3 items-center hover:bg-navy-800/30 transition-colors cursor-pointer',
                    expanded === c.id && 'bg-navy-800/40',
                    !c.current_owner_id && 'border-l-2 border-red-500/50'
                  )}
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  {/* Contact */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-200 truncate">{c.name}</p>
                      {c.lifecycle_stage === 'lead' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">NEW</span>
                      )}
                      {c.lifecycle_stage === 'salesqualifiedlead' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">SQL</span>
                      )}
                    </div>
                    {c.company && <p className="text-xs text-gray-500 truncate">{c.company}</p>}
                    {(c.city || c.state) && (
                      <p className="text-[10px] text-gray-600 flex items-center gap-1"><MapPin size={9} />{[c.city, c.state].filter(Boolean).join(', ')}</p>
                    )}
                  </div>

                  {/* Email */}
                  <p className="text-xs text-gray-400 truncate">{c.email || '—'}</p>

                  {/* Phone */}
                  <p className="text-xs text-gray-400 truncate">{c.phone || '—'}</p>

                  {/* Source */}
                  <p className="text-[10px] text-gray-500 truncate">{c.source || '—'}</p>

                  {/* Activity */}
                  <div className="text-xs text-gray-500">
                    {c.comm_count > 0 ? (
                      <span className="flex items-center gap-1">
                        {c.last_comm_type === 'call' ? <Phone size={10} /> : c.last_comm_type === 'email' ? <Mail size={10} /> : <MessageSquare size={10} />}
                        {c.last_comm_at ? timeAgo(c.last_comm_at) : c.comm_count}
                      </span>
                    ) : (
                      <span className="text-gray-600">none</span>
                    )}
                  </div>

                  {/* Created Date */}
                  <p className="text-xs text-gray-500 tabular-nums">{formatDate(c.created_at)}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 justify-end" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setQualifyId(c.id); setQualForm({ budget: '', timeline: '', project_type: '', windows_count: '', notes: '' }); }}
                      className={cn(
                        'p-1.5 rounded-lg border',
                        c.metadata && (c.metadata.budget || c.metadata.timeline || c.metadata.project_type || c.metadata.windows_count || c.metadata.qual_notes)
                          ? 'bg-teal-500/15 text-teal-400 border-teal-500/30 hover:bg-teal-500/25'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      )}
                      title={c.metadata && (c.metadata.budget || c.metadata.qual_notes) ? 'Qualified ✓' : 'Qualify'}
                    >
                      <CheckCircle size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === c.id && (
                  <div className="px-6 py-4 bg-navy-800/20 border-t border-navy-700/20">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Contact Info</h4>
                        <div className="space-y-1.5 text-sm">
                          <p className="text-gray-300">{c.name}</p>
                          {c.email && <p className="text-gray-400 flex items-center gap-1.5"><Mail size={12} />{c.email}</p>}
                          {c.phone && <p className="text-gray-400 flex items-center gap-1.5"><Phone size={12} />{c.phone}</p>}
                          {c.company && <p className="text-gray-400 flex items-center gap-1.5"><Building2 size={12} />{c.company}</p>}
                          {(c.city || c.state) && <p className="text-gray-400 flex items-center gap-1.5"><MapPin size={12} />{[c.city, c.state].filter(Boolean).join(', ')}</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Deal</h4>
                        {c.deal_title ? (
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-300">{c.deal_title}</p>
                            {c.deal_amount && <p className="text-emerald-400 font-semibold">${Number(c.deal_amount).toLocaleString()}</p>}
                            {c.deal_stage && <p className="text-gray-500 text-xs">{c.deal_stage}</p>}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600">No deal yet</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Details</h4>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>Source: {c.source || 'Unknown'}</p>
                          <p>Stage: {c.lifecycle_stage}</p>
                          <p>Created: {formatDate(c.created_at)}</p>
                          <p>Communications: {c.comm_count}</p>
                          {c.current_owner_id ? <p>Owner: {c.owner_name}</p> : <p className="text-red-400">⚠ Unassigned</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-navy-800/30 border-t border-navy-700/20">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages} · {total.toLocaleString()} contacts
              </span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded text-xs text-gray-400 hover:bg-navy-700 disabled:opacity-30">Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded text-xs text-gray-400 hover:bg-navy-700 disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-navy-900 border border-red-500/30 rounded-2xl p-6 w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/10"><Trash2 size={20} className="text-red-400" /></div>
              <h3 className="text-lg font-bold text-gray-100">Delete Contact?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              Are you sure you want to delete <span className="text-gray-200 font-semibold">{deleteTarget.name}</span>?
            </p>
            {deleteTarget.email && <p className="text-xs text-gray-500 mb-1">{deleteTarget.email}</p>}
            {deleteTarget.phone && <p className="text-xs text-gray-500 mb-3">{deleteTarget.phone}</p>}
            <p className="text-xs text-red-400/70 mb-5">This will permanently remove the contact and all associated data.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
              <button
                onClick={deleteContact}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Qualification Modal */}
      {qualifyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setQualifyId(null)}>
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl p-6 w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-100">Qualify Lead</h3>
              <button onClick={() => setQualifyId(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Budget Range</label>
                  <select value={qualForm.budget} onChange={e => setQualForm(f => ({ ...f, budget: e.target.value }))}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-sm text-gray-200">
                    <option value="">Select...</option>
                    <option value="under_5k">Under $5K</option>
                    <option value="5k_15k">$5K - $15K</option>
                    <option value="15k_30k">$15K - $30K</option>
                    <option value="30k_50k">$30K - $50K</option>
                    <option value="over_50k">Over $50K</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Timeline</label>
                  <select value={qualForm.timeline} onChange={e => setQualForm(f => ({ ...f, timeline: e.target.value }))}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-sm text-gray-200">
                    <option value="">Select...</option>
                    <option value="asap">ASAP</option>
                    <option value="1_3_months">1-3 months</option>
                    <option value="3_6_months">3-6 months</option>
                    <option value="6_12_months">6-12 months</option>
                    <option value="just_looking">Just looking</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Project Type</label>
                  <select value={qualForm.project_type} onChange={e => setQualForm(f => ({ ...f, project_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-sm text-gray-200">
                    <option value="">Select...</option>
                    <option value="replacement">Replacement</option>
                    <option value="new_construction">New Construction</option>
                    <option value="renovation">Renovation</option>
                    <option value="commercial">Commercial</option>
                    <option value="multi_unit">Multi-Unit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block"># of Windows</label>
                  <input type="text" value={qualForm.windows_count} onChange={e => setQualForm(f => ({ ...f, windows_count: e.target.value }))}
                    placeholder="e.g. 12" className="w-full px-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-600" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <textarea value={qualForm.notes} onChange={e => setQualForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Qualification notes..."
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-600 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setQualifyId(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
                <button onClick={submitQualification} className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90">
                  Save Qualification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
