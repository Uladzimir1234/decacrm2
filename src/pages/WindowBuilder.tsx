import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// ── Types ──────────────────────────────────────────────────────────────────
type OpeningType = 'fixed' | 'tilt_turn' | 'door' | 'sliding';
type HandlePos   = 'left' | 'right';

interface Cell {
  id: string;
  opening_type: OpeningType;
  handle_pos: HandlePos;
  w_pct: number;  // percentage of overall width
  h_pct: number;  // percentage of overall height
  row: number;    // 0-indexed row
  col: number;    // 0-indexed column
}

interface WindowItem {
  id: string;
  name: string;
  w_mm: number;   // overall width in mm
  h_mm: number;   // overall height in mm
  id_sys: number;
  id_color: number;
  qty: number;
  cells: Cell[];
  mullions: number[];   // x positions as % of width
  transoms: number[];   // y positions as % of height
  glazing: 'triple' | 'double';
  id_glazing?: number;
  grids: boolean;
  material_cost?: number;
  list_price?: number;
  dealer_price?: number;
  confidence?: string;
}

interface Reference {
  systems: { id: number; name: string }[];
  colors:  { id: number; name: string }[];
  glass_types: { id: number; name: string; hr: string | null; tags: string | null }[];
  opening_types: { id: string; name: string; icon: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const mmToIn = (mm: number) => (mm / 25.4).toFixed(1) + '"';
const newCell = (col: number, row: number): Cell => ({
  id: `${col}-${row}-${Date.now()}`,
  opening_type: 'fixed',
  handle_pos: 'right',
  w_pct: 100,
  h_pct: 100,
  row, col,
});

const OPENING_COLORS: Record<OpeningType, string> = {
  fixed:     '#e0e8f0',
  tilt_turn: '#d0e8d0',
  door:      '#e8e0d0',
  sliding:   '#e0d0e8',
};
const OPENING_LABELS: Record<OpeningType, string> = {
  fixed:     'F',
  tilt_turn: 'T&T',
  door:      'D',
  sliding:   '⇔',
};

// ── SVG Window Preview ─────────────────────────────────────────────────────
function WindowSVG({ item }: { item: WindowItem }) {
  const W = 260, H = Math.round(260 * (item.h_mm / item.w_mm));
  const pad = 16;
  const fw = W - 2 * pad, fh = H - 2 * pad;

  // Build grid of cells
  const cols = [0, ...item.mullions, 100];
  const rows = [0, ...item.transoms, 100];

  const cells: { x: number; y: number; w: number; h: number; col: number; row: number }[] = [];
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols.length - 1; c++) {
      cells.push({
        x: pad + (cols[c] / 100) * fw,
        y: pad + (rows[r] / 100) * fh,
        w: ((cols[c + 1] - cols[c]) / 100) * fw,
        h: ((rows[r + 1] - rows[r]) / 100) * fh,
        col: c, row: r,
      });
    }
  }

  const getCell = (col: number, row: number) =>
    item.cells.find(c => c.col === col && c.row === row);

  return (
    <svg width={W} height={H} className="border border-gray-300 rounded bg-white shadow">
      {/* Outer frame */}
      <rect x={pad/2} y={pad/2} width={W - pad} height={H - pad}
            fill="none" stroke="#555" strokeWidth={pad} />
      {/* Cells */}
      {cells.map(cell => {
        const cfg = getCell(cell.col, cell.row);
        const ot: OpeningType = cfg?.opening_type ?? 'fixed';
        const hp: HandlePos   = cfg?.handle_pos ?? 'right';
        const sashPad = 6;
        return (
          <g key={`${cell.col}-${cell.row}`}>
            <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                  fill={OPENING_COLORS[ot]} stroke="#aaa" strokeWidth={1} />
            {/* Sash inner frame for T&T/Door */}
            {ot !== 'fixed' && (
              <rect x={cell.x + sashPad} y={cell.y + sashPad}
                    width={cell.w - 2 * sashPad} height={cell.h - 2 * sashPad}
                    fill="none" stroke="#666" strokeWidth={2} />
            )}
            {/* Handle indicator */}
            {ot === 'tilt_turn' && (
              <circle
                cx={hp === 'right' ? cell.x + cell.w - sashPad - 4 : cell.x + sashPad + 4}
                cy={cell.y + cell.h / 2}
                r={4} fill="#e66" />
            )}
            {ot === 'door' && (
              <circle
                cx={hp === 'right' ? cell.x + cell.w - sashPad - 4 : cell.x + sashPad + 4}
                cy={cell.y + cell.h * 0.4}
                r={5} fill="#c84" />
            )}
            {/* Label */}
            <text x={cell.x + cell.w / 2} y={cell.y + cell.h / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fill="#333" fontWeight="600">
              {OPENING_LABELS[ot]}
            </text>
          </g>
        );
      })}
      {/* Mullion lines */}
      {item.mullions.map((pct, i) => (
        <line key={`m${i}`}
              x1={pad + (pct / 100) * fw} y1={pad / 2}
              x2={pad + (pct / 100) * fw} y2={H - pad / 2}
              stroke="#555" strokeWidth={4} />
      ))}
      {/* Transom lines */}
      {item.transoms.map((pct, i) => (
        <line key={`t${i}`}
              x1={pad / 2} y1={pad + (pct / 100) * fh}
              x2={W - pad / 2} y2={pad + (pct / 100) * fh}
              stroke="#555" strokeWidth={4} />
      ))}
      {/* Dimension labels */}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#666">
        {item.w_mm}mm ({mmToIn(item.w_mm)})
      </text>
      <text x={4} y={H / 2} textAnchor="middle" fontSize={9} fill="#666"
            transform={`rotate(-90, 4, ${H / 2})`}>
        {item.h_mm}mm ({mmToIn(item.h_mm)})
      </text>
    </svg>
  );
}

// ── Cell Editor ────────────────────────────────────────────────────────────
function CellEditor({ cell, onChange }: { cell: Cell; onChange: (c: Cell) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded border">
      <span className="text-gray-500 font-mono">
        [{cell.col},{cell.row}]
      </span>
      <select value={cell.opening_type}
              onChange={e => onChange({ ...cell, opening_type: e.target.value as OpeningType })}
              className="border rounded px-1 py-0.5 text-xs">
        <option value="fixed">Fixed</option>
        <option value="tilt_turn">Tilt-and-Turn</option>
        <option value="door">Door</option>
        <option value="sliding">Sliding</option>
      </select>
      {cell.opening_type !== 'fixed' && (
        <select value={cell.handle_pos}
                onChange={e => onChange({ ...cell, handle_pos: e.target.value as HandlePos })}
                className="border rounded px-1 py-0.5 text-xs">
          <option value="right">Handle Right</option>
          <option value="left">Handle Left</option>
        </select>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function WindowBuilder() {
  const [ref, setRef] = useState<Reference | null>(null);
  const [items, setItems] = useState<WindowItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/windows/reference').then(r => setRef(r.data));
  }, []);

  const addItem = () => {
    const item: WindowItem = {
      id: Date.now().toString(),
      name: `Window ${items.length + 1}`,
      w_mm: 914, h_mm: 1524,
      id_sys: 11, id_color: 2,
      qty: 1,
      cells: [newCell(0, 0)],
      mullions: [], transoms: [],
      glazing: 'triple', grids: false, id_glazing: undefined,
    };
    setItems(prev => [...prev, item]);
  };

  const updateItem = useCallback((id: string, patch: Partial<WindowItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }, []);

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const addMullion = (item: WindowItem) => {
    const existing = item.mullions;
    const newPct = existing.length === 0 ? 50 : Math.round((existing[existing.length - 1] + 100) / 2);
    if (newPct >= 100) return;
    const mullions = [...existing, newPct].sort((a, b) => a - b);
    const cols = mullions.length + 1;
    // Rebuild cells for new column count, same rows
    const rowCount = item.transoms.length + 1;
    const cells: Cell[] = [];
    for (let r = 0; r < rowCount; r++)
      for (let c = 0; c < cols; c++) {
        const existing = item.cells.find(x => x.col === c && x.row === r);
        cells.push(existing ?? newCell(c, r));
      }
    updateItem(item.id, { mullions, cells });
  };

  const addTransom = (item: WindowItem) => {
    const existing = item.transoms;
    const newPct = existing.length === 0 ? 50 : Math.round((existing[existing.length - 1] + 100) / 2);
    if (newPct >= 100) return;
    const transoms = [...existing, newPct].sort((a, b) => a - b);
    const colCount = item.mullions.length + 1;
    const rows = transoms.length + 1;
    const cells: Cell[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < colCount; c++) {
        const existing = item.cells.find(x => x.col === c && x.row === r);
        cells.push(existing ?? newCell(c, r));
      }
    updateItem(item.id, { transoms, cells });
  };

  const updateCell = (itemId: string, cell: Cell) => {
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, cells: it.cells.map(c => c.id === cell.id ? cell : c) }
        : it
    ));
  };

  const estimatePrice = async (item: WindowItem) => {
    try {
      const { data } = await api.post('/api/windows/price-estimate', {
        id_sys: item.id_sys, id_color: item.id_color,
        w: item.w_mm, h: item.h_mm,
        id_glazing: item.id_glazing,
        opening_type: item.cells.some(c => c.opening_type === 'tilt_turn') ? 'tilt_turn'
                     : item.cells.some(c => c.opening_type === 'door') ? 'door' : 'fixed',
      });
      updateItem(item.id, {
        material_cost: data.material_cost,
        list_price: data.list_price,
        dealer_price: data.dealer_price,
        confidence: data.confidence,
      });
    } catch {}
  };

  const totalList   = items.reduce((s, it) => s + (it.list_price ?? 0) * it.qty, 0);
  const totalDealer = items.reduce((s, it) => s + (it.dealer_price ?? 0) * it.qty, 0);
  const total = totalDealer;

  const handleSave = async () => {
    if (!clientName) { toast.error('Enter client name'); return; }
    setLoading(true);
    try {
      await api.post('/api/windows/quote', { client_name: clientName, client_email: clientEmail, items, total });
      setSaved(true);
      toast.success('Quote saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { toast.error('Failed to save quote'); }
    setLoading(false);
  };

  if (!ref) return <div className="p-8 text-gray-500">Loading reference data...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between shadow flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold">IT-Window Builder</h1>
          <p className="text-blue-200 text-sm">Configure windows, get instant price estimates</p>
        </div>
        <div className="flex items-center gap-3">
          {totalDealer > 0 && (
            <div className="flex gap-3">
              <span className="bg-blue-600 px-3 py-2 rounded text-sm font-semibold">
                List: ${totalList.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="bg-green-600 px-3 py-2 rounded text-sm font-semibold">
                Dealer: ${totalDealer.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <button onClick={addItem}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold text-sm">
            + Add Window
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Client Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Client Name</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)}
                   placeholder="John Smith" className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</label>
            <input value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                   placeholder="john@example.com" type="email"
                   className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSave} disabled={loading}
                  className={`px-6 py-2 rounded font-semibold text-sm text-white ${
                    saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saved ? '✓ Saved' : loading ? 'Saving...' : 'Save Quote'}
          </button>
        </div>

        {items.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <div className="text-5xl mb-4">🪟</div>
            <p className="text-lg">No windows yet.</p>
            <button onClick={addItem}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold">
              + Add First Window
            </button>
          </div>
        )}

        {items.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow p-5 mb-6">
            {/* Item header */}
            <div className="flex items-center justify-between mb-4">
              <input value={item.name}
                     onChange={e => updateItem(item.id, { name: e.target.value })}
                     className="text-lg font-bold border-b border-transparent focus:border-blue-400 outline-none px-1" />
              <button onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-sm">✕ Remove</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Config */}
              <div className="space-y-4">
                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Width (mm)</label>
                    <input type="number" value={item.w_mm} min={300} max={6000} step={10}
                           onChange={e => updateItem(item.id, { w_mm: +e.target.value, price_each: undefined })}
                           className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
                    <span className="text-xs text-gray-400">{mmToIn(item.w_mm)} inches</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Height (mm)</label>
                    <input type="number" value={item.h_mm} min={300} max={4000} step={10}
                           onChange={e => updateItem(item.id, { h_mm: +e.target.value, price_each: undefined })}
                           className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
                    <span className="text-xs text-gray-400">{mmToIn(item.h_mm)} inches</span>
                  </div>
                </div>

                {/* Profile + Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Profile System</label>
                    <select value={item.id_sys}
                            onChange={e => updateItem(item.id, { id_sys: +e.target.value, price_each: undefined })}
                            className="mt-1 block w-full border rounded px-3 py-2 text-sm">
                      {ref.systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Color</label>
                    <select value={item.id_color}
                            onChange={e => updateItem(item.id, { id_color: +e.target.value, price_each: undefined })}
                            className="mt-1 block w-full border rounded px-3 py-2 text-sm">
                      {ref.colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Glazing + Qty */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Glazing</label>
                    <select value={item.glazing}
                            onChange={e => updateItem(item.id, { glazing: e.target.value as 'triple' | 'double' })}
                            className="mt-1 block w-full border rounded px-3 py-2 text-sm">
                      <option value="triple">Triple (standard)</option>
                      <option value="double">Double</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Quantity</label>
                    <input type="number" value={item.qty} min={1} max={999}
                           onChange={e => updateItem(item.id, { qty: +e.target.value })}
                           className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
                  </div>
                </div>

                {/* Glass Type */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Glass Type</label>
                  <select value={item.id_glazing ?? ''}
                          onChange={e => updateItem(item.id, { id_glazing: e.target.value ? +e.target.value : undefined })}
                          className="mt-1 block w-full border rounded px-3 py-2 text-sm">
                    <option value="">— Select glass type —</option>
                    {ref.glass_types.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}{g.hr ? ` · HR ${parseFloat(g.hr).toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add sections */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Sections</label>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => addMullion(item)}
                            className="border border-gray-300 hover:bg-gray-50 text-xs px-3 py-1.5 rounded">
                      + Vertical Mullion
                    </button>
                    <button onClick={() => addTransom(item)}
                            className="border border-gray-300 hover:bg-gray-50 text-xs px-3 py-1.5 rounded">
                      + Horizontal Transom
                    </button>
                    {(item.mullions.length > 0 || item.transoms.length > 0) && (
                      <button onClick={() => updateItem(item.id, { mullions: [], transoms: [], cells: [newCell(0, 0)] })}
                              className="border border-red-200 text-red-400 hover:bg-red-50 text-xs px-3 py-1.5 rounded">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Cell configs */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Cell Configuration ({item.cells.length} cell{item.cells.length > 1 ? 's' : ''})
                  </label>
                  <div className="mt-1 space-y-1">
                    {item.cells.map(cell => (
                      <CellEditor key={cell.id} cell={cell}
                                  onChange={c => updateCell(item.id, c)} />
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gray-50 rounded p-3 flex items-center justify-between">
                  <div>
                    {item.list_price ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-blue-700">
                            ${item.list_price.toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-xs">list / unit</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-green-700">
                            ${item.dealer_price?.toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-xs">dealer (−30%)</span>
                        </div>
                        {item.qty > 1 && (
                          <div className="text-xs text-gray-500">
                            List: ${(item.list_price * item.qty).toFixed(2)} · Dealer: ${((item.dealer_price ?? 0) * item.qty).toFixed(2)} × {item.qty} units
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Material: ${item.material_cost?.toFixed(2)} + overhead
                        </div>
                        <div className={`text-xs ${
                          item.confidence === 'high' ? 'text-green-600' :
                          item.confidence === 'medium' ? 'text-yellow-600' : 'text-red-500'}`}>
                          ● {item.confidence} confidence
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Price not calculated</span>
                    )}
                  </div>
                  <button onClick={() => estimatePrice(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold">
                    Get Price
                  </button>
                </div>
              </div>

              {/* Right: SVG Preview */}
              <div className="flex flex-col items-center gap-3">
                <label className="text-xs font-semibold text-gray-500 uppercase">Preview</label>
                <WindowSVG item={item} />
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>
                    Area: {((item.w_mm / 1000) * (item.h_mm / 1000)).toFixed(2)} m²
                  </span>
                  <span>
                    Perim: {(2 * (item.w_mm + item.h_mm) / 1000).toFixed(2)} m
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span style={{ background: OPENING_COLORS.fixed }} className="inline-block w-3 h-3 border border-gray-300" /> Fixed
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ background: OPENING_COLORS.tilt_turn }} className="inline-block w-3 h-3 border border-gray-300" /> Tilt-and-Turn
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ background: OPENING_COLORS.door }} className="inline-block w-3 h-3 border border-gray-300" /> Door
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Summary footer */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {items.length} item{items.length > 1 ? 's' : ''} · {items.reduce((s, it) => s + it.qty, 0)} total units
            </div>
            <div className="text-right">
              {totalDealer > 0 ? (
                <div>
                  <div className="text-blue-700 font-bold">List: ${totalList.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <div className="text-green-700 text-xl font-bold">Dealer: ${totalDealer.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              ) : 'Get prices above'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
