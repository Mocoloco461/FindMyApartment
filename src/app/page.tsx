'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar } from '@/components/FilterBar';
import { PropertyCard, PropertyData } from '@/components/PropertyCard';
import { PropertyModal } from '@/components/PropertyModal';
import { RemindersModal, ReminderItem } from '@/components/RemindersModal';
import { TelegramModal } from '@/components/TelegramModal';
import { PropertyStatus } from '@prisma/client';
import { Building2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({
    ALL: 0,
    NEW: 0,
    RELEVANT: 0,
    NOT_RELEVANT: 0,
    NEEDS_CHECK: 0,
    CHECK_LATER: 0,
  });
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [roomsFilter, setRoomsFilter] = useState('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // UI / Modal States
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch properties from API
  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (roomsFilter !== 'ALL') params.set('rooms', roomsFilter);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sortBy) params.set('sortBy', sortBy);

      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.properties || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load properties', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, roomsFilter, minPrice, maxPrice, sortBy]);

  // Fetch reminders
  const loadReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders');
      const data = await res.json();
      if (data.success) {
        setReminders(data.reminders || []);
      }
    } catch (err) {
      console.error('Failed to load reminders', err);
    }
  }, []);

  // Fetch latest sync info
  const loadSyncStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.success && data.latestSync) {
        const d = new Date(data.latestSync.startedAt);
        setLastSyncTime(
          new Intl.DateTimeFormat('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          }).format(d)
        );
      }
    } catch (err) {
      console.error('Failed to load sync stats', err);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadReminders();
    loadSyncStats();
  }, [loadReminders, loadSyncStats]);

  // Manual Trigger Sync
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        const added = data.sync?.newAdded || 0;
        const total = data.sync?.totalFound || 0;
        setSyncToast({
          message: `הסנכרון הושלם בהצלחה! נשלפו ${total} דירות (${added} חדשות נוספו).`,
          type: 'success',
        });
        setLastSyncTime(
          new Intl.DateTimeFormat('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          }).format(new Date())
        );
        await Promise.all([loadProperties(), loadReminders()]);
      } else {
        setSyncToast({
          message: data.error || 'שגיאה במהלך הסנכרון',
          type: 'error',
        });
      }
    } catch (err: any) {
      setSyncToast({
        message: err.message || 'שגיאת רשת בסנכרון',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  // Quick Status change on card
  const handleStatusChange = async (id: string, newStatus: PropertyStatus) => {
    // Optimistic update
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );

    try {
      await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadProperties();
    } catch (err) {
      console.error('Failed to update status', err);
      loadProperties();
    }
  };

  // Update property details from modal
  const handlePropertyUpdate = async (id: string, updates: Partial<PropertyData>) => {
    // Optimistic update
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    if (selectedProperty && selectedProperty.id === id) {
      setSelectedProperty((prev) => (prev ? { ...prev, ...updates } : null));
    }

    const res = await fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error('Failed to update property');
    }

    loadProperties();
  };

  // Reminder Handlers
  const handleCreateReminder = async (title: string, note: string, dueDate: string) => {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, note, dueDate }),
    });

    if (!res.ok) {
      throw new Error('Failed to create reminder');
    }

    loadReminders();
  };

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isCompleted } : r))
    );

    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isCompleted }),
    });

    loadReminders();
  };

  const handleDeleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
    loadReminders();
  };

  const handleOpenDetails = (prop: PropertyData) => {
    setSelectedProperty(prop);
    setIsPropertyModalOpen(true);
  };

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setSearchQuery('');
    setRoomsFilter('ALL');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const pendingRemindersCount = reminders.filter((r) => !r.isCompleted).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <Navbar
        onSync={handleSync}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onOpenReminders={() => setIsRemindersModalOpen(true)}
        onOpenTelegram={() => setIsTelegramModalOpen(true)}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full">
        {/* Sync Toast Notification */}
        {syncToast && (
          <div
            className={`mb-4 p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-medium shadow-sm transition-all animate-bounce-once ${
              syncToast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span>{syncToast.message}</span>
            <button
              onClick={() => setSyncToast(null)}
              className="text-xs font-bold underline mr-2 cursor-pointer"
            >
              סגור
            </button>
          </div>
        )}

        {/* Stats Overview */}
        <StatsBar
          stats={{
            ALL: stats.ALL || 0,
            NEW: stats.NEW || 0,
            RELEVANT: stats.RELEVANT || 0,
            NOT_RELEVANT: stats.NOT_RELEVANT || 0,
            NEEDS_CHECK: stats.NEEDS_CHECK || 0,
            CHECK_LATER: stats.CHECK_LATER || 0,
          }}
          currentStatus={statusFilter}
          onSelectStatus={setStatusFilter}
        />

        {/* Filters and Search Bar */}
        <FilterBar
          status={statusFilter}
          onStatusChange={setStatusFilter}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          rooms={roomsFilter}
          onRoomsChange={setRoomsFilter}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          stats={stats}
          onResetFilters={handleResetFilters}
        />

        {/* Properties Grid / Empty State */}
        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">טוען דירות בכרמי גת...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-lg mx-auto my-8">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">לא נמצאו דירות התואמות לסינון</h3>
            <p className="text-xs text-slate-500 mb-4">
              נסה לשנות את הסינון, לנקות את מילות החיפוש, או לבצע סנכרון חדש מהאתר
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
              >
                איפוס כל המסננים
              </button>
              <button
                onClick={handleSync}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                סנכרן עכשיו מהאתר
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {properties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                onOpenDetails={handleOpenDetails}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <PropertyModal
        property={selectedProperty}
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onUpdate={handlePropertyUpdate}
      />

      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={reminders}
        onCreateReminder={handleCreateReminder}
        onToggleComplete={handleToggleComplete}
        onDeleteReminder={handleDeleteReminder}
      />

      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </div>
  );
}
