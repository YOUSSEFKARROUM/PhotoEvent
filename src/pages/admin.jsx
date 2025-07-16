import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import User from "../entities/User";
import { Event } from "../entities/Event";
import Photo from "../entities/Photo";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { createPageUrl } from "../utils";
import { 
  Users, 
  Camera, 
  Image as ImageIcon, 
  HardDrive, 
  Shield, 
  ArrowRight,
  BarChart2,
  ListOrdered,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "../components/admin/StatCard";
import EventsChart from "../components/admin/EventsChart";
import RecentActivity from "../components/admin/RecentActivity";

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, eventss: 0, photos: 0 });
  const [eventssData, seteventssData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await User.me();
        if (!user || user.role.toUpperCase() !== 'ADMIN') {
          navigate(createPageUrl("Home"));
        } else {
          loadData();
        }
      } catch (error) {
        navigate(createPageUrl("Home"));
      }
    };
    checkAdmin();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [users, eventss, photos] = await Promise.all([
        User.list(),
        Event.list(),
        Photo.list()
      ]);
      setStats({ users: users.length, eventss: eventss.length, photos: photos.length });
      seteventssData(eventss);
    } catch (error) {
      console.error("Erreur de chargement des données admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const adminSections = [
    { title: "Gérer les Événements", icon: Camera, url: createPageUrl("Admineventss"), description: "Créer, modifier et superviser tous les événements." },
    { title: "Gérer les Utilisateurs", icon: Users, url: createPageUrl("AdminUsers"), description: "Consulter la liste des inscrits et gérer les rôles." },
    { title: "Bibliothèque de Photos", icon: ImageIcon, url: createPageUrl("AdminPhotos"), description: "Modérer et consulter toutes les photos uploadées." }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Tableau de Bord Administrateur
          </h1>
          <p className="text-xl text-slate-600">
            Vue d'overview de l'activité de la plateforme Photoevents.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          <Shield className="w-4 h-4" />
          <span>Accès Administrateur</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Utilisateurs" value={stats.users} icon={Users} color="from-blue-500 to-cyan-500" isLoading={isLoading} />
        <StatCard title="Événements" value={stats.eventss} icon={Camera} color="from-purple-500 to-pink-500" isLoading={isLoading} />
        <StatCard title="Photos" value={stats.photos} icon={ImageIcon} color="from-green-500 to-emerald-500" isLoading={isLoading} />
        <StatCard title="Stockage (simulé)" value="25.6 GB" icon={HardDrive} color="from-orange-500 to-red-500" isLoading={isLoading} />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Analytics Chart */}
        <Card className="lg:col-span-2 border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              Activité des événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventsChart eventss={eventssData} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-blue-600" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminSections.map(section => (
              <motion.div
                key={section.title}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link to={section.url}>
                  <div className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{section.title}</h4>
                      <p className="text-sm text-slate-500">{section.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
} 