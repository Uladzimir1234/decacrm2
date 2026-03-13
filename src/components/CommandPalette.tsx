import { useEffect, useState, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Users2, BarChart3, Monitor, Zap, Bell,
  Clock, Crosshair, ClipboardList, MessageSquare, Grid, List,
  Database, BookOpen, AlertTriangle, Search, User, Briefcase,
} from 'lucide-react';
import { api, isApiOffline } from '../lib/api';

interface SearchResult {
  id: string;
  name: string;
  type: 'contact' | 'deal';
  subtitle: string;
}

const PAGES = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sellers/eric', icon: Users, label: 'Eric' },
  { path: '/sellers/paul', icon: Users, label: 'Paul' },
  { path: '/team', icon: Users2, label: 'Team' },
  { path: '/feed', icon: Bell, label: 'Activity Feed' },
  { path: '/nurture', icon: Zap, label: 'Nurture' },
  { path: '/alerts', icon: AlertTriangle, label: 'Signals' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/workspace', icon: Monitor, label: 'Workspace' },
  { path: '/reminders', icon: Clock, label: 'Reminders' },
  { path: '/lead-queue', icon: List, label: 'Ilya Queue' },
  { path: '/command-center', icon: Crosshair, label: 'Command Center' },
  { path: '/tasks', icon: ClipboardList, label: 'Task Desk' },
  { path: '/war-room', icon: MessageSquare, label: 'War Room' },
  { path: '/it-windows', icon: Grid, label: 'IT-Windows' },
  { path: '/database', icon: Database, label: 'Database' },
  { path: '/activity', icon: BookOpen, label: 'Daily Journal' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search contacts/deals with debounce
  const searchApi = useCallback(async (q: string) => {
    if (q.length < 2 || isApiOffline()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/api/search', { params: { q, limit: 10 } });
      const items: SearchResult[] = [];
      if (Array.isArray(data?.contacts)) {
        for (const c of data.contacts) {
          items.push({
            id: String(c.id),
            name: String(c.name || ''),
            type: 'contact',
            subtitle: [c.email, c.phone, c.company].filter(Boolean).join(' · '),
          });
        }
      }
      if (Array.isArray(data?.deals)) {
        for (const d of data.deals) {
          items.push({
            id: String(d.id),
            name: String(d.contact_name || d.dealname || ''),
            type: 'deal',
            subtitle: [d.stage, d.amount ? `$${Number(d.amount).toLocaleString()}` : ''].filter(Boolean).join(' · '),
          });
        }
      }
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchApi(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchApi]);

  function handleSelect(path: string) {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(path);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { setOpen(false); setQuery(''); setResults([]); }}
      />
      {/* Dialog */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[560px]">
        <Command
          className="bg-navy-900 border border-navy-600 rounded-xl shadow-2xl overflow-hidden"
          shouldFilter={true}
        >
          <div className="flex items-center gap-2 px-4 border-b border-navy-700/50">
            <Search size={16} className="text-gray-500 flex-shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search pages, contacts, deals..."
              className="w-full py-3 bg-transparent text-sm text-gray-100 placeholder:text-gray-500 outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-navy-800 border border-navy-700 rounded">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-gray-500">
              {loading ? 'Searching...' : 'No results found.'}
            </Command.Empty>

            {/* Pages */}
            <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500">
              {PAGES.map((page) => (
                <Command.Item
                  key={page.path}
                  value={page.label}
                  onSelect={() => handleSelect(page.path)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 cursor-pointer data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-light transition-colors"
                >
                  <page.icon size={16} className="flex-shrink-0 text-gray-500" />
                  {page.label}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Contacts */}
            {results.filter(r => r.type === 'contact').length > 0 && (
              <Command.Group heading="Contacts" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500">
                {results.filter(r => r.type === 'contact').map((r) => (
                  <Command.Item
                    key={`contact-${r.id}`}
                    value={`${r.name} ${r.subtitle}`}
                    onSelect={() => handleSelect(`/database?contact=${r.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 cursor-pointer data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-light transition-colors"
                  >
                    <User size={16} className="flex-shrink-0 text-sky-400" />
                    <div className="min-w-0">
                      <div className="truncate">{r.name}</div>
                      {r.subtitle && <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Deals */}
            {results.filter(r => r.type === 'deal').length > 0 && (
              <Command.Group heading="Deals" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500">
                {results.filter(r => r.type === 'deal').map((r) => (
                  <Command.Item
                    key={`deal-${r.id}`}
                    value={`${r.name} ${r.subtitle}`}
                    onSelect={() => handleSelect(`/deals/${r.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 cursor-pointer data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-light transition-colors"
                  >
                    <Briefcase size={16} className="flex-shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                      <div className="truncate">{r.name}</div>
                      {r.subtitle && <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-navy-700/50">
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-navy-800 border border-navy-700 rounded text-[10px]">&uarr;&darr;</kbd>
              navigate
            </span>
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-navy-800 border border-navy-700 rounded text-[10px]">&crarr;</kbd>
              select
            </span>
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-navy-800 border border-navy-700 rounded text-[10px]">esc</kbd>
              close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
