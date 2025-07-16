import React, { useState, useRef } from "react";
import User from "@/entities/User.js";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  User as UserIcon,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

export default function ReferencePhotoUpload({ onPhotoUploaded, currentUser }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);
      setShowCamera(true);
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Veuillez utiliser l'upload de fichier.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !isCameraReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `reference-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      stopCamera();
      setError(null);
    }, 'image/jpeg', 0.8);
  };

  const uploadReferencePhoto = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(90, prev + 10));
      }, 200);

      // Upload file
      const { file_url } = await UploadFile({ file: selectedFile });
      
      // Simulate face encoding processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user with reference data
      await User.updateMyUserData({
        reference_face_data: {
          reference_image_url: file_url,
          face_encoding: Array(128).fill(0).map(() => Math.random()) // Simulate face encoding
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onPhotoUploaded();
      }, 1000);

    } catch (error) {
      setError("Erreur lors de l'upload. Veuillez réessayer.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError(null);
    setUploadProgress(0);
  };

  React.useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      stopCamera();
    };
  }, [preview]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-2xl mx-auto border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Photo de Référence
          </CardTitle>
          <p className="text-slate-600">
            Uploadez un selfie clair pour permettre à notre IA de vous reconnaître dans les photos d'événements.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Guidelines */}
          <Alert className="border-purple-200 bg-purple-50">
            <UserIcon className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>Conseils pour une meilleure reconnaissance :</strong>
              <ul className="mt-2 text-sm space-y-1">
                <li>• Visage bien éclairé et centré</li>
                <li>• Regardez directement l'objectif</li>
                <li>• Évitez les lunettes de soleil ou masques</li>
                <li>• Photo en haute qualité recommandée</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Camera View */}
          {showCamera && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Camera overlay */}
                <div className="absolute inset-0 border-4 border-white/20 rounded-xl">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/50 rounded-full"></div>
                </div>
                
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Initialisation de la caméra...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center gap-4 mt-4">
                <Button variant="outline" onClick={stopCamera}>
                  Annuler
                </Button>
                <Button
                  onClick={capturePhoto}
                  disabled={!isCameraReady}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capturer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Upload Options */}
          {!showCamera && !preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload */}
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900 mb-1">Upload depuis l'appareil</h3>
                  <p className="text-sm text-slate-600">Choisir une photo existante</p>
                </div>

                {/* Camera Capture */}
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors cursor-pointer"
                  onClick={startCamera}
                >
                  <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-900 mb-1">Prendre une photo</h3>
                  <p className="text-sm text-slate-600">Utiliser la caméra</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview and Upload */}
          {preview && !showCamera && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="relative">
                <img
                  src={preview}
                  alt="Photo de référence"
                  className="w-full max-w-sm mx-auto rounded-xl shadow-lg"
                />
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="mb-2">Traitement en cours...</p>
                      <Progress value={uploadProgress} className="w-48 mx-auto" />
                    </div>
                  </div>
                )}
                
                {uploadProgress === 100 && (
                  <div className="absolute inset-0 bg-green-500/80 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-semibold">Photo enregistrée !</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={resetSelection}
                  disabled={isUploading}
                >
                  Changer
                </Button>
                <Button
                  onClick={uploadReferencePhoto}
                  disabled={isUploading || uploadProgress === 100}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 