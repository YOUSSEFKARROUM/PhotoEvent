import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Image, CalendarPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'user_registered',
      title: 'Nouvel utilisateur inscrit',
      description: 'Marie Dupont s\'est inscrite sur la plateforme',
      time: 'Il y a 2 heures',
      icon: UserPlus,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'photo_uploaded',
      title: 'Nouvelle photo uploadée',
      description: 'Photo ajoutée à l\'événement "Mariage de Sophie et Thomas"',
      time: 'Il y a 4 heures',
      icon: Image,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'events_created',
      title: 'Nouvel événement créé',
      description: 'Événement "Conférence Tech 2024" créé',
      time: 'Il y a 1 jour',
      icon: CalendarPlus,
      color: 'text-purple-600'
    }
  ];

  return (
    <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center ${activity.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-500">{activity.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 