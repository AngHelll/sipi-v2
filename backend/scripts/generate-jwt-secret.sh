#!/bin/bash
# Script to generate a secure JWT_SECRET
# Usage: ./generate-jwt-secret.sh

echo "🔐 Generating Secure JWT_SECRET"
echo "================================="
echo ""

# Method 1: OpenSSL (base64) - Recommended
echo "Method 1: OpenSSL Base64 (Recommended)"
JWT_SECRET_B64=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET_B64"
echo ""

# Method 2: OpenSSL (hex)
echo "Method 2: OpenSSL Hex"
JWT_SECRET_HEX=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET_HEX"
echo ""

# Method 3: Node.js (base64)
if command -v node &> /dev/null; then
    echo "Method 3: Node.js Base64"
    JWT_SECRET_NODE=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    echo "JWT_SECRET=$JWT_SECRET_NODE"
    echo ""
fi

echo "================================="
echo "💡 Recommended: Use Method 1 (OpenSSL Base64)"
echo ""
echo "📝 To update your .env file:"
echo "   JWT_SECRET=\"$JWT_SECRET_B64\""
echo ""
echo "⚠️  Security Notes:"
echo "   - Minimum length: 32 characters (256 bits)"
echo "   - Keep it secret! Never commit to version control"
echo "   - Use different secrets for development and production"
echo "   - Store in environment variables, not in code"


