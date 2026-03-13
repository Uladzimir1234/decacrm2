import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, X, Building2, MapPin, Phone, Mail, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDealers, fetchDealerDetail, createDealer, type DealerSummary, type DealerDetail, type CreateDealerPayload } from '../services/hub';
import { formatCurrency, formatRelativeTime } from '../lib/theme';

const TIER_COLORS: Record<string, string> = {
  premium: 'bg-amber-100 text-amber-700',
  standard: 'bg-blue-100 text-blue-700',
  basic: 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function DealerPortal() {
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DealerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loadDealers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDealers();
      setDealers(data.dealers);
    } catch (e) {
      console.error('Failed to load dealers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDealers(); }, [loadDealers]);

  const handleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const data = await fetchDealerDetail(id);
      setDetail(data);
    } catch (e) {
      console.error('Failed to load dealer:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">Dealer Portal</h1>
          <p className="text-sm text-content-tertiary">{dealers.length} dealers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent-dark transition-colors"
          >
            <Plus size={12} />
            Add Dealer
          </button>
          {loading && <Loader2 size={16} className="text-accent animate-spin" />}
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden mb-3"
          >
            <CreateDealerForm
              onCreated={() => { setShowCreate(false); loadDealers(); }}
              onCancel={() => setShowCreate(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-surface-card rounded-lg shadow-card border border-surface-border">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_80px_80px_100px_100px_80px_60px] gap-1 px-4 py-2 text-[10px] uppercase tracking-wider text-content-tertiary font-semibold border-b border-surface-border">
          <div>Dealer</div>
          <div>Territory</div>
          <div>Tier</div>
          <div>Status</div>
          <div className="text-right">Revenue</div>
          <div className="text-right">Pipeline</div>
          <div className="text-right">Orders</div>
          <div className="text-right">Tickets</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-surface-border">
          {dealers.map(dealer => {
            const isExpanded = expandedId === dealer.id;
            return (
              <div key={dealer.id}>
                <button
                  onClick={() => handleExpand(dealer.id)}
                  className={`w-full grid grid-cols-[1fr_120px_80px_80px_100px_100px_80px_60px] gap-1 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors ${isExpanded ? 'bg-surface-hover' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={14} className="text-content-tertiary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-content-primary truncate">{dealer.name}</div>
                      {dealer.contact_name && (
                        <div className="text-[10px] text-content-tertiary truncate">{dealer.contact_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-content-secondary truncate">{dealer.territory || '—'}</div>
                  <div className="flex items-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIER_COLORS[dealer.tier] || 'bg-gray-100 text-gray-600'}`}>
                      {dealer.tier}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[dealer.status] || 'bg-gray-100 text-gray-600'}`}>
                      {dealer.status}
                    </span>
                  </div>
                  <div className="text-right text-xs font-medium text-content-primary flex items-center justify-end">
                    {formatCurrency(dealer.total_revenue)}
                  </div>
                  <div className="text-right text-xs text-accent font-medium flex items-center justify-end">
                    {parseFloat(dealer.pipeline_value) > 0 ? formatCurrency(dealer.pipeline_value) : '—'}
                  </div>
                  <div className="text-right text-xs text-content-secondary flex items-center justify-end">
                    {dealer.total_orders}
                    {parseInt(dealer.active_orders) > 0 && (
                      <span className="text-accent ml-1">({dealer.active_orders})</span>
                    )}
                  </div>
                  <div className="text-right text-xs flex items-center justify-end">
                    {parseInt(dealer.open_tickets) > 0 ? (
                      <span className="text-status-red font-medium">{dealer.open_tickets}</span>
                    ) : (
                      <span className="text-content-tertiary">0</span>
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-4 bg-surface-raised border-t border-surface-border">
                        {detailLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 size={20} className="text-accent animate-spin" />
                          </div>
                        ) : detail ? (
                          <DealerDetailCard detail={detail} />
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!loading && dealers.length === 0 && (
          <div className="text-center py-12">
            <Building2 size={32} className="text-content-tertiary mx-auto mb-3" />
            <p className="text-sm text-content-secondary">No dealers yet</p>
            <p className="text-xs text-content-tertiary mt-1">Click "Add Dealer" to create your first dealer</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Dealer Detail Card ─── */

function DealerDetailCard({ detail }: { detail: DealerDetail }) {
  const { dealer, orders, communications } = detail;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      {/* Left — Orders + Communications */}
      <div className="space-y-4">
        {/* Orders */}
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-2">
            Orders ({orders.length})
          </h4>
          {orders.length > 0 ? (
            <div className="space-y-1">
              {orders.map(order => (
                <div key={order.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-surface-hover">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-content-primary">#{order.order_number || order.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase ${
                      order.status === 'delivered' || order.status === 'installed' ? 'bg-green-100 text-green-700' :
                      order.status === 'in_production' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{order.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-content-primary">{formatCurrency(order.amount)}</span>
                    <span className="text-[10px] text-content-tertiary">{formatRelativeTime(order.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-tertiary py-2">No orders yet</p>
          )}
        </div>

        {/* Communications */}
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-2">
            Communications ({communications.length})
          </h4>
          {communications.length > 0 ? (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {communications.map(comm => (
                <div key={comm.id} className="flex items-start gap-2 text-xs py-1.5 px-2 rounded hover:bg-surface-hover">
                  <span className="mt-0.5">{comm.type === 'email' ? '📧' : comm.type === 'call' ? '📞' : '💬'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-content-primary">{comm.subject || comm.type}</span>
                      <span className="text-[9px] text-content-tertiary uppercase">{comm.direction}</span>
                    </div>
                    {comm.body && <div className="text-content-tertiary truncate mt-0.5">{comm.body}</div>}
                  </div>
                  <span className="text-[10px] text-content-tertiary flex-shrink-0">{formatRelativeTime(comm.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-tertiary py-2">No communications yet</p>
          )}
        </div>
      </div>

      {/* Right — Dealer Info */}
      <div className="space-y-4">
        <InfoSection title="Contact Info">
          <div className="space-y-1.5 text-xs">
            {dealer.email && (
              <div className="flex items-center gap-2 text-content-secondary">
                <Mail size={12} className="text-content-tertiary" />
                <span>{dealer.email}</span>
              </div>
            )}
            {dealer.phone && (
              <div className="flex items-center gap-2 text-content-secondary">
                <Phone size={12} className="text-content-tertiary" />
                <span>{dealer.phone}</span>
              </div>
            )}
            {(dealer.city || dealer.state) && (
              <div className="flex items-center gap-2 text-content-secondary">
                <MapPin size={12} className="text-content-tertiary" />
                <span>{[dealer.address, dealer.city, dealer.state, dealer.zip].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {dealer.website && (
              <div className="flex items-center gap-2 text-content-secondary">
                <Globe size={12} className="text-content-tertiary" />
                <span>{dealer.website}</span>
              </div>
            )}
            {dealer.company && (
              <div className="flex items-center gap-2 text-content-secondary">
                <Building2 size={12} className="text-content-tertiary" />
                <span>{dealer.company}</span>
              </div>
            )}
          </div>
        </InfoSection>

        <InfoSection title="Terms">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-content-tertiary">Type</span>
              <span className="text-content-primary">{dealer.dealer_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-tertiary">Tier</span>
              <span className="text-content-primary capitalize">{dealer.tier}</span>
            </div>
            {dealer.commission_rate && (
              <div className="flex justify-between">
                <span className="text-content-tertiary">Commission</span>
                <span className="text-content-primary">{dealer.commission_rate}%</span>
              </div>
            )}
            {dealer.credit_limit && (
              <div className="flex justify-between">
                <span className="text-content-tertiary">Credit Limit</span>
                <span className="text-content-primary">${parseFloat(dealer.credit_limit).toLocaleString()}</span>
              </div>
            )}
            {dealer.balance_due && parseFloat(dealer.balance_due) > 0 && (
              <div className="flex justify-between pt-1 border-t border-surface-border">
                <span className="text-status-red font-medium">Balance Due</span>
                <span className="text-status-red font-medium">${parseFloat(dealer.balance_due).toLocaleString()}</span>
              </div>
            )}
          </div>
        </InfoSection>

        {dealer.notes && (
          <InfoSection title="Notes">
            <p className="text-xs text-content-secondary whitespace-pre-wrap">{dealer.notes}</p>
          </InfoSection>
        )}

        <div className="text-[10px] text-content-tertiary">
          Added {formatRelativeTime(dealer.created_at)}
        </div>
      </div>
    </div>
  );
}

/* ─── Create Dealer Form ─── */

function CreateDealerForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateDealerPayload>({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    state: '',
    territory: '',
    dealer_type: 'dealer',
    tier: 'standard',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createDealer(form);
      onCreated();
    } catch (e) {
      console.error('Failed to create dealer:', e);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof CreateDealerPayload, val: string) =>
    setForm(p => ({ ...p, [key]: val }));

  return (
    <form onSubmit={handleSubmit} className="bg-surface-card rounded-lg border border-surface-border p-4">
      <h3 className="text-sm font-semibold text-content-primary mb-3">New Dealer</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FormInput label="Dealer Name *" value={form.name || ''} onChange={v => set('name', v)} required />
        <FormInput label="Contact Name" value={form.contact_name || ''} onChange={v => set('contact_name', v)} />
        <FormInput label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
        <FormInput label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
        <FormInput label="Company" value={form.company || ''} onChange={v => set('company', v)} />
        <FormInput label="City" value={form.city || ''} onChange={v => set('city', v)} />
        <FormInput label="State" value={form.state || ''} onChange={v => set('state', v)} />
        <FormInput label="Territory" value={form.territory || ''} onChange={v => set('territory', v)} />
        <div>
          <label className="text-[10px] uppercase tracking-wider text-content-tertiary font-medium">Type</label>
          <select
            value={form.dealer_type || 'dealer'}
            onChange={e => set('dealer_type', e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-surface border border-surface-border rounded focus:border-accent focus:outline-none text-content-primary"
          >
            <option value="dealer">Dealer</option>
            <option value="distributor">Distributor</option>
            <option value="contractor">Contractor</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-content-tertiary font-medium">Tier</label>
          <select
            value={form.tier || 'standard'}
            onChange={e => set('tier', e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-surface border border-surface-border rounded focus:border-accent focus:outline-none text-content-primary"
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <FormInput label="Commission %" value={String(form.commission_rate || '')} onChange={v => set('commission_rate', v)} type="number" />
        <FormInput label="Credit Limit $" value={String(form.credit_limit || '')} onChange={v => set('credit_limit', v)} type="number" />
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={saving || !form.name?.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium rounded border border-surface-border text-content-secondary hover:bg-surface-hover"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── Shared ─── */

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-card rounded-md border border-surface-border p-3">
      <h4 className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-content-tertiary font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full mt-0.5 px-2 py-1 text-xs bg-surface border border-surface-border rounded focus:border-accent focus:outline-none text-content-primary"
      />
    </div>
  );
}
