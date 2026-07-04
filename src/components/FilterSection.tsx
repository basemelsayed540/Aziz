import React from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';

interface FilterOptions {
  daily: string[];
  zone: string[];
  sender: string[];
}

interface FiltersProps {
  filters: {
    status: string;
    search: string;
    daily: string;
    zone: string;
    sender: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  filterOptions?: FilterOptions;
  filterCounts?: Record<string, Record<string, number>>;
  actionsHidden?: boolean;
  onToggleActions?: () => void;
}

const statuses = ['الكل', 'المفضلة', 'بحاجة لمتابعة', 'قيد التوصيل', 'تم', 'مؤجل', 'الغاء', 'شحن', 'تعديل سعر'];

const filterChips = [
  { key: 'daily' as const, label: 'اليومية', icon: '📅' },
  { key: 'status' as const, label: 'الحالة', icon: '📋' },
  { key: 'zone' as const, label: 'الزون', icon: '📍' },
  { key: 'sender' as const, label: 'الراسل', icon: '🏢' },
];

export function FilterSection({ filters, setFilters, filterOptions, filterCounts, actionsHidden, onToggleActions }: FiltersProps) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex gap-1.5 items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
            <Search className="w-5 h-5 text-text-muted" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
            className="w-full bg-bg-surface text-text-main border border-border-strong rounded-xl pr-11 pl-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right"
            placeholder="البحث باسم العميل، الهاتف، الهاتف البديل أو كود الشحنة..."
          />
        </div>
        {onToggleActions && (
          <button 
            onClick={onToggleActions}
            className="p-3 bg-bg-surface border border-border-strong rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-text-main transition-colors cursor-pointer"
            title={actionsHidden ? "إظهار الأزرار" : "إخفاء الأزرار"}
          >
            {actionsHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {filterChips.map(({ key, label, icon }) => {
          const options = key === 'status'
            ? statuses
            : key === 'daily'
              ? filterOptions?.daily || []
              : key === 'zone'
                ? filterOptions?.zone || []
                : filterOptions?.sender || [];

          const currentVal = filters[key];
          const isActive = !!currentVal && currentVal !== 'الكل';

          return (
            <select
              key={key}
              value={currentVal}
              onChange={(e) => setFilters((prev: any) => ({ ...prev, [key]: e.target.value }))}
              className={`text-center px-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer appearance-none ${
                isActive
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-bg-surface border-border-subtle text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              dir="rtl"
            >
              <option value="" className="bg-bg-surface text-text-muted">{icon} {label}</option>
              {options.map(opt => {
                const cnt = filterCounts?.[key]?.[opt];
                return (
                  <option key={opt} value={opt} className="bg-bg-surface text-text-main">
                    {opt}{cnt != null ? ` (${cnt})` : ''}
                  </option>
                );
              })}
            </select>
          );
        })}
      </div>
    </div>
  );
}
