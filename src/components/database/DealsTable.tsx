import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, Loader2, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.decacrm.com';
const API_KEY = 'deca-admin-2026-secure-api-key-8x9z4w3y2q1p';

interface Deal {
  id: number;
  title: string;
  amount: number | null;
  stage: string;
  contact_name: string | null;
  close_date: string | null;
  created_at: string;
}

const STAGE_COLORS: Record<string, string> = {
  'appointmentscheduled': 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  'qualifiedtobuy': 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  'presentationscheduled': 'bg-purple-400/10 text-purple-300 border-purple-400/20',
  'decisionmakerboughtin': 'bg-orange-400/10 text-orange-300 border-orange-400/20',
  'contractsent': 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
  'closedwon': 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  'closedlost': 'bg-red-400/10 text-red-400 border-red-400/20',
};

function stageBadge(stage: string | null) {
  const key = stage?.toLowerCase().replace(/\s/g, '') || '';
  const cls = STAGE_COLORS[key] || 'bg-gray-400/10 text-gray-400 border-gray-400/20';
  const label = stage?.replace(/([A-Z])/g, ' $1').trim() || '—';
  return <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{label}</span>;
}

function SortIcon({ col: c, sorting }: { col: string; sorting: SortingState }) {
  const s = sorting.find(s => s.id === c);
  if (!s) return <ChevronsUpDown size={12} className="text-gray-600" />;
  return s.desc ? <ChevronDown size={12} className="text-blue-400" /> : <ChevronUp size={12} className="text-blue-400" />;
}

const col = createColumnHelper<Deal>();

export default function DealsTable() {
  const [data, setData] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const LIMIT = 50;
  const totalPages = Math.ceil(total / LIMIT);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sort = sorting[0];
      const params = new URLSearchParams({
        page: String(page), limit: String(LIMIT),
        sort: sort?.id || 'created_at', order: sort?.desc ? 'desc' : 'asc',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`${API_URL}/api/pg/deals?${params}`, { headers: { 'x-api-key': API_KEY } });
      const json = await res.json();
      if (json.ok) { setData(json.deals); setTotal(json.total); }
    } finally { setLoading(false); }
  }, [page, sorting, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortableIds = new Set(['title', 'amount', 'stage', 'close_date', 'created_at']);

  const columns = [
    col.accessor('title', {
      header: 'Deal Title',
      cell: info => <span className="font-medium text-gray-100">{info.getValue() || '—'}</span>,
    }),
    col.accessor('amount', {
      header: 'Amount',
      cell: info => {
        const v = info.getValue();
        return <span className="text-emerald-400 font-medium">{v != null ? `$${Number(v).toLocaleString()}` : '—'}</span>;
      },
    }),
    col.accessor('stage', { header: 'Stage', cell: info => stageBadge(info.getValue()) }),
    col.accessor('contact_name', {
      header: 'Contact',
      cell: info => <span className="text-gray-400 text-sm">{info.getValue() || '—'}</span>,
    }),
    col.accessor('close_date', {
      header: 'Close Date',
      cell: info => <span className="text-gray-500 text-xs">{info.getValue() ? new Date(info.getValue()!).toLocaleDateString() : '—'}</span>,
    }),
    col.accessor('created_at', {
      header: 'Created',
      cell: info => <span className="text-gray-500 text-xs">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '—'}</span>,
    }),
  ];

  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: (u) => { setSorting(u); setPage(1); },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, manualPagination: true, pageCount: totalPages,
  });

  return (
    <div className="mt-6 rounded-xl border border-navy-700/50 bg-navy-800/50 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-navy-700/50">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search deals..."
            className="w-full bg-navy-900/80 border border-navy-700/50 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-colors"
          />
        </div>
        <div className="text-sm text-gray-500 ml-auto">
          {loading ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading…</span>
            : <span>{total.toLocaleString()} deals</span>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-navy-700/50">
                {hg.headers.map(header => {
                  const isSortable = sortableIds.has(header.id);
                  return (
                    <th key={header.id}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${isSortable ? 'cursor-pointer hover:text-gray-300 select-none' : ''}`}
                      onClick={isSortable ? () => {
                        const cur = sorting.find(s => s.id === header.id);
                        if (!cur) setSorting([{ id: header.id, desc: false }]);
                        else if (!cur.desc) setSorting([{ id: header.id, desc: true }]);
                        else setSorting([]);
                        setPage(1);
                      } : undefined}
                    >
                      <span className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable && <SortIcon col={header.id} sorting={sorting} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-navy-700/30">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-navy-700/20 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-600">No deals found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-navy-700/50">
        <span className="text-xs text-gray-600">Page {page} of {totalPages || 1}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-navy-700/50 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-400 min-w-[4rem] text-center">
            {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-navy-700/50 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
