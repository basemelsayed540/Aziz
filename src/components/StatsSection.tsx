import React from 'react';
import { DollarSign, Percent, ArrowLeftRight, Package } from 'lucide-react';
import { enNum } from '../utils/enNum';

export interface StatsData {
  paid: number;
  commission: number;
  remittance: number;
  total: number;
  doneCount?: number;
  statusBreakdown?: string;
}

export function StatsSection({ stats }: { stats: StatsData }) {
  const statsConfig = [
    {
      label: 'المدفوع',
      value: enNum(stats.paid),
      color: 'dark:text-emerald-400 text-emerald-600',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
      border: 'border-emerald-500/20 dark:border-emerald-500/10',
      icon: <DollarSign className="w-5 h-5 dark:text-emerald-400 text-emerald-600" />,
    },
    {
      label: 'العمولة',
      value: enNum(stats.commission),
      color: 'dark:text-amber-400 text-amber-600',
      bg: 'bg-amber-500/10 dark:bg-amber-500/5',
      border: 'border-amber-500/20 dark:border-amber-500/10',
      icon: <Percent className="w-5 h-5 dark:text-amber-400 text-amber-600" />,
      extra: stats.doneCount != null ? `${enNum(stats.doneCount)} شحنة` : undefined,
    },
    {
      label: 'التوريد',
      value: enNum(stats.remittance),
      color: 'dark:text-sky-400 text-sky-600',
      bg: 'bg-sky-500/10 dark:bg-sky-500/5',
      border: 'border-sky-500/20 dark:border-sky-500/10',
      icon: <ArrowLeftRight className="w-5 h-5 dark:text-sky-400 text-sky-600" />,
      extra: stats.statusBreakdown,
    },
    {
      label: 'الشحنات',
      value: enNum(stats.total),
      color: 'dark:text-purple-400 text-purple-600',
      bg: 'bg-purple-500/10 dark:bg-purple-500/5',
      border: 'border-purple-500/20 dark:border-purple-500/10',
      icon: <Package className="w-5 h-5 dark:text-purple-400 text-purple-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {statsConfig.map((item, idx) => (
        <div 
          key={idx} 
          className={`bg-bg-surface p-4 rounded-2xl border ${item.border} ${item.bg} flex flex-col justify-between shadow-sm relative overflow-hidden transition-colors duration-200`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-text-muted text-xs font-bold leading-relaxed">{item.label}</span>
            <div className="p-1.5 rounded-lg bg-black/5 dark:bg-black/20">
              {item.icon}
            </div>
          </div>
          <div>
            <span className={`text-xl font-extrabold tracking-tight ${item.color}`}>
              {item.value}
            </span>
            {(item as any).extra && <div className="text-[0.6rem] font-medium opacity-70 mt-1 leading-tight">{(item as any).extra}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
