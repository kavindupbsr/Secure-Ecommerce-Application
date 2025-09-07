#!/bin/bash

# SSL Certificate Generation Script for Development
# This script creates self-signed SSL certificates for HTTPS development

echo "🔐 Generating SSL Certificates for Secure E-commerce Application"
echo "=================================================="

# Create certificates directory
mkdir -p backend/certificates

# Navigate to certificates directory
cd backend/certificates

echo "📋 Creating SSL configuration file..."

# Create SSL configuration file
cat > ssl.conf << EOF
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
EOF

echo "🔑 Generating private key..."
# Generate private key
openssl genrsa -out server.key 2048

echo "📄 Generating certificate signing request..."
# Generate certificate signing request
openssl req -new -key server.key -out server.csr -config ssl.conf

echo "🏆 Generating self-signed certificate..."
# Generate self-signed certificate
openssl x509 -req -in server.csr -signkey server.key -out server.crt -days 365 -extensions v3_req -extfile ssl.conf

echo "🔒 Setting appropriate permissions..."
# Set appropriate permissions
chmod 600 server.key
chmod 644 server.crt
chmod 644 ssl.conf

echo "🧹 Cleaning up temporary files..."
# Clean up
rm server.csr

echo ""
echo "✅ SSL Certificates Generated Successfully!"
echo "=================================================="
echo "📁 Certificate files created:"
echo "   • backend/certificates/server.key (Private Key)"
echo "   • backend/certificates/server.crt (Certificate)"
echo "   • backend/certificates/ssl.conf (Configuration)"
echo ""
echo "🚀 You can now run the application with HTTPS enabled:"
echo "   cd backend && npm run dev"
echo ""
echo "🌐 Access your application at:"
echo "   https://localhost:5000 (Backend API)"
echo "   https://localhost:3000 (Frontend App)"
echo ""
echo "⚠️  Browser Warning:"
echo "   Your browser will show a security warning for self-signed certificates."
echo "   Click 'Advanced' → 'Proceed to localhost (unsafe)' to continue."
echo ""
echo "🔧 For production deployment:"
echo "   Replace these self-signed certificates with CA-signed certificates"
echo "   from a trusted certificate authority like Let's Encrypt."
echo ""
echo "✨ Happy Secure Coding!"
