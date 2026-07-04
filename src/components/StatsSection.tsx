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
    { label: 'المدفوع', value: enNum(stats.paid), color: 'dark:text-emerald-400 text-emerald-600', bg: 'bg-emerald-500/10 dark:bg-emerald-500/5', border: 'border-emerald-500/20 dark:border-emerald-500/10' },
    { label: 'العمولة', value: enNum(stats.commission), color: 'dark:text-amber-400 text-amber-600', bg: 'bg-amber-500/10 dark:bg-amber-500/5', border: 'border-amber-500/20 dark:border-amber-500/10', extra: stats.doneCount != null ? `${enNum(stats.doneCount)} شحنة` : undefined },
    { label: 'التوريد', value: enNum(stats.remittance), color: 'dark:text-sky-400 text-sky-600', bg: 'bg-sky-500/10 dark:bg-sky-500/5', border: 'border-sky-500/20 dark:border-sky-500/10', extra: stats.statusBreakdown },
    { label: 'الشحنات', value: enNum(stats.total), color: 'dark:text-purple-400 text-purple-600', bg: 'bg-purple-500/10 dark:bg-purple-500/5', border: 'border-purple-500/20 dark:border-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 mb-3">
      {statsConfig.map((item, idx) => (
        <div 
          key={idx} 
          className={`bg-bg-surface p-2 rounded-lg border ${item.border} ${item.bg} transition-colors duration-200 text-center`}
        >
          <div className="text-text-muted text-[0.55rem] font-bold leading-tight truncate mb-0.5">{item.label}</div>
          <div className={`text-xs font-extrabold tracking-tight ${item.color}`}>{item.value}</div>
          {(item as any).extra && <div className="text-[0.45rem] font-medium opacity-70 leading-tight truncate">{(item as any).extra}</div>}
        </div>
      ))}
    </div>
  );
}
