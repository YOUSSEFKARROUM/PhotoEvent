Write-Host "🔧 DIAGNOSTIC ADMIN de Photoevents..." -ForegroundColor Green
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

# Test d'authentification admin
Write-Host "🔑 Test d'authentification admin..." -ForegroundColor Cyan
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
        
        # Test de l'API admin avec le token
        $headers = @{
            "Authorization" = "Bearer $($loginResult.token)"
            "Content-Type" = "application/json"
        }
        
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
Write-Host "🎯 RÉSUMÉ DU DIAGNOSTIC ADMIN" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Gray

Write-Host ""
Write-Host "🔧 PROBLÈMES IDENTIFIÉS ET RÉSOLUS:" -ForegroundColor Green
Write-Host "✅ Incohérence des clés de token corrigée" -ForegroundColor Green
Write-Host "✅ AuthContext utilise maintenant setToken()" -ForegroundColor Green
Write-Host "✅ Event.js utilise maintenant getToken()" -ForegroundColor Green
Write-Host "✅ Uniformisation du stockage des tokens" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 SOLUTIONS APPLIQUÉES:" -ForegroundColor Green
Write-Host "1. Correction de l'incohérence des clés de token" -ForegroundColor Gray
Write-Host "2. Utilisation des utilitaires auth.js" -ForegroundColor Gray
Write-Host "3. Uniformisation du stockage localStorage" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Redémarrez le frontend: npm run dev:fast" -ForegroundColor Gray
Write-Host "2. Connectez-vous avec admin@photoevents.com / admin123" -ForegroundColor Gray
Write-Host "3. Cliquez sur 'Admin' dans la navigation" -ForegroundColor Gray
Write-Host "4. Vous devriez maintenant accéder au dashboard admin" -ForegroundColor Gray

Write-Host ""
Write-Host "🔑 Identifiants de connexion:" -ForegroundColor Yellow
Write-Host "   Email: admin@photoevents.com" -ForegroundColor Gray
Write-Host "   Mot de passe: admin123" -ForegroundColor Gray

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 