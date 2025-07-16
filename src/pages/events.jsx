import React, { useState, useEffect } from "react";
import { Event } from "../entities/Event";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  MapPin, 
  Camera, 
  Search, 
  Users,
  Clock,
  ArrowRight,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Events() {
  const [events, setevents] = useState([]);
  const [filteredevents, setFilteredevents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadevents();
  }, []);

  useEffect(() => {
    filterevents();
  }, [events, searchTerm]);

  const loadevents = async () => {
    try {
      const eventsList = await Event.list("-date");
      setevents(eventsList);
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterevents = () => {
    if (!searchTerm) {
      setFilteredevents(events);
    } else {
      const filtered = events.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredevents(filtered);
    }
  };

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Événements Disponibles
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
          Découvrez les événements photographiés et retrouvez vos souvenirs grâce à notre 
          technologie de reconnaissance faciale avancée.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Rechercher un événement ou un lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 text-lg rounded-xl border-2 border-slate-200 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-12 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Comment retrouver vos photos ?
              </h3>
              <div className="text-slate-700 space-y-2">
                <p>1. <strong>Sélectionnez un événement</strong> auquel vous avez participé</p>
                <p>2. <strong>Uploadez un selfie</strong> pour que notre IA vous reconnaisse</p>
                <p>3. <strong>Téléchargez vos photos</strong> automatiquement identifiées</p>
              </div>
              <div className="mt-4">
                <Link to={createPageUrl("MyPhotos")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Commencer la recherche
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* events Grid */}
      {filteredevents.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {searchTerm ? "Aucun événement trouvé" : "Aucun événement disponible"}
          </h3>
          <p className="text-slate-500">
            {searchTerm 
              ? "Essayez avec d'autres termes de recherche." 
              : "Les événements apparaîtront ici une fois créés par les photographes."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredevents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2">
                {/* events Image */}
                <div className="relative h-48 overflow-hidden">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-white/70" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className={`${getStatusColor(event.status)} border font-medium`}>
                      {getStatusText(event.status)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {event.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {format(new Date(event.date), "d MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        Par {event.photographer_email}
                      </span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl group-hover:shadow-lg transition-all duration-300"
                    onClick={() => navigate(createPageUrl(`MyPhotos?selected_event=${event.id}`))}
                  >
                    Chercher mes photos
                    <Search className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}