import { Thermometer, Flame, Sun, Cloud, Snowflake } from 'lucide-react';

interface TemperatureBarProps {
  summary: {
    hot: number;
    warm: number;
    cooling: number;
    cold: number;
  };
  onFilterChange?: (filter: 'all' | 'hot' | 'warm' | 'cooling' | 'cold') => void;
  activeFilter?: string;
}

export default function TemperatureBar({ summary, onFilterChange, activeFilter = 'all' }: TemperatureBarProps) {
  const temperatures = [
    {
      key: 'hot' as const,
      label: 'HOT',
      count: summary.hot,
      icon: Flame,
      bgClass: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 hover:border-red-500/50',
      textClass: 'text-red-400',
      glowClass: 'shadow-red-500/20',
    },
    {
      key: 'warm' as const,
      label: 'WARM',
      count: summary.warm,
      icon: Sun,
      bgClass: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 hover:border-amber-500/50',
      textClass: 'text-amber-400',
      glowClass: 'shadow-amber-500/20',
    },
    {
      key: 'cooling' as const,
      label: 'COOLING',
      count: summary.cooling,
      icon: Cloud,
      bgClass: 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/30 hover:border-sky-500/50',
      textClass: 'text-sky-400',
      glowClass: 'shadow-sky-500/20',
    },
    {
      key: 'cold' as const,
      label: 'COLD',
      count: summary.cold,
      icon: Snowflake,
      bgClass: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 border-slate-500/30 hover:border-slate-500/50',
      textClass: 'text-slate-400',
      glowClass: 'shadow-slate-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {temperatures.map(({ key, label, count, icon: Icon, bgClass, textClass, glowClass }) => (
        <button
          key={key}
          onClick={() => onFilterChange?.(key)}
          className={`
            card p-4 transition-all duration-200 cursor-pointer
            ${bgClass} ${glowClass}
            ${activeFilter === key ? 'ring-2 ring-opacity-50' : ''}
            transform hover:scale-[1.02] hover:shadow-lg
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wider ${textClass} mb-1`}>
                {label}
              </p>
              <p className="text-2xl font-bold text-white">
                {count}
              </p>
            </div>
            <Icon size={24} className={textClass} />
          </div>
        </button>
      ))}
    </div>
  );
}