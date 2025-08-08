import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  MapPin,
  Users,
  Camera,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

export default function EventSelector({ events, onEventSelected }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-800 border-blue-200";
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "upcoming": return "À venir";
      case "active": return "En cours";
      case "completed": return "Terminé";
      default: return "Inconnu";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-4xl mx-auto border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Sélectionnez un Événement
          </CardTitle>
          <p className="text-slate-600">
            Choisissez l'événement dans lequel vous souhaitez rechercher vos photos.
          </p>
        </CardHeader>

        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Aucun événement disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <motion.div
                  key={event._id || event.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="group cursor-pointer border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {event.name}
                        </h3>
                        <Badge className={`${getStatusColor(event.status)} border text-xs`}>
                          {getStatusText(event.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(event.date), "d MMMM yyyy", { locale: fr })}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="truncate">{event.photographer_email}</span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <Button
                        onClick={() => onEventSelected(event._id || event.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 group-hover:shadow-md transition-all duration-300"
                      >
                        Sélectionner cet événement
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 