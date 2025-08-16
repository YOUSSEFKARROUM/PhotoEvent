import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import User from "../entities/User";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { 
  MoreHorizontal, 
  ShieldCheck, 
  User as UserIcon, 
  Trash2,
  Mail,
  Calendar,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "../utils";

export default function AdminUsers() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    loadUsers();
  }, [navigate, isAuthenticated, isAdmin, loading]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await User.list();
      setUsers(usersData);
    } catch (error) {
      console.error("Erreur de chargement des utilisateurs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'USER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Administrateur';
      case 'USER':
        return 'Utilisateur';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Suppression d'utilisateur
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await User.delete(userId);
        loadUsers();
      } catch (error) {
        alert("Erreur lors de la suppression de l'utilisateur.");
      }
    }
  };

  // Edition d'utilisateur (changement de rôle simple)
  const handleEditUser = async (user) => {
    const newRole = prompt("Nouveau rôle pour l'utilisateur (ADMIN ou USER) :", user.role);
    if (newRole && newRole !== user.role) {
      try {
        await User.update(user.id, { role: newRole });
        loadUsers();
      } catch (error) {
        alert("Erreur lors de la modification du rôle.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Gestion des Utilisateurs
          </h1>
          <p className="text-xl text-slate-600">
            Consulter et gérer tous les utilisateurs de la plateforme
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="grid gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleColor(user.role)}>
                    {user.role?.toUpperCase() === 'ADMIN' && <ShieldCheck className="w-3 h-3 mr-1" />}
                    {getRoleText(user.role)}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {user.role?.toUpperCase() !== 'ADMIN' && (
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
          </h3>
          <p className="text-slate-600">
            {searchTerm ? 'Essayez de modifier votre recherche.' : 'Les utilisateurs apparaîtront ici.'}
          </p>
        </div>
      )}
    </div>
  );
} 