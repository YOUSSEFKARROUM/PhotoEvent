import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Event, User, Photo } from "@/entities/all";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  MapPin,
  Camera
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/lib/utils";

export default function Adminevents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [eventss, seteventss] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newevents, setNewevents] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    photographerEmail: "",
    coverImageUrl: "",
    status: "upcoming"
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [editeventsId, setEditeventsId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Ouvre le formulaire si ?add=1 dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "1") {
      setShowCreateForm(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate(createPageUrl("Home"));
      return;
    }
    loadeventss();
  }, [navigate, isAuthenticated, isAdmin, loading]);

  const loadeventss = async () => {
    setIsLoading(true);
    try {
      const eventssData = await Event.list();
      seteventss(eventssData);
    } catch (error) {
      console.error("Erreur de chargement des événements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming':
        return 'À venir';
      case 'active':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  };

  const handleCreateevents = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      // Création de l'événement sans image d'abord
      const eventsToSend = {
        name: newevents.name,
        description: newevents.description,
        date: newevents.date,
        location: newevents.location,
        photographerEmail: newevents.photographerEmail,
        coverImageUrl: newevents.coverImageUrl
      };
      let created = await Event.create(eventsToSend);
      // Mettre à jour le statut à 'ACTIVE' pour permettre l'upload de photo
      created = (await Event.update(created.id || created._id, { ...created, status: 'ACTIVE' })).events || created;
      // Si une image a été sélectionnée, l'uploader et mettre à jour l'événement
      if (imageFile) {
        const photoRes = await Photo.create(imageFile, created.id || created._id, 'Image de couverture');
        if (photoRes && photoRes.photo && photoRes.photo.url) {
          // Mettre à jour l'événement avec l'URL de la photo
          await Event.update(created.id || created._id, {
            ...created,
            coverImageUrl: photoRes.photo.url
          });
        }
      }
      seteventss(prev => [created, ...prev]);
      setShowCreateForm(false);
      setNewevents({
        name: "",
        description: "",
        date: "",
        location: "",
        photographerEmail: "",
        coverImageUrl: "",
        status: "upcoming"
      });
      setImageFile(null);
    } catch (error) {
      setErrorMsg(error.message || "Erreur lors de la création de l'événement");
      console.error("Erreur lors de la création:", error);
    }
  };

  // Handler pour supprimer un événement
  const handleDeleteevents = async (eventsId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet événement ?')) return;
    try {
      await Event.delete(eventsId);
      seteventss(prev => prev.filter(ev => (ev.id || ev._id) !== eventsId));
    } catch (error) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  // Handler pour éditer un événement
  const handleEditevents = (events) => {
    setEditeventsId(events.id || events._id);
    setShowCreateForm(true);
    setNewevents({
      name: events.name || '',
      description: events.description || '',
      date: events.date ? events.date.slice(0, 10) : '',
      location: events.location || '',
      photographerEmail: events.photographerEmail || '',
      coverImageUrl: events.coverImageUrl || '',
      status: events.status || 'upcoming'
    });
  };

  // Handler pour voir les photos d'un événement
  const handlePhotos = (eventsId) => {
    navigate(createPageUrl("AdminPhotos", { events: eventsId }));
  };

  const handleSubmitevents = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (editeventsId) {
        // Edition d'un événement existant
        let updated = await Event.update(editeventsId, {
          name: newevents.name,
          description: newevents.description,
          date: newevents.date,
          location: newevents.location,
          photographerEmail: newevents.photographerEmail,
          coverImageUrl: newevents.coverImageUrl,
          status: newevents.status
        });
        // Si une nouvelle image a été sélectionnée, l'uploader et mettre à jour l'événement
        if (imageFile) {
          const eventId = String(editeventsId);
          console.log('ID envoyé à Photo.create:', eventId, typeof eventId);
          if (!eventId) {
            setErrorMsg("Erreur interne : l'ID de l'événement n'a pas été généré.");
            return;
          }
          const photoRes = await Photo.create(imageFile, eventId, 'Image de couverture');
          if (photoRes && photoRes.photo && photoRes.photo.url) {
            updated = await Event.update(editeventsId, {
              ...updated,
              coverImageUrl: photoRes.photo.url
            });
          }
        }
        seteventss(prev => prev.map(ev => (ev.id === editeventsId || ev._id === editeventsId) ? updated : ev));
        setEditeventsId(null);
      } else {
        // Création d'un nouvel événement
        const eventsToSend = {
          name: newevents.name,
          description: newevents.description,
          date: newevents.date,
          location: newevents.location,
          photographerEmail: newevents.photographerEmail,
          coverImageUrl: newevents.coverImageUrl,
          status: newevents.status
        };
        let created = await Event.create(eventsToSend);
        console.log('DEBUG Event.create returned:', created);
        if (imageFile) {
          const eventId = String(created.id || created._id);
          console.log('ID envoyé à Photo.create:', eventId, typeof eventId);
          if (!eventId) {
            setErrorMsg("Erreur interne : l'ID de l'événement n'a pas été généré.");
            return;
          }
          const photoRes = await Photo.create(imageFile, eventId, 'Image de couverture');
          if (photoRes && photoRes.photo && photoRes.photo.url) {
            created = await Event.update(eventId, {
              ...created,
              coverImageUrl: photoRes.photo.url
            });
          }
        }
        seteventss(prev => [created, ...prev]);
      }
      setShowCreateForm(false);
      setNewevents({
        name: "",
        description: "",
        date: "",
        location: "",
        photographerEmail: "",
        coverImageUrl: "",
        status: "upcoming"
      });
      setImageFile(null);
      setErrorMsg("");
    } catch (error) {
      setErrorMsg(error.message || "Erreur lors de la création/mise à jour de l'événement");
      console.error("Erreur lors de la création/mise à jour:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Button 
            variant="outline"
            onClick={() => navigate(createPageUrl("Admin"))}
            className="mr-2"
          >
            Retour
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Gestion des Événements
            </h1>
            <p className="text-xl text-slate-600">
              Créer, modifier et superviser tous les événements
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer un événement
        </Button>
      </div>

      {/* Create events Form */}
      {showCreateForm && (
        <Card className="mb-8 border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>{editeventsId ? "Modifier l'événement" : "Créer un nouvel événement"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitevents} className="space-y-4">
              {errorMsg && (
                <div className="text-red-600 font-semibold text-sm mb-2">{errorMsg}</div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de l'événement</Label>
                  <Input
                    id="name"
                    value={newevents.name}
                    onChange={(e) => setNewevents(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newevents.date}
                    onChange={(e) => setNewevents(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={newevents.status}
                    onValueChange={value => setNewevents(prev => ({ ...prev, status: value }))}
                  >
                    <SelectItem value="upcoming">À venir</SelectItem>
                    <SelectItem value="active">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="imageFile">Image de couverture (upload)</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                />
                {newevents.coverImageUrl && (
                  <img src={newevents.coverImageUrl} alt="Aperçu" className="mt-2 w-32 h-20 object-cover rounded" />
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newevents.description}
                  onChange={(e) => setNewevents(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={newevents.location}
                    onChange={(e) => setNewevents(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="photographerEmail">Email photographe</Label>
                  <Input
                    id="photographerEmail"
                    type="email"
                    value={newevents.photographerEmail}
                    onChange={(e) => setNewevents(prev => ({ ...prev, photographerEmail: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editeventsId ? "Mettre à jour" : "Créer l'événement"}</Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => { setShowCreateForm(false); setEditeventsId(null); }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* eventss List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventss.map((events) => (
          <Card key={events.id || events._id} className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{events.name}</CardTitle>
                <Badge className={getStatusColor(events.status)}>
                  {getStatusText(events.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">{events.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(events.date), 'dd MMMM yyyy', { locale: fr })}
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  {events.location}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditevents(events)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePhotos(events.id || events._id)}>
                  <Camera className="w-4 h-4 mr-1" />
                  Photos
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteevents(events.id || events._id)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {eventss.length === 0 && (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Aucun événement créé
          </h3>
          <p className="text-slate-600">
            Commencez par créer votre premier événement.
          </p>
        </div>
      )}
    </div>
  );
} 