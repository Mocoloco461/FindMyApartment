'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Car,
  Layers,
  Wind,
  Home,
  FileText,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { PropertyData } from './PropertyCard';
import { PropertyStatus } from '@prisma/client';

interface PropertyModalProps {
  property: PropertyData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PropertyData>) => Promise<void>;
}

const AMENITY_HEBREW_MAP: Record<string, string> = {
  PARKING: 'חניה פרטית',
  ELEVATOR: 'מעלית בבניין',
  AC: 'מיזוג אוויר',
  SAFE_ROOM: 'ממ״ד (מרחב מוגן דירתי)',
  MAMAD: 'ממ״ד (מרחב מוגן דירתי)',
  FURNISHED: 'ריהוט קיים',
  ACCESSIBLE: 'גישה לנכים',
  BOILER: 'דוד שמש',
  BALCONY: 'מרפסת שמש',
  STORAGE: 'מחסן',
  BARS: 'סורגים',
  SUN_TERRACE: 'מרפסת שמש',
  RENOVATED: 'משופצת',
  PETS_ALLOWED: 'חיות מחמד מותרות',
  AIR_CONDITIONED: 'ממוזגת',
};

export const PropertyModal: React.FC<PropertyModalProps> = ({
  property,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState<PropertyStatus>('NEW');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (property) {
      setStatus(property.status || 'NEW');
      setNotes(property.notes || '');
      setCurrentImageIndex(0);

      if (property.followUpDate) {
        // Convert to YYYY-MM-DDTHH:MM for datetime-local
        const d = new Date(property.followUpDate);
        const pad = (n: number) => (n < 10 ? `0${n}` : n);
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setFollowUpDate(formatted);
      } else {
        setFollowUpDate('');
      }
      setSaveSuccess(false);
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const images = property.images || [];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdate(property.id, {
        status,
        notes: notes.trim(),
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update property', err);
    } finally {
      setIsSaving(false);
    }
  };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate">
                {property.street || 'כרמי גת, קרית גת'}
              </h2>
              <p className="text-xs text-slate-500">
                מזהה מודעה: {property.id} {property.source ? `· מקור: ${property.source}` : ''}
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
          {/* Image Carousel */}
          {images.length > 0 ? (
            <div className="relative aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden group shadow-inner">
              <img
                src={images[currentImageIndex]}
                alt={property.street || 'תמונת הדירה'}
                className="w-full h-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-44 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
              אין תמונות זמינות למודעה זו
            </div>
          )}

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-xs text-slate-500 block">מחיר חודשי</span>
              <span className="text-lg sm:text-xl font-bold text-slate-900">
                {property.price ? `${property.price.toLocaleString()} ₪` : 'לא צוין'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-xs text-slate-500 block">מספר חדרים</span>
              <span className="text-lg sm:text-xl font-bold text-slate-900">
                {property.rooms ? `${property.rooms} חד׳` : 'לא צוין'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-xs text-slate-500 block">שטח</span>
              <span className="text-lg sm:text-xl font-bold text-slate-900">
                {property.sqm ? `${property.sqm} מ״ר` : 'לא צוין'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-xs text-slate-500 block">קומה</span>
              <span className="text-lg sm:text-xl font-bold text-slate-900">
                {property.floor !== null ? `קומה ${property.floor}` : 'לא צוין'}
                {property.floorsTotal ? ` / ${property.floorsTotal}` : ''}
              </span>
            </div>
          </div>

          {/* Amenities Badges */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              מאפיינים ותוספות בדירה
            </h3>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span
                    key={a}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5"
                  >
                    {a === 'SAFE_ROOM' || a === 'MAMAD' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : a === 'PARKING' ? (
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                    ) : a === 'ELEVATOR' ? (
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    ) : a === 'AC' ? (
                      <Wind className="w-3.5 h-3.5 text-sky-600" />
                    ) : null}
                    {AMENITY_HEBREW_MAP[a] || a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">לא צוינו מאפיינים במודעה</p>
            )}
          </div>

          {/* Status & Follow-Up Section */}
          <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              ניהול סטטוס ותאריך חזרה למעקב
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  סטטוס דירה:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                  className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="NEW">חדש</option>
                  <option value="RELEVANT">רלוונטי</option>
                  <option value="NEEDS_CHECK">דרוש בדיקה</option>
                  <option value="CHECK_LATER">אפשרות בדיקה בהמשך</option>
                  <option value="NOT_RELEVANT">לא רלוונטי</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1 flex items-center justify-between">
                  <span>תאריך חזרה לבדיקה:</span>
                  {followUpDate && (
                    <button
                      onClick={() => setFollowUpDate('')}
                      className="text-rose-600 hover:text-rose-700 text-[11px] cursor-pointer"
                    >
                      נקה תאריך
                    </button>
                  )}
                </label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full text-sm p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            {followUpDate && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50 text-purple-800 text-xs font-medium border border-purple-200/70">
                <Bell className="w-4 h-4 shrink-0 text-purple-600" />
                <span>
                  בתאריך זה תשלח אליך הודעת תזכורת אוטומטית בטלגרם עם פרטי הדירה וההערות שלך!
                </span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              הערות אישיות לדירה זו
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="כתוב כאן כל פרט: דיברתי עם המתווך, כניסה מיידית, דורשים ערבות בנקאית, לראות ביום שלישי..."
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-slate-50"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
            <span>צפה במודעה המקורית</span>
          </a>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/25'
            }`}
          >
            {isSaving ? (
              <span>שומר...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>נשמר בהצלחה!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>שמור שינויים</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
