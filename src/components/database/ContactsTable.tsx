import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Loader2, ChevronRight as ExpandIcon } from 'lucide-react';
import ContactTimeline from './ContactTimeline';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.decacrm.com';
const API_KEY = 'deca-admin-2026-secure-api-key-8x9z4w3y2q1p';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  owner_name: string;
  lifecycle_stage: string;
  created_at: string;
}

const col = createColumnHelper<Contact>();

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  customer: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  opportunity: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  subscriber: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  other: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
};

function stageBadge(stage: string | null) {
  const s = stage?.toLowerCase() || 'other';
  const cls = STAGE_COLORS[s] || STAGE_COLORS.other;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${cls} capitalize`}>
      {stage || '—'}
    </span>
  );
}

function SortIcon({ col: c, sorting }: { col: string; sorting: SortingState }) {
  const s = sorting.find(s => s.id === c);
  if (!s) return <ChevronsUpDown size={12} className="text-gray-600" />;
  return s.desc ? <ChevronDown size={12} className="text-emerald-400" /> : <ChevronUp size={12} className="text-emerald-400" />;
}

export default function ContactsTable() {
  const [data, setData] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const LIMIT = 50;
  const totalPages = Math.ceil(total / LIMIT);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sort = sorting[0];
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sort: sort?.id || 'created_at',
        order: sort?.desc ? 'desc' : 'asc',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`${API_URL}/api/pg/contacts?${params}`, {
        headers: { 'x-api-key': API_KEY },
      });
      const json = await res.json();
      if (json.ok) {
        setData(json.contacts);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, sorting, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    col.display({
      id: 'expand',
      size: 32,
      cell: ({ row }) => (
        <span className={`text-gray-500 transition-transform duration-200 inline-block ${expandedRow === row.original.id ? 'rotate-90' : ''}`}>
          <ExpandIcon size={14} />
        </span>
      ),
    }),
    col.accessor('name', {
      header: 'Name',
      cell: info => <span className="font-medium text-gray-100">{info.getValue() || '—'}</span>,
    }),
    col.accessor('email', {
      header: 'Email',
      cell: info => <span className="text-gray-400 text-sm">{info.getValue() || '—'}</span>,
    }),
    col.accessor('phone', {
      header: 'Phone',
      cell: info => <span className="text-gray-400 text-sm">{info.getValue() || '—'}</span>,
    }),
    col.accessor('company', {
      header: 'Company',
      cell: info => <span className="text-gray-300 text-sm">{info.getValue() || '—'}</span>,
    }),
    col.accessor('owner_name', {
      header: 'Owner',
      cell: info => <span className="text-gray-400 text-sm">{info.getValue() || '—'}</span>,
    }),
    col.accessor('lifecycle_stage', {
      header: 'Stage',
      cell: info => stageBadge(info.getValue()),
    }),
    col.accessor('created_at', {
      header: 'Created',
      cell: info => (
        <span className="text-gray-500 text-xs">
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '—'}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
  });

  const sortableIds = new Set(['name', 'email', 'company', 'lifecycle_stage', 'created_at']);

  return (
    <div className="mt-6 rounded-xl border border-navy-700/50 bg-navy-800/50 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-navy-700/50">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone, company..."
            className="w-full bg-navy-900/80 border border-navy-700/50 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-colors"
          />
        </div>
        <div className="text-sm text-gray-500 ml-auto">
          {loading ? (
            <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading…</span>
          ) : (
            <span>{total.toLocaleString()} contacts</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-navy-700/50">
                {hg.headers.map(header => {
                  const isSortable = sortableIds.has(header.id);
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${isSortable ? 'cursor-pointer hover:text-gray-300 select-none' : ''}`}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      onClick={isSortable ? () => {
                        const current = sorting.find(s => s.id === header.id);
                        if (!current) setSorting([{ id: header.id, desc: false }]);
                        else if (!current.desc) setSorting([{ id: header.id, desc: true }]);
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
              <>
                <tr
                  key={row.id}
                  onClick={() => setExpandedRow(prev => prev === row.original.id ? null : row.original.id)}
                  className={`cursor-pointer transition-colors hover:bg-navy-700/30 ${expandedRow === row.original.id ? 'bg-navy-700/20' : ''}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expandedRow === row.original.id && (
                  <tr key={`${row.id}-expanded`} className="bg-navy-900/40">
                    <td colSpan={columns.length} className="px-4">
                      <ContactTimeline contactId={row.original.id} />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-600">
                  No contacts found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-navy-700/50">
        <span className="text-xs text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-navy-700/50 text-gray-400 hover:text-gray-200 hover:border-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-400 min-w-[4rem] text-center">
            {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-navy-700/50 text-gray-400 hover:text-gray-200 hover:border-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
