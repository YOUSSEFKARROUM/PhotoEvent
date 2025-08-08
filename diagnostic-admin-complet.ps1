Write-Host "🔧 DIAGNOSTIC ADMIN COMPLET de Photoevents..." -ForegroundColor Green
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

Write-Host ""

# Vérifications des fichiers
Write-Host "📁 Vérifications des fichiers..." -ForegroundColor Cyan

$requiredFiles = @(
    "backend/.env",
    "src/contexts/AuthContext.jsx",
    "src/components/ProtectedRoute.jsx",
    "src/entities/Event.js",
    "src/utils/auth.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

Write-Host ""

# Test de connexion backend
Write-Host "🔌 Test de connexion backend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend: Connecté et fonctionnel" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backend: Réponse inattendue (Status: $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend: Non accessible (assurez-vous qu'il est démarré)" -ForegroundColor Red
}

Write-Host ""

# Test d'authentification admin détaillé
Write-Host "🔑 Test d'authentification admin détaillé..." -ForegroundColor Cyan
try {
    $loginData = @{
        email = "admin@photoevents.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 10
    
    if ($loginResponse.StatusCode -eq 200) {
        $loginResult = $loginResponse.Content | ConvertFrom-Json
        Write-Host "✅ Connexion admin réussie" -ForegroundColor Green
        Write-Host "   Token: $($loginResult.token ? 'Présent' : 'Absent')" -ForegroundColor Gray
        Write-Host "   User: $($loginResult.user.name)" -ForegroundColor Gray
        Write-Host "   Role: $($loginResult.user.role)" -ForegroundColor Gray
        Write-Host "   Est admin: $($loginResult.user.role -eq 'ADMIN')" -ForegroundColor Gray
        
        # Test de l'API /auth/me avec le token
        $headers = @{
            "Authorization" = "Bearer $($loginResult.token)"
            "Content-Type" = "application/json"
        }
        
        Write-Host ""
        Write-Host "🔍 Test de l'API /auth/me..." -ForegroundColor Cyan
        $meResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/me" -Method GET -Headers $headers -TimeoutSec 10
        
        if ($meResponse.StatusCode -eq 200) {
            $meResult = $meResponse.Content | ConvertFrom-Json
            Write-Host "✅ API /auth/me réussie" -ForegroundColor Green
            Write-Host "   User: $($meResult.user.name)" -ForegroundColor Gray
            Write-Host "   Role: $($meResult.user.role)" -ForegroundColor Gray
            Write-Host "   Est admin: $($meResult.user.role -eq 'ADMIN')" -ForegroundColor Gray
        } else {
            Write-Host "❌ API /auth/me échouée (Status: $($meResponse.StatusCode))" -ForegroundColor Red
        }
        
        # Test de l'API admin avec le token
        Write-Host ""
        Write-Host "🔍 Test de l'API admin..." -ForegroundColor Cyan
        $adminResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/users" -Method GET -Headers $headers -TimeoutSec 10
        
        if ($adminResponse.StatusCode -eq 200) {
            Write-Host "✅ API admin accessible" -ForegroundColor Green
        } else {
            Write-Host "❌ API admin non accessible (Status: $($adminResponse.StatusCode))" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Connexion admin échouée (Status: $($loginResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur lors du test d'authentification: $($_.Exception.Message)" -ForegroundColor Red
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
Write-Host "🎯 RÉSUMÉ DU DIAGNOSTIC ADMIN COMPLET" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Gray

Write-Host ""
Write-Host "🔧 PROBLÈMES IDENTIFIÉS:" -ForegroundColor Yellow
Write-Host "⚠️ Le problème semble être dans la vérification du rôle admin côté frontend" -ForegroundColor Yellow
Write-Host "⚠️ Les logs de débogage ont été ajoutés pour identifier le problème" -ForegroundColor Yellow

Write-Host ""
Write-Host "🚀 SOLUTIONS APPLIQUÉES:" -ForegroundColor Green
Write-Host "1. Ajout de logs de débogage dans AuthContext" -ForegroundColor Gray
Write-Host "2. Ajout d'informations de débogage dans ProtectedRoute" -ForegroundColor Gray
Write-Host "3. Script de test frontend créé (test-frontend-auth.js)" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 INSTRUCTIONS POUR DÉBOGUER:" -ForegroundColor Yellow
Write-Host "1. Redémarrez le frontend: npm run dev:fast" -ForegroundColor Gray
Write-Host "2. Connectez-vous avec admin@photoevents.com / admin123" -ForegroundColor Gray
Write-Host "3. Ouvrez la console du navigateur (F12)" -ForegroundColor Gray
Write-Host "4. Cliquez sur 'Admin' dans la navigation" -ForegroundColor Gray
Write-Host "5. Vérifiez les logs de débogage dans la console" -ForegroundColor Gray
Write-Host "6. Si vous voyez 'Accès refusé', regardez les informations de débogage" -ForegroundColor Gray

Write-Host ""
Write-Host "🔍 SCRIPT DE TEST FRONTEND:" -ForegroundColor Yellow
Write-Host "Copiez et collez le contenu de test-frontend-auth.js dans la console du navigateur" -ForegroundColor Gray

Write-Host ""
Write-Host "🔑 Identifiants de connexion:" -ForegroundColor Yellow
Write-Host "   Email: admin@photoevents.com" -ForegroundColor Gray
Write-Host "   Mot de passe: admin123" -ForegroundColor Gray

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 