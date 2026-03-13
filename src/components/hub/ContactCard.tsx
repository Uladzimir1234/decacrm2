import { useState, useCallback, useEffect } from 'react';
import { Phone, Mail, MapPin, Calendar, DollarSign, Package, FileText, MessageSquare, Check, X, Pencil, Loader2, PhoneCall, StickyNote, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { ContactCard as ContactCardData, ContactNote, CallBriefing, CommItem } from '../../services/hub';
import { updateContact, fetchContactNotes, addContactNote, fetchCallBriefing, fetchContactComms } from '../../services/hub';
import { ACTION_ICONS, formatRelativeTime, formatCurrency, getStageConfig } from '../../lib/theme';

interface Props {
  data: ContactCardData;
  onUpdated?: () => void;
}

export default function ContactCard({ data, onUpdated }: Props) {
  const { contact, communications, deals, finance, orders, forms, timeline } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      {/* Left — Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-content-primary">Timeline</h3>
          <span className="text-xs text-content-tertiary">({timeline.length} events)</span>
        </div>
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
          {timeline.map((event, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1.5 px-2 rounded hover:bg-surface-hover text-xs">
              <span className="mt-0.5 flex-shrink-0">{ACTION_ICONS[event.event_type] || '📌'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-content-primary">{event.title || event.event_type}</span>
                  {event.amount && parseFloat(event.amount) > 0 && (
                    <span className="text-status-green font-medium">{formatCurrency(event.amount)}</span>
                  )}
                  {event.status_val && (
                    <span className="text-content-tertiary">({event.status_val})</span>
                  )}
                </div>
                {event.detail && (
                  <div className="text-content-tertiary truncate mt-0.5">{event.detail}</div>
                )}
              </div>
              <span className="text-content-tertiary text-[10px] flex-shrink-0 mt-0.5">
                {formatRelativeTime(event.event_date)}
              </span>
            </div>
          ))}
          {timeline.length === 0 && (
            <div className="text-content-tertiary text-xs py-4 text-center">No activity yet</div>
          )}
        </div>
      </div>

      {/* Right — Details */}
      <div className="space-y-4">
        {/* Contact Info — Editable */}
        <ContactInfoSection contact={contact} onUpdated={onUpdated} />

        {/* Communications — full content */}
        <CommunicationsSection contactId={contact.id} breakdown={communications.breakdown} total={communications.total} />

        {/* Deals */}
        {deals.count > 0 && (
          <DetailSection title="Deals">
            {deals.items.map(deal => {
              const stg = getStageConfig(deal.stage);
              return (
                <div key={deal.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-content-primary font-medium truncate">{deal.title}</span>
                    {stg && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stg.bg} ${stg.text}`}>{stg.label}</span>}
                  </div>
                  <span className="font-medium text-content-primary">{formatCurrency(deal.amount)}</span>
                </div>
              );
            })}
          </DetailSection>
        )}

        {/* Finance — Enhanced */}
        <FinanceSection finance={finance} />

        {/* Orders */}
        {orders.count > 0 && (
          <DetailSection title="iTokna Orders">
            {orders.items.slice(0, 3).map(order => (
              <div key={order.id_doc} className="flex items-center justify-between text-xs py-1">
                <span className="text-content-primary">#{order.docnum}</span>
                <span className="font-medium">{formatCurrency(order.syma)}</span>
              </div>
            ))}
          </DetailSection>
        )}

        {/* FB Lead Ads / Form Responses — Enhanced */}
        <FormAnswersSection forms={forms} contact={contact} />

        {/* Contact Notes */}
        <NotesSection contactId={contact.id} />

        {/* Call Briefing */}
        <CallBriefingSection contactId={contact.id} />

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t border-surface-border">
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-surface-border text-content-secondary hover:bg-surface-hover transition-colors">
              <Phone size={12} /> Call
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-surface-border text-content-secondary hover:bg-surface-hover transition-colors">
              <Mail size={12} /> Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Info with Inline Editing ─── */

function ContactInfoSection({ contact, onUpdated }: { contact: ContactCardData['contact']; onUpdated?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    name: contact.name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    city: contact.city || '',
    state: contact.state || '',
  });

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const changed: Record<string, string | null> = {};
      if (fields.name !== (contact.name || '')) changed.name = fields.name || null;
      if (fields.email !== (contact.email || '')) changed.email = fields.email || null;
      if (fields.phone !== (contact.phone || '')) changed.phone = fields.phone || null;
      if (fields.city !== (contact.city || '')) changed.city = fields.city || null;
      if (fields.state !== (contact.state || '')) changed.state = fields.state || null;

      if (Object.keys(changed).length > 0) {
        await updateContact(contact.id, changed);
        onUpdated?.();
      }
      setEditing(false);
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  }, [fields, contact, onUpdated]);

  const handleCancel = () => {
    setFields({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      city: contact.city || '',
      state: contact.state || '',
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <DetailSection title="Contact">
        <div className="space-y-2">
          <EditField label="Name" value={fields.name} onChange={v => setFields(p => ({ ...p, name: v }))} />
          <EditField label="Email" value={fields.email} onChange={v => setFields(p => ({ ...p, email: v }))} type="email" />
          <EditField label="Phone" value={fields.phone} onChange={v => setFields(p => ({ ...p, phone: v }))} type="tel" />
          <div className="flex gap-2">
            <EditField label="City" value={fields.city} onChange={v => setFields(p => ({ ...p, city: v }))} />
            <EditField label="State" value={fields.state} onChange={v => setFields(p => ({ ...p, state: v }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-accent text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-surface-border text-content-secondary hover:bg-surface-hover"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Contact" action={<button onClick={() => setEditing(true)} className="text-content-tertiary hover:text-accent"><Pencil size={11} /></button>}>
      <div className="space-y-1.5 text-xs">
        {contact.email && (
          <div className="flex items-center gap-2 text-content-secondary">
            <Mail size={12} className="text-content-tertiary" />
            <span>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-content-secondary">
            <Phone size={12} className="text-content-tertiary" />
            <span>{contact.phone}</span>
          </div>
        )}
        {(contact.city || contact.state) && (
          <div className="flex items-center gap-2 text-content-secondary">
            <MapPin size={12} className="text-content-tertiary" />
            <span>{[contact.city, contact.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {contact.owner_name && (
          <div className="text-content-tertiary mt-1">Seller: {contact.owner_name}</div>
        )}
      </div>
    </DetailSection>
  );
}

/* ─── Finance Section — Wave + QB detail ─── */

function FinanceSection({ finance }: { finance: ContactCardData['finance'] }) {
  const hasWave = finance.wave && (finance.wave.total > 0 || finance.wave.invoices?.length > 0);
  const hasQB = finance.quickbooks && (finance.quickbooks.total > 0 || finance.quickbooks.invoices?.length > 0);

  if (!hasWave && !hasQB && finance.total_invoiced <= 0) return null;

  return (
    <DetailSection title="Finance">
      <div className="space-y-2 text-xs">
        {/* Summary row */}
        <div className="flex justify-between items-center pb-1.5 border-b border-surface-border">
          <span className="font-medium text-content-primary">Total Invoiced</span>
          <span className="font-semibold text-content-primary">${finance.total_invoiced.toLocaleString()}</span>
        </div>

        {/* Wave invoices */}
        {hasWave && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-1">Wave</div>
            {finance.wave.invoices.map((inv: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-content-primary">#{inv.invoice_number}</span>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
                <div className="text-right">
                  <span className="text-content-primary">${parseFloat(inv.total_amount || '0').toLocaleString()}</span>
                  {parseFloat(inv.amount_due || '0') > 0 && (
                    <span className="text-status-red ml-1.5 text-[10px]">({formatCurrency(inv.amount_due)} due)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QuickBooks invoices */}
        {hasQB && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-1">QuickBooks</div>
            {finance.quickbooks.invoices.map((inv: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-content-primary">#{inv.doc_number}</span>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
                <div className="text-right">
                  <span className="text-content-primary">${parseFloat(inv.total_amount || '0').toLocaleString()}</span>
                  {parseFloat(inv.balance || '0') > 0 && (
                    <span className="text-status-red ml-1.5 text-[10px]">({formatCurrency(inv.balance)} due)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Outstanding total */}
        {finance.total_outstanding > 0 && (
          <div className="flex justify-between items-center pt-1.5 border-t border-surface-border">
            <span className="font-medium text-status-red">Balance Due</span>
            <span className="font-semibold text-status-red">${finance.total_outstanding.toLocaleString()}</span>
          </div>
        )}
      </div>
    </DetailSection>
  );
}

/* ─── Form Answers / FB Lead Ads — Enhanced ─── */

function FormAnswersSection({ forms, contact }: { forms: ContactCardData['forms']; contact: ContactCardData['contact'] }) {
  // Merge contact preferences with form data
  const contactPrefs: Record<string, string> = {};
  const c = contact as any;
  if (c.pref_frame_color) contactPrefs['Frame Color'] = c.pref_frame_color;
  if (c.pref_glass_type) contactPrefs['Glass Type'] = c.pref_glass_type;
  if (c.pref_grill_type) contactPrefs['Grill Type'] = c.pref_grill_type;
  if (c.pref_handle_color) contactPrefs['Handle Color'] = c.pref_handle_color;
  if (c.pref_hinges_color) contactPrefs['Hinges Color'] = c.pref_hinges_color;
  if (c.pref_tempered) contactPrefs['Tempered'] = c.pref_tempered;

  const hasPrefs = Object.keys(contactPrefs).length > 0;
  const hasForms = forms.length > 0;

  if (!hasPrefs && !hasForms) return null;

  const form = hasForms ? forms[0] : null;

  return (
    <DetailSection title={form?.source === 'facebook_ads' ? 'FB Lead Ads' : 'Form Answers'}>
      <div className="space-y-2 text-xs">
        {/* Form submission answers */}
        {form && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {form.color_preference && <FormTag label="Color" value={form.color_preference} />}
            {form.timeline && <FormTag label="Timeline" value={form.timeline.replace(/_/g, ' ')} />}
            {form.glazing_type && <FormTag label="Glazing" value={form.glazing_type} />}
            {form.window_count && <FormTag label="Windows" value={form.window_count} />}
            {form.needs_visit && <FormTag label="Visit Needed" value={form.needs_visit} highlight />}
            {form.frame_color && <FormTag label="Frame" value={form.frame_color} />}
          </div>
        )}

        {/* Contact-level preferences */}
        {hasPrefs && (
          <>
            {hasForms && <div className="border-t border-surface-border pt-1.5 mt-1.5" />}
            <div className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold">Product Config</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {Object.entries(contactPrefs).map(([label, value]) => (
                <FormTag key={label} label={label} value={value} />
              ))}
            </div>
          </>
        )}

        {/* Source + date */}
        {form && (
          <div className="text-[10px] text-content-tertiary pt-1">
            via {form.source?.replace(/_/g, ' ')} {form.created_at && `· ${formatRelativeTime(form.created_at)}`}
          </div>
        )}
      </div>
    </DetailSection>
  );
}

/* ─── Communications Section — Full Content ─── */

function CommunicationsSection({ contactId, breakdown, total }: { contactId: number; breakdown: Record<string, number>; total: number }) {
  const [comms, setComms] = useState<CommItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'call' | 'email' | 'sms'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const callCount = (breakdown.call_inbound || 0) + (breakdown.call_outbound || 0);
  const emailCount = (breakdown.email_inbound || 0) + (breakdown.email_outbound || 0);
  const smsCount = (breakdown.sms_inbound || 0) + (breakdown.sms_outbound || 0);

  const loadComms = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetchContactComms(contactId, type, 1, 30);
      setComms(res.timeline);
      setLoaded(true);
    } catch (e) {
      console.error('Failed to load comms:', e);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  const handleFilter = (f: 'all' | 'call' | 'email' | 'sms') => {
    setFilter(f);
    setExpandedId(null);
    loadComms(f);
  };

  // Auto-load on first render
  useEffect(() => {
    if (!loaded) loadComms('all');
  }, [loaded, loadComms]);

  const getContent = (c: CommItem): string => {
    if (c.comm_type === 'call') return c.subject || '(no transcription)';
    if (c.comm_type === 'sms') return c.body || '';
    if (c.comm_type === 'email') return c.body || '';
    return c.body || c.subject || '';
  };

  const getPreview = (c: CommItem): string => {
    if (c.comm_type === 'call') {
      const text = c.subject || '';
      return text.length > 80 ? text.substring(0, 80) + '...' : text;
    }
    if (c.comm_type === 'email') return c.subject || '(no subject)';
    const body = (c.body || '').replace(/<[^>]*>/g, '').trim();
    return body.length > 80 ? body.substring(0, 80) + '...' : body;
  };

  const formatDuration = (s: number | null) => {
    if (!s) return '';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return date.toLocaleDateString('en-US', opts);
  };

  return (
    <DetailSection title={`Communications (${total})`}>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-2">
        {([
          ['all', `All ${total}`, null],
          ['call', `📞 ${callCount}`, callCount],
          ['email', `📧 ${emailCount}`, emailCount],
          ['sms', `💬 ${smsCount}`, smsCount],
        ] as const).map(([key, label, count]) => (
          count !== 0 && (
            <button
              key={key}
              onClick={() => handleFilter(key as any)}
              className={`px-2 py-0.5 text-[10px] rounded-full font-medium transition-colors ${
                filter === key
                  ? 'bg-accent text-white'
                  : 'bg-surface text-content-tertiary hover:text-content-secondary'
              }`}
            >
              {label}
            </button>
          )
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-content-tertiary py-2">
          <Loader2 size={12} className="animate-spin" /> Loading...
        </div>
      )}

      {/* Communications list */}
      {!loading && comms.length > 0 && (
        <div className="space-y-0.5 max-h-[350px] overflow-y-auto pr-1">
          {comms.map(c => {
            const isExpanded = expandedId === c.id;
            const content = getContent(c);
            const preview = getPreview(c);
            const dir = c.direction === 'inbound' ? '←' : c.direction === 'outbound' ? '→' : '';
            const typeIcon = c.comm_type === 'call' ? '📞' : c.comm_type === 'email' ? '📧' : c.comm_type === 'sms' ? '💬' : '📝';
            const hasMore = content.length > 80;

            return (
              <div key={c.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full text-left flex items-start gap-2 text-[11px] py-1.5 px-1.5 rounded hover:bg-surface-hover transition-colors group"
                >
                  <span className="flex-shrink-0 text-content-tertiary w-[50px]">{formatDate(c.date)}</span>
                  <span className="flex-shrink-0">{typeIcon}{dir}</span>
                  <span className="flex-1 min-w-0 text-content-secondary">
                    <span className={isExpanded ? '' : 'line-clamp-1'}>{preview}</span>
                    {c.comm_type === 'call' && c.duration_seconds ? (
                      <span className="text-content-tertiary ml-1">({formatDuration(c.duration_seconds)})</span>
                    ) : null}
                  </span>
                  {hasMore && (
                    <span className="flex-shrink-0 text-content-tertiary opacity-0 group-hover:opacity-100">
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </span>
                  )}
                </button>
                {isExpanded && content && (
                  <div className="ml-[66px] mr-1 mb-1.5 p-2 rounded bg-surface border border-surface-border text-[11px] text-content-primary leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {c.comm_type === 'email' && c.subject && (
                      <div className="font-medium text-content-primary mb-1">Subject: {c.subject}</div>
                    )}
                    {c.comm_type === 'email' && c.metadata && (
                      <div className="text-[10px] text-content-tertiary mb-1.5">
                        {(c.metadata as any).from && <>From: {(c.metadata as any).from}</>}
                        {(c.metadata as any).to && <> → {(c.metadata as any).to}</>}
                      </div>
                    )}
                    {content.replace(/<[^>]*>/g, '')}
                    {c.phone_line && (
                      <div className="text-[10px] text-content-tertiary mt-1.5 pt-1 border-t border-surface-border">
                        via {c.phone_line}
                        {c.comm_type === 'call' && c.duration_seconds ? ` · ${formatDuration(c.duration_seconds)}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && comms.length === 0 && loaded && (
        <div className="text-xs text-content-tertiary py-2 text-center">No communications found</div>
      )}
    </DetailSection>
  );
}

/* ─── Shared Components ─── */

function DetailSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-surface-card rounded-md border border-surface-border p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex-1">
      <label className="text-[10px] text-content-tertiary uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full mt-0.5 px-2 py-1 text-xs bg-surface border border-surface-border rounded focus:border-accent focus:outline-none text-content-primary"
      />
    </div>
  );
}


function FormTag({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <>
      <span className="text-content-tertiary">{label}:</span>
      <span className={highlight ? 'text-accent font-medium' : 'text-content-primary'}>{value}</span>
    </>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const config = s === 'paid' || s === 'closed'
    ? 'bg-green-100 text-green-700'
    : s === 'overdue'
    ? 'bg-red-100 text-red-700'
    : s === 'open' || s === 'sent'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase ${config}`}>
      {status}
    </span>
  );
}

/* ─── Notes Section ─── */

function NotesSection({ contactId }: { contactId: number }) {
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContactNotes(contactId).then(d => {
      setNotes(d.notes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [contactId]);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const result = await addContactNote(contactId, newNote.trim());
      setNotes(prev => [result.note, ...prev]);
      setNewNote('');
    } catch (e) {
      console.error('Failed to add note:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailSection title={`Notes${notes.length > 0 ? ` (${notes.length})` : ''}`}>
      <div className="space-y-2">
        {/* Add note form */}
        <div className="flex gap-1.5">
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a note..."
            className="flex-1 px-2 py-1 text-xs bg-surface border border-surface-border rounded focus:border-accent focus:outline-none text-content-primary"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newNote.trim()}
            className="px-2 py-1 bg-accent text-white rounded text-xs hover:bg-accent-dark disabled:opacity-50"
          >
            {saving ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
          </button>
        </div>

        {/* Notes list */}
        {loading ? (
          <div className="text-xs text-content-tertiary py-1">Loading...</div>
        ) : notes.length > 0 ? (
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {notes.map(note => (
              <div key={note.id} className="text-xs py-1 px-1.5 rounded bg-surface">
                <div className="text-content-primary">{note.content}</div>
                <div className="text-[10px] text-content-tertiary mt-0.5">
                  {note.author} · {formatRelativeTime(note.created_at)}
                  {note.pinned && <span className="text-accent ml-1">pinned</span>}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </DetailSection>
  );
}

/* ─── Call Briefing Section ─── */

function CallBriefingSection({ contactId }: { contactId: number }) {
  const [briefing, setBriefing] = useState<CallBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (!briefing) {
      setLoading(true);
      try {
        const data = await fetchCallBriefing(contactId);
        setBriefing(data);
      } catch (e) {
        console.error('Failed to load briefing:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DetailSection
      title="Call Briefing"
      action={
        <button onClick={handleOpen} className="text-content-tertiary hover:text-accent">
          <PhoneCall size={11} />
        </button>
      }
    >
      {!open && (
        <button onClick={handleOpen} className="text-xs text-accent hover:underline">
          Load briefing before calling
        </button>
      )}
      {open && loading && (
        <div className="flex items-center gap-2 text-xs text-content-tertiary py-1">
          <Loader2 size={12} className="animate-spin" /> Loading...
        </div>
      )}
      {open && briefing && (
        <div className="text-xs space-y-1.5">
          {briefing.briefing.last_contact && (
            <div className="text-content-secondary">
              <span className="text-content-tertiary">Last:</span>{' '}
              {briefing.briefing.last_contact.summary}
              <span className="text-content-tertiary ml-1">({briefing.briefing.last_contact.days_ago}d ago)</span>
            </div>
          )}
          {briefing.briefing.active_deal && (
            <div className="text-content-secondary">
              <span className="text-content-tertiary">Deal:</span>{' '}
              {briefing.briefing.active_deal.title}{' '}
              <span className="text-accent">{formatCurrency(briefing.briefing.active_deal.amount)}</span>
            </div>
          )}
          {briefing.briefing.preferences.color && (
            <div className="text-content-secondary">
              <span className="text-content-tertiary">Prefs:</span>{' '}
              {[briefing.briefing.preferences.color, briefing.briefing.preferences.glazing, briefing.briefing.preferences.timeline].filter(Boolean).join(', ')}
            </div>
          )}
          {briefing.briefing.balance_due > 0 && (
            <div className="text-status-red">Balance: ${briefing.briefing.balance_due.toLocaleString()}</div>
          )}
          {briefing.briefing.talking_points.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-surface-border">
              <div className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-1">Talking Points</div>
              <ul className="space-y-0.5">
                {briefing.briefing.talking_points.map((tp, i) => (
                  <li key={i} className="text-content-primary flex items-start gap-1.5">
                    <span className="text-accent">•</span> {tp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </DetailSection>
  );
}
