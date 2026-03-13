import { useEffect, useState, useRef } from 'react';
import { X, TrendingUp, AlertTriangle, Factory, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPulse, type PulseData } from '../../services/hub';
import { formatCurrency, formatRelativeTime, ACTION_ICONS } from '../../lib/theme';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PulsePanel({ open, onClose }: Props) {
  const [data, setData] = useState<PulseData | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetchPulse().then(setData).catch(console.error);
    }
  }, [open]);

  // Auto-refresh every 60s when open
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      fetchPulse().then(setData).catch(console.error);
    }, 60000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-80 bg-sidebar-bg text-sidebar-text-active shadow-panel z-50 flex flex-col"
          onMouseLeave={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              <span className="text-sm font-semibold">DECA Pulse</span>
            </div>
            <button onClick={onClose} className="text-sidebar-text hover:text-sidebar-text-active">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {!data ? (
              <div className="text-sidebar-text text-sm text-center py-8">Loading...</div>
            ) : (
              <>
                {/* Scoreboard */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-sidebar-text mb-2 font-semibold">Scoreboard</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <ScoreCard label="New Leads" value={data.scoreboard.new_leads_24h} icon="🔵" />
                    <ScoreCard label="Active 1h" value={data.scoreboard.active_contacts_1h} icon="🟢" />
                    <ScoreCard label="Comms 24h" value={data.scoreboard.comms_24h} icon="📨" />
                    <ScoreCard label="Missed Calls" value={data.scoreboard.missed_calls_24h} icon="📞" alert />
                    <ScoreCard label="Total Debt" value={formatCurrency(data.scoreboard.total_debt)} icon="💰" alert />
                    <ScoreCard label="Production" value={data.scoreboard.orders_in_production} icon="🏭" />
                  </div>
                </section>

                {/* Top Debtors */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-sidebar-text mb-2 font-semibold flex items-center gap-1">
                    <AlertTriangle size={10} className="text-status-red" /> Top Debtors
                  </h3>
                  <div className="space-y-1">
                    {data.topDebtors.map(d => (
                      <div key={d.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-sidebar-hover">
                        <span className="truncate">{d.name}</span>
                        <span className="text-status-red font-medium">${parseFloat(d.total_owed).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Production */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-sidebar-text mb-2 font-semibold flex items-center gap-1">
                    <Factory size={10} /> Production
                  </h3>
                  <div className="space-y-1">
                    {data.production.map(o => (
                      <div key={o.id_doc} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-sidebar-hover">
                        <span>#{o.docnum} {o.client_name || '—'}</span>
                        <span className="text-sidebar-text">{formatCurrency(o.syma)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recent Activity */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-sidebar-text mb-2 font-semibold flex items-center gap-1">
                    <TrendingUp size={10} /> Recent Activity
                  </h3>
                  <div className="space-y-0.5">
                    {data.recentActivity.map((a, i) => (
                      <div key={i} className="text-xs py-1.5 px-2 rounded hover:bg-sidebar-hover">
                        <div className="flex items-center gap-1.5">
                          <span>{ACTION_ICONS[a.event_type] || '📌'}</span>
                          <span className="truncate font-medium">{a.contact_name || 'Unknown'}</span>
                          <span className="text-sidebar-text ml-auto text-[10px]">{formatRelativeTime(a.event_date)}</span>
                        </div>
                        {a.title && <div className="text-sidebar-text truncate mt-0.5 ml-5">{a.title}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScoreCard({ label, value, icon, alert }: { label: string; value: string | number; icon: string; alert?: boolean }) {
  return (
    <div className="bg-sidebar-hover rounded-md p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs">{icon}</span>
        <span className="text-[10px] text-sidebar-text uppercase">{label}</span>
      </div>
      <div className={`text-lg font-semibold ${alert ? 'text-status-red' : 'text-sidebar-text-active'}`}>
        {value}
      </div>
    </div>
  );
}
