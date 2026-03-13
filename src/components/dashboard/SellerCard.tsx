import { Phone, Clock, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import StatusDot from '../ui/StatusDot';
import { formatCurrencyK } from '../../lib/utils';
import type { Seller } from '../../types';

interface SellerCardProps {
  seller: Seller;
  onClick: () => void;
}

export default function SellerCard({ seller, onClick }: SellerCardProps) {
  const overallStatus =
    (seller.alert_count || 0) > 2
      ? 'red'
      : (seller.alert_count || 0) > 0
        ? 'yellow'
        : 'green';

  const chartData = (seller.calls_this_week || []).map((val, i) => ({
    day: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
    calls: val,
  }));

  return (
    <div
      onClick={onClick}
      className="card-hover p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent-light">
            {seller.initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">
              {seller.name}
            </h3>
            <p className="text-xs text-gray-500">
              {seller.active_deals || 0} deals &middot;{' '}
              {formatCurrencyK(seller.pipeline_value || 0)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(seller.alert_count || 0) > 0 && (
            <span className="flex items-center gap-1 bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md text-xs font-medium border border-red-500/30">
              <AlertTriangle size={10} />
              {seller.alert_count}
            </span>
          )}
          <StatusDot status={overallStatus} pulse={overallStatus === 'red'} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} className="text-gray-500" />
          <span>
            Avg Response: <strong className="text-gray-300">{seller.avg_response_time || 0}h</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Phone size={12} className="text-gray-500" />
          <span>
            Close Rate: <strong className="text-gray-300">{Math.round((seller.close_rate || 0) * 100)}%</strong>
          </span>
        </div>
      </div>

      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Tooltip
              contentStyle={{
                background: '#151d35',
                border: '1px solid #243050',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#e5e7eb',
              }}
              cursor={{ fill: 'rgba(59,130,246,0.1)' }}
            />
            <Bar
              dataKey="calls"
              fill="rgba(59,130,246,0.6)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-gray-600 mt-1 text-center">
        Calls this week
      </p>
    </div>
  );
}
