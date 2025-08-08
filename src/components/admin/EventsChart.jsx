import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const eventsChart = ({ events, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Correction : s'assurer que events est un tableau
  const safeEvents = Array.isArray(events) ? events : [];
  const upcomingCount = safeEvents.filter(e => e.status === 'upcoming').length;
  const activeCount = safeEvents.filter(e => e.status === 'active').length;
  const completedCount = safeEvents.filter(e => e.status === 'completed').length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        Répartition des événements par statut
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
          <div className="text-sm text-slate-500">À venir</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-slate-500">En cours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{completedCount}</div>
          <div className="text-sm text-slate-500">Terminés</div>
        </div>
      </div>
    </div>
  );
};

export default eventsChart; 