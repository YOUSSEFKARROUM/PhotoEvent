@echo off
REM Script d'installation DeepFace compatible pour Windows

REM 1. Créer l'environnement virtuel avec Python 3.11
py -3.11 -m venv .venv

REM 2. Activer le venv
call .venv\Scripts\activate

REM 3. Mettre à jour pip
python -m pip install --upgrade pip

REM 4. Installer les dépendances compatibles IA
pip install tensorflow==2.12.0 keras==2.12.0 numpy==1.23.5 tensorboard==2.12.3 tf-keras deepface

REM 5. Afficher la version de python et message de succès
python --version
pip show tensorflow keras numpy deepface

echo.
echo Installation terminée !
echo Activez le venv avec :
echo   .venv\Scripts\activate
echo Puis lancez votre backend normalement.
pause 