import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Loader2, X, Mail, Phone, MessageSquare, FileText, ArrowRightLeft, ChevronRight, ChevronLeft, Users, TrendingUp, Clock, Zap, Sparkles } from 'lucide-react';
import { cn, formatCurrency, timeAgo, formatDateTime } from '../lib/utils';
import SignalsBar, { useSignalCounts } from '../components/SignalsBar';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.decacrm.com';
const API_KEY = 'deca-admin-2026-secure-api-key-8x9z4w3y2q1p';

const SELLERS = [
  { id: '452551692', name: 'Eric', fullName: 'Eric Yurtuc' },
  { id: '1782412198', name: 'Paul', fullName: 'Paul Naz' },
  { id: '83366492', name: 'Ilya', fullName: 'Ilya' },
] as const;

const COLUMNS = [
  { key: 'hot', label: '🔥 Ready to Buy', color: 'green', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-400' },
  { key: 'engaged', label: '💬 Actively Interested', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  { key: 'considering', label: '🤔 Considering', color: 'yellow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  { key: 'doubtful', label: '😟 Has Doubts', color: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400' },
  { key: 'cold', label: '🥶 Going Cold', color: 'red', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' },
  { key: 'won', label: '✅ Won', color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
  { key: 'lost', label: '❌ Lost', color: 'gray', bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', dot: 'bg-gray-500' },
] as const;

const TABS = ['All', 'Emails', 'SMS', 'Calls', 'Notes', 'Changes'] as const;
const TAB_ICONS: Record<string, typeof Mail> = { Emails: Mail, SMS: MessageSquare, Calls: Phone, Notes: FileText, Changes: ArrowRightLeft };

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
}

async function apiFetch(path: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: { 'x-api-key': API_KEY } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  dealName?: string;
  dealAmount?: number;
  dealStage?: string;
  score?: number;
  classification?: string;
  column?: string;
  lastActivity?: string;
  timelineCount?: number;
  handoffs?: number;
  handoffTimeline?: Array<{ date: string; from: string; to: string }>;
  signals?: string[];
  summaryLine?: string;
  blocker?: string;
  insight?: {
    why_here?: string;
    blocker?: string;
    recommendation?: string;
    missing?: string;
    summary_line?: string;
  };
}

interface SellerData {
  name: string;
  contacts: Contact[];
  columns: Record<string, { label: string; color: string; count: number }>;
}

interface TimelineEvent {
  type: string;
  date: string;
  subject?: string;
  body?: string;
  from?: string;
  to?: string;
  direction?: string;
  duration?: number;
  note?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  [key: string]: unknown;
}

export default function CommandCenter() {
  const [activeSeller, setActiveSeller] = useState(SELLERS[0].id);
  const [overview, setOverview] = useState<Record<string, SellerData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [panelTab, setPanelTab] = useState<typeof TABS[number]>('All');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [aiPopup, setAiPopup] = useState<Contact | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [mobileContact, setMobileContact] = useState<Contact | null>(null);
  const [mobileTab, setMobileTab] = useState<typeof TABS[number]>('All');
  const { counts: signalCounts, total: totalSignals } = useSignalCounts();
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const openAiPopup = useCallback(async (contact: Contact) => {
    if (contact.insight) {
      setAiPopup(contact);
      return;
    }
    // Fetch insight from contact detail endpoint
    setAiLoading(true);
    setAiPopup({ ...contact }); // show popup immediately with what we have
    try {
      const data = await apiFetch(`/api/command-center/contact/${contact.id}`);
      if (data.insight) {
        setAiPopup(prev => prev ? { ...prev, insight: data.insight } : null);
      }
    } catch (e) {
      console.error('Failed to load AI insight:', e);
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch('/api/command-center/overview')
      .then(data => {
        setOverview(data.sellerViews || data);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const loadTimeline = useCallback(async (contactId: string, tab: string) => {
    setTimelineLoading(true);
    try {
      const path = tab === 'All'
        ? `/api/command-center/contact/${contactId}`
        : `/api/command-center/contact/${contactId}/tab/${tab.toLowerCase()}`;
      const data = await apiFetch(path);
      setTimeline(data.timeline || data.events || []);
      // Enrich selected contact with detail data
      if (data.contact) {
        // Parse signals: could be array of strings or object with categories
        let parsedSignals: string[] | undefined;
        if (Array.isArray(data.signals)) {
          parsedSignals = data.signals.map((s: any) => typeof s === 'string' ? s : s.text || s.signal);
        } else if (data.signals && typeof data.signals === 'object') {
          parsedSignals = [];
          for (const [cat, items] of Object.entries(data.signals)) {
            if (Array.isArray(items) && items.length > 0) {
              parsedSignals.push(`${cat.replace(/_/g, ' ')}: ${items.length}`);
            }
          }
        }
        setSelectedContact(prev => prev ? {
          ...prev,
          email: prev.email || data.contact.email,
          phone: prev.phone || data.contact.phone,
          company: prev.company || data.contact.company,
          handoffTimeline: Array.isArray(data.handoffs) ? data.handoffs : prev.handoffTimeline,
          signals: parsedSignals && parsedSignals.length > 0 ? parsedSignals : prev.signals,
          insight: data.insight || prev.insight,
        } : prev);
      }
    } catch {
      setTimeline([]);
    }
    setTimelineLoading(false);
  }, []);

  const openMobileContact = useCallback((c: Contact) => {
    setMobileContact(c);
    setMobileTab('All');
    loadTimeline(c.id, 'All');
  }, [loadTimeline]);

  const switchMobileTab = useCallback((tab: typeof TABS[number]) => {
    setMobileTab(tab);
    if (mobileContact) loadTimeline(mobileContact.id, tab);
  }, [mobileContact, loadTimeline]);

  const openContact = useCallback((c: Contact) => {
    if (selectedContact?.id === c.id) {
      setSelectedContact(null);
      return;
    }
    setSelectedContact(c);
    setPanelTab('All');
    setInsightOpen(false);
    loadTimeline(c.id, 'All');
  }, [loadTimeline, selectedContact]);

  const switchTab = useCallback((tab: typeof TABS[number]) => {
    setPanelTab(tab);
    if (selectedContact) loadTimeline(selectedContact.id, tab);
  }, [selectedContact, loadTimeline]);

  const seller = overview?.[activeSeller];
  const contactsByColumn: Record<string, Contact[]> = {};
  COLUMNS.forEach(col => { contactsByColumn[col.key] = []; });
  seller?.contacts?.forEach((raw: any) => {
    const c: Contact = {
      id: raw.contactId || raw.id,
      name: raw.contactName || raw.name || raw.dealName || 'Unknown',
      email: raw.email,
      phone: raw.phone,
      company: raw.company,
      dealName: raw.dealName,
      dealAmount: raw.amount ? Number(raw.amount) : undefined,
      dealStage: raw.dealStage,
      score: raw.score,
      classification: raw.behavior?.classification || raw.classification,
      column: raw.behavior?.column || raw.column || 'considering',
      lastActivity: raw.lastActivity,
      timelineCount: raw.timelineCount,
      handoffs: raw.handoffs,
      handoffTimeline: raw.handoffTimeline,
      signals: Array.isArray(raw.behavior?.signals) ? raw.behavior.signals : Array.isArray(raw.signals) ? raw.signals : undefined,
      summaryLine: raw.summaryLine,
      blocker: raw.blocker,
    };
    const key = c.column || 'considering';
    if (contactsByColumn[key]) contactsByColumn[key].push(c);
    else contactsByColumn['considering'].push(c);
  });

  // Mobile: columns with contacts
  const activeColumns = COLUMNS.filter(col => (contactsByColumn[col.key] || []).length > 0);
  const safeColIdx = Math.min(mobileColIdx, Math.max(activeColumns.length - 1, 0));
  const currentMobileCol = activeColumns[safeColIdx] || COLUMNS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load Command Center</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* ═══════════ MOBILE VIEW ═══════════ */}
      <div className="md:hidden flex flex-col h-full">
        {/* Mobile: Fullscreen Contact Detail */}
        {mobileContact ? (
          <div className="flex flex-col h-full bg-navy-900">
            {/* Mobile contact header */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-navy-700/50 bg-navy-900/95 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setMobileContact(null)} className="p-1.5 rounded-lg bg-navy-800 text-gray-400 hover:text-gray-200">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-gray-100 truncate">{mobileContact.name}</h2>
                  {mobileContact.dealName && (
                    <p className="text-xs text-gray-400 truncate">
                      <span className="text-accent-light">{mobileContact.dealAmount ? formatCurrency(mobileContact.dealAmount) : ''}</span> · {mobileContact.dealStage}
                    </p>
                  )}
                </div>
                {mobileContact.score != null && (
                  <span className="text-sm font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">{mobileContact.score}</span>
                )}
                {mobileContact.summaryLine && (
                  <button
                    onClick={() => openAiPopup(mobileContact)}
                    className="p-2 rounded-lg bg-amber-500/10 text-amber-400"
                  >
                    <Sparkles size={16} />
                  </button>
                )}
              </div>
              {/* Contact info chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {mobileContact.email && (
                  <span className="flex items-center gap-1 bg-navy-800 text-gray-400 px-2 py-0.5 rounded text-[11px]">
                    <Mail size={10} />{mobileContact.email}
                  </span>
                )}
                {mobileContact.phone && (
                  <a href={`tel:${mobileContact.phone}`} className="flex items-center gap-1 bg-navy-800 text-green-400 px-2 py-0.5 rounded text-[11px]">
                    <Phone size={10} />{mobileContact.phone}
                  </a>
                )}
              </div>
              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1">
                {TABS.map(tab => {
                  const Icon = TAB_ICONS[tab];
                  return (
                    <button
                      key={tab}
                      onClick={() => switchMobileTab(tab)}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                        mobileTab === tab
                          ? 'bg-accent text-white'
                          : 'bg-navy-800 text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {Icon && <Icon size={11} />}
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Mobile timeline */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {timelineLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" size={20} /></div>
              ) : timeline.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-12">No events found</p>
              ) : (
                timeline.map((evt, i) => <TimelineItem key={i} event={evt} />)
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile top bar */}
            <div className="flex-shrink-0 border-b border-navy-700/50 bg-navy-900/95 backdrop-blur-sm px-4 py-3">
              <div className="flex items-center gap-3 mb-2">
                <Zap size={16} className="text-accent flex-shrink-0" />
                <div className="flex bg-navy-800 rounded-lg p-0.5 gap-0.5 flex-1">
                  {SELLERS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSeller(s.id)}
                      className={cn(
                        'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                        activeSeller === s.id
                          ? 'bg-accent text-white shadow-lg shadow-accent/20'
                          : 'text-gray-400'
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{seller?.contacts?.length || 0}</span>
              </div>
              {/* Column selector — swipeable pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto -mx-4 px-4 pb-1">
                {activeColumns.map((col, idx) => {
                  const count = (contactsByColumn[col.key] || []).length;
                  return (
                    <button
                      key={col.key}
                      onClick={() => setMobileColIdx(idx)}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                        safeColIdx === idx
                          ? cn(col.bg, col.border, col.text)
                          : 'border-transparent text-gray-500 bg-navy-800/50'
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', col.dot)} />
                      {col.label.split(' ').pop()}
                      <span className="opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Mobile: single column, swipeable */}
            <div
              className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
              onTouchStart={(e) => {
                touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
              }}
              onTouchEnd={(e) => {
                if (!touchStart.current) return;
                const dx = e.changedTouches[0].clientX - touchStart.current.x;
                const dy = e.changedTouches[0].clientY - touchStart.current.y;
                const dt = Date.now() - touchStart.current.t;
                // Horizontal swipe: > 60px, less vertical than horizontal, < 400ms
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 400) {
                  if (dx < 0 && safeColIdx < activeColumns.length - 1) setMobileColIdx(safeColIdx + 1);
                  else if (dx > 0 && safeColIdx > 0) setMobileColIdx(safeColIdx - 1);
                }
                touchStart.current = null;
              }}
            >
              {(contactsByColumn[currentMobileCol.key] || []).map(c => (
                <button
                  key={c.id}
                  onClick={() => openMobileContact(c)}
                  className="w-full text-left p-3 rounded-xl border bg-navy-800/80 border-navy-700/40 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-bold text-gray-200 truncate flex-1">{c.name}</p>
                    <div className="flex items-center gap-1.5 ml-2">
                      {c.summaryLine && (
                        <span
                          onClick={(e) => { e.stopPropagation(); openAiPopup(c); }}
                          className="p-1 rounded-md bg-amber-500/10 text-amber-400"
                        >
                          <Sparkles size={11} />
                        </span>
                      )}
                      {c.score != null && (
                        <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', currentMobileCol.bg, currentMobileCol.text)}>
                          {c.score}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.dealName && (
                    <p className="text-xs text-gray-400 truncate">
                      <span className="text-accent-light">{c.dealAmount ? formatCurrency(c.dealAmount) : ''}</span> · {c.dealName}
                    </p>
                  )}
                  {c.dealStage && <p className="text-[11px] text-gray-500 mt-0.5">{c.dealStage}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                    {c.lastActivity && <span className="flex items-center gap-1"><Clock size={9} />{timeAgo(c.lastActivity)}</span>}
                    {(c.timelineCount ?? 0) > 0 && <span>{c.timelineCount} events</span>}
                    {(c.handoffs ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <ArrowRightLeft size={9} />{c.handoffs}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {(contactsByColumn[currentMobileCol.key] || []).length === 0 && (
                <p className="text-center text-gray-600 text-sm py-12">No contacts</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══════════ DESKTOP VIEW ═══════════ */}
      {/* Top Bar */}
      <div className="hidden md:block flex-shrink-0 border-b border-navy-700/50 bg-navy-900/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Zap size={20} className="text-accent" />
              Command Center
            </h1>
            <div className="flex bg-navy-800 rounded-lg p-1 gap-1">
              {SELLERS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSeller(s.id)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-all relative',
                    activeSeller === s.id
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700'
                  )}
                >
                  {s.name}
                  {(signalCounts[s.id === '452551692' ? '2' : s.id === '1782412198' ? '3' : '4'] || 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1 animate-pulse">
                      {signalCounts[s.id === '452551692' ? '2' : s.id === '1782412198' ? '3' : '4']}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {seller && (
            <div className="flex items-center gap-4 text-sm">
              <Stat icon={Users} label="Contacts" value={seller.contacts?.length || 0} />
              {Object.entries(seller.columns || {}).slice(0, 4).map(([k, v]) => (
                <Stat key={k} label={v.label?.split(' ').pop() || k} value={v.count} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Signals Bar - Desktop */}
      <div className="hidden md:block px-4 pt-3">
        <SignalsBar
          sellerId={activeSeller === '452551692' ? '2' : activeSeller === '1782412198' ? '3' : '4'}
          onSignalClick={(signal) => {
            // Find the contact in current view and open it
            const contact = seller?.contacts?.find((c: any) => String(c.contactId || c.id) === String(signal.contact_id));
            if (contact) openContact(contact as any);
          }}
        />
      </div>

      {/* Kanban Board - Desktop only, drag-to-scroll */}
      <div
        className="hidden md:block flex-1 h-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none"
        ref={(el) => {
          if (!el || (el as any).__dragInit) return;
          (el as any).__dragInit = true;
          let isDown = false, startX = 0, scrollLeft = 0;
          el.addEventListener('mousedown', (e) => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; });
          el.addEventListener('mouseleave', () => { isDown = false; });
          el.addEventListener('mouseup', () => { isDown = false; });
          el.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX); });
        }}
      >
        <div className="flex gap-2 p-3 h-full min-w-max">
          {COLUMNS.map(col => {
            const contacts = contactsByColumn[col.key] || [];
            return (
              <div key={col.key} className={cn("min-w-[220px] w-56 flex-shrink-0 flex flex-col")}>
                <div className={cn('sticky top-0 z-10 px-3 py-2 rounded-t-lg border', col.bg, col.border)}>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', col.dot)} />
                    <span className={cn('text-sm font-semibold', col.text)}>{col.label}</span>
                    <span className="ml-auto text-xs text-gray-500 bg-navy-800 px-1.5 py-0.5 rounded-full">
                      {contacts.length}
                    </span>
                  </div>
                  {contacts.reduce((sum, c) => sum + (c.dealAmount || 0), 0) > 0 && (
                    <p className={cn('text-xs font-semibold mt-1', col.text, 'opacity-70')}>
                      {formatCurrency(contacts.reduce((sum, c) => sum + (c.dealAmount || 0), 0))}
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)] space-y-1.5 p-1.5 bg-navy-950/30 rounded-b-lg border border-t-0 border-navy-700/30">
                  {contacts.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-8">No contacts</p>
                  )}
                  {contacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => openContact(c)}
                      className={cn(
                        'w-full text-left px-2.5 py-2 rounded-lg border transition-all hover:scale-[1.01]',
                        'bg-navy-800/80 border-navy-700/40 hover:border-navy-600 hover:bg-navy-800',
                        selectedContact?.id === c.id && 'ring-1 ring-accent border-accent/40'
                      )}
                    >
                      <div className="flex items-start justify-between mb-0.5">
                        <p className="text-xs font-bold text-gray-200 truncate">{c.name}</p>
                        {c.score != null && (
                          <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', col.bg, col.text)}>
                            {c.score}
                          </span>
                        )}
                      </div>
                      {c.dealAmount ? (
                        <p className="text-[11px] text-accent-light truncate">{formatCurrency(c.dealAmount)}</p>
                      ) : c.company ? (
                        <p className="text-[11px] text-gray-500 truncate">{c.company}</p>
                      ) : null}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                        {c.lastActivity && <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(c.lastActivity)}</span>}
                        {(c.timelineCount ?? 0) > 0 && <span>{c.timelineCount} events</span>}
                        {(c.handoffs ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <ArrowRightLeft size={10} />{c.handoffs} handoffs
                          </span>
                        )}
                        {c.summaryLine && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openAiPopup(c); }}
                            className="ml-auto p-1 rounded-md bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 transition-all hover:scale-110"
                            title="AI Sales Advisor"
                          >
                            <Sparkles size={12} />
                          </button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-over Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-in-out',
          selectedContact ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Backdrop */}
        {selectedContact && (
          <div className="fixed inset-0 bg-black/30 -z-10" onClick={() => setSelectedContact(null)} />
        )}
        <div className="h-full w-[520px] bg-navy-900 border-l border-navy-700/50 shadow-2xl flex flex-col relative overflow-hidden">
          {selectedContact && (
            <>
              {/* Panel Header */}
              <div className="flex-shrink-0 p-5 border-b border-navy-700/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-100">{selectedContact.name}</h2>
                    {selectedContact.company && <p className="text-sm text-gray-400">{selectedContact.company}</p>}
                  </div>
                  <button onClick={() => setSelectedContact(null)} className="text-gray-500 hover:text-gray-300 p-1">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedContact.email && (
                    <span className="flex items-center gap-1 bg-navy-800 text-gray-300 px-2 py-1 rounded">
                      <Mail size={12} />{selectedContact.email}
                    </span>
                  )}
                  {selectedContact.phone && (
                    <span className="flex items-center gap-1 bg-navy-800 text-gray-300 px-2 py-1 rounded">
                      <Phone size={12} />{selectedContact.phone}
                    </span>
                  )}
                </div>
                {selectedContact.score != null && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm">
                      <TrendingUp size={14} className="text-accent" />
                      <span className="text-gray-300 font-semibold">Score: {selectedContact.score}</span>
                    </span>
                    {selectedContact.classification && (
                      <span className="text-xs bg-accent/10 text-accent-light px-2 py-0.5 rounded border border-accent/20">
                        {selectedContact.classification}
                      </span>
                    )}
                  </div>
                )}
                {/* Signals */}
                {selectedContact.signals && selectedContact.signals.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {selectedContact.signals.map((s, i) => (
                      <span key={i} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {/* Handoff timeline */}
                {selectedContact.handoffTimeline && selectedContact.handoffTimeline.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Handoffs</p>
                    {selectedContact.handoffTimeline.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <ArrowRightLeft size={10} className="text-amber-400" />
                        <span>{h.from}</span>
                        <ChevronRight size={10} />
                        <span>{h.to}</span>
                        <span className="text-gray-600 ml-auto">{timeAgo(h.date)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* AI Insight - icon trigger */}
                {selectedContact.insight && (
                  <button
                    onClick={() => openAiPopup(selectedContact)}
                    className="mt-3 w-full flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg px-3 py-2 hover:from-amber-500/15 hover:to-orange-500/15 transition-all"
                  >
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Sparkles size={12} /> AI Sales Advisor
                    </span>
                    <ChevronRight size={14} className="text-amber-400" />
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex-shrink-0 flex border-b border-navy-700/50 px-3 gap-1 overflow-x-auto">
                {TABS.map(tab => {
                  const Icon = TAB_ICONS[tab];
                  return (
                    <button
                      key={tab}
                      onClick={() => switchTab(tab)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                        panelTab === tab
                          ? 'border-accent text-accent-light'
                          : 'border-transparent text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {Icon && <Icon size={12} />}
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {timelineLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-accent" size={20} />
                  </div>
                ) : timeline.length === 0 ? (
                  <p className="text-center text-gray-600 text-sm py-12">No events found</p>
                ) : (
                  timeline.map((evt, i) => <TimelineItem key={i} event={evt} />)
                )}
              </div>

            </>
          )}
        </div>
      </div>

      {/* AI Insight Popup Modal */}
      {aiPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAiPopup(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-navy-800 border border-amber-500/20 rounded-2xl shadow-2xl shadow-amber-500/5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-navy-700/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15">
                  <Sparkles size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-400">AI Sales Advisor</p>
                  <p className="text-[11px] text-gray-500">{aiPopup.name}</p>
                </div>
              </div>
              <button onClick={() => setAiPopup(null)} className="text-gray-500 hover:text-gray-300 p-1.5 hover:bg-navy-700 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Summary line */}
            {aiPopup.summaryLine && (
              <div className="px-5 pt-3">
                <p className="text-xs text-amber-400/80 italic">{aiPopup.summaryLine}</p>
              </div>
            )}

            {/* Insight sections */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {aiLoading && !aiPopup.insight && (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Loading AI analysis...</span>
                </div>
              )}
              {aiPopup.insight ? (
                <>
                  {aiPopup.insight.why_here && (
                    <div className="bg-navy-700/30 rounded-xl p-3.5">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-1.5">📍 Why here</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{aiPopup.insight.why_here}</p>
                    </div>
                  )}
                  {aiPopup.insight.blocker && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3.5">
                      <p className="text-[10px] text-red-400/70 uppercase font-semibold tracking-wider mb-1.5">🚫 Blocker</p>
                      <p className="text-sm text-red-300 leading-relaxed">{aiPopup.insight.blocker}</p>
                    </div>
                  )}
                  {aiPopup.insight.recommendation && (
                    <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3.5">
                      <p className="text-[10px] text-green-400/70 uppercase font-semibold tracking-wider mb-1.5">💡 Next Action</p>
                      <p className="text-sm text-green-300 leading-relaxed">{aiPopup.insight.recommendation}</p>
                    </div>
                  )}
                  {aiPopup.insight.missing && (
                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3.5">
                      <p className="text-[10px] text-yellow-400/70 uppercase font-semibold tracking-wider mb-1.5">⚠️ Not Yet Discussed</p>
                      <p className="text-sm text-yellow-300 leading-relaxed">{aiPopup.insight.missing}</p>
                    </div>
                  )}
                </>
              ) : !aiLoading && (
                <>
                  {aiPopup.blocker && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3.5">
                      <p className="text-[10px] text-red-400/70 uppercase font-semibold tracking-wider mb-1.5">🚫 Blocker</p>
                      <p className="text-sm text-red-300 leading-relaxed">{aiPopup.blocker}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-center">Full AI analysis not available for this contact</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon?: typeof Users; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-1.5 text-gray-400">
      {Icon && <Icon size={14} className="text-gray-500" />}
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-200">{value}</span>
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const [emailBody, setEmailBody] = useState<string | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const typeColors: Record<string, string> = {
    email: 'text-sky-400 bg-sky-500/10',
    sms: 'text-green-400 bg-green-500/10',
    call: 'text-purple-400 bg-purple-500/10',
    note: 'text-yellow-400 bg-yellow-500/10',
    change: 'text-gray-400 bg-gray-500/10',
  };
  const typeIcons: Record<string, typeof Mail> = {
    email: Mail, sms: MessageSquare, call: Phone, note: FileText, change: ArrowRightLeft,
  };
  const t = event.type?.toLowerCase() || 'note';
  const color = typeColors[t] || typeColors.note;
  const Icon = typeIcons[t] || FileText;
  const e = event as any;

  const loadEmailBody = async () => {
    if (!e.id || loadingBody) return;
    setLoadingBody(true);
    try {
      const folder = e.folder || 'INBOX';
      const data = await apiFetch(`/api/command-center/email/${e.id}/body?folder=${encodeURIComponent(folder)}`);
      setEmailBody(data.body || '(empty)');
    } catch { setEmailBody('Failed to load email body'); }
    setLoadingBody(false);
  };

  return (
    <div className="flex gap-3">
      <div className={cn('flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5', color)}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-300 capitalize">{event.type || 'Event'}</span>
          {t === 'email' && e.accountLabel && <span className="text-xs text-sky-400/70 font-medium">[{e.accountLabel}]</span>}
          {event.direction && <span className="text-xs text-gray-600">({event.direction})</span>}
          {t === 'email' && e.folder && <span className="text-xs text-gray-600">{e.folder}</span>}
          <span className="text-xs text-gray-600 ml-auto">{formatDateTime(event.date)}</span>
        </div>
        {/* Email rendering */}
        {t === 'email' && (
          <>
            {event.subject && <p className="text-sm text-gray-200 font-medium mb-0.5">📧 {event.subject}</p>}
            {event.from && <p className="text-xs text-gray-400">{event.from} → {event.to || '?'}</p>}
            {event.body && <p className="text-xs text-gray-400 whitespace-pre-wrap mt-1 border-l-2 border-sky-500/20 pl-2 line-clamp-6">{event.body}</p>}
            {emailBody && <p className="text-xs text-gray-400 whitespace-pre-wrap mt-1 border-l-2 border-sky-500/30 pl-2">{emailBody}</p>}
            {!event.body && !emailBody && e.id && (
              <button onClick={loadEmailBody} className="text-xs text-sky-400/70 hover:text-sky-300 mt-0.5 cursor-pointer">
                {loadingBody ? 'Loading...' : '📨 Click to load email body'}
              </button>
            )}
          </>
        )}
        {/* Note rendering */}
        {t === 'note' && (event.note || event.body) && (
          <p className="text-xs text-gray-300 whitespace-pre-wrap bg-yellow-500/5 rounded p-1.5 mt-0.5">
            {event.note || (event.body?.includes('<') ? stripHtml(event.body) : event.body)}
          </p>
        )}
        {/* SMS */}
        {t === 'sms' && (e.text || event.body) && <p className="text-xs text-gray-400 whitespace-pre-wrap">{e.text || event.body}</p>}
        {/* Call */}
        {t === 'call' && (typeof e.summary === 'string' ? e.summary : e.summary?.data?.summary?.join(' ')) && (
          <p className="text-xs text-gray-400 italic">{typeof e.summary === 'string' ? e.summary : e.summary?.data?.summary?.join(' ')}</p>
        )}
        {/* Non-email from/to already shown above for emails */}
        {t !== 'email' && event.from && <p className="text-xs text-gray-500">From: {event.from}{event.to ? ` → ${event.to}` : ''}</p>}
        {e.userName && <p className="text-xs text-gray-500">By: {e.userName}</p>}
        {/* Generic subject for non-email */}
        {t !== 'email' && t !== 'note' && event.subject && <p className="text-sm text-gray-200 font-medium mb-0.5">{event.subject}</p>}
        {/* Generic body for non-note, non-email */}
        {t !== 'email' && t !== 'note' && t !== 'sms' && event.body && <p className="text-xs text-gray-400 line-clamp-3 whitespace-pre-wrap">{event.body}</p>}
        {event.field && (
          <p className="text-xs text-gray-500">
            {event.field}: <span className="text-red-400 line-through">{event.oldValue}</span> → <span className="text-green-400">{event.newValue}</span>
          </p>
        )}
        {event.duration != null && <p className="text-xs text-gray-500">Duration: {Math.floor(event.duration / 60)}m {event.duration % 60}s</p>}
      </div>
    </div>
  );
}
