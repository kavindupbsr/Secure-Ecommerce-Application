# SSL Certificate Generation for Windows PowerShell
# This script creates self-signed SSL certificates for HTTPS development

Write-Host "🔐 Generating SSL Certificates for Secure E-commerce Application" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

# Check if OpenSSL is available
try {
    $null = Get-Command openssl -ErrorAction Stop
    Write-Host "✅ OpenSSL found" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenSSL not found. Please install OpenSSL first:" -ForegroundColor Red
    Write-Host "   Option 1: Install via Chocolatey: choco install openssl" -ForegroundColor Yellow
    Write-Host "   Option 2: Download from https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "   Option 3: Use Git Bash (comes with OpenSSL)" -ForegroundColor Yellow
    exit 1
}

# Create certificates directory
New-Item -ItemType Directory -Path "backend\certificates" -Force | Out-Null

# Navigate to certificates directory
Set-Location "backend\certificates"

Write-Host "📋 Creating SSL configuration file..." -ForegroundColor Cyan

# Create SSL configuration file
$sslConfig = @"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=AU
ST=State
L=City
O=SecureEcommerce
OU=Development
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
"@

$sslConfig | Out-File -FilePath "ssl.conf" -Encoding ASCII

Write-Host "🔑 Generating private key..." -ForegroundColor Cyan
# Generate private key
& openssl genrsa -out server.key 2048

Write-Host "📄 Generating certificate signing request..." -ForegroundColor Cyan
# Generate certificate signing request
& openssl req -new -key server.key -out server.csr -config ssl.conf

Write-Host "🏆 Generating self-signed certificate..." -ForegroundColor Cyan
# Generate self-signed certificate
& openssl x509 -req -in server.csr -signkey server.key -out server.crt -days 365 -extensions v3_req -extfile ssl.conf

Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Cyan
# Clean up
Remove-Item server.csr -Force

# Navigate back to project root
Set-Location ..\..

Write-Host ""
Write-Host "✅ SSL Certificates Generated Successfully!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "📁 Certificate files created:" -ForegroundColor White
Write-Host "   • backend/certificates/server.key (Private Key)" -ForegroundColor Yellow
Write-Host "   • backend/certificates/server.crt (Certificate)" -ForegroundColor Yellow
Write-Host "   • backend/certificates/ssl.conf (Configuration)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 You can now run the application with HTTPS enabled:" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access your application at:" -ForegroundColor White
Write-Host "   https://localhost:5000 (Backend API)" -ForegroundColor Cyan
Write-Host "   https://localhost:3000 (Frontend App)" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Browser Warning:" -ForegroundColor Yellow
Write-Host "   Your browser will show a security warning for self-signed certificates." -ForegroundColor White
Write-Host "   Click 'Advanced' → 'Proceed to localhost (unsafe)' to continue." -ForegroundColor White
Write-Host ""
Write-Host "🔧 For production deployment:" -ForegroundColor White
Write-Host "   Replace these self-signed certificates with CA-signed certificates" -ForegroundColor White
Write-Host "   from a trusted certificate authority like Let's Encrypt." -ForegroundColor White
Write-Host ""
Write-Host "✨ Happy Secure Coding!" -ForegroundColor Magenta
