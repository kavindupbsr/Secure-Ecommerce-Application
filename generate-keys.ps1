# Generate Secure Keys Script
Write-Host "🔑 Generating Secure Keys for Environment Variables" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

# Function to generate random string
function Generate-RandomString {
    param([int]$Length = 32)
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    $random = ''
    for ($i = 0; $i -lt $Length; $i++) {
        $random += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $random
}

# Generate secure keys
$jwtSecret = Generate-RandomString -Length 64
$sessionSecret = Generate-RandomString -Length 64
$encryptionKey = Generate-RandomString -Length 32

Write-Host ""
Write-Host "✅ Generated Secure Keys:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Cyan
Write-Host ""
Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor Cyan
Write-Host ""
Write-Host "ENCRYPTION_KEY=$encryptionKey" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Copy these values to your backend/.env file" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔒 Keep these keys secure and never commit them to version control!" -ForegroundColor Red
