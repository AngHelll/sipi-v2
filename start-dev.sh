#!/bin/bash
# Script para iniciar el proyecto en modo desarrollo
# Compatible con Mac y Linux

set -e

echo "🚀 Iniciando SIPI-V2 en modo desarrollo..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo ""

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL no encontrado en PATH (puede estar corriendo)${NC}"
else
    echo -e "${GREEN}✅ MySQL encontrado${NC}"
fi

# Verificar dependencias del backend
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del backend...${NC}"
    cd backend
    npm install
    cd ..
fi

# Verificar dependencias del frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Verificar Prisma
if [ ! -d "backend/node_modules/.prisma" ]; then
    echo -e "${YELLOW}🔧 Generando cliente de Prisma...${NC}"
    cd backend
    npm run prisma:generate
    cd ..
fi

# Verificar .env del backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env no existe. Copiando desde .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Por favor, edita backend/.env con tus credenciales${NC}"
fi

# Verificar .env del frontend
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env no existe. Creando...${NC}"
    echo "VITE_API_URL=http://localhost:3001/api" > frontend/.env
fi

echo ""
echo -e "${GREEN}✅ Verificaciones completadas${NC}"
echo ""
echo "📝 Iniciando servidores..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend
echo -e "${GREEN}🔧 Iniciando Backend (puerto 3001)...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar un poco para que el backend inicie
sleep 3

# Verificar que el backend esté corriendo
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Error al iniciar el backend. Revisa backend.log${NC}"
    exit 1
fi

# Iniciar frontend
echo -e "${GREEN}🎨 Iniciando Frontend (puerto 5173)...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Esperar un poco para que el frontend inicie
sleep 3

# Verificar que el frontend esté corriendo
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Error al iniciar el frontend. Revisa frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Servidores iniciados correctamente!${NC}"
echo ""
echo "📍 URLs:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Presiona Ctrl+C para detener los servidores"
echo ""

# Esperar a que los procesos terminen
wait
