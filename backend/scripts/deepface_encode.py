#!/usr/bin/env python3
"""
Script DeepFace pour générer les encodages faciaux
Usage: python deepface_encode.py <image_path> [model_name]
"""

import sys
import json
import os
import warnings

# Supprimer les avertissements TensorFlow
warnings.filterwarnings('ignore')

def validate_image(image_path):
    """Valide que l'image existe et peut être lue"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image non trouvée: {image_path}")
    
    # Teste si l'image peut être lue par OpenCV
    try:
        import cv2
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Impossible de lire l'image: {image_path}")
    except ImportError:
        # Si OpenCV n'est pas disponible, on continue quand même
        pass
    
    return True

def generate_face_encoding(image_path, model_name='Facenet'):
    """
    Génère l'encodage facial d'une image
    
    Args:
        image_path (str): Chemin vers l'image
        model_name (str): Modèle DeepFace à utiliser
    
    Returns:
        dict: Résultat avec l'encodage ou l'erreur
    """
    try:
        # Validation de l'image
        validate_image(image_path)
        
        # Import DeepFace avec gestion d'erreur
        try:
            from deepface import DeepFace
        except ImportError as e:
            return {
                'success': False,
                'error': f"DeepFace non installé: {str(e)}",
                'type': 'ImportError'
            }
        
        # Configuration pour éviter les téléchargements automatiques
        import os
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Supprime les logs TensorFlow
        
        # Rediriger stdout et stderr pour capturer les messages de DeepFace
        import io
        from contextlib import redirect_stdout, redirect_stderr
        
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        result = None

        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            # Génération de l'encodage avec DeepFace
            # Utilisation de RetinaFace pour une meilleure détection
            result = DeepFace.represent(
                img_path=image_path, 
                model_name=model_name,
                enforce_detection=True,
                detector_backend='retinaface'
            )
        
        # DeepFace retourne une liste, on prend le premier visage détecté
        if result and len(result) > 0:
            embedding = result[0]['embedding']
            
            return {
                'success': True,
                'embedding': embedding,
                'model': model_name,
                'faces_detected': len(result)
            }
        else:
            return {
                'success': False,
                'error': 'Aucun visage détecté dans l\'image'
            }
            
    except ValueError as ve:
        # Erreur spécifique si aucun visage n'est trouvé par DeepFace
        return {
            'success': False,
            'error': f"Aucun visage n'a pu être détecté. Assurez-vous que le visage est bien visible. Détails techniques: {str(ve)}",
            'type': 'ValueError'
        }
    except Exception as e:
        # Capturer toutes les autres erreurs
        import traceback
        return {
            'success': False,
            'error': f"Une erreur technique est survenue lors de l'analyse de l'image. Détails: {str(e)}",
            'type': type(e).__name__,
            'traceback': traceback.format_exc(),
            'captured_stdout': stdout_capture.getvalue() if 'stdout_capture' in locals() else '',
            'captured_stderr': stderr_capture.getvalue() if 'stderr_capture' in locals() else ''
        }

def compare_faces(encoding1, encoding2):
    """
    Compare deux encodages faciaux
    
    Args:
        encoding1, encoding2: Listes d'encodages
    
    Returns:
        float: Score de similarité (0-1)
    """
    try:
        import numpy as np
        
        # Conversion en numpy arrays
        enc1 = np.array(encoding1)
        enc2 = np.array(encoding2)
        
        # Calcul de la similarité cosinus
        dot_product = np.dot(enc1, enc2)
        norm1 = np.linalg.norm(enc1)
        norm2 = np.linalg.norm(enc2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        return float(similarity)
        
    except Exception as e:
        print(f"Erreur lors de la comparaison: {e}")
        return 0.0

def main():
    """Fonction principale"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python deepface_encode.py <image_path> [model_name]'
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else 'Facenet'
    
    # Validation du modèle
    valid_models = ['Facenet', 'Facenet512', 'OpenFace', 'DeepFace', 'DeepID', 'Dlib', 'ArcFace']
    if model_name not in valid_models:
        print(json.dumps({
            'success': False,
            'error': f'Modèle invalide: {model_name}. Modèles valides: {", ".join(valid_models)}'
        }))
        sys.exit(1)
    
    # Génération de l'encodage
    result = generate_face_encoding(image_path, model_name)
    
    # Sortie JSON
    print(json.dumps(result, ensure_ascii=False))
    
    # Code de sortie
    sys.exit(0 if result['success'] else 1)

if __name__ == "__main__":
    main() 