'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: data.message || 'הודעת בדיקה נשלחה בהצלחה לטלגרם!' });
      } else {
        setResult({ success: false, message: data.error || 'שגיאה בשליחת הודעת הבדיקה' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'שגיאת רשת בבדיקה' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                הגדרות והתראות טלגרם
              </h2>
              <p className="text-xs text-slate-500">
                בדיקת חיבור וקבלת התראות בזמן אמת
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-sky-50/60 border border-sky-200/70 rounded-2xl text-xs sm:text-sm text-sky-900 space-y-2">
            <p className="font-semibold">איך עובדות ההתראות במערכת?</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
              <li><b>דירה חדשה:</b> בכל סריקה שעתית, כל דירה שלא נראתה בעבר תשלח בהתראה מיידית.</li>
              <li><b>תזכורת חזרה לדירה:</b> אם סימנת "בדיקה בהמשך" ובחרת תאריך, תקפוץ לך תזכורת בטלגרם.</li>
              <li><b>תזכורת עצמאית:</b> תזכורות שנקבעו בחלונית התזכורות יישלחו בתאריך היעד.</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">הגדרת משתני סביבה בקובץ <code>.env</code>:</p>
            <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
              TELEGRAM_BOT_TOKEN="הטוקן_של_הבוט"<br />
              TELEGRAM_CHAT_ID="מזהה_הצאט_שלך"
            </p>
          </div>

          {result && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs sm:text-sm ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{result.success ? 'הבדיקה הצליחה!' : 'שגיאה בחיבור'}</p>
                <p className="text-xs opacity-90">{result.message}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleTest}
            disabled={isTesting}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm shadow-sky-500/25 cursor-pointer disabled:bg-sky-400"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'בודק חיבור מול Telegram...' : 'שלח הודעת בדיקה עכשיו לטלגרם'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
