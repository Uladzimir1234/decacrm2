import { useState, useEffect, useCallback, useRef, useMemo, MouseEvent as ReactMouseEvent } from 'react';
import {
  DndContext, DragOverlay, pointerWithin, rectIntersection, useDroppable,
  useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
  Search, Loader2, Phone, Mail, MessageSquare, X, Clock, ChevronDown, ChevronUp,
  ArrowUpDown, StickyNote, CalendarPlus, Paperclip, Send, Check, AlertCircle, ExternalLink,
  PanelLeftClose, PanelLeftOpen, GripVertical, ArrowUp, DollarSign
} from 'lucide-react';
import {
  fetchContactsLive, fetchContactCard, fetchFilterValues, fetchPulse, fetchContactComms,
  addContactNote, fetchDealsBoard, moveDealStage, fetchCategories,
  type HubContact, type ListParams, type ContactCard as ContactCardType, type FilterValues,
  type PulseData, type CommItem, type BoardDeal, type DealsBoardResponse, type CategoryCount
} from '../services/hub';
import { getActivityIndicator, getStageConfig, ACTION_ICONS, formatRelativeTime, formatCurrency } from '../lib/theme';

const SOURCE_LABELS: Record<string, string> = {
  'word_of_mouth': 'WOM', 'facebook': 'FB', 'instagram': 'IG', 'google': 'Google',
  'website': 'Web', 'referral': 'Ref', 'zillow': 'Zillow', 'yelp': 'Yelp',
  'thumbtack': 'Tack', 'homeadvisor': 'HA', 'angieslist': 'Angi',
  'paid_social': 'Paid', 'organic_search': 'SEO', 'direct_traffic': 'Direct', 'offline': 'Offline',
};
function getSourceLabel(source: string | null): string {
  if (!source) return '';
  return SOURCE_LABELS[source.toLowerCase().replace(/[\s-]+/g, '_')] || source.slice(0, 8);
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#3954AB', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className="rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: colors[idx], fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

const VIEW_TABS = [
  { key: 'all', label: 'All' },
  { key: 'leads', label: 'Leads' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'deals', label: 'Deals' },
  { key: 'customers', label: 'Customers' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Last Activity' },
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Date Added' },
  { value: 'value', label: 'Deal Value' },
];

export default function DatabaseLive() {
  const [contacts, setContacts] = useState<HubContact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('db_activeTab') || 'all');
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('db_sortBy') || 'recent');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cardData, setCardData] = useState<ContactCardType | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues | null>(null);
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('db_filters');
    return saved ? JSON.parse(saved) : { seller: '', stage: '', city: '', state: '', category: '' };
  });
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const autoSelected = useRef(false);
  const limit = 50;

  // UI state — all persisted in localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('db_sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [cardWidth, setCardWidth] = useState(() => {
    const saved = localStorage.getItem('db_cardWidth');
    return saved ? parseInt(saved, 10) : 420;
  });
  const [activityWidth, setActivityWidth] = useState(() => {
    const saved = localStorage.getItem('db_activityWidth');
    return saved ? parseInt(saved, 10) : 288;
  });

  // Deal Page state
  const [dealPageOpen, setDealPageOpen] = useState(() => localStorage.getItem('db_dealPageOpen') === 'true');
  const [dealsData, setDealsData] = useState<DealsBoardResponse | null>(null);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dragDeal, setDragDeal] = useState<BoardDeal | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const MIN_CONTACTS_WIDTH = 250;
  const SIDEBAR_WIDTH = sidebarOpen ? 224 : 40;
  const HANDLE_WIDTH = 2; // thin handles (matching sidebar border)

  // Persist all UI state
  useEffect(() => { localStorage.setItem('db_sidebarOpen', String(sidebarOpen)); }, [sidebarOpen]);
  useEffect(() => { localStorage.setItem('db_cardWidth', String(cardWidth)); }, [cardWidth]);
  useEffect(() => { localStorage.setItem('db_activityWidth', String(activityWidth)); }, [activityWidth]);

  // Clamp widths on window resize
  useEffect(() => {
    const onResize = () => {
      const available = window.innerWidth - SIDEBAR_WIDTH - HANDLE_WIDTH * 2 - MIN_CONTACTS_WIDTH;
      if (cardWidth + activityWidth > available) {
        const ratio = cardWidth / (cardWidth + activityWidth);
        setCardWidth(Math.max(200, Math.floor(available * ratio)));
        setActivityWidth(Math.max(200, Math.floor(available * (1 - ratio))));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [cardWidth, activityWidth, SIDEBAR_WIDTH]);

  // Drag resize — INDEPENDENT dividers
  // Left handle: controls contacts ↔ card split (activity unchanged)
  // Right handle: controls card ↔ activity split (contacts unchanged — card+activity sum stays constant)
  const handleResizeStart = (target: 'card' | 'activity') => (e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;

    if (target === 'card') {
      // LEFT HANDLE: drag changes card width, activity stays fixed
      const startW = cardWidth;
      const maxW = Math.min(700, window.innerWidth - SIDEBAR_WIDTH - activityWidth - HANDLE_WIDTH * 2 - MIN_CONTACTS_WIDTH);
      const onMove = (ev: globalThis.MouseEvent) => {
        const delta = startX - ev.clientX;
        setCardWidth(Math.max(200, Math.min(maxW, startW + delta)));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    } else {
      // RIGHT HANDLE: drag redistributes between card and activity (sum stays constant)
      const startCardW = cardWidth;
      const startActW = activityWidth;
      const totalRight = startCardW + startActW; // this sum stays constant
      const onMove = (ev: globalThis.MouseEvent) => {
        const delta = startX - ev.clientX; // positive = drag left = activity grows
        const newActW = Math.max(180, Math.min(totalRight - 200, startActW + delta));
        const newCardW = totalRight - newActW;
        setActivityWidth(newActW);
        setCardWidth(Math.max(200, newCardW));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Persist Deal Page state + listen for MetricsBangs toggle
  useEffect(() => { localStorage.setItem('db_dealPageOpen', String(dealPageOpen)); }, [dealPageOpen]);
  useEffect(() => {
    const handler = (e: Event) => {
      const open = (e as CustomEvent).detail?.open;
      if (typeof open === 'boolean') setDealPageOpen(open);
    };
    window.addEventListener('toggle-deal-page', handler);
    return () => window.removeEventListener('toggle-deal-page', handler);
  }, []);

  // Listen for seller changes from other pages (e.g., SellerBoard)
  useEffect(() => {
    const handler = (e: Event) => {
      const seller = (e as CustomEvent).detail?.seller || '';
      if (seller !== filters.seller) {
        setFilters((p: typeof filters) => ({ ...p, seller }));
        setPage(1);
      }
    };
    window.addEventListener('seller-changed', handler);
    return () => window.removeEventListener('seller-changed', handler);
  }, [filters.seller]);

  // Load deals when Deal Page opens — filtered by selected seller
  const loadDeals = useCallback(async () => {
    setDealsLoading(true);
    try { setDealsData(await fetchDealsBoard(filters.seller || undefined)); }
    catch (e) { console.error('Deals load error:', e); }
    finally { setDealsLoading(false); }
  }, [filters.seller]);
  useEffect(() => { if (dealPageOpen) loadDeals(); }, [dealPageOpen, loadDeals]);

  const handleDealDrop = async (dealId: number, newStage: string) => {
    if (!dealsData) return;
    // Optimistic update
    const updated = { ...dealsData };
    let movedDeal: BoardDeal | undefined;
    for (const stage of Object.keys(updated.board)) {
      const idx = updated.board[stage].deals.findIndex(d => d.id === dealId);
      if (idx >= 0) {
        movedDeal = updated.board[stage].deals.splice(idx, 1)[0];
        updated.board[stage].count--;
        updated.board[stage].total -= movedDeal.amount;
        break;
      }
    }
    if (movedDeal) {
      movedDeal.board_stage = newStage;
      updated.board[newStage].deals.unshift(movedDeal);
      updated.board[newStage].count++;
      updated.board[newStage].total += movedDeal.amount;
      setDealsData({ ...updated });
    }
    setDragDeal(null);
    setDragOverStage(null);
    try { await moveDealStage(dealId, newStage); }
    catch { loadDeals(); } // revert on error
  };

  // Persist filters, tab, sort
  useEffect(() => { localStorage.setItem('db_activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('db_sortBy', sortBy); }, [sortBy]);
  useEffect(() => {
    localStorage.setItem('db_filters', JSON.stringify(filters));
    // Sync seller to shared state so SellerBoard + Deals stay in sync
    localStorage.setItem('deca-selected-seller', filters.seller || '');
    window.dispatchEvent(new CustomEvent('seller-changed', { detail: { seller: filters.seller || '' } }));
  }, [filters]);

  useEffect(() => {
    fetchFilterValues().then(setFilterValues).catch(console.error);
    fetchCategories().then(r => setCategories(r.categories)).catch(console.error);
    fetchPulse().then(setPulse).catch(console.error);
    const interval = setInterval(() => { fetchPulse().then(setPulse).catch(console.error); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const buildParams = useCallback((): ListParams => {
    const params: ListParams = { sort: sortBy, page, limit };
    if (search) params.search = search;
    if (activeTab === 'leads') params.contactType = 'lead';
    if (activeTab === 'contacts') params.contactType = 'contact';
    if (activeTab === 'deals') params.filter = 'deals';
    if (activeTab === 'customers') params.filter = 'sold';
    if (filters.seller) params.seller = filters.seller;
    if (filters.stage) params.stage = filters.stage;
    if (filters.city) params.city = filters.city;
    if (filters.state) params.state = filters.state;
    if (filters.category) params.category = filters.category;
    return params;
  }, [search, activeTab, sortBy, page, filters]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchContactsLive(buildParams());
      setContacts(data.contacts);
      setTotal(data.total);
      if (!autoSelected.current && data.contacts.length > 0 && !selectedId) {
        autoSelected.current = true;
        const firstId = data.contacts[0].id;
        setSelectedId(firstId);
        try { setCardData(await fetchContactCard(firstId)); } catch {}
      }
    } catch (e) { console.error('Failed:', e); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { const i = setInterval(loadContacts, 30000); return () => clearInterval(i); }, [loadContacts]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(loadContacts, 300);
  };

  const handleSelect = async (id: number) => {
    setSelectedId(id);
    setCardLoading(true);
    try { setCardData(await fetchContactCard(id)); }
    catch (e) { console.error('Card error:', e); }
    finally { setCardLoading(false); }
  };

  // Click activity item → load that contact
  const handleActivityClick = async (contactName: string) => {
    // Find contact in current list by name
    const found = contacts.find(c => c.name === contactName);
    if (found) {
      handleSelect(found.id);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Filter activity by seller — match contact names from loaded contacts with owner
  const ownerContactNames = new Set(
    filters.seller
      ? contacts.filter(c => c.owner_name === filters.seller).map(c => c.name)
      : []
  );
  const filteredActivity = pulse?.recentActivity?.filter(event => {
    if (!filters.seller) return true;
    // Match by contact name if we have owner filter
    return ownerContactNames.has(event.contact_name);
  }) || [];

  return (
    <div className="relative" style={{ height: 'calc(100vh - 40px)' }}>
      {/* DEAL PAGE — sliding panel from top */}
      <div
        className={`absolute inset-0 z-50 bg-white transition-transform duration-300 ease-in-out ${
          dealPageOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ height: 'calc(100vh - 40px)' }}
      >
        {dealPageOpen && (
          <DealsKanban
            data={dealsData}
            loading={dealsLoading}
            onClose={() => {
              setDealPageOpen(false);
              // Sync MetricsBangs state
              localStorage.setItem('deca-bangs-open', 'false');
              window.dispatchEvent(new CustomEvent('toggle-deal-page', { detail: { open: false } }));
            }}
            onRefresh={loadDeals}
            dragDeal={dragDeal}
            setDragDeal={setDragDeal}
            dragOverStage={dragOverStage}
            setDragOverStage={setDragOverStage}
            onDrop={handleDealDrop}
            onSelectContact={(id) => { setDealPageOpen(false); handleSelect(id); }}
          />
        )}
      </div>

      {/* Main database layout */}
      <div className="flex h-full">
      {/* LEFT: Filters & Sort — COLLAPSIBLE */}
      {sidebarOpen ? (
        <div className="w-56 flex-shrink-0 flex flex-col border-r border-surface-border bg-white">
          {/* Search + collapse button */}
          <div className="p-3 border-b border-surface-border">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setSidebarOpen(false)} className="text-content-tertiary hover:text-content-primary transition-colors" title="Collapse filters">
                <PanelLeftClose size={16} />
              </button>
              <span className="text-xs font-medium text-content-tertiary">Filters</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
              <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-surface/50 rounded-md border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none text-content-primary placeholder:text-content-tertiary" />
            </div>
          </div>

          {/* View tabs */}
          <div className="px-2 py-2 border-b border-surface-border">
            <div className="text-xs text-content-tertiary font-medium px-2 mb-1.5">View</div>
            {VIEW_TABS.map(tab => (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-content-primary text-white' : 'text-content-secondary hover:bg-surface-hover'
                }`}
              >{tab.label}</button>
            ))}
          </div>

          {/* Sort */}
          <div className="px-3 py-2 border-b border-surface-border">
            <div className="text-xs text-content-tertiary font-medium mb-1.5 flex items-center gap-1">
              <ArrowUpDown size={10} /> Sort By
            </div>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
              className="w-full text-sm bg-white border border-surface-border rounded-md px-2 py-1.5 text-content-primary focus:border-accent focus:outline-none">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Filters */}
          {filterValues && (
            <div className="px-3 py-2 border-b border-surface-border flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-content-tertiary font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <button onClick={() => setFilters({ seller: '', stage: '', city: '', state: '', category: '' })}
                    className="text-xs text-red-500 hover:underline">Clear</button>
                )}
              </div>
              <div className="space-y-2">
                <FilterSelect label="Owner" value={filters.seller}
                  onChange={v => { setFilters(p => ({...p, seller: v})); setPage(1); }}
                  options={filterValues.sellers.map(s => ({ value: s.name, label: s.name }))} />
                <FilterSelect label="Stage" value={filters.stage}
                  onChange={v => { setFilters(p => ({...p, stage: v})); setPage(1); }}
                  options={filterValues.stages.map(s => ({ value: s, label: s }))} />
                <FilterSelect label="City" value={filters.city}
                  onChange={v => { setFilters(p => ({...p, city: v})); setPage(1); }}
                  options={filterValues.cities.map(c => ({ value: c, label: c }))} />
                <FilterSelect label="State" value={filters.state}
                  onChange={v => { setFilters(p => ({...p, state: v})); setPage(1); }}
                  options={(filterValues.states || []).map(s => ({ value: s, label: s }))} />
                <FilterSelect label="Category" value={filters.category}
                  onChange={v => { setFilters(p => ({...p, category: v})); setPage(1); }}
                  options={categories.map(c => ({ value: c.category, label: `${c.category} (${c.count})` }))} />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 border-t border-surface-border mt-auto">
            <div className="text-2xl font-semibold text-content-primary">{total.toLocaleString()}</div>
            <div className="text-xs text-content-tertiary">contacts total</div>
          </div>
        </div>
      ) : (
        /* Collapsed sidebar — just a thin strip with expand button */
        <div className="w-10 flex-shrink-0 flex flex-col items-center border-r border-surface-border bg-white py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-content-tertiary hover:text-content-primary transition-colors" title="Expand filters">
            <PanelLeftOpen size={16} />
          </button>
          {activeFilterCount > 0 && (
            <span className="mt-2 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
          )}
        </div>
      )}

      {/* CENTER: Contact List — min width prevents panels from covering it */}
      <div className="flex-1 flex flex-col border-r border-surface-border" style={{ minWidth: MIN_CONTACTS_WIDTH }}>
        {/* List header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <div className="relative mr-2">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-content-tertiary" />
                <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-7 pr-2 py-1 text-xs bg-surface/50 rounded border border-surface-border focus:border-accent focus:outline-none text-content-primary w-40" />
              </div>
            )}
            <h2 className="text-sm font-semibold text-content-primary">Contacts</h2>
            {loading && <Loader2 size={14} className="text-content-tertiary animate-spin" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-content-tertiary">
            <span>Page {page}/{totalPages || 1}</span>
            {page > 1 && <button onClick={() => setPage(p => p-1)} className="text-accent hover:underline">← Prev</button>}
            {page < totalPages && <button onClick={() => setPage(p => p+1)} className="text-accent hover:underline">Next →</button>}
          </div>
        </div>

        {/* Contact rows */}
        <div className="flex-1 overflow-y-auto bg-white">
          {contacts.map(contact => {
            const indicator = getActivityIndicator(contact.last_action_at);
            const stage = getStageConfig(contact.current_stage);
            const isSelected = selectedId === contact.id;
            const calls = parseInt(String(contact.call_count)) || 0;
            const emails = parseInt(String(contact.email_count)) || 0;
            const sms = parseInt(String(contact.sms_count)) || 0;

            return (
              <button key={contact.id}
                onClick={() => handleSelect(contact.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-surface-border/50 transition-colors ${
                  isSelected ? 'bg-accent/5 border-l-2 border-l-accent' : 'hover:bg-surface-hover/50 border-l-2 border-l-transparent'
                }`}>
                <Avatar name={contact.name || '?'} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-content-primary truncate">{contact.name}</span>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${indicator.color}`} title={indicator.label} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {contact.owner_name && <span className="text-xs text-content-tertiary">{contact.owner_name}</span>}
                    {contact.source && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-content-tertiary">{getSourceLabel(contact.source)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {calls > 0 && <span className="text-xs font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700"><Phone size={11}/>{calls}</span>}
                  {emails > 0 && <span className="text-xs font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700"><Mail size={11}/>{emails}</span>}
                  {sms > 0 && <span className="text-xs font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700"><MessageSquare size={11}/>{sms}</span>}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[80px]">
                  {stage && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.bg} ${stage.text}`}>
                      {stage.label}
                    </span>
                  )}
                  <span className="text-xs text-content-tertiary">{formatRelativeTime(contact.last_action_at)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RESIZE HANDLE — between contact list and card (thin, matching sidebar border) */}
      <div
        onMouseDown={handleResizeStart('card')}
        className="w-px flex-shrink-0 bg-surface-border hover:bg-accent/50 cursor-col-resize transition-colors relative"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" /> {/* wider hit area */}
      </div>

      {/* RIGHT: Contact Detail — RESIZABLE */}
      <div style={{ width: cardWidth }} className="flex-shrink-0 flex flex-col border-r border-surface-border bg-white">
        {cardLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="text-content-tertiary animate-spin" />
          </div>
        ) : cardData ? (
          <ContactDetailPanel data={cardData} onRefresh={() => selectedId && handleSelect(selectedId)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-content-tertiary">
            Select a contact to view details
          </div>
        )}
      </div>

      {/* RESIZE HANDLE — between card and activity (thin, matching sidebar border) */}
      <div
        onMouseDown={handleResizeStart('activity')}
        className="w-px flex-shrink-0 bg-surface-border hover:bg-accent/50 cursor-col-resize transition-colors relative"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" /> {/* wider hit area */}
      </div>

      {/* FAR RIGHT: Activity Feed — RESIZABLE, FILTERED BY SELLER */}
      <div style={{ width: activityWidth }} className="flex-shrink-0 flex flex-col bg-white">
        <div className="px-4 py-3 border-b border-surface-border flex-shrink-0">
          <h3 className="text-sm font-semibold text-content-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Live Activity
            {filters.seller && (
              <span className="text-xs font-normal text-content-tertiary ml-1">· {filters.seller}</span>
            )}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredActivity.length > 0 ? (
            filteredActivity.map((event, i) => (
              <button
                key={i}
                onClick={() => handleActivityClick(event.contact_name)}
                className="w-full text-left px-4 py-3 border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm flex-shrink-0">{ACTION_ICONS[event.event_type] || '📌'}</span>
                  <span className="text-sm font-medium text-content-primary truncate group-hover:text-accent transition-colors">{event.contact_name}</span>
                </div>
                <div className="text-xs text-content-secondary mt-1 line-clamp-2">{event.title || event.detail}</div>
                <div className="text-xs text-content-tertiary mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {formatRelativeTime(event.event_date)}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-content-tertiary">
              {filters.seller ? `No activity for ${filters.seller}` : 'No recent activity'}
            </div>
          )}
        </div>
      </div>
      </div>{/* close main database flex layout */}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DEALS KANBAN — Atomic CRM style board
   ═══════════════════════════════════════════════ */

const DEAL_STAGES = [
  { key: 'opportunity', label: 'Opportunity', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  { key: 'proposal', label: 'Proposal', color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  { key: 'won', label: 'Won', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  { key: 'delayed', label: 'Delayed', color: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
];

/* ── Droppable column wrapper ── */
function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `col-${stageKey}` });
  return (
    <div ref={setNodeRef} className="p-2 space-y-1.5 min-h-[60px]">
      {children}
    </div>
  );
}

/* ── Sortable deal card ── */
function SortableDealCard({ deal, onSelectContact }: { deal: BoardDeal; onSelectContact: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `deal-${deal.id}`,
    data: { deal },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.25 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`rounded-xl border border-surface-border/60 px-2.5 py-2 cursor-grab active:cursor-grabbing bg-white shadow-sm ${
        isDragging ? 'shadow-none' : 'hover:shadow-lg hover:-translate-y-0.5'
      } transition-all duration-150`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); deal.contact_id && onSelectContact(deal.contact_id); }}
        className="text-xs font-medium text-content-primary hover:text-accent transition-colors text-left truncate block w-full"
      >
        {deal.contact_name || deal.title}
      </button>
      <div className="flex items-center justify-between mt-0.5">
        {deal.amount > 0 && (
          <span className="text-xs font-semibold text-content-primary">{formatCurrency(deal.amount)}</span>
        )}
        {deal.owner_name && (
          <span className="text-[10px] text-content-tertiary">{deal.owner_name}</span>
        )}
      </div>
      {deal.contact_city && (
        <span className="text-[10px] text-content-tertiary">{deal.contact_city}</span>
      )}
    </div>
  );
}

/* ── Drag overlay card (the floating ghost that follows cursor) ── */
function DealOverlayCard({ deal }: { deal: BoardDeal }) {
  return (
    <div className="rounded-xl border border-accent/30 px-2.5 py-2 bg-white shadow-2xl cursor-grabbing">
      <div className="text-xs font-medium text-content-primary truncate">{deal.contact_name || deal.title}</div>
      {deal.amount > 0 && (
        <div className="text-xs font-semibold text-content-primary mt-0.5">{formatCurrency(deal.amount)}</div>
      )}
      {deal.owner_name && (
        <div className="text-[10px] text-content-tertiary mt-0.5">{deal.owner_name}</div>
      )}
    </div>
  );
}

/* Custom collision: try pointerWithin first (precise), fall back to rectIntersection (catches empty columns) */
const kanbanCollision: CollisionDetection = (args) => {
  const pw = pointerWithin(args);
  if (pw.length > 0) return pw;
  return rectIntersection(args);
};

function DealsKanban({ data, loading, onClose, onRefresh, dragDeal, setDragDeal, dragOverStage, setDragOverStage, onDrop, onSelectContact }: {
  data: DealsBoardResponse | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  dragDeal: BoardDeal | null;
  setDragDeal: (d: BoardDeal | null) => void;
  dragOverStage: string | null;
  setDragOverStage: (s: string | null) => void;
  onDrop: (dealId: number, stage: string) => void;
  onSelectContact: (id: number) => void;
}) {
  const [activeDeal, setActiveDeal] = useState<BoardDeal | null>(null);
  // Local reorder state — tracks within-column moves
  const [localOrder, setLocalOrder] = useState<Record<string, BoardDeal[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Sync local order from data
  useEffect(() => {
    if (data) {
      const order: Record<string, BoardDeal[]> = {};
      DEAL_STAGES.forEach(s => {
        order[s.key] = data.board[s.key]?.deals || [];
      });
      setLocalOrder(order);
    }
  }, [data]);

  // Build sortable IDs per column from local order
  const columnIds = useMemo(() => {
    const m: Record<string, string[]> = {};
    DEAL_STAGES.forEach(s => {
      m[s.key] = (localOrder[s.key] || []).map(d => `deal-${d.id}`);
    });
    return m;
  }, [localOrder]);

  // Find which column a deal ID belongs to
  const findColumn = (id: string): string | null => {
    for (const [col, ids] of Object.entries(columnIds)) {
      if (ids.includes(id)) return col;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const deal = (event.active.data.current as any)?.deal as BoardDeal;
    if (deal) {
      setActiveDeal(deal);
      setDragDeal(deal);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setDragOverStage(null); return; }
    const overId = String(over.id);
    if (overId.startsWith('col-')) {
      setDragOverStage(overId.replace('col-', ''));
    } else {
      const col = findColumn(overId);
      if (col) setDragOverStage(col);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentDeal = activeDeal;
    setActiveDeal(null);
    setDragDeal(null);
    setDragOverStage(null);

    if (!over || !currentDeal) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine target stage
    let targetStage: string | null = null;
    if (overId.startsWith('col-')) {
      targetStage = overId.replace('col-', '');
    } else {
      targetStage = findColumn(overId);
    }

    if (!targetStage) return;

    const sourceStage = currentDeal.board_stage;

    if (targetStage !== sourceStage) {
      // Cross-column move → API call
      onDrop(currentDeal.id, targetStage);
    } else {
      // Within-column reorder
      const ids = columnIds[sourceStage] || [];
      const oldIdx = ids.indexOf(activeId);
      const newIdx = ids.indexOf(overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(localOrder[sourceStage] || [], oldIdx, newIdx);
        setLocalOrder(prev => ({ ...prev, [sourceStage]: reordered }));
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-surface-border bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-content-primary">Deals</h2>
          {data && (
            <div className="flex items-center gap-4 text-sm text-content-secondary">
              <span>{data.total_deals} deals</span>
              <span className="font-medium text-content-primary">{formatCurrency(data.total_value)}</span>
            </div>
          )}
          {loading && <Loader2 size={16} className="text-content-tertiary animate-spin" />}
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-content-secondary border border-surface-border rounded-md hover:bg-surface-hover transition-colors"
        >
          <ArrowUp size={12} /> Back to Database
        </button>
      </div>

      {/* Kanban Board — single scroll, no vertical dividers */}
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-surface/30">
          <div className="flex gap-0 min-h-full">
            {DEAL_STAGES.map(stage => {
              const col = data?.board[stage.key];
              const isOver = dragOverStage === stage.key;
              const deals = localOrder[stage.key] || [];
              const ids = columnIds[stage.key] || [];
              return (
                <div
                  key={stage.key}
                  className={`flex-1 min-w-[160px] transition-colors duration-200 ${
                    isOver ? 'bg-accent/5' : ''
                  }`}
                >
                  {/* Column header — sticky */}
                  <div className="sticky top-0 z-10 px-2.5 py-2 border-b border-surface-border bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                        <span className="text-xs font-semibold text-content-primary">{stage.label}</span>
                        <span className="text-[10px] text-content-tertiary font-medium">{col?.count || 0}</span>
                      </div>
                      {(col?.total || 0) > 0 && (
                        <span className="text-[10px] font-medium text-content-secondary">{formatCurrency(col!.total)}</span>
                      )}
                    </div>
                  </div>

                  {/* Deal cards with sortable context */}
                  <DroppableColumn stageKey={stage.key}>
                    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                      {deals.map(deal => (
                        <SortableDealCard
                          key={deal.id}
                          deal={deal}
                          onSelectContact={onSelectContact}
                        />
                      ))}
                      {deals.length === 0 && !isOver && (
                        <div className="text-[10px] text-content-tertiary text-center py-6">No deals</div>
                      )}
                      {isOver && activeDeal && (
                        <div className="h-10 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 transition-all duration-200" />
                      )}
                    </SortableContext>
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating overlay card — snaps center to cursor */}
        <DragOverlay
          modifiers={[snapCenterToCursor]}
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          style={{ cursor: 'grabbing' }}
        >
          {activeDeal ? <DealOverlayCard deal={activeDeal} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTACT DETAIL PANEL — with full communications
   ═══════════════════════════════════════════════ */

function ContactDetailPanel({ data, onRefresh }: { data: ContactCardType; onRefresh: () => void }) {
  const c = data.contact;
  const stage = getStageConfig(c.current_stage);

  // Communications with full content from /timeline endpoint
  const [comms, setComms] = useState<CommItem[]>([]);
  const [commsLoading, setCommsLoading] = useState(true);
  const [commsFilter, setCommsFilter] = useState<'all' | 'call' | 'email' | 'sms' | 'task'>('all');
  const [expandedCommId, setExpandedCommId] = useState<string | null>(null);

  // Quick note
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // Active section
  const [activeSection, setActiveSection] = useState<'comms' | 'details'>('comms');

  // Load full communications on mount
  useEffect(() => {
    setCommsLoading(true);
    setCommsFilter('all');
    setExpandedCommId(null);
    fetchContactComms(c.id, 'all', 1, 50)
      .then(res => setComms(res.timeline))
      .catch(console.error)
      .finally(() => setCommsLoading(false));
  }, [c.id]);

  const handleFilterChange = (f: 'all' | 'call' | 'email' | 'sms' | 'task') => {
    setCommsFilter(f);
    setCommsLoading(true);
    setExpandedCommId(null);
    fetchContactComms(c.id, f, 1, 50)
      .then(res => setComms(res.timeline))
      .catch(console.error)
      .finally(() => setCommsLoading(false));
  };

  const handleQuickNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      await addContactNote(c.id, noteText.trim(), 'general');
      setNoteText('');
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (e) {
      console.error('Note save failed:', e);
    } finally {
      setNoteSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar name={c.name || '?'} size={44} />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-content-primary truncate">{c.name}</h3>
            {c.company && <p className="text-xs text-content-tertiary truncate">{c.company}</p>}
          </div>
        </div>

        {/* Communication count badges */}
        {(() => {
          const bd = data.communications.breakdown || {};
          const calls = (bd.call_inbound || 0) + (bd.call_outbound || 0);
          const emails = (bd.email_inbound || 0) + (bd.email_outbound || 0);
          const smsCount = (bd.sms_inbound || 0) + (bd.sms_outbound || 0);
          const tasks = bd.task || 0;
          const notes = bd.note || 0;
          return (
            <div className="flex items-center gap-2 mt-2.5">
              <span className="flex items-center gap-1 text-xs text-content-secondary" title="Calls">
                <Phone size={13} className="text-content-tertiary" />
                <span className="font-semibold text-content-primary">{calls}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-content-secondary" title="Emails">
                <Mail size={13} className="text-content-tertiary" />
                <span className="font-semibold text-content-primary">{emails}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-content-secondary" title="SMS">
                <MessageSquare size={13} className="text-content-tertiary" />
                <span className="font-semibold text-content-primary">{smsCount}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-content-secondary" title="Tasks">
                <Check size={13} className="text-content-tertiary" />
                <span className="font-semibold text-content-primary">{tasks}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-content-secondary" title="Notes">
                <StickyNote size={13} className="text-content-tertiary" />
                <span className="font-semibold text-content-primary">{notes}</span>
              </span>
            </div>
          );
        })()}

        {/* Action buttons — full set */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {c.phone && (
            <a href={`tel:${c.phone}`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-content-primary text-white rounded-md hover:bg-content-primary/90 transition-colors">
              <Phone size={12} /> Call
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-surface-border text-content-secondary rounded-md hover:bg-surface-hover transition-colors">
              <Mail size={12} /> Email
            </a>
          )}
          {c.phone && (
            <a href={`sms:${c.phone}`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-surface-border text-content-secondary rounded-md hover:bg-surface-hover transition-colors">
              <MessageSquare size={12} /> SMS
            </a>
          )}
          <button
            onClick={() => {
              const note = prompt('Add a note:');
              if (note) {
                addContactNote(c.id, note, 'general').then(() => onRefresh());
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-surface-border text-content-secondary rounded-md hover:bg-surface-hover transition-colors">
            <StickyNote size={12} /> Note
          </button>
          <button
            onClick={() => {
              const task = prompt('Add a task:');
              if (task) {
                addContactNote(c.id, task, 'task').then(() => onRefresh());
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-surface-border text-content-secondary rounded-md hover:bg-surface-hover transition-colors">
            <Check size={12} /> Task
          </button>
        </div>
      </div>

      {/* Contact info bar */}
      <div className="px-4 py-2.5 border-b border-surface-border flex-shrink-0 space-y-1">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          {c.phone && <span className="text-content-primary">{c.phone}</span>}
          {c.email && <span className="text-content-secondary truncate">{c.email}</span>}
          {c.city && <span className="text-content-tertiary">{c.city}{c.state ? ', ' + c.state : ''}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {stage && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${stage.bg} ${stage.text}`}>{stage.label}</span>
          )}
          {c.owner_name && <span className="text-content-tertiary">{c.owner_name}</span>}
          {data.deals.count > 0 && (
            <span className="text-content-secondary font-medium">{data.deals.count} deals · {formatCurrency(data.deals.total_value)}</span>
          )}
          {data.finance.total_outstanding > 0 && (
            <span className="text-red-600 font-medium">Owes {formatCurrency(data.finance.total_outstanding)}</span>
          )}
        </div>
      </div>

      {/* Quick note bar */}
      <div className="px-4 py-2 border-b border-surface-border flex-shrink-0 flex items-center gap-2">
        <input
          type="text"
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuickNote()}
          placeholder="Quick note..."
          className="flex-1 text-xs bg-surface/50 border border-surface-border rounded-md px-2.5 py-1.5 text-content-primary placeholder:text-content-tertiary focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleQuickNote}
          disabled={!noteText.trim() || noteSaving}
          className="text-xs px-2 py-1.5 rounded-md border border-surface-border text-content-secondary hover:bg-surface-hover disabled:opacity-40"
        >
          {noteSaved ? <Check size={12} className="text-green-600" /> : noteSaving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
      </div>

      {/* Section toggle */}
      <div className="flex border-b border-surface-border flex-shrink-0 px-1">
        <button
          onClick={() => setActiveSection('comms')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeSection === 'comms' ? 'border-content-primary text-content-primary' : 'border-transparent text-content-tertiary hover:text-content-secondary'
          }`}
        >
          Communications ({data.communications.total})
        </button>
        <button
          onClick={() => setActiveSection('details')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeSection === 'details' ? 'border-content-primary text-content-primary' : 'border-transparent text-content-tertiary hover:text-content-secondary'
          }`}
        >
          Details
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeSection === 'comms' ? (
          <CommunicationsPanel
            comms={comms}
            loading={commsLoading}
            filter={commsFilter}
            onFilter={handleFilterChange}
            expandedId={expandedCommId}
            onExpand={setExpandedCommId}
          />
        ) : (
          <DetailsPanel data={data} />
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   COMMUNICATIONS PANEL — Full body content, filters
   ═══════════════════════════════════════════════ */

function CommunicationsPanel({ comms, loading, filter, onFilter, expandedId, onExpand }: {
  comms: CommItem[]; loading: boolean; filter: string;
  onFilter: (f: 'all' | 'call' | 'email' | 'sms' | 'task') => void;
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
    <div className="p-3">
      {/* Filter tabs */}
      <div className="flex gap-1 mb-3">
        {(['all', 'call', 'email', 'sms', 'task'] as const).map(f => {
          const labels: Record<string, string> = { all: 'All', call: '📞 Calls', email: '📧 Emails', sms: '💬 SMS', task: '✅ Tasks' };
          return (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
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

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-content-tertiary py-6">
          <Loader2 size={14} className="animate-spin" /> Loading...
        </div>
      )}

      {!loading && comms.length === 0 && (
        <div className="text-sm text-content-tertiary text-center py-6">No communications found</div>
      )}

      {!loading && comms.length > 0 && (
        <div className="space-y-0.5">
          {comms.map(c => {
            const isExpanded = expandedId === c.id;
            const bodyText = (c.body || '').replace(/<[^>]*>/g, '');
            const hasBody = bodyText.trim().length > 0;
            const preview = c.comm_type === 'call'
              ? (c.subject || '(no transcription)')
              : c.comm_type === 'email'
              ? (c.subject || '(no subject)')
              : c.comm_type === 'task'
              ? (c.subject || '(task)')
              : bodyText.substring(0, 100) || '(empty)';

            const dir = c.direction === 'inbound' ? '← ' : c.direction === 'outbound' ? '→ ' : '';
            const icon = c.comm_type === 'call' ? '📞' : c.comm_type === 'email' ? '📧' : c.comm_type === 'sms' ? '💬' : c.comm_type === 'task' ? '✅' : '📝';

            return (
              <div key={c.id}>
                <button
                  onClick={() => onExpand(isExpanded ? null : c.id)}
                  className={`w-full text-left flex items-start gap-2 py-2 px-2 rounded-md transition-colors ${
                    isExpanded ? 'bg-accent/5' : 'hover:bg-surface-hover/50'
                  }`}
                >
                  <span className="flex-shrink-0 text-xs text-content-tertiary w-[50px] font-medium mt-0.5">{formatDate(c.date)}</span>
                  <span className="flex-shrink-0 text-sm">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-content-primary">
                      <span className="text-content-tertiary">{dir}</span>
                      <span className={isExpanded ? 'font-medium' : 'line-clamp-1'}>{preview}</span>
                    </div>
                    {!isExpanded && c.comm_type === 'email' && hasBody && (
                      <div className="text-xs text-content-tertiary line-clamp-1 mt-0.5">{bodyText.substring(0, 80)}</div>
                    )}
                    {c.comm_type === 'call' && c.duration_seconds ? (
                      <span className="text-xs text-content-tertiary">({formatDuration(c.duration_seconds)})</span>
                    ) : null}
                  </div>
                  <span className="flex-shrink-0 text-content-tertiary mt-0.5">
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                </button>

                {/* Expanded: full content */}
                {isExpanded && (
                  <div className="ml-[62px] mr-2 mb-2 p-3 rounded-md border border-surface-border bg-surface/30 text-sm leading-relaxed">
                    {/* Email: show subject, from/to, body */}
                    {c.comm_type === 'email' && (
                      <>
                        {c.subject && <div className="font-medium text-content-primary mb-1">Subject: {c.subject}</div>}
                        {c.metadata && (
                          <div className="text-xs text-content-tertiary mb-2 space-y-0.5">
                            {(c.metadata as any).from && <div>From: {(c.metadata as any).from}</div>}
                            {(c.metadata as any).to && <div>To: {(c.metadata as any).to}</div>}
                          </div>
                        )}
                        <div className="text-xs text-content-primary whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                          {bodyText || '(no body)'}
                        </div>
                      </>
                    )}

                    {/* SMS: show body */}
                    {c.comm_type === 'sms' && (
                      <div className="text-xs text-content-primary whitespace-pre-wrap">
                        {bodyText || '(empty message)'}
                      </div>
                    )}

                    {/* Call: show transcription */}
                    {c.comm_type === 'call' && (
                      <>
                        {c.duration_seconds != null && (
                          <div className="text-xs text-content-tertiary mb-1">
                            Duration: {formatDuration(c.duration_seconds)}
                          </div>
                        )}
                        <div className="text-xs text-content-primary whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                          {c.subject || bodyText || '(no transcription available)'}
                        </div>
                      </>
                    )}

                    {/* Task: show body */}
                    {c.comm_type === 'task' && (
                      <>
                        {c.subject && <div className="font-medium text-xs text-content-primary mb-1">{c.subject}</div>}
                        {c.metadata && (c.metadata as any).properties?.hs_task_status && (
                          <div className="text-xs text-content-tertiary mb-1">
                            Status: {(c.metadata as any).properties.hs_task_status}
                          </div>
                        )}
                        {bodyText && bodyText !== '<p></p>' && (
                          <div className="text-xs text-content-primary whitespace-pre-wrap">{bodyText}</div>
                        )}
                      </>
                    )}

                    {/* Note/Chat/Other */}
                    {!['email', 'sms', 'call', 'task'].includes(c.comm_type) && (
                      <div className="text-xs text-content-primary whitespace-pre-wrap">
                        {c.subject && <div className="font-medium mb-1">{c.subject}</div>}
                        {bodyText || '(no content)'}
                      </div>
                    )}

                    {/* Phone line info */}
                    {c.phone_line && (
                      <div className="text-xs text-content-tertiary mt-2 pt-2 border-t border-surface-border">
                        via {c.phone_line}
                      </div>
                    )}
                    {c.account && (
                      <div className="text-xs text-content-tertiary mt-1">
                        Account: {c.account}
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
   DETAILS PANEL — Deals, Finance, Orders, etc
   ═══════════════════════════════════════════════ */

function DetailsPanel({ data }: { data: ContactCardType }) {
  const { deals, finance, orders } = data;

  return (
    <div className="p-3 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Deals" value={deals.count} />
        <MiniStat label="Value" value={formatCurrency(deals.total_value)} />
        <MiniStat label="Comms" value={data.communications.total} />
      </div>

      {/* Deals */}
      {deals.count > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">Deals</h4>
          {deals.items.map(deal => {
            const stg = getStageConfig(deal.stage);
            return (
              <div key={deal.id} className="flex items-center justify-between text-xs py-1.5 border-b border-surface-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-content-primary font-medium truncate">{deal.title}</span>
                  {stg && <span className={`text-xs px-1.5 py-0.5 rounded-full ${stg.bg} ${stg.text}`}>{stg.label}</span>}
                </div>
                <span className="font-medium text-content-primary">{formatCurrency(deal.amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Finance */}
      {finance.total_outstanding > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">Finance</h4>
          <div className="bg-red-50 rounded-md p-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-content-secondary">Outstanding</span>
              <span className="font-semibold text-red-600">{formatCurrency(finance.total_outstanding)}</span>
            </div>
            {finance.total_paid > 0 && (
              <div className="flex justify-between mt-1">
                <span className="text-content-secondary">Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(finance.total_paid)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders */}
      {orders.count > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">iTokna Orders ({orders.count})</h4>
          {orders.items.slice(0, 5).map(order => (
            <div key={order.id_doc} className="flex items-center justify-between text-xs py-1.5 border-b border-surface-border/50 last:border-0">
              <span className="text-content-primary">#{order.docnum}</span>
              <span className="font-medium text-content-primary">{formatCurrency(order.syma)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Arrived / Last Contact dates */}
      <div className="space-y-1 text-xs">
        {data.contact.hs_create_date && (
          <div className="flex justify-between">
            <span className="text-content-tertiary">Arrived</span>
            <span className="text-content-secondary">{new Date(data.contact.hs_create_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
        {data.contact.last_contacted && (
          <div className="flex justify-between">
            <span className="text-content-tertiary">Last Contact</span>
            <span className="text-content-secondary">{new Date(data.contact.last_contacted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED
   ═══════════════════════════════════════════════ */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-content-tertiary">{label}</span>
      <span className="text-xs text-content-primary">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center py-2">
      <div className="text-lg font-semibold text-content-primary">{value}</div>
      <div className="text-xs text-content-tertiary">{label}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <span className="text-xs text-content-tertiary font-medium block mb-0.5">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-sm bg-white border border-surface-border rounded-md px-2 py-1.5 text-content-primary focus:border-accent focus:outline-none">
        <option value="">All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
