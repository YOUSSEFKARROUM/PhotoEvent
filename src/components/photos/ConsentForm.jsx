import React, { useState, useEffect } from "react";
import User from "@/entities/User.js";
import apiService from "@/services/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Info, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ConsentForm({ onConsentGiven }) {
  const [consents, setConsents] = useState({
    faceRecognition: false,
    dataProcessing: false,
    termsAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug: vérifier l'authentification au montage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setDebugInfo({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      hasUser: !!user,
      token: token ? token.substring(0, 20) + '...' : 'No token'
    });
    
    console.log('=== DEBUG CONSENT FORM ===');
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'No token');
    console.log('User:', user);
  }, []);

  const handleConsentChange = (key, checked) => {
    setConsents(prev => ({ ...prev, [key]: checked }));
  };

  const allConsentsGiven = Object.values(consents).every(consent => consent);

  const handleSubmit = async () => {
    if (!allConsentsGiven) return;

    setIsSubmitting(true);
    try {
      await User.updateMyUserData({
        consent_given: true,
        consent_date: new Date().toISOString()
      });
      onConsentGiven(); // Toujours passer à l'étape suivante après succès
    } catch (error) {
      // Ne rediriger que si la réponse backend est vraiment 401/403
      if (
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.toLowerCase().includes('unauthorized') ||
        error.message.toLowerCase().includes('forbidden')
      ) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        if (error.message.includes('Session expirée') || error.message.includes('accès interdit')) {
          alert("Votre session a expiré ou vous n'avez plus accès à cette action. Veuillez vous reconnecter.");
        } else {
          alert(`Erreur lors de l'enregistrement du consentement : ${error.message}`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-3xl mx-auto border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Consentement RGPD
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Votre vie privée est notre priorité. Veuillez lire et accepter les conditions suivantes.
          </p>
          
          {/* DEBUG INFO */}
          {debugInfo && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-left">
              <strong>Debug Info:</strong><br/>
              Token: {debugInfo.hasToken ? '✅ Present' : '❌ Missing'}<br/>
              Token Length: {debugInfo.tokenLength}<br/>
              User: {debugInfo.hasUser ? '✅ Present' : '❌ Missing'}<br/>
              Token Preview: {debugInfo.token}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Privacy Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Protection de vos données :</strong> Nous utilisons un chiffrement de bout en bout 
              pour protéger vos données biométriques. Vous pouvez supprimer vos données à tout moment.
            </AlertDescription>
          </Alert>

          {/* Consent Checkboxes */}
          <div className="space-y-6">
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Checkbox
                id="faceRecognition"
                checked={consents.faceRecognition}
                onChange={e => handleConsentChange('faceRecognition', e.target.checked)}
                className="mt-1"
              />
              <div className="space-y-1">
                <label 
                  htmlFor="faceRecognition"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Reconnaissance faciale
                </label>
                <p className="text-sm text-slate-600">
                  J'autorise l'utilisation de ma photo de référence pour la reconnaissance faciale 
                  afin de retrouver mes photos dans les événements. Cette technologie utilise des 
                  algorithmes avancés pour identifier mon visage de manière sécurisée.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Checkbox
                id="dataProcessing"
                checked={consents.dataProcessing}
                onChange={e => handleConsentChange('dataProcessing', e.target.checked)}
                className="mt-1"
              />
              <div className="space-y-1">
                <label 
                  htmlFor="dataProcessing"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Traitement des données
                </label>
                <p className="text-sm text-slate-600">
                  J'accepte que mes données biométriques soient traitées et stockées de manière 
                  sécurisée pour permettre la recherche de photos. Ces données ne seront jamais 
                  partagées avec des tiers et seront supprimées à ma demande.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Checkbox
                id="termsAccepted"
                checked={consents.termsAccepted}
                onChange={e => handleConsentChange('termsAccepted', e.target.checked)}
                className="mt-1"
              />
              <div className="space-y-1">
                <label 
                  htmlFor="termsAccepted"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Conditions d'utilisation
                </label>
                <p className="text-sm text-slate-600">
                  J'ai lu et j'accepte les conditions d'utilisation de la plateforme PhotoEvent. 
                  Je comprends mes droits concernant mes données personnelles (accès, rectification, 
                  effacement, portabilité).
                </p>
              </div>
            </div>
          </div>

          {/* Rights Information */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Vos droits RGPD :</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>Droit d'accès :</strong> Vous pouvez consulter vos données à tout moment</li>
              <li>• <strong>Droit de rectification :</strong> Vous pouvez modifier vos informations</li>
              <li>• <strong>Droit à l'effacement :</strong> Vous pouvez supprimer votre compte et toutes vos données</li>
              <li>• <strong>Droit à la portabilité :</strong> Vous pouvez récupérer vos données dans un format lisible</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!allConsentsGiven || isSubmitting}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Donner mon consentement
                </>
              )}
            </Button>
            
            {!allConsentsGiven && (
              <p className="text-sm text-slate-500 text-center mt-2">
                Veuillez accepter toutes les conditions pour continuer
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}