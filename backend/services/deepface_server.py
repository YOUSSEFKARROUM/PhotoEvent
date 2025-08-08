import asyncio
import json
import sys
from concurrent.futures import ThreadPoolExecutor
import time
import os
from deepface import DeepFace
import cv2
import numpy as np

class DeepFaceService:
    def __init__(self):
        self.model_loaded = False
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.preload_models()
    
    def preload_models(self):
        """Précharge les modèles DeepFace au démarrage"""
        try:
            print("🔄 Préchargement des modèles DeepFace...")
            start_time = time.time()
            # Précharger le modèle de détection
            DeepFace.extract_faces(
                img_path="dummy_face.jpg",  # Image test
                detector_backend="retinaface",
                enforce_detection=False
            )
            load_time = time.time() - start_time
            print(f"✅ Modèles préchargés en {load_time:.2f}s")
            self.model_loaded = True
        except Exception as e:
            print(f"❌ Erreur préchargement: {e}")
            self.model_loaded = False
    
    async def extract_face_encoding_async(self, image_path):
        """Extraction asynchrone des features faciales"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, 
            self._extract_face_encoding_sync, 
            image_path
        )
    
    def _extract_face_encoding_sync(self, image_path):
        """Extraction synchrone (thread séparé)"""
        try:
            start_time = time.time()
            # Optimisation: réduire la taille de l'image avant traitement
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Impossible de lire l'image")
            # Redimensionner si trop grande (max 800px)
            height, width = img.shape[:2]
            if max(height, width) > 800:
                scale = 800 / max(height, width)
                new_width = int(width * scale)
                new_height = int(height * scale)
                img = cv2.resize(img, (new_width, new_height))
                # Sauvegarder l'image redimensionnée
                temp_path = image_path.replace('.jpg', '_resized.jpg')
                cv2.imwrite(temp_path, img)
                image_path = temp_path
            # Extraction des features
            embeddings = DeepFace.represent(
                img_path=image_path,
                model_name="Facenet",  # Plus rapide que VGG-Face
                detector_backend="retinaface",
                enforce_detection=False
            )
            if embeddings:
                encoding = embeddings[0]["embedding"]
                processing_time = time.time() - start_time
                print(f"✅ Extraction terminée en {processing_time:.2f}s")
                return encoding
            else:
                raise ValueError("Aucun visage détecté")
        except Exception as e:
            print(f"❌ Erreur extraction: {e}")
            return None

# Instance globale
deepface_service = DeepFaceService()

async def main():
    """Fonction principale pour traitement en ligne de commande"""
    if len(sys.argv) < 2:
        print("Usage: python deepface_server.py <image_path>")
        return
    image_path = sys.argv[1]
    encoding = await deepface_service.extract_face_encoding_async(image_path)
    result = {
        "success": encoding is not None,
        "encoding": encoding.tolist() if encoding is not None else None,
        "timestamp": time.time()
    }
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main()) 