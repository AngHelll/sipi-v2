#!/bin/bash
echo "🔍 Checking Prerequisites for SIPI-V2"
echo "======================================"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
    
    # Check version (>= 20.19.0 or 22.x)
    NODE_SEMVER=$(echo "$NODE_VERSION" | sed 's/^v//')
    if ! node -e "
      const [maj, min] = process.argv[1].split('.').map(Number);
      process.exit(maj > 20 || (maj === 20 && min >= 19) || maj === 22 ? 0 : 1);
    " "$NODE_SEMVER" 2>/dev/null; then
        echo "   ⚠️  Warning: Node.js 20.19+ required (Vite 7). You have $NODE_VERSION — run: nvm install && nvm use"
    fi
else
    echo "❌ Node.js: Not found"
    echo "   Install with: brew install node"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm: Not found (comes with Node.js)"
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | cut -d',' -f1)
    echo "✅ MySQL: $MYSQL_VERSION"
else
    echo "❌ MySQL: Not found"
    echo "   Install with: brew install mysql"
fi

# Check Homebrew
if command -v brew &> /dev/null; then
    BREW_VERSION=$(brew --version | head -1)
    echo "✅ Homebrew: $BREW_VERSION"
else
    echo "❌ Homebrew: Not found"
fi

# Check if project directories exist
echo ""
echo "📁 Project Structure:"
if [ -d "backend" ]; then
    echo "✅ backend/ directory exists"
else
    echo "❌ backend/ directory not found"
fi

if [ -d "frontend" ]; then
    echo "✅ frontend/ directory exists"
else
    echo "❌ frontend/ directory not found"
fi

# Check if .env files exist
echo ""
echo "⚙️  Configuration Files:"
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
else
    echo "⚠️  backend/.env not found (will be created by setup script)"
fi

if [ -f "frontend/.env" ]; then
    echo "✅ frontend/.env exists"
else
    echo "⚠️  frontend/.env not found (will be created by setup script)"
fi

# Check if dependencies are installed
echo ""
echo "📦 Dependencies:"
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed (run: cd backend && npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed (run: cd frontend && npm install)"
fi

echo ""
echo "======================================"
echo "✅ Prerequisites check complete!"
echo ""
