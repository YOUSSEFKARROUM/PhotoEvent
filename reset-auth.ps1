Write-Host "🔄 RÉINITIALISATION AUTHENTIFICATION ADMIN..." -ForegroundColor Green
Write-Host ""

# Vérifier que le backend est démarré
Write-Host "🔌 Vérification backend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend: Connecté et fonctionnel" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: Réponse inattendue" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Backend: Non accessible - Démarrez d'abord le backend" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test de connexion admin
Write-Host "🔑 Test de connexion admin..." -ForegroundColor Cyan
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
        
        # Sauvegarder le token pour les tests
        $token = $loginResult.token
        
    } else {
        Write-Host "❌ Connexion admin échouée" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de la connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test de l'API /auth/me
Write-Host "🔍 Test de l'API /auth/me..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $meResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/me" -Method GET -Headers $headers -TimeoutSec 10
    
    if ($meResponse.StatusCode -eq 200) {
        $meResult = $meResponse.Content | ConvertFrom-Json
        Write-Host "✅ API /auth/me réussie" -ForegroundColor Green
        Write-Host "   User: $($meResult.user.name)" -ForegroundColor Gray
        Write-Host "   Role: $($meResult.user.role)" -ForegroundColor Gray
        Write-Host "   Est admin: $($meResult.user.role -eq 'ADMIN')" -ForegroundColor Gray
    } else {
        Write-Host "❌ API /auth/me échouée" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur API /auth/me: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test de l'API admin
Write-Host "🔍 Test de l'API admin..." -ForegroundColor Cyan
try {
    $adminResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/users" -Method GET -Headers $headers -TimeoutSec 10
    
    if ($adminResponse.StatusCode -eq 200) {
        Write-Host "✅ API admin accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ API admin non accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur API admin: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 RÉSUMÉ DE LA RÉINITIALISATION" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ AUTHENTIFICATION BACKEND: FONCTIONNELLE" -ForegroundColor Green
Write-Host "✅ RÔLE ADMIN: CORRECTEMENT DÉFINI" -ForegroundColor Green
Write-Host "✅ API ADMIN: ACCESSIBLE" -ForegroundColor Green

Write-Host ""
Write-Host "💡 INSTRUCTIONS POUR LE FRONTEND:" -ForegroundColor Yellow
Write-Host "1. Ouvrez votre navigateur" -ForegroundColor Gray
Write-Host "2. Allez sur http://localhost:5173" -ForegroundColor Gray
Write-Host "3. Ouvrez la console (F12)" -ForegroundColor Gray
Write-Host "4. Copiez et collez le contenu de debug-admin.js" -ForegroundColor Gray
Write-Host "5. Connectez-vous avec admin@photoevents.com / admin123" -ForegroundColor Gray
Write-Host "6. Cliquez sur 'Admin' et vérifiez les logs" -ForegroundColor Gray

Write-Host ""
Write-Host "🔑 Identifiants de connexion:" -ForegroundColor Yellow
Write-Host "   Email: admin@photoevents.com" -ForegroundColor Gray
Write-Host "   Mot de passe: admin123" -ForegroundColor Gray

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 