'use client';

import React from 'react';
import { RefreshCw, Bell, Send, Building2 } from 'lucide-react';

interface NavbarProps {
  onSync: () => void;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onOpenReminders: () => void;
  onOpenTelegram: () => void;
  pendingRemindersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSync,
  isSyncing,
  lastSyncTime,
  onOpenReminders,
  onOpenTelegram,
  pendingRemindersCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                  Realta כרמי גת
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  קרית גת
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {lastSyncTime ? `סנכרון אחרון: ${lastSyncTime}` : 'סריקה שעתית אוטומטית פעילה'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Telegram Test Button */}
            <button
              onClick={onOpenTelegram}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="הגדרות ובדיקת בוט טלגרם"
            >
              <Send className="w-4 h-4 text-sky-500" />
              <span className="hidden md:inline">טלגרם</span>
            </button>

            {/* Reminders Button */}
            <button
              onClick={onOpenReminders}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="ניהול תזכורות"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">תזכורות</span>
              {pendingRemindersCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-amber-600 rounded-full">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            {/* Sync Now Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                isSyncing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/25'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'מסנכרן...' : 'סנכרן עכשיו'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
