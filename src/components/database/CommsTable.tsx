import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, Loader2, Phone, Mail, MessageSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.decacrm.com';
const API_KEY = 'deca-admin-2026-secure-api-key-8x9z4w3y2q1p';

interface Comm {
  id: number;
  comm_type: string;
  direction: string;
  contact_name: string | null;
  subject: string | null;
  body: string | null;
  created_at: string;
}

function typeIcon(type: string) {
  if (type === 'call') return <Phone size={14} className="text-emerald-400" />;
  if (type === 'email') return <Mail size={14} className="text-blue-400" />;
  return <MessageSquare size={14} className="text-purple-400" />;
}

const col = createColumnHelper<Comm>();

export default function CommsTable() {
  const [data, setData] = useState<Comm[]>([]);
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
      const res = await fetch(`${API_URL}/api/pg/communications?${params}`, { headers: { 'x-api-key': API_KEY } });
      const json = await res.json();
      if (json.ok) { setData(json.communications); setTotal(json.total); }
    } finally { setLoading(false); }
  }, [page, sorting, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    col.accessor('comm_type', {
      header: 'Type',
      cell: info => (
        <div className="flex items-center gap-2">
          {typeIcon(info.getValue())}
          <span className="text-xs text-gray-400 capitalize">{info.getValue()}</span>
        </div>
      ),
    }),
    col.accessor('direction', {
      header: 'Dir',
      cell: info => (
        <span className={`text-xs font-mono ${info.getValue() === 'inbound' ? 'text-emerald-400' : 'text-amber-400'}`}>
          {info.getValue() === 'inbound' ? '← in' : '→ out'}
        </span>
      ),
    }),
    col.accessor('contact_name', {
      header: 'Contact',
      cell: info => <span className="text-gray-300 text-sm">{info.getValue() || '—'}</span>,
    }),
    col.accessor('subject', {
      header: 'Subject / Preview',
      cell: info => {
        const row = info.row.original;
        return (
          <div>
            {row.subject && <p className="text-sm text-gray-200 truncate max-w-xs">{row.subject}</p>}
            {row.body && <p className="text-xs text-gray-500 truncate max-w-xs">{row.body.slice(0, 100)}</p>}
            {!row.subject && !row.body && <span className="text-gray-600 text-xs">—</span>}
          </div>
        );
      },
    }),
    col.accessor('created_at', {
      header: 'Date',
      cell: info => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '—'}
        </span>
      ),
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
            placeholder="Search communications..."
            className="w-full bg-navy-900/80 border border-navy-700/50 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 transition-colors"
          />
        </div>
        <div className="text-sm text-gray-500 ml-auto">
          {loading ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading…</span>
            : <span>{total.toLocaleString()} records</span>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-navy-700/50">
                {hg.headers.map(header => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
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
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-600">No communications found.</td></tr>
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
