import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Camera, Image, Users, Home, Menu, X, Shield, LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./components/ui/sheet";
import { useAuth } from "./contexts/AuthContext";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navigationItems = [
    {
      title: "Accueil",
      url: createPageUrl("Home"),
      icon: Home,
    },
    {
      title: "Événements",
      url: createPageUrl("events"),
      icon: Camera,
    },
  ];

  // Ajouter les éléments de navigation conditionnels
  if (isAuthenticated) {
    navigationItems.push(
      {
        title: "Mes Photos",
        url: createPageUrl("MyPhotos"),
        icon: Image,
      }
    );
    if (isAdmin) {
      navigationItems.push({
        title: "Upload",
        url: createPageUrl("Upload"),
        icon: Users,
      });
    }
  }

  if (isAdmin) {
    navigationItems.push({
      title: "Admin",
      url: createPageUrl("Admin"),
      icon: Shield,
    });
  }

  const isActive = (url) => location.pathname === url;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <style>
        {`
          :root {
            --primary: #1e40af;
            --primary-dark: #1e3a8a;
            --accent: #3b82f6;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --surface: #ffffff;
            --surface-hover: #f8fafc;
          }
          
          .glass-effect {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .nav-link-active {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: white;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25);
          }
          
          .nav-link {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .nav-link:hover {
            background: var(--surface-hover);
            transform: translateY(-1px);
          }
        `}
      </style>

      {/* Header Navigation */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Photoevents
                </h1>
                <p className="text-xs text-slate-500 -mt-1">Reconnaissance Faciale</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`nav-link flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm ${
                    isActive(item.url) 
                      ? 'nav-link-active' 
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
              
              {/* User menu */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm text-slate-600 px-3 py-2">
                    {user?.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-600 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="nav-link flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-slate-700 hover:text-slate-900"
                >
                  Connexion
                </Link>
              )}
            </nav>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 glass-effect">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={() => setIsMenuOpen(false)}
                      className={`nav-link flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                        isActive(item.url) 
                          ? 'nav-link-active' 
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </Link>
                  ))}
                  
                  {/* User menu mobile */}
                  {isAuthenticated ? (
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <div className="px-4 py-2 text-sm text-slate-600">
                        {user?.name}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="nav-link flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:text-red-700 w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="nav-link flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-700 hover:text-slate-900"
                    >
                      Connexion
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/20 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-600 font-medium">Photoevents</span>
            </div>
            <div className="text-sm text-slate-500">
              © 2024 Photoevents. Conforme RGPD - Reconnaissance faciale sécurisée
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 