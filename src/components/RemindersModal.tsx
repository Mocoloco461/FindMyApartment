'use client';

import React, { useState } from 'react';
import { X, Bell, Plus, Trash2, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

export interface ReminderItem {
  id: string;
  title: string;
  note: string | null;
  dueDate: string;
  isCompleted: boolean;
  isNotified: boolean;
  createdAt: string;
}

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ReminderItem[];
  onCreateReminder: (title: string, note: string, dueDate: string) => Promise<void>;
  onToggleComplete: (id: string, isCompleted: boolean) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onCreateReminder,
  onToggleComplete,
  onDeleteReminder,
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('אנא הזן כותרת לתזכורת');
      return;
    }
    if (!dueDate) {
      setError('אנא בחר תאריך ושעה');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateReminder(title.trim(), note.trim(), new Date(dueDate).toISOString());
      setTitle('');
      setNote('');
      setDueDate('');
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת התזכורת');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                ניהול תזכורות עצמאיות
              </h2>
              <p className="text-xs text-slate-500">
                קבע תאריך והערה — הודעה תקפוץ ישירות לטלגרם במועד המבוקש
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

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Add New Reminder Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              הוספת תזכורת חדשה
            </h3>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  נושא / כותרת התזכורת:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="לדוגמה: להתקשר לבעל הדירה ברחוב נופך"
                  className="w-full text-sm p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  תאריך ושעה לקפיצת ההודעה:
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                הערה מוצמדת לתזכורת (תישלח בטלגרם):
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="כתוב כאן מה לבדוק או לשאול בתאריך זה..."
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? 'מוסיף...' : 'הוסף תזכורת למערכת'}
            </button>
          </form>

          {/* Reminders List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              רשימת התזכורות שלך ({reminders.length})
            </h3>

            {reminders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                אין תזכורות מתוזמנות כרגע. צור תזכורת חדשה למעלה!
              </div>
            ) : (
              <div className="space-y-2.5">
                {reminders.map((rem) => {
                  const dateStr = new Intl.DateTimeFormat('he-IL', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Jerusalem',
                  }).format(new Date(rem.dueDate));

                  const isPast = new Date(rem.dueDate) < new Date();

                  return (
                    <div
                      key={rem.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        rem.isCompleted
                          ? 'bg-slate-50/60 border-slate-200 opacity-60'
                          : isPast
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-white border-slate-200/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => onToggleComplete(rem.id, !rem.isCompleted)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                            rem.isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {rem.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <h4
                            className={`text-sm font-bold text-slate-900 ${
                              rem.isCompleted ? 'line-through text-slate-500' : ''
                            }`}
                          >
                            {rem.title}
                          </h4>

                          {rem.note && (
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">{rem.note}</p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3" />
                              {dateStr}
                            </span>
                            {rem.isNotified && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-semibold">
                                הודעה נשלחה בטלגרם
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteReminder(rem.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="מחק תזכורת"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
