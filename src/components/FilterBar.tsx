'use client';

import React from 'react';
import { Search, ArrowUpDown, SlidersHorizontal, X } from 'lucide-react';

interface FilterBarProps {
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  rooms: string;
  onRoomsChange: (rooms: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  stats: Record<string, number>;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  status,
  onStatusChange,
  search,
  onSearchChange,
  rooms,
  onRoomsChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  sortBy,
  onSortByChange,
  stats,
  onResetFilters,
}) => {
  const statusTabs = [
    { id: 'ALL', label: 'הכל', count: stats.ALL || 0 },
    { id: 'NEW', label: 'חדשות', count: stats.NEW || 0 },
    { id: 'RELEVANT', label: 'רלוונטי', count: stats.RELEVANT || 0 },
    { id: 'NEEDS_CHECK', label: 'דרוש בדיקה', count: stats.NEEDS_CHECK || 0 },
    { id: 'CHECK_LATER', label: 'בדיקה בהמשך', count: stats.CHECK_LATER || 0 },
    { id: 'NOT_RELEVANT', label: 'לא רלוונטי', count: stats.NOT_RELEVANT || 0 },
  ];

  const roomOptions = [
    { id: 'ALL', label: 'הכל' },
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5', label: '5+' },
  ];

  const hasActiveFilters = search || rooms !== 'ALL' || minPrice || maxPrice || status !== 'ALL';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-6 space-y-4">
      {/* Status Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 -mx-1 px-1">
        {statusTabs.map((tab) => {
          const isSelected = status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search by Street */}
        <div className="lg:col-span-4 relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חיפוש לפי רחוב (לדוגמה: כרמי גת, נעמן)..."
            className="w-full pr-9 pl-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Rooms Filter */}
        <div className="lg:col-span-3 flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 shrink-0">חדרים:</span>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-full justify-between">
            {roomOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onRoomsChange(opt.id)}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                  rooms === opt.id
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="מחיר מ-₪"
            className="w-1/2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="עד-₪"
            className="w-1/2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Sort By */}
        <div className="lg:col-span-2 relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full pr-8 pl-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="newest">נוספו לאחרונה</option>
            <option value="price_asc">מחיר: מהנמוך לגבוה</option>
            <option value="price_desc">מחיר: מהגבוה לנמוך</option>
            <option value="rooms_desc">חדרים: מהגדול לקטן</option>
            <option value="sqm_desc">שטח: מהגדול לקטן</option>
            <option value="updated">עודכן לאחרונה</option>
          </select>
        </div>
      </div>

      {/* Clear Filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>מסננים פעילים</span>
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            איפוס מסננים
          </button>
        </div>
      )}
    </div>
  );
};
