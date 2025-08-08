import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, ArrowLeft, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getImageUrl(photoUrl) {
  if (!photoUrl) return "/placeholder.jpg";
  if (photoUrl.startsWith("http")) return photoUrl;
  return `${API_BASE_URL}/uploads/photos/${photoUrl}`;
}

export default function EventPhotos() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PHOTOS_PER_PAGE = 20;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Fetch event details
        const eventRes = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error("Événement introuvable");
        const eventData = await eventRes.json();
        setEvent(eventData);

        // Fetch photos for this event
        const photosRes = await fetch(`${API_BASE_URL}/api/photos/event?eventId=${eventId}`);
        if (!photosRes.ok) throw new Error("Erreur lors du chargement des photos");
        const photosData = await photosRes.json();
        setPhotos(photosData);
        setFilteredPhotos(photosData);
      } catch (err) {
        setError(err.message || "Erreur inattendue");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [eventId]);

  useEffect(() => {
    if (!search) {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(
        photos.filter(
          (p) =>
            (p.filename && p.filename.toLowerCase().includes(search.toLowerCase())) ||
            (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())))
        )
      );
    }
    setPage(1);
  }, [search, photos]);

  const paginatedPhotos = filteredPhotos.slice(
    (page - 1) * PHOTOS_PER_PAGE,
    page * PHOTOS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE);

  const handleDownload = (photo) => {
    const url = getImageUrl(photo.url || photo.filename);
    const link = document.createElement("a");
    link.href = url;
    link.download = photo.filename || "photo.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(12)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="aspect-square bg-slate-200 rounded-xl"></div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Erreur</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Button onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/events">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {event.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span>{format(new Date(event.date), "d MMMM yyyy", { locale: fr })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>{event.photographer_email || event.photographerEmail}</span>
            </div>
            {event.status && (
              <Badge className="bg-blue-100 text-blue-800 text-xs font-semibold">
                {event.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg mb-8">
          <CardContent className="p-6">
            <p className="text-slate-700">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Rechercher dans les photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par nom de fichier ou tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos Count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-slate-600" />
          <span className="text-slate-700 font-medium">
            {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? "s" : ""}
            {search && ` trouvée${filteredPhotos.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {search ? "Aucune photo trouvée" : "Aucune photo disponible"}
          </h3>
          <p className="text-slate-500">
            {search
              ? "Essayez avec d'autres termes de recherche."
              : "Les photos de cet événement apparaîtront ici une fois uploadées."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedPhotos.map((photo) => (
              <Card key={photo._id || photo.id} className="overflow-hidden">
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={getImageUrl(photo.url || photo.filename)}
                    alt={photo.filename || "Photo"}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/placeholder.jpg")}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute bottom-2 right-2"
                    onClick={() => handleDownload(photo)}
                  >
                    <Download className="w-5 h-5 text-blue-600" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="text-sm text-slate-700 truncate">{photo.filename}</div>
                  <div className="text-xs text-slate-400">
                    {photo.createdAt
                      ? format(new Date(photo.createdAt), "dd MMM yyyy", { locale: fr })
                      : ""}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                variant="outline"
              >
                Précédent
              </Button>
              <span className="px-4 py-2 text-slate-700">
                Page {page} / {totalPages}
              </span>
              <Button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                variant="outline"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}