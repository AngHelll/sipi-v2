#!/bin/bash
# Setup script for SIPI-V2 development environment

set -e  # Exit on error

echo "🚀 Setting up SIPI-V2 Development Environment"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    echo "Please install Node.js 20.19+ from: https://nodejs.org/ (or: nvm install && nvm use)"
    exit 1
fi

# Check Node.js version (>= 20.19.0, < 23)
NODE_SEMVER=$(node -v | sed 's/^v//')
if ! node -e "
  const [maj, min] = process.argv[1].split('.').map(Number);
  process.exit(maj > 20 || (maj === 20 && min >= 19) || maj === 22 ? 0 : 1);
" "$NODE_SEMVER"; then
    echo -e "${RED}❌ Node.js must be >= 20.19.0 (or 22.x). Current: v${NODE_SEMVER}${NC}"
    echo "   Run: nvm install && nvm use"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"
echo ""

# Function to create .env file if it doesn't exist
create_env_file() {
    local ENV_FILE=$1
    local EXAMPLE_FILE=$2
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$EXAMPLE_FILE" ]; then
            echo -e "${YELLOW}📝 Creating $ENV_FILE from $EXAMPLE_FILE${NC}"
            cp "$EXAMPLE_FILE" "$ENV_FILE"
            echo -e "${YELLOW}⚠️  Please edit $ENV_FILE with your configuration${NC}"
        else
            echo -e "${RED}❌ $EXAMPLE_FILE not found. Please create it manually.${NC}"
        fi
    else
        echo -e "${GREEN}✅ $ENV_FILE already exists${NC}"
    fi
}

# Setup Backend
echo "📦 Setting up Backend..."
echo "------------------------"
cd backend

# Create backend .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating backend/.env file..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/sipi_db"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
# Generate with: openssl rand -base64 32
JWT_SECRET=development_jwt_secret_change_this_in_production_minimum_32_characters
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
EOF
    echo -e "${YELLOW}⚠️  Created backend/.env - Please update with your database credentials!${NC}"
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
echo "-------------------------"
cd frontend

# Create frontend .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating frontend/.env file..."
    echo 'VITE_API_URL=http://localhost:3001/api' > .env
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
else
    echo -e "${GREEN}✅ frontend/.env already exists${NC}"
fi

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

cd ..

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. ⚙️  Configure backend/.env with your MySQL database credentials"
echo "2. 📊 Make sure MySQL is running and create the database:"
echo "   mysql> CREATE DATABASE sipi_db;"
echo "3. 🔄 Generate Prisma client:"
echo "   cd backend && npm run prisma:generate"
echo "4. 🗄️  Run database migrations:"
echo "   cd backend && npm run prisma:migrate"
echo "5. ▶️  Start backend: cd backend && npm run dev"
echo "6. ▶️  Start frontend: cd frontend && npm run dev"
echo ""


