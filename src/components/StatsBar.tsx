'use client';

import React from 'react';
import { Home, Sparkles, CheckCircle, HelpCircle, Clock, XCircle } from 'lucide-react';

interface StatsBarProps {
  stats: {
    ALL: number;
    NEW: number;
    RELEVANT: number;
    NOT_RELEVANT: number;
    NEEDS_CHECK: number;
    CHECK_LATER: number;
  };
  currentStatus: string;
  onSelectStatus: (status: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, currentStatus, onSelectStatus }) => {
  const cards = [
    {
      id: 'ALL',
      label: 'כל הדירות',
      count: stats.ALL || 0,
      icon: Home,
      color: 'text-slate-700 bg-slate-100',
      activeColor: 'ring-2 ring-slate-800 bg-slate-50',
    },
    {
      id: 'NEW',
      label: 'חדשות',
      count: stats.NEW || 0,
      icon: Sparkles,
      color: 'text-blue-700 bg-blue-50',
      activeColor: 'ring-2 ring-blue-600 bg-blue-50/80',
    },
    {
      id: 'RELEVANT',
      label: 'רלוונטי',
      count: stats.RELEVANT || 0,
      icon: CheckCircle,
      color: 'text-emerald-700 bg-emerald-50',
      activeColor: 'ring-2 ring-emerald-600 bg-emerald-50/80',
    },
    {
      id: 'NEEDS_CHECK',
      label: 'דרוש בדיקה',
      count: stats.NEEDS_CHECK || 0,
      icon: HelpCircle,
      color: 'text-amber-700 bg-amber-50',
      activeColor: 'ring-2 ring-amber-600 bg-amber-50/80',
    },
    {
      id: 'CHECK_LATER',
      label: 'בדיקה בהמשך',
      count: stats.CHECK_LATER || 0,
      icon: Clock,
      color: 'text-purple-700 bg-purple-50',
      activeColor: 'ring-2 ring-purple-600 bg-purple-50/80',
    },
    {
      id: 'NOT_RELEVANT',
      label: 'לא רלוונטי',
      count: stats.NOT_RELEVANT || 0,
      icon: XCircle,
      color: 'text-rose-700 bg-rose-50',
      activeColor: 'ring-2 ring-rose-600 bg-rose-50/80',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 my-4 sm:my-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = currentStatus === c.id;

        return (
          <button
            key={c.id}
            onClick={() => onSelectStatus(c.id)}
            className={`p-3 rounded-xl border border-slate-200/80 bg-white transition-all text-right cursor-pointer flex flex-col justify-between ${
              isActive ? `${c.activeColor} shadow-sm scale-[1.02]` : 'hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 truncate">{c.label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{c.count}</div>
          </button>
        );
      })}
    </div>
  );
};
