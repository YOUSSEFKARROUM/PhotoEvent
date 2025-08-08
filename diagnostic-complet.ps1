Write-Host "🔍 DIAGNOSTIC COMPLET de Photoevents..." -ForegroundColor Green
Write-Host ""

# Vérifications système
Write-Host "📋 Vérifications système..." -ForegroundColor Cyan

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non installé ou non accessible" -ForegroundColor Red
}

# Vérifier npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm non installé ou non accessible" -ForegroundColor Red
}

# Vérifier MongoDB
try {
    $mongoTest = mongo --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB: Installé" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MongoDB: Non installé (le backend utilisera une connexion externe)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ MongoDB: Non installé (le backend utilisera une connexion externe)" -ForegroundColor Yellow
}

Write-Host ""

# Vérifications des fichiers
Write-Host "📁 Vérifications des fichiers..." -ForegroundColor Cyan

# Vérifier la structure du projet
$requiredFiles = @(
    "package.json",
    "backend/package.json",
    "backend/server.js",
    "backend/.env",
    "public/favicon.ico"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

Write-Host ""

# Vérifications des dépendances
Write-Host "📦 Vérifications des dépendances..." -ForegroundColor Cyan

# Frontend
if (Test-Path "node_modules") {
    Write-Host "✅ Frontend: node_modules présent" -ForegroundColor Green
} else {
    Write-Host "⚠️ Frontend: node_modules manquant (exécutez 'npm install')" -ForegroundColor Yellow
}

# Backend
if (Test-Path "backend/node_modules") {
    Write-Host "✅ Backend: node_modules présent" -ForegroundColor Green
} else {
    Write-Host "⚠️ Backend: node_modules manquant (exécutez 'cd backend && npm install')" -ForegroundColor Yellow
}

Write-Host ""

# Test de connexion backend
Write-Host "🔌 Test de connexion backend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend: Connecté et fonctionnel" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($healthData.status)" -ForegroundColor Gray
        Write-Host "   Environment: $($healthData.environment)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Backend: Réponse inattendue (Status: $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend: Non accessible (assurez-vous qu'il est démarré)" -ForegroundColor Red
}

Write-Host ""

# Test de connexion frontend
Write-Host "🌐 Test de connexion frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend: Connecté et fonctionnel" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Frontend: Réponse inattendue (Status: $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Frontend: Non accessible (assurez-vous qu'il est démarré)" -ForegroundColor Red
}

Write-Host ""

# Test d'authentification
Write-Host "🔑 Test d'authentification..." -ForegroundColor Cyan
if (Test-Path "backend/test_auth_simple.js") {
    try {
        Set-Location backend
        $authResult = node test_auth_simple.js 2>&1
        Set-Location ..
        
        if ($authResult -match "✅ Connexion réussie") {
            Write-Host "✅ Authentification: Fonctionnelle" -ForegroundColor Green
        } else {
            Write-Host "❌ Authentification: Échec" -ForegroundColor Red
            Write-Host "   Détails: $authResult" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Authentification: Erreur lors du test" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Authentification: Script de test manquant" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 RÉSUMÉ DU DIAGNOSTIC" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Gray

# Compter les erreurs et avertissements
$errors = 0
$warnings = 0

if ($LASTEXITCODE -ne 0) { $errors++ }

Write-Host ""
if ($errors -eq 0) {
    Write-Host "✅ Tout semble fonctionner correctement !" -ForegroundColor Green
    Write-Host "🚀 Vous pouvez maintenant utiliser l'application." -ForegroundColor Green
} else {
    Write-Host "⚠️ Quelques problèmes ont été détectés." -ForegroundColor Yellow
    Write-Host "🔧 Exécutez '.\start-complete.ps1' pour résoudre les problèmes." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 