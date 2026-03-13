import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, AlertCircle, Phone, Mail, Zap, Bell, PhoneMissed, UserPlus, Clock,
  CheckCircle2, MessageSquare, ArrowRight, ChevronDown, ChevronUp, Flame, Package,
  Copy, Check, ExternalLink, Search, StickyNote, Send, MailOpen, PhoneIncoming,
  CornerUpLeft, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchSellerBoard, fetchFilterValues, fetchSellerMetrics, fetchSellerNotifications,
  markNotificationRead, fetchCallBriefing, fetchEmailTemplates, renderEmailTemplate,
  fetchRecentInboundSms, fetchProductionStatus, fetchContactComms, fetchSellerInbox,
  fetchTemplateSuggestions, sendDraftEmail, fetchSellerProduction, addContactNote,
  fetchStageContacts,
  type SellerBoardData, type SellerMetrics, type SellerNotificationsResponse,
  type CallBriefing, type EmailTemplate, type RenderedEmail, type InboundSmsMessage,
  type ProductionOrder, type ProductionResponse, type CommItem, type InboxItem,
  type SmartInboxResponse, type TemplateSuggestion, type SellerProductionResponse,
  type StageContact, type StageContactsResponse
} from '../services/hub';
import { ACTION_ICONS, formatRelativeTime, formatCurrency, getStageConfig } from '../lib/theme';
import { useAuth } from '../context/AuthContext';

export default function SellerBoard() {
  const { role, teamMemberId } = useAuth();
  const [data, setData] = useState<SellerBoardData | null>(null);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [notifications, setNotifications] = useState<SellerNotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [selectedContact, setSelectedContact] = useState<SellerBoardData['doNow'][0] | null>(null);

  // Smart Inbox
  const [inbox, setInbox] = useState<SmartInboxResponse | null>(null);
  const [inboxLoading, setInboxLoading] = useState(false);

  // Template suggestions
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Seller production
  const [sellerProd, setSellerProd] = useState<SellerProductionResponse | null>(null);

  // Init seller — sync with shared state (Database page selection)
  useEffect(() => {
    fetchFilterValues().then(fv => {
      setSellers(fv.sellers);
      if (role === 'seller' && teamMemberId) {
        const me = fv.sellers.find(s => s.id === teamMemberId);
        if (me) { setSelectedSeller(me.name); setSelectedSellerId(me.id); }
      } else {
        // Read shared seller from localStorage (synced from Database page)
        const shared = localStorage.getItem('deca-selected-seller');
        const match = shared ? fv.sellers.find(s => s.name === shared) : null;
        if (match) {
          setSelectedSeller(match.name);
          setSelectedSellerId(match.id);
        } else if (fv.sellers.length) {
          setSelectedSeller(fv.sellers[0].name);
          setSelectedSellerId(fv.sellers[0].id);
        }
      }
    }).catch(console.error);
  }, [role, teamMemberId]);

  // Listen for seller changes from other pages
  useEffect(() => {
    const handler = (e: Event) => {
      const seller = (e as CustomEvent).detail?.seller || '';
      if (seller && seller !== selectedSeller) {
        const s = sellers.find(x => x.name === seller);
        if (s) {
          setSelectedSeller(s.name);
          setSelectedSellerId(s.id);
          setSelectedContact(null);
        }
      }
    };
    window.addEventListener('seller-changed', handler);
    return () => window.removeEventListener('seller-changed', handler);
  }, [selectedSeller, sellers]);

  const loadBoard = useCallback(async () => {
    if (!selectedSeller) return;
    setLoading(true);
    try {
      const [boardData, metricsData, notifsData] = await Promise.all([
        fetchSellerBoard(undefined, selectedSeller),
        selectedSellerId ? fetchSellerMetrics(selectedSellerId) : Promise.resolve(null),
        selectedSellerId ? fetchSellerNotifications(selectedSellerId) : Promise.resolve(null),
      ]);
      setData(boardData);
      setMetrics(metricsData);
      setNotifications(notifsData);
      if (boardData.doNow.length > 0 && !selectedContact) {
        setSelectedContact(boardData.doNow[0]);
      }
    } catch (e) {
      console.error('Failed to load seller board:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedSeller, selectedSellerId]);

  // Load Smart Inbox + Template Suggestions + Seller Production
  useEffect(() => {
    if (!selectedSellerId) return;
    setInboxLoading(true);
    fetchSellerInbox(selectedSellerId)
      .then(setInbox)
      .catch(console.error)
      .finally(() => setInboxLoading(false));

    setSuggestionsLoading(true);
    fetchTemplateSuggestions(selectedSellerId)
      .then(res => setSuggestions(res.suggestions || []))
      .catch(console.error)
      .finally(() => setSuggestionsLoading(false));

    fetchSellerProduction(selectedSellerId)
      .then(setSellerProd)
      .catch(console.error);
  }, [selectedSellerId]);

  useEffect(() => { loadBoard(); }, [loadBoard]);
  useEffect(() => {
    const interval = setInterval(loadBoard, 60000);
    return () => clearInterval(interval);
  }, [loadBoard]);

  const handleSellerChange = (name: string) => {
    setSelectedSeller(name);
    const s = sellers.find(x => x.name === name);
    setSelectedSellerId(s?.id || null);
    setSelectedContact(null);
    // Sync to shared state so Database + Deals pages update
    localStorage.setItem('deca-selected-seller', name);
    window.dispatchEvent(new CustomEvent('seller-changed', { detail: { seller: name } }));
  };

  const handleDismissNotif = async (id: number) => {
    await markNotificationRead(id);
    setNotifications(prev => prev ? {
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    } : prev);
  };

  const handleSelectContact = (item: SellerBoardData['doNow'][0]) => {
    setSelectedContact(item);
  };

  const handleInboxContactClick = (item: InboxItem) => {
    const found = data?.doNow.find(d => d.contact_id === item.contact_id);
    if (found) {
      setSelectedContact(found);
    } else {
      setSelectedContact({
        contact_id: item.contact_id,
        contact_name: item.contact_name,
        deal_title: '',
        amount: '0',
        stage: '',
        close_date: null,
        phone: item.phone || null,
        email: item.email || null,
        balance_due: '0',
        days_silent: 0,
        priority_score: 0,
        next_action: item.type === 'sms' ? 'Reply to SMS' : item.type === 'missed_call' ? 'Call back' : 'Reply to email',
      });
    }
  };

  const inboxTotal = inbox ? inbox.sms.length + inbox.missed_calls.length + inbox.emails.length : 0;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 40px)' }}>
      {data && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* PIPELINE + HEADER merged into one row */}
          <div className="border-b border-surface-border flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5">
              {/* Seller selector inline */}
              {role === 'admin' && (
                <select
                  value={selectedSeller}
                  onChange={e => handleSellerChange(e.target.value)}
                  className="text-xs bg-white border border-surface-border rounded px-2 py-0.5 text-content-primary focus:border-accent focus:outline-none flex-shrink-0"
                >
                  {sellers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              )}
              {inboxTotal > 0 && (
                <span className="text-[10px] font-medium bg-red-50 text-red-600 px-1.5 py-0.5 rounded flex-shrink-0">
                  {inboxTotal}
                </span>
              )}
              {loading && <Loader2 size={12} className="text-content-tertiary animate-spin flex-shrink-0" />}
            </div>
            <PipelineFunnel
              pipeline={data.pipeline}
              sellerName={selectedSeller}
              onSelectContact={(sc) => {
                setSelectedContact({
                  contact_id: String(sc.contact_id),
                  contact_name: sc.contact_name,
                  deal_title: sc.deal_title,
                  amount: sc.amount,
                  stage: sc.stage,
                  close_date: sc.close_date,
                  phone: sc.phone,
                  email: sc.email,
                  balance_due: sc.balance_due,
                  days_silent: sc.days_silent || 0,
                  priority_score: 0,
                  next_action: sc.days_silent && sc.days_silent > 7 ? 'Follow up — ' + sc.days_silent + 'd silent' : 'Review deal',
                });
              }}
              selectedContactId={selectedContact?.contact_id || null}
            />
          </div>

          {/* Notifications */}
          <NotificationsBar notifications={notifications} onDismiss={handleDismissNotif} />

          {/* Smart Inbox */}
          <div className="border-b border-surface-border flex-shrink-0">
            <SmartInbox
              inbox={inbox}
              loading={inboxLoading}
              onContactClick={handleInboxContactClick}
              selectedContactId={selectedContact?.contact_id || null}
            />
          </div>

          {/* 3-column: DO NOW | Action Panel | Templates + Production */}
          <div className="flex-1 flex min-h-0">

            {/* LEFT — DO NOW */}
            <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-surface-border">
              <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-content-primary">Do Now</h2>
                  <span className="text-[10px] text-content-tertiary font-medium">{data.doNow.length}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {data.doNow.length === 0 && (
                  <div className="px-3 py-8 text-center text-xs text-content-tertiary">No urgent priorities</div>
                )}
                {data.doNow.map((item, i) => (
                  <DoNowRow
                    key={item.contact_id}
                    item={item}
                    rank={i + 1}
                    isSelected={selectedContact?.contact_id === item.contact_id}
                    onSelect={() => handleSelectContact(item)}
                    suggestions={suggestions}
                    sellerProd={sellerProd}
                  />
                ))}
              </div>
            </div>

            {/* CENTER — Action Panel — scrollable */}
            <div className="flex-1 flex flex-col overflow-y-auto border-r border-surface-border">
              {selectedContact ? (
                <ActionPanel contact={selectedContact} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-content-tertiary text-sm">
                  <div className="text-center">
                    <Search size={28} className="mx-auto mb-2 text-content-tertiary/30" />
                    <p className="text-xs font-medium">Select a contact</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Templates + Production + Feed */}
            <div className="w-[280px] flex-shrink-0 flex flex-col overflow-y-auto">
              <EmailTemplatePanel
                suggestions={suggestions}
                loading={suggestionsLoading}
                onContactClick={handleInboxContactClick}
              />

              <ProductionTracker
                production={sellerProd}
                onContactClick={(cid, cname) => {
                  const found = data?.doNow.find(d => d.contact_id === String(cid));
                  if (found) setSelectedContact(found);
                }}
              />

              {/* Live Feed */}
              <div className="flex-1">
                <div className="flex items-center px-3 py-2 border-b border-surface-border">
                  <h2 className="text-xs font-semibold text-content-primary">Activity</h2>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                  {data.liveFeed.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-content-tertiary">No recent events</div>
                  ) : (
                    data.liveFeed.slice(0, 10).map((event, i) => (
                      <div key={i} className="px-3 py-1.5 hover:bg-surface-hover/50 transition-colors border-b border-surface-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] flex-shrink-0">{ACTION_ICONS[event.event_type] || '📌'}</span>
                          <span className="text-[11px] font-medium text-content-primary truncate">{event.contact_name}</span>
                          <span className="text-[10px] text-content-tertiary ml-auto flex-shrink-0">{formatRelativeTime(event.event_date)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SMART INBOX — Unified unanswered items
   ═══════════════════════════════════════════════ */

function SmartInbox({ inbox, loading, onContactClick, selectedContactId }: {
  inbox: SmartInboxResponse | null; loading: boolean;
  onContactClick: (item: InboxItem) => void; selectedContactId: string | null;
}) {
  const [tab, setTab] = useState<'all' | 'sms' | 'calls' | 'emails'>('all');
  const [collapsed, setCollapsed] = useState(false);

  const allItems: InboxItem[] = inbox
    ? [
        ...inbox.sms.map(s => ({ ...s, type: 'sms' as const })),
        ...inbox.missed_calls.map(c => ({ ...c, type: 'missed_call' as const })),
        ...inbox.emails.map(e => ({ ...e, type: 'email' as const })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const filtered = tab === 'all' ? allItems
    : tab === 'sms' ? allItems.filter(i => i.type === 'sms')
    : tab === 'calls' ? allItems.filter(i => i.type === 'missed_call')
    : allItems.filter(i => i.type === 'email');

  const total = allItems.length;
  if (total === 0 && !loading) return null;

  const tabCounts = {
    all: allItems.length,
    sms: inbox?.sms.length || 0,
    calls: inbox?.missed_calls.length || 0,
    emails: inbox?.emails.length || 0,
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare size={13} className="text-green-600" />;
      case 'missed_call': return <PhoneMissed size={13} className="text-red-500" />;
      case 'email': return <MailOpen size={13} className="text-blue-600" />;
      default: return <Bell size={13} />;
    }
  };

  return (
    <div className="bg-white">
      {/* Header + tabs + collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-surface-hover/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-content-primary">Inbox</h2>
          {total > 0 && (
            <span className="text-[10px] font-medium bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{total}</span>
          )}
        </div>
        {!collapsed && (
          <div className="flex gap-1 ml-1">
            {(['all', 'sms', 'calls', 'emails'] as const).map(t => (
              <span
                key={t}
                onClick={(e) => { e.stopPropagation(); setTab(t); }}
                className={`px-2 py-0.5 text-[10px] rounded font-medium cursor-pointer transition-colors ${
                  tab === t
                    ? 'bg-content-primary text-white'
                    : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
                }`}
              >
                {t === 'all' ? 'All' : t === 'sms' ? 'SMS' : t === 'calls' ? 'Calls' : 'Emails'}
                {tabCounts[t] > 0 && <span className="ml-0.5 opacity-70">{tabCounts[t]}</span>}
              </span>
            ))}
          </div>
        )}
        <span className="ml-auto text-content-tertiary">
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </span>
        {loading && <Loader2 size={12} className="text-content-tertiary animate-spin" />}
      </button>

      {/* Items — collapsible */}
      {!collapsed && (
        <div className="flex gap-0 overflow-x-auto border-t border-surface-border/50">
          {filtered.length === 0 && (
            <div className="px-3 py-3 text-xs text-content-tertiary w-full text-center">All caught up</div>
          )}
          {filtered.slice(0, 8).map((item, i) => (
            <button
              key={`${item.type}-${item.comm_id || i}`}
              onClick={() => onContactClick(item)}
              className={`flex-shrink-0 w-[200px] px-3 py-2 text-left border-r border-surface-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors ${
                selectedContactId === item.contact_id ? 'bg-accent/5' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {typeIcon(item.type)}
                <span className="text-[11px] font-medium text-content-primary truncate">{item.contact_name}</span>
                <span className="text-[10px] text-content-tertiary ml-auto flex-shrink-0">{formatRelativeTime(item.date)}</span>
              </div>
              <div className="text-[10px] text-content-secondary line-clamp-1">
                {item.subject || item.preview || item.body || (item.type === 'missed_call' ? 'Missed call' : 'No preview')}
              </div>
              <div className="mt-1">
                {item.type === 'sms' && item.phone && (
                  <a href={`sms:${item.phone}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 hover:text-green-700">
                    <CornerUpLeft size={9} /> Reply
                  </a>
                )}
                {item.type === 'missed_call' && item.phone && (
                  <a href={`tel:${item.phone}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-600">
                    <Phone size={9} /> Call Back
                  </a>
                )}
                {item.type === 'email' && item.email && (
                  <a href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || '')}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700">
                    <CornerUpLeft size={9} /> Reply
                  </a>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DO NOW Row — Enhanced with template glow, SMS preview, production badge
   ═══════════════════════════════════════════════ */

function DoNowRow({ item, rank, isSelected, onSelect, suggestions, sellerProd }: {
  item: SellerBoardData['doNow'][0]; rank: number; isSelected: boolean; onSelect: () => void;
  suggestions: TemplateSuggestion[]; sellerProd: SellerProductionResponse | null;
}) {
  const due = parseFloat(item.balance_due) || 0;
  const stg = item.stage ? getStageConfig(item.stage) : null;
  const contactId = parseInt(item.contact_id);

  // Check if any template suggestion matches this contact
  const hasGlowingTemplate = suggestions.some(s =>
    s.glowing && s.contacts?.some(c => c.contact_id === contactId)
  );

  // Check if this contact has production orders
  const hasProduction = sellerProd?.orders?.some(o => o.contact_id === contactId);

  return (
    <button
      onClick={onSelect}
      className={`w-full px-4 py-3 text-left transition-all border-b border-surface-border/50 last:border-0 ${
        isSelected
          ? 'bg-accent/5 border-l-2 border-l-accent'
          : 'hover:bg-surface-hover/50 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xs font-medium text-content-tertiary w-4 text-right flex-shrink-0 mt-0.5">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-content-primary truncate">{item.contact_name}</span>
            {stg && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stg.bg} ${stg.text}`}>{stg.label}</span>
            )}
            {hasProduction && (
              <Package size={11} className="text-blue-500 flex-shrink-0" title="Has production orders" />
            )}
            {hasGlowingTemplate && (
              <Flame size={11} className="text-orange-500 flex-shrink-0" title="Template ready" />
            )}
          </div>
          <div className="text-xs text-accent mt-0.5 truncate">{item.next_action}</div>
          <div className="flex items-center gap-2 mt-1 text-xs text-content-tertiary">
            {parseFloat(item.amount) > 0 && <span className="font-medium text-content-secondary">{formatCurrency(item.amount)}</span>}
            {due > 0 && <span className="text-red-600 font-medium">${due.toLocaleString()}</span>}
            {item.days_silent > 0 && <span className="text-orange-500">{item.days_silent}d</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   ACTION PANEL — Center column
   ═══════════════════════════════════════════════ */

function ActionPanel({ contact }: { contact: SellerBoardData['doNow'][0] }) {
  const contactId = parseInt(contact.contact_id);
  const [briefing, setBriefing] = useState<CallBriefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [production, setProduction] = useState<ProductionResponse | null>(null);
  const [prodLoading, setProdLoading] = useState(false);
  const [comms, setComms] = useState<CommItem[]>([]);
  const [commsLoading, setCommsLoading] = useState(false);
  const [commsFilter, setCommsFilter] = useState<'all' | 'call' | 'email' | 'sms'>('all');
  const [expandedCommId, setExpandedCommId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'briefing' | 'templates' | 'production' | 'comms'>('briefing');

  // Quick note
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    setBriefing(null);
    setProduction(null);
    setComms([]);
    setActiveTab('briefing');
    setCommsFilter('all');
    setExpandedCommId(null);
    setNoteText('');
    setNoteSaved(false);

    setBriefingLoading(true);
    fetchCallBriefing(contactId)
      .then(setBriefing)
      .catch(console.error)
      .finally(() => setBriefingLoading(false));

    setProdLoading(true);
    fetchProductionStatus(contactId)
      .then(setProduction)
      .catch(console.error)
      .finally(() => setProdLoading(false));

    setCommsLoading(true);
    fetchContactComms(contactId, 'all', 1, 20)
      .then(res => setComms(res.timeline))
      .catch(console.error)
      .finally(() => setCommsLoading(false));
  }, [contactId]);

  const loadComms = (type: string) => {
    setCommsLoading(true);
    setExpandedCommId(null);
    fetchContactComms(contactId, type, 1, 20)
      .then(res => setComms(res.timeline))
      .catch(console.error)
      .finally(() => setCommsLoading(false));
  };

  const handleCommsFilter = (f: 'all' | 'call' | 'email' | 'sms') => {
    setCommsFilter(f);
    loadComms(f);
  };

  const handleQuickNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      await addContactNote(contactId, noteText.trim(), 'general');
      setNoteText('');
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save note:', e);
    } finally {
      setNoteSaving(false);
    }
  };

  const due = parseFloat(contact.balance_due) || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Contact header */}
      <div className="px-5 py-4 border-b border-surface-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">{contact.contact_name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className="text-accent font-medium flex items-center gap-1">
                <AlertCircle size={13} /> {contact.next_action}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-content-primary text-white hover:bg-content-primary/90 font-medium transition-colors">
                <Phone size={13} /> Call
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-surface-border text-content-primary hover:bg-surface-hover font-medium transition-colors">
                <Mail size={13} /> Email
              </a>
            )}
          </div>
        </div>
        {/* Quick stats */}
        <div className="flex items-center gap-2 mt-3">
          {parseFloat(contact.amount) > 0 && (
            <span className="text-xs font-medium text-content-secondary bg-surface px-2 py-1 rounded">
              {formatCurrency(contact.amount)}
            </span>
          )}
          {due > 0 && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
              Owes ${due.toLocaleString()}
            </span>
          )}
          {contact.days_silent > 0 && (
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
              {contact.days_silent}d silent
            </span>
          )}
          {contact.phone && <span className="text-xs text-content-tertiary">{contact.phone}</span>}
        </div>

        {/* Quick Note — inline */}
        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickNote()}
            placeholder="Add a quick note..."
            className="flex-1 text-xs bg-surface/50 border border-surface-border rounded-md px-3 py-1.5 text-content-primary placeholder:text-content-tertiary focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleQuickNote}
            disabled={!noteText.trim() || noteSaving}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-surface border border-surface-border text-content-secondary hover:bg-surface-hover disabled:opacity-40 transition-colors"
          >
            {noteSaved ? <Check size={12} className="text-green-600" /> : noteSaving ? <Loader2 size={12} className="animate-spin" /> : <StickyNote size={12} />}
            {noteSaved ? 'Saved' : 'Note'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-surface-border px-1">
        {([
          ['briefing', 'Briefing', Zap],
          ['templates', 'Templates', Flame],
          ['production', 'Production', Package],
          ['comms', 'Comms', MessageSquare],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-content-primary text-content-primary'
                : 'border-transparent text-content-tertiary hover:text-content-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'briefing' && (
          <BriefingTab briefing={briefing} loading={briefingLoading} />
        )}
        {activeTab === 'templates' && (
          <EmailTemplatesTab contactId={contactId} contactName={contact.contact_name} contactEmail={contact.email} />
        )}
        {activeTab === 'production' && (
          <ProductionTab production={production} loading={prodLoading} />
        )}
        {activeTab === 'comms' && (
          <CommsTab
            comms={comms}
            loading={commsLoading}
            filter={commsFilter}
            onFilter={handleCommsFilter}
            expandedId={expandedCommId}
            onExpand={setExpandedCommId}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   EMAIL TEMPLATE PANEL — Right sidebar with glowing templates
   ═══════════════════════════════════════════════ */

function EmailTemplatePanel({ suggestions, loading, onContactClick }: {
  suggestions: TemplateSuggestion[]; loading: boolean;
  onContactClick: (item: InboxItem) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rendering, setRendering] = useState<{ templateId: number; contactId: number } | null>(null);
  const [rendered, setRendered] = useState<RenderedEmail | null>(null);
  const [draftSent, setDraftSent] = useState<string | null>(null);

  const handleRender = async (templateId: number, contactId: number) => {
    setRendering({ templateId, contactId });
    setRendered(null);
    try {
      const result = await renderEmailTemplate(templateId, contactId);
      setRendered(result);
    } catch (e) {
      console.error(e);
    } finally {
      setRendering(null);
    }
  };

  const handleSendDraft = async (templateId: number, contactId: number) => {
    try {
      await sendDraftEmail(templateId, contactId);
      setDraftSent(`${templateId}-${contactId}`);
      setTimeout(() => setDraftSent(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const glowing = suggestions.filter(s => s.glowing);
  const other = suggestions.filter(s => !s.glowing);

  return (
    <div className="bg-white border-b border-surface-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Flame size={12} className="text-orange-500" />
          <h2 className="text-xs font-semibold text-content-primary">Templates</h2>
        </div>
        {glowing.length > 0 && (
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
            {glowing.length} ready
          </span>
        )}
      </div>

      {loading && <LoadingSpinner text="Loading..." />}

      <div className="max-h-[320px] overflow-y-auto">
        {/* Glowing templates first */}
        {glowing.map(s => (
          <div key={s.template.id} className="border-b border-surface-border/50 last:border-0">
            <button
              onClick={() => setExpandedId(expandedId === s.template.id ? null : s.template.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-orange-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Flame size={12} className="text-orange-500 flex-shrink-0" />
                <span className="text-xs font-medium text-content-primary truncate">{s.template.name}</span>
                <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded ml-auto flex-shrink-0 font-medium">
                  {s.count} contacts
                </span>
              </div>
            </button>

            {expandedId === s.template.id && (
              <div className="px-4 pb-3 space-y-1">
                {s.contacts.slice(0, 5).map(c => (
                  <div key={c.contact_id} className="flex items-center gap-2 text-xs py-1">
                    <span className="text-content-primary font-medium truncate flex-1">{c.contact_name}</span>
                    <button
                      onClick={() => handleRender(s.template.id, c.contact_id)}
                      className="text-accent hover:text-accent-dark font-medium flex-shrink-0"
                      disabled={rendering?.templateId === s.template.id && rendering?.contactId === c.contact_id}
                    >
                      {rendering?.templateId === s.template.id && rendering?.contactId === c.contact_id
                        ? <Loader2 size={10} className="animate-spin" />
                        : 'Preview'}
                    </button>
                    <button
                      onClick={() => handleSendDraft(s.template.id, c.contact_id)}
                      className="text-content-tertiary hover:text-green-600 flex-shrink-0"
                    >
                      {draftSent === `${s.template.id}-${c.contact_id}`
                        ? <Check size={10} className="text-green-600" />
                        : <Send size={10} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Other templates */}
        {other.map(s => (
          <div key={s.template.id} className="border-b border-surface-border/50 last:border-0">
            <button
              onClick={() => setExpandedId(expandedId === s.template.id ? null : s.template.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-surface-hover/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-content-tertiary flex-shrink-0" />
                <span className="text-xs font-medium text-content-secondary truncate">{s.template.name}</span>
                {s.count > 0 && (
                  <span className="text-[10px] text-content-tertiary bg-surface px-1.5 py-0.5 rounded ml-auto flex-shrink-0">
                    {s.count}
                  </span>
                )}
              </div>
            </button>

            {expandedId === s.template.id && s.contacts.length > 0 && (
              <div className="px-4 pb-3 space-y-1">
                {s.contacts.slice(0, 5).map(c => (
                  <div key={c.contact_id} className="flex items-center gap-2 text-xs py-1">
                    <span className="text-content-primary font-medium truncate flex-1">{c.contact_name}</span>
                    <button
                      onClick={() => handleRender(s.template.id, c.contact_id)}
                      className="text-accent hover:text-accent-dark font-medium flex-shrink-0"
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rendered preview */}
      {rendered && (
        <div className="border-t border-surface-border p-3">
          <div className="text-xs font-medium text-content-primary mb-1">{rendered.rendered.subject}</div>
          <div className="text-xs text-content-secondary leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
            {rendered.rendered.body_html.replace(/<[^>]*>/g, '').substring(0, 300)}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                const text = `Subject: ${rendered.rendered.subject}\n\n${rendered.rendered.body_html.replace(/<[^>]*>/g, '')}`;
                navigator.clipboard.writeText(text);
              }}
              className="text-[10px] font-medium text-content-secondary hover:text-content-primary flex items-center gap-1"
            >
              <Copy size={10} /> Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRODUCTION TRACKER — Bottom right
   ═══════════════════════════════════════════════ */

function ProductionTracker({ production, onContactClick }: {
  production: SellerProductionResponse | null;
  onContactClick: (contactId: number, contactName: string) => void;
}) {
  if (!production || production.orders.length === 0) return null;

  const statusColors: Record<string, string> = {
    'Draft': 'bg-surface text-content-secondary',
    'In Production': 'bg-blue-50 text-blue-700',
    'Ready': 'bg-green-50 text-green-700',
    'Shipped': 'bg-purple-50 text-purple-700',
    'Delivered': 'bg-teal-50 text-teal-700',
    'Installed': 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="bg-white border-b border-surface-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Package size={12} className="text-blue-600" />
          <h2 className="text-xs font-semibold text-content-primary">Production</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-content-tertiary">{production.summary.total} orders</span>
          {production.summary.total_value > 0 && (
            <span className="font-medium text-content-secondary">${production.summary.total_value.toLocaleString()}</span>
          )}
        </div>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {production.orders.slice(0, 6).map(order => (
          <button
            key={order.id_doc}
            onClick={() => onContactClick(order.contact_id, order.contact_name)}
            className="w-full text-left px-4 py-2 hover:bg-surface-hover/50 transition-colors border-b border-surface-border/50 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-content-primary truncate">{order.contact_name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColors[order.status_label] || 'bg-surface text-content-secondary'}`}>
                {order.status_label}
              </span>
              <span className="text-xs text-content-secondary ml-auto flex-shrink-0">${parseFloat(order.syma).toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-content-tertiary mt-0.5">
              #{order.docnum} · {order.item_count} items
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BRIEFING TAB
   ═══════════════════════════════════════════════ */

function BriefingTab({ briefing, loading }: { briefing: CallBriefing | null; loading: boolean }) {
  if (loading) return <LoadingSpinner text="Loading briefing..." />;
  if (!briefing) return <EmptyState text="No briefing available" />;

  const b = briefing.briefing;
  return (
    <div className="space-y-5">
      {b.ai_summary && (
        <div className="rounded-lg border border-surface-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={14} className="text-accent" />
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">Summary</span>
          </div>
          <p className="text-sm text-content-primary leading-relaxed">{b.ai_summary}</p>
        </div>
      )}

      {b.customer_quote && (
        <div className="border-l-2 border-content-tertiary pl-4 py-1">
          <p className="text-sm text-content-primary italic leading-relaxed">"{b.customer_quote.text}"</p>
          <span className="text-xs text-content-tertiary mt-1 block">
            — {new Date(b.customer_quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} via {b.customer_quote.source}
          </span>
        </div>
      )}

      {b.next_step && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface/50">
          <ArrowRight size={14} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">Next Step</span>
            <p className="text-sm text-content-primary font-medium mt-0.5">{b.next_step}</p>
          </div>
        </div>
      )}

      {b.interaction_breakdown && (
        <div className="flex items-center gap-4 py-3 border-t border-surface-border">
          {Object.entries(b.interaction_breakdown).map(([type, count]) => (
            <div key={type} className="text-center">
              <div className="text-lg font-semibold text-content-primary">{count}</div>
              <div className="text-xs text-content-tertiary capitalize">{type}s</div>
            </div>
          ))}
          <div className="text-center ml-auto">
            <div className="text-lg font-semibold text-accent">{b.total_interactions}</div>
            <div className="text-xs text-content-tertiary">Total</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {b.active_deal && (
          <span className="text-xs font-medium text-content-secondary bg-surface px-2.5 py-1 rounded-md">
            Deal: {formatCurrency(b.active_deal.amount)} · {b.active_deal.stage}
          </span>
        )}
        {(b.preferences.color || b.preferences.glazing || b.preferences.timeline) && (
          <span className="text-xs font-medium text-content-secondary bg-surface px-2.5 py-1 rounded-md">
            {[b.preferences.color, b.preferences.glazing, b.preferences.timeline].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {b.talking_points.length > 0 && (
        <div className="border-t border-surface-border pt-4">
          <div className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">Talking Points</div>
          <ul className="space-y-2">
            {b.talking_points.map((tp, i) => (
              <li key={i} className="text-sm text-content-primary flex items-start gap-2">
                <span className="text-content-tertiary mt-1 flex-shrink-0">•</span> {tp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {b.recent_comms.length > 0 && (
        <div className="border-t border-surface-border pt-4">
          <div className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">
            Recent ({b.recent_comms.length})
          </div>
          <div className="space-y-0.5">
            {b.recent_comms.slice(0, 5).map((c, i) => {
              const icon = c.comm_type === 'call' ? '📞' : c.comm_type === 'email' ? '📧' : c.comm_type === 'sms' ? '💬' : '📝';
              const dir = c.direction === 'inbound' ? '←' : c.direction === 'outbound' ? '→' : '';
              const text = (c.ai_summary || c.subject || c.preview || '').replace(/<[^>]*>/g, '').substring(0, 100);
              const dur = c.duration_seconds ? ` (${Math.floor(c.duration_seconds / 60)}:${String(c.duration_seconds % 60).padStart(2, '0')})` : '';
              return (
                <div key={i} className="flex items-start gap-2 text-sm py-1.5 px-2 rounded hover:bg-surface-hover/50">
                  <span className="text-content-tertiary w-[50px] flex-shrink-0 text-xs font-medium">
                    {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm flex-shrink-0">{icon}{dir}</span>
                  <span className="text-content-secondary line-clamp-1 text-xs">{text}{dur}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   EMAIL TEMPLATES TAB (in Action Panel)
   ═══════════════════════════════════════════════ */

function EmailTemplatesTab({ contactId, contactName, contactEmail }: { contactId: number; contactName: string; contactEmail: string | null }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState<number | null>(null);
  const [rendered, setRendered] = useState<RenderedEmail | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftSent, setDraftSent] = useState(false);

  useEffect(() => {
    fetchEmailTemplates()
      .then(res => setTemplates(res.templates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePreview = async (templateId: number) => {
    setRendering(templateId);
    setRendered(null);
    setCopied(false);
    setDraftSent(false);
    try {
      const result = await renderEmailTemplate(templateId, contactId);
      setRendered(result);
    } catch (e) {
      console.error(e);
    } finally {
      setRendering(null);
    }
  };

  const handleCopy = () => {
    if (!rendered) return;
    const text = `Subject: ${rendered.rendered.subject}\n\n${rendered.rendered.body_html.replace(/<[^>]*>/g, '')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendDraft = async (templateId: number) => {
    try {
      await sendDraftEmail(templateId, contactId);
      setDraftSent(true);
      setTimeout(() => setDraftSent(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner text="Loading templates..." />;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {templates.filter(t => t.is_active).map(t => {
          const isRecommended = t.category === 'follow_up' || t.category === 'visit';
          return (
            <button
              key={t.id}
              onClick={() => handlePreview(t.id)}
              disabled={rendering === t.id}
              className={`w-full text-left px-3.5 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                isRecommended
                  ? 'border-orange-200 bg-orange-50/50 hover:bg-orange-50'
                  : 'border-surface-border hover:bg-surface-hover/50'
              }`}
            >
              {isRecommended && <Flame size={14} className="text-orange-500 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-content-primary">{t.name}</div>
                <div className="text-xs text-content-tertiary mt-0.5">{t.category.replace(/_/g, ' ')}</div>
              </div>
              {rendering === t.id && <Loader2 size={14} className="animate-spin text-content-tertiary" />}
            </button>
          );
        })}
      </div>

      {rendered && (
        <div className="border border-surface-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface/50 border-b border-surface-border">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Check size={12} className="text-green-600" /> Ready
            </span>
            <div className="flex items-center gap-2">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(rendered.rendered.subject)}&body=${encodeURIComponent(rendered.rendered.body_html.replace(/<[^>]*>/g, ''))}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-content-primary text-white rounded-md text-xs font-medium hover:bg-content-primary/90 transition-colors"
                >
                  <ExternalLink size={11} /> Open in Email
                </a>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border rounded-md text-xs font-medium text-content-secondary hover:bg-surface-hover transition-colors"
              >
                {copied ? <><Check size={11} className="text-green-600" /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
              <button
                onClick={() => rendered && handleSendDraft(rendered.template_id || 0)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border rounded-md text-xs font-medium text-content-secondary hover:bg-surface-hover transition-colors"
              >
                {draftSent ? <><Check size={11} className="text-green-600" /> Draft Saved</> : <><Send size={11} /> Save Draft</>}
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-content-tertiary mb-1">To: {contactEmail || contactName}</div>
            <div className="font-medium text-sm text-content-primary mb-3">{rendered.rendered.subject}</div>
            <div className="text-sm text-content-secondary leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto">
              {rendered.rendered.body_html.replace(/<[^>]*>/g, '')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRODUCTION TAB (in Action Panel)
   ═══════════════════════════════════════════════ */

function ProductionTab({ production, loading }: { production: ProductionResponse | null; loading: boolean }) {
  if (loading) return <LoadingSpinner text="Loading production..." />;
  if (!production || production.orders.length === 0) return <EmptyState text="No orders found" />;

  const statusColors: Record<string, string> = {
    'Draft': 'bg-surface text-content-secondary',
    'In Production': 'bg-blue-50 text-blue-700',
    'Ready': 'bg-green-50 text-green-700',
    'Shipped': 'bg-purple-50 text-purple-700',
    'Delivered': 'bg-teal-50 text-teal-700',
    'Installed': 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center py-3">
          <div className="text-2xl font-semibold text-content-primary">{production.summary.total_orders}</div>
          <div className="text-xs text-content-tertiary mt-0.5">Orders</div>
        </div>
        <div className="text-center py-3">
          <div className="text-2xl font-semibold text-blue-600">{production.summary.in_production}</div>
          <div className="text-xs text-content-tertiary mt-0.5">In Production</div>
        </div>
        <div className="text-center py-3">
          <div className="text-2xl font-semibold text-content-primary">${production.summary.total_value.toLocaleString()}</div>
          <div className="text-xs text-content-tertiary mt-0.5">Total Value</div>
        </div>
      </div>

      <div className="space-y-2">
        {production.orders.map(order => (
          <div key={order.id_doc} className="border border-surface-border rounded-lg p-4 hover:bg-surface-hover/30 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-content-primary">#{order.docnum}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusColors[order.status_label] || 'bg-surface text-content-secondary'}`}>
                  {order.status_label}
                </span>
              </div>
              <span className="font-semibold text-sm text-content-primary">${parseFloat(order.syma).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-content-tertiary">
              <span>{new Date(order.docdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>{order.item_count} items</span>
              {order.komment && <span className="truncate">{order.komment}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMMUNICATIONS TAB (in Action Panel)
   ═══════════════════════════════════════════════ */

function CommsTab({ comms, loading, filter, onFilter, expandedId, onExpand }: {
  comms: CommItem[]; loading: boolean; filter: string;
  onFilter: (f: 'all' | 'call' | 'email' | 'sms') => void;
  expandedId: string | null; onExpand: (id: string | null) => void;
}) {
  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return date.toLocaleDateString('en-US', opts);
  };

  const formatDuration = (s: number | null) => {
    if (!s) return '';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {(['all', 'call', 'email', 'sms'] as const).map(f => {
          const labels: Record<string, string> = { all: 'All', call: 'Calls', email: 'Emails', sms: 'SMS' };
          return (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                filter === f
                  ? 'bg-content-primary text-white'
                  : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {loading && <LoadingSpinner text="Loading..." />}
      {!loading && comms.length === 0 && <EmptyState text="No communications" />}

      {!loading && comms.length > 0 && (
        <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
          {comms.map(c => {
            const isExpanded = expandedId === c.id;
            const content = c.comm_type === 'call' ? (c.subject || '(no transcription)') : (c.body || c.subject || '');
            const preview = c.comm_type === 'call'
              ? (c.subject || '').substring(0, 80)
              : c.comm_type === 'email'
              ? (c.subject || '(no subject)')
              : (c.body || '').replace(/<[^>]*>/g, '').substring(0, 80);
            const dir = c.direction === 'inbound' ? '←' : c.direction === 'outbound' ? '→' : '';
            const icon = c.comm_type === 'call' ? '📞' : c.comm_type === 'email' ? '📧' : c.comm_type === 'sms' ? '💬' : '📝';
            const hasMore = content.length > 80;

            return (
              <div key={c.id}>
                <button
                  onClick={() => onExpand(isExpanded ? null : c.id)}
                  className="w-full text-left flex items-start gap-2 text-sm py-2 px-2 rounded hover:bg-surface-hover/50 transition-colors"
                >
                  <span className="flex-shrink-0 text-content-tertiary w-[50px] text-xs font-medium">{formatDate(c.date)}</span>
                  <span className="flex-shrink-0 text-sm">{icon}{dir}</span>
                  <span className="flex-1 min-w-0 text-content-secondary text-xs">
                    <span className={isExpanded ? '' : 'line-clamp-1'}>{preview}{preview.length >= 80 ? '...' : ''}</span>
                    {c.comm_type === 'call' && c.duration_seconds ? (
                      <span className="text-content-tertiary ml-1">({formatDuration(c.duration_seconds)})</span>
                    ) : null}
                  </span>
                  {hasMore && (
                    <span className="flex-shrink-0 text-content-tertiary">
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                </button>
                {isExpanded && content && (
                  <div className="ml-[66px] mr-2 mb-2 p-3 rounded-md border border-surface-border text-sm text-content-primary leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto bg-surface/30">
                    {c.comm_type === 'email' && c.subject && (
                      <div className="font-medium mb-1 text-sm">Subject: {c.subject}</div>
                    )}
                    {c.comm_type === 'email' && c.metadata && (
                      <div className="text-xs text-content-tertiary mb-2">
                        {(c.metadata as any).from && <>From: {(c.metadata as any).from}</>}
                        {(c.metadata as any).to && <> → {(c.metadata as any).to}</>}
                      </div>
                    )}
                    {content.replace(/<[^>]*>/g, '')}
                    {c.phone_line && (
                      <div className="text-xs text-content-tertiary mt-2 pt-2 border-t border-surface-border">
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
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PIPELINE FUNNEL — Top of page, clickable stage blocks
   ═══════════════════════════════════════════════ */

const PIPELINE_ORDER = [
  'appointmentscheduled', 'qualifiedtobuy', 'presentationscheduled',
  'decisionmakerboughtin', 'contractsent', 'invoicesent',
];
const CLOSED_STAGES = ['closedwon', 'closedlost'];

function PipelineFunnel({ pipeline, sellerName, onSelectContact, selectedContactId }: {
  pipeline: SellerBoardData['pipeline'];
  sellerName: string;
  onSelectContact: (sc: StageContact) => void;
  selectedContactId: string | null;
}) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [stageContacts, setStageContacts] = useState<StageContact[]>([]);
  const [stageLoading, setStageLoading] = useState(false);

  // Sort pipeline by defined order
  const activePipeline = PIPELINE_ORDER
    .map(stage => pipeline.find(p => p.stage.toLowerCase() === stage))
    .filter((p): p is SellerBoardData['pipeline'][0] => !!p && parseInt(p.count) > 0);

  const closedPipeline = CLOSED_STAGES
    .map(stage => pipeline.find(p => p.stage.toLowerCase() === stage))
    .filter((p): p is SellerBoardData['pipeline'][0] => !!p && parseInt(p.count) > 0);

  const handleStageClick = async (stage: string) => {
    if (expandedStage === stage) {
      setExpandedStage(null);
      return;
    }
    setExpandedStage(stage);
    setStageLoading(true);
    setStageContacts([]);
    try {
      const res = await fetchStageContacts(stage, sellerName, 30);
      setStageContacts(res.contacts || []);
    } catch (e) {
      console.error('Failed to load stage contacts:', e);
    } finally {
      setStageLoading(false);
    }
  };

  const totalActive = activePipeline.reduce((s, p) => s + parseInt(p.count), 0);
  const totalValue = activePipeline.reduce((s, p) => s + parseFloat(p.total), 0);

  return (
    <div className="px-2 py-1">
      {/* Stage blocks */}
      <div className="flex gap-1 overflow-x-auto">
        {activePipeline.map(p => {
          const stg = getStageConfig(p.stage);
          const isExpanded = expandedStage === p.stage.toLowerCase();
          return (
            <button
              key={p.stage}
              onClick={() => handleStageClick(p.stage.toLowerCase())}
              className={`flex-1 rounded-md border px-2 py-1 text-left transition-all min-w-[70px] ${
                isExpanded
                  ? 'border-accent bg-accent/5'
                  : 'border-surface-border/60 hover:border-accent/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{stg?.icon}</span>
                  <span className={`text-[10px] font-semibold ${stg?.text || 'text-content-secondary'}`}>{stg?.label || p.stage}</span>
                </div>
                <span className="text-base font-bold text-content-primary">{p.count}</span>
              </div>
              <div className="text-[10px] font-medium text-content-tertiary text-right">{formatCurrency(p.total)}</div>
            </button>
          );
        })}

        {/* Closed stages — smaller, muted */}
        {closedPipeline.map(p => {
          const stg = getStageConfig(p.stage);
          const isExpanded = expandedStage === p.stage.toLowerCase();
          return (
            <button
              key={p.stage}
              onClick={() => handleStageClick(p.stage.toLowerCase())}
              className={`flex-shrink-0 rounded-md border px-2 py-1 text-left transition-all min-w-[70px] ${
                isExpanded
                  ? 'border-accent bg-accent/5'
                  : 'border-surface-border/50 bg-surface/50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{stg?.icon}</span>
                  <span className="text-[10px] font-semibold text-content-tertiary">{stg?.label}</span>
                </div>
                <span className="text-base font-bold text-content-tertiary">{p.count}</span>
              </div>
              <div className="text-[10px] text-content-tertiary text-right">{formatCurrency(p.total)}</div>
            </button>
          );
        })}

        {/* Total summary */}
        <div className="flex-shrink-0 px-2 py-1 min-w-[60px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold">Total</span>
            <span className="text-base font-bold text-accent">{totalActive}</span>
          </div>
          <div className="text-[10px] font-medium text-content-tertiary text-right">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      {/* Expanded stage — contact list */}
      <AnimatePresence>
        {expandedStage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-white rounded-lg border border-surface-border max-h-[280px] flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getStageConfig(expandedStage)?.icon}</span>
                  <span className="text-sm font-semibold text-content-primary">{getStageConfig(expandedStage)?.label}</span>
                  <span className="text-xs text-content-tertiary">({stageContacts.length})</span>
                </div>
                <button onClick={() => setExpandedStage(null)} className="text-content-tertiary hover:text-content-primary">
                  <ChevronUp size={16} />
                </button>
              </div>

              {stageLoading && <LoadingSpinner text="Loading contacts..." />}

              {!stageLoading && stageContacts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 overflow-y-auto">
                  {stageContacts.map(sc => {
                    const isSelected = selectedContactId === String(sc.contact_id);
                    const amount = parseFloat(sc.amount) || 0;
                    const silent = sc.days_silent || 0;
                    const silentColor = silent > 14 ? 'text-red-600' : silent > 7 ? 'text-orange-500' : 'text-content-tertiary';

                    return (
                      <button
                        key={sc.contact_id}
                        onClick={() => onSelectContact(sc)}
                        className={`text-left px-4 py-3 border-b border-r border-surface-border/50 hover:bg-surface-hover/50 transition-colors ${
                          isSelected ? 'bg-accent/5 border-l-2 border-l-accent' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-content-primary truncate">{sc.contact_name}</span>
                          {amount > 0 && <span className="text-sm font-semibold text-content-primary ml-2">{formatCurrency(amount)}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          {silent > 0 && <span className={`font-medium ${silentColor}`}>{silent}d silent</span>}
                          <span className="text-content-tertiary">{sc.total_comms} comms</span>
                          {sc.city && <span className="text-content-tertiary truncate">{sc.city}{sc.state ? ', ' + sc.state : ''}</span>}
                        </div>
                        {sc.phone && <div className="text-xs text-content-tertiary mt-0.5">{sc.phone}</div>}
                      </button>
                    );
                  })}
                </div>
              )}

              {!stageLoading && stageContacts.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-content-tertiary">No contacts in this stage</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════ */

function TodayMetrics({ data, metrics, inboxCount }: { data: SellerBoardData; metrics: SellerMetrics | null; inboxCount: number }) {
  const m = metrics?.metrics;
  return (
    <div className="flex items-center gap-0 divide-x divide-surface-border/50 px-2 py-1.5">
      <MetricCard label="Contacts" value={data.stats.total_contacts} />
      <MetricCard label="Deals" value={data.stats.total_deals} />
      <MetricCard label="Pipeline" value={formatCurrency(data.stats.total_pipeline)} />
      <MetricCard
        label="Calls"
        value={m ? `${parseInt(m.calls_made) + parseInt(m.calls_received)}` : data.stats.comms_24h}
        sub={m && parseInt(m.calls_missed) > 0 ? `${m.calls_missed} missed` : undefined}
        warn={m ? parseInt(m.calls_missed) > 0 : false}
      />
      <MetricCard label="Emails" value={m ? `${parseInt(m.emails_sent) + parseInt(m.emails_received)}` : '—'} />
      <MetricCard label="Touched" value={m?.contacts_touched || '0'} />
      <MetricCard
        label="Inbox"
        value={inboxCount}
        warn={inboxCount > 0}
      />
    </div>
  );
}

function MetricCard({ label, value, sub, warn, highlight }: {
  label: string; value: string | number; sub?: string; warn?: boolean; highlight?: boolean;
}) {
  return (
    <div className="px-3 py-1">
      <div className="text-[10px] text-content-tertiary font-medium">{label}</div>
      <div className={`text-sm font-semibold ${
        warn ? 'text-red-600' : highlight ? 'text-green-600' : 'text-content-primary'
      }`}>
        {value}
      </div>
      {sub && <div className={`text-[10px] ${warn ? 'text-red-500' : 'text-content-tertiary'}`}>{sub}</div>}
    </div>
  );
}

function NotificationsBar({ notifications, onDismiss }: {
  notifications: SellerNotificationsResponse | null; onDismiss: (id: number) => void;
}) {
  const alerts = notifications?.live_alerts || [];
  const notifs = notifications?.notifications || [];
  const total = alerts.length + notifs.length;
  if (total === 0) return null;

  return (
    <div className="px-3 py-1 space-y-1 border-b border-surface-border flex-shrink-0">
      {alerts.map((alert, i) => (
        <div key={`alert-${i}`} className="flex items-center gap-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm">
          <PhoneMissed size={14} className="text-red-500 flex-shrink-0" />
          <span className="text-red-600 font-medium">Missed</span>
          <span className="text-content-primary font-medium">{alert.contact_name}</span>
          {alert.phone && <span className="text-content-tertiary text-xs">{alert.phone}</span>}
          <span className="text-content-tertiary text-xs ml-auto">{formatRelativeTime(alert.date)}</span>
          {alert.phone && (
            <a href={`tel:${alert.phone}`} className="px-3 py-1 bg-content-primary text-white rounded-md text-xs font-medium hover:bg-content-primary/90 transition-colors">
              Call Back
            </a>
          )}
        </div>
      ))}
      {notifs.slice(0, 3).map(n => (
        <div key={n.id} className="flex items-center gap-2.5 px-3 py-1.5 border-b border-surface-border/50 text-sm">
          <NotifIcon type={n.type} />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-content-primary">{n.title}</span>
            {n.body && <span className="text-content-tertiary ml-1.5">{n.body}</span>}
          </div>
          <span className="text-xs text-content-tertiary flex-shrink-0">{formatRelativeTime(n.created_at)}</span>
          <button onClick={() => onDismiss(n.id)} className="text-content-tertiary hover:text-green-600 flex-shrink-0 transition-colors">
            <CheckCircle2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case 'missed_call': return <PhoneMissed size={12} className="text-red-500" />;
    case 'new_lead': return <UserPlus size={12} className="text-green-600" />;
    case 'inactive_deal': return <Clock size={12} className="text-orange-500" />;
    default: return <Bell size={12} className="text-content-tertiary" />;
  }
}

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-content-tertiary py-6">
      <Loader2 size={14} className="animate-spin" /> {text}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-sm text-content-tertiary text-center py-8">{text}</div>
  );
}
