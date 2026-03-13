import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { Search, Factory, ChevronRight, Package, Wrench, GlassWater, Truck, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductionOrder {
  id: string;
  order_number: string;
  customer_name: string;
  order_date: string;
  production_status: string;
  fulfillment_percentage: number;
  windows_count: number;
  doors_count: number;
  sliding_doors_count: number;
  delivered: boolean;
  is_priority: boolean;
  delivery_date: string | null;
  construction_count: string;
  f_welding: string | null;
  f_assembly: string | null;
  f_glass: string | null;
  f_doors: string | null;
  f_sliding: string | null;
}

interface DashboardStats {
  total_orders: string;
  production_ready: string;
  delivered: string;
  priority_orders: string;
  total_constructions: string;
  avg_fulfillment: number;
  welding_complete: string;
  assembly_complete: string;
  glass_complete: string;
  total_customers: string;
}

const STATUS_COLORS: Record<string, string> = {
  complete: 'bg-emerald-100 text-emerald-700',
  not_started: 'bg-gray-100 text-gray-500',
  partial: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  complete: 'Done',
  not_started: '—',
  partial: 'Partial',
  in_progress: 'WIP',
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-content-tertiary">—</span>;
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', STATUS_COLORS[status] || 'bg-gray-100 text-gray-500')}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div
        className={cn('h-1.5 rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500')}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function Production() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'priority' | 'delivered'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/production/orders'),
      api.get('/api/production/dashboard'),
    ]).then(([ordersRes, statsRes]) => {
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (filter === 'priority') list = list.filter(o => o.is_priority);
    if (filter === 'delivered') list = list.filter(o => o.delivered);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.customer_name?.toLowerCase().includes(q) || o.order_number?.toLowerCase().includes(q));
    }
    return list;
  }, [orders, search, filter]);

  async function openDetail(orderId: string) {
    setSelectedOrder(orderId);
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/production/orders/${orderId}`);
      setOrderDetail(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Orders List */}
      <div className={cn('flex flex-col border-r border-border', selectedOrder ? 'w-[380px]' : 'flex-1')}>
        {/* Stats bar */}
        {stats && (
          <div className="flex gap-3 px-4 py-3 border-b border-border bg-surface-raised">
            <Stat label="Orders" value={stats.total_orders} />
            <Stat label="Units" value={stats.total_constructions} />
            <Stat label="Avg %" value={`${stats.avg_fulfillment}%`} />
            <Stat label="Welding" value={`${stats.welding_complete}/${stats.total_orders}`} />
            <Stat label="Assembly" value={`${stats.assembly_complete}/${stats.total_orders}`} />
            <Stat label="Glass" value={`${stats.glass_complete}/${stats.total_orders}`} />
            <Stat label="Delivered" value={stats.delivered} />
          </div>
        )}

        {/* Search + filter */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'priority', 'delivered'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'text-[10px] font-medium px-2 py-1 rounded transition-colors',
                  filter === f ? 'bg-accent text-white' : 'bg-surface-raised text-content-secondary hover:bg-border'
                )}
              >
                {f === 'all' ? 'All' : f === 'priority' ? 'Priority' : 'Delivered'}
              </button>
            ))}
          </div>
        </div>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(order => (
            <button
              key={order.id}
              onClick={() => openDetail(order.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border hover:bg-surface-raised transition-colors',
                selectedOrder === order.id && 'bg-accent/5 border-l-2 border-l-accent'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {order.is_priority && <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                    <span className="text-xs font-semibold text-content-primary truncate">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-content-tertiary">#{order.order_number}</span>
                    <span className="text-[10px] text-content-tertiary">{order.construction_count} units</span>
                    {order.windows_count > 0 && <span className="text-[10px] text-content-tertiary">{order.windows_count}W</span>}
                    {order.doors_count > 0 && <span className="text-[10px] text-content-tertiary">{order.doors_count}D</span>}
                    {order.sliding_doors_count > 0 && <span className="text-[10px] text-content-tertiary">{order.sliding_doors_count}SD</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-medium text-content-secondary">{order.fulfillment_percentage}%</span>
                  <ChevronRight size={14} className="text-content-tertiary" />
                </div>
              </div>
              {/* Mini progress */}
              <div className="mt-1.5">
                <ProgressBar pct={order.fulfillment_percentage} />
              </div>
              {/* Status pills */}
              <div className="flex gap-1 mt-1.5">
                <StatusBadge status={order.f_welding} />
                <StatusBadge status={order.f_assembly} />
                <StatusBadge status={order.f_glass} />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm text-content-tertiary">No orders found</div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedOrder && (
        <div className="flex-1 overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
            </div>
          ) : orderDetail ? (
            <OrderDetail order={orderDetail} onClose={() => { setSelectedOrder(null); setOrderDetail(null); }} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-sm font-bold text-content-primary">{value}</div>
      <div className="text-[9px] text-content-tertiary uppercase tracking-wide">{label}</div>
    </div>
  );
}

function OrderDetail({ order, onClose }: { order: any; onClose: () => void }) {
  const f = order.fulfillment;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            {order.is_priority && <Star size={16} className="text-amber-500 fill-amber-500" />}
            <h2 className="text-lg font-bold text-content-primary">{order.customer_name}</h2>
          </div>
          <p className="text-sm text-content-tertiary mt-0.5">
            Order #{order.order_number} · {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
            {order.delivery_date && ` · Delivery: ${new Date(order.delivery_date).toLocaleDateString()}`}
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-content-tertiary hover:text-content-primary px-2 py-1 rounded hover:bg-surface-raised">
          Close
        </button>
      </div>

      {/* Fulfillment Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-content-primary">Fulfillment</span>
          <span className="text-sm font-bold text-content-primary">{order.fulfillment_percentage}%</span>
        </div>
        <ProgressBar pct={order.fulfillment_percentage} />
      </div>

      {/* Manufacturing Stages */}
      {f && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StageCard icon={Wrench} label="Cutting" items={[
            { label: 'Profile', status: f.profile_cutting },
            { label: 'Reinforcement', status: f.reinforcement_cutting },
            { label: 'Screens', status: f.screens_cutting },
          ]} />
          <StageCard icon={Factory} label="Welding & Assembly" items={[
            { label: 'Welding', status: f.welding_status },
            { label: 'Assembly', status: f.assembly_status },
            { label: 'Frames welded', status: f.frames_welded ? 'complete' : 'not_started' },
          ]} />
          <StageCard icon={GlassWater} label="Glass" items={[
            { label: 'Glass status', status: f.glass_status },
            { label: 'Delivered', status: f.glass_delivered ? 'complete' : 'not_started' },
            { label: 'Installed', status: f.glass_installed ? 'complete' : 'not_started' },
          ]} />
          <StageCard icon={Truck} label="Shipping" items={[
            { label: 'Windows', status: f.windows_delivered ? 'complete' : 'not_started' },
            { label: 'Doors', status: f.doors_status },
            { label: 'Sliding doors', status: f.sliding_doors_status },
          ]} />
        </div>
      )}

      {/* Constructions Table */}
      <div>
        <h3 className="text-sm font-semibold text-content-primary mb-2 flex items-center gap-1.5">
          <Package size={14} />
          Constructions ({order.constructions?.length || 0})
        </h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-raised">
                <th className="text-left px-3 py-2 font-medium text-content-secondary">#</th>
                <th className="text-left px-3 py-2 font-medium text-content-secondary">Type</th>
                <th className="text-left px-3 py-2 font-medium text-content-secondary">Size</th>
                <th className="text-left px-3 py-2 font-medium text-content-secondary">Opening</th>
                <th className="text-left px-3 py-2 font-medium text-content-secondary">Glass</th>
                <th className="text-left px-3 py-2 font-medium text-content-secondary">Location</th>
                <th className="text-right px-3 py-2 font-medium text-content-secondary">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.constructions?.map((c: any) => (
                <tr key={c.id} className="border-t border-border hover:bg-surface-raised/50">
                  <td className="px-3 py-2 text-content-primary font-medium">{c.construction_number}</td>
                  <td className="px-3 py-2 text-content-secondary capitalize">{c.construction_type}</td>
                  <td className="px-3 py-2 text-content-secondary">
                    {c.width_mm && c.height_mm ? `${c.width_mm}×${c.height_mm}mm` : '—'}
                  </td>
                  <td className="px-3 py-2 text-content-secondary">{c.opening_type || '—'}</td>
                  <td className="px-3 py-2 text-content-secondary truncate max-w-[120px]" title={c.glass_type}>
                    {c.glass_type ? c.glass_type.split(',')[0] : '—'}
                  </td>
                  <td className="px-3 py-2 text-content-secondary truncate max-w-[100px]" title={c.location}>
                    {c.location || '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-content-primary">{c.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Batches */}
      {order.delivery_batches?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-content-primary mb-2 flex items-center gap-1.5">
            <Truck size={14} />
            Delivery Batches ({order.delivery_batches.length})
          </h3>
          <div className="space-y-2">
            {order.delivery_batches.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-surface-raised rounded-lg border border-border">
                <div>
                  <span className="text-xs font-medium text-content-primary">
                    {b.delivery_date ? new Date(b.delivery_date).toLocaleDateString() : '—'}
                  </span>
                  {b.delivery_person && (
                    <span className="text-[10px] text-content-tertiary ml-2">by {b.delivery_person}</span>
                  )}
                </div>
                <StatusBadge status={b.status === 'shipped' ? 'complete' : b.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StageCard({ icon: Icon, label, items }: { icon: any; label: string; items: { label: string; status: string }[] }) {
  const allDone = items.every(i => i.status === 'complete');
  return (
    <div className={cn('border rounded-lg p-3', allDone ? 'border-emerald-200 bg-emerald-50/50' : 'border-border')}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} className={allDone ? 'text-emerald-600' : 'text-content-tertiary'} />
        <span className="text-xs font-semibold text-content-primary">{label}</span>
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[10px] text-content-secondary">{item.label}</span>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
