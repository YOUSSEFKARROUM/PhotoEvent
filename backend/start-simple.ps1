# Script simple pour demarrer le backend
Write-Host "Demarrage du backend Photoevents..." -ForegroundColor Green

# Verifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js detecte: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js non installe" -ForegroundColor Red
    exit 1
}

# Verifier npm
try {
    $npmVersion = npm --version
    Write-Host "npm detecte: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm non installe" -ForegroundColor Red
    exit 1
}

# Installer les dependances si necessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..." -ForegroundColor Yellow
    npm install
}

# Creer les dossiers necessaires
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
}
if (-not (Test-Path "uploads/photos")) {
    New-Item -ItemType Directory -Path "uploads/photos" -Force | Out-Null
}

# Definir les variables d'environnement
$env:JWT_SECRET = "votre_cle_secrete_jwt_tres_longue_et_complexe_ici_par_defaut"
$env:MONGODB_URI = "mongodb://localhost:27017/photoevents"
$env:PORT = "5000"
$env:NODE_ENV = "development"
$env:REDIS_ENABLED = "false"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Port: $env:PORT" -ForegroundColor White
Write-Host "  MongoDB: $env:MONGODB_URI" -ForegroundColor White
Write-Host "  Redis: Desactive" -ForegroundColor White

Write-Host "Demarrage du serveur..." -ForegroundColor Green
npm run dev

