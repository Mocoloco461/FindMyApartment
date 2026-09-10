'use client';

import React from 'react';
import {
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Car,
  Wind,
  Layers,
  Calendar,
  FileText,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import { PropertyStatus } from '@prisma/client';

export interface PropertyData {
  id: string;
  city: string;
  district: string;
  street: string | null;
  price: number | null;
  rooms: number | null;
  sqm: number | null;
  floor: number | null;
  floorsTotal: number | null;
  propertyType: string | null;
  source: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  propertyTax: number | null;
  amenities: string[];
  images: string[];
  url: string;
  status: PropertyStatus;
  followUpDate: string | null;
  notes: string | null;
  firstSeenAt: string;
}

interface PropertyCardProps {
  property: PropertyData;
  onOpenDetails: (property: PropertyData) => void;
  onStatusChange: (id: string, newStatus: PropertyStatus) => void;
}

const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; badgeClass: string; bgClass: string; borderClass: string }
> = {
  NEW: {
    label: 'חדש',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    bgClass: 'bg-blue-50/40',
    borderClass: 'border-blue-200',
  },
  RELEVANT: {
    label: 'רלוונטי',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bgClass: 'bg-emerald-50/40',
    borderClass: 'border-emerald-200',
  },
  NOT_RELEVANT: {
    label: 'לא רלוונטי',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    bgClass: 'bg-slate-50/50',
    borderClass: 'border-slate-200',
  },
  NEEDS_CHECK: {
    label: 'דרוש בדיקה',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    bgClass: 'bg-amber-50/40',
    borderClass: 'border-amber-200',
  },
  CHECK_LATER: {
    label: 'בדיקה בהמשך',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    bgClass: 'bg-purple-50/40',
    borderClass: 'border-purple-200',
  },
};

const SOURCE_COLORS: Record<string, string> = {
  Yad2: 'bg-orange-50 text-orange-700 border-orange-200',
  Madlan: 'bg-blue-50 text-blue-700 border-blue-200',
  Komo: 'bg-red-50 text-red-700 border-red-200',
  Homeless: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Facebook: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  FacebookGroup: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onOpenDetails,
  onStatusChange,
}) => {
  const currentStatus = property.status || 'NEW';
  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.NEW;
  const primaryImage = property.images && property.images.length > 0 ? property.images[0] : null;

  const hasMamad = property.amenities.some((a) => a === 'SAFE_ROOM' || a === 'MAMAD');
  const hasParking = property.amenities.includes('PARKING');
  const hasElevator = property.amenities.includes('ELEVATOR');
  const hasAC = property.amenities.some((a) => a === 'AC' || a === 'AIR_CONDITIONED');

  const sourceClass = SOURCE_COLORS[property.source || ''] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg property-card-transition overflow-hidden flex flex-col justify-between">
      {/* Top Image Preview & Badges */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onOpenDetails(property)}>
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={property.street || 'דירה בכרמי גת'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
            <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-xs">אין תמונה זמינה</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2">
          {/* Status Badge */}
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow-xs ${statusCfg.badgeClass}`}>
            {statusCfg.label}
          </span>

          {/* Source Badge */}
          {property.source && (
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border backdrop-blur-md bg-white/90 ${sourceClass}`}>
              {property.source}
            </span>
          )}
        </div>

        {/* Bottom Image Info: Price & Photo Count */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-end justify-between text-white">
          <div>
            <div className="text-xl sm:text-2xl font-black drop-shadow-md tracking-tight">
              {property.price ? `${property.price.toLocaleString()} ₪` : 'מחיר לא צוין'}
              <span className="text-xs font-normal text-white/80 mr-1">/ חודש</span>
            </div>
          </div>

          {property.images && property.images.length > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/50 backdrop-blur-xs text-white/90">
              📷 {property.images.length}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        {/* Street & Specs */}
        <div>
          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-base sm:text-lg mb-1.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">{property.street || 'כרמי גת (ללא רחוב)'}</span>
          </div>

          {/* Apartment Specs Grid */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium my-2.5">
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-semibold">
              {property.rooms ? `${property.rooms} חד׳` : 'חדרים לא צוין'}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-semibold">
              {property.sqm ? `${property.sqm} מ״ר` : 'שטח לא צוין'}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-semibold">
              {property.floor !== null ? `קומה ${property.floor}` : 'קומה לא צוין'}
              {property.floorsTotal ? ` מתוך ${property.floorsTotal}` : ''}
            </span>
          </div>

          {/* Amenities Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {hasMamad && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> ממ״ד
              </span>
            )}
            {hasParking && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Car className="w-3 h-3" /> חניה
              </span>
            )}
            {hasElevator && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Layers className="w-3 h-3" /> מעלית
              </span>
            )}
            {hasAC && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <Wind className="w-3 h-3" /> מיזוג
              </span>
            )}
          </div>

          {/* Note or Follow-up preview if exists */}
          {(property.notes || property.followUpDate) && (
            <div className="mt-3 p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1">
              {property.followUpDate && (
                <div className="flex items-center gap-1 font-semibold text-purple-700">
                  <Calendar className="w-3 h-3" />
                  <span>תאריך חזרה: {new Date(property.followUpDate).toLocaleDateString('he-IL')}</span>
                </div>
              )}
              {property.notes && (
                <div className="flex items-start gap-1 text-slate-700 truncate">
                  <FileText className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                  <span className="truncate">{property.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Status Quick Dropdown */}
          <div className="relative flex-1">
            <select
              value={currentStatus}
              onChange={(e) => onStatusChange(property.id, e.target.value as PropertyStatus)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors"
            >
              <option value="NEW">חדש</option>
              <option value="RELEVANT">רלוונטי</option>
              <option value="NEEDS_CHECK">דרוש בדיקה</option>
              <option value="CHECK_LATER">בדיקה בהמשך</option>
              <option value="NOT_RELEVANT">לא רלוונטי</option>
            </select>
          </div>

          {/* Details & Notes Button */}
          <button
            onClick={() => onOpenDetails(property)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>פרטים והערות</span>
          </button>

          {/* External Link */}
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="מעבר למודעה המקורית"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </article>
  );
};
