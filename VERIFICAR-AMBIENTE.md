# Verificar y Levantar Ambiente Local

## 🔍 Verificar si está Corriendo

### Opción 1: Verificar Puertos

```bash
# Verificar puerto backend (3001)
lsof -i:3001

# Verificar puerto frontend (5173)
lsof -i:5173
```

Si hay procesos, los servidores están corriendo.

### Opción 2: Probar Endpoints

```bash
# Backend health check
curl http://localhost:3001/health

# Frontend (debería retornar HTML)
curl http://localhost:5173
```

### Opción 3: Abrir en Navegador

- **Backend API**: http://localhost:3001/health
- **Frontend**: http://localhost:5173

---

## 🚀 Levantar Ambiente

### Opción A: Script Automático (Recomendado)

```bash
# Desde la raíz del proyecto
./start-dev.sh
```

Este script:
- ✅ Verifica Node.js y MySQL
- ✅ Instala dependencias si faltan
- ✅ Genera Prisma client si falta
- ✅ Crea archivos .env si faltan
- ✅ Inicia backend (puerto 3001)
- ✅ Inicia frontend (puerto 5173)

### Opción B: Manual

#### 1. Backend

```bash
cd backend

# Instalar dependencias (si no están)
npm install

# Generar Prisma client (si no está)
npx prisma generate

# Verificar .env existe
ls -la .env

# Iniciar servidor
npm run dev
```

#### 2. Frontend (en otra terminal)

```bash
cd frontend

# Instalar dependencias (si no están)
npm install

# Iniciar servidor
npm run dev
```

---

## ✅ Verificar que Todo Funciona

### 1. Backend

```bash
# Health check
curl http://localhost:3001/health

# Debería retornar:
# {"status":"ok","timestamp":"2026-01-23T..."}
```

### 2. Frontend

Abrir en navegador: http://localhost:5173

Deberías ver la página de login.

### 3. Verificar Migraciones

```bash
cd backend
npx prisma migrate status
```

Debería mostrar: "Database schema is up to date!" o las migraciones pendientes.

---

## 🛑 Detener Servidores

### Si usaste el script `start-dev.sh`:

Presiona `Ctrl+C` en la terminal donde está corriendo.

### Si los iniciaste manualmente:

Presiona `Ctrl+C` en cada terminal.

### Forzar cierre (si es necesario):

```bash
# Matar procesos en puertos
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

---

## 🔧 Troubleshooting

### Error: Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i:3001
lsof -i:5173

# Matar proceso específico
kill -9 <PID>
```

### Error: MySQL no conecta

```bash
# Verificar que MySQL está corriendo
mysql -u root -e "SELECT 1"

# Verificar .env tiene DATABASE_URL correcta
cat backend/.env | grep DATABASE_URL
```

### Error: Dependencias faltantes

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Error: Prisma client no generado

```bash
cd backend
npx prisma generate
```

---

## 📋 Checklist Rápido

- [ ] MySQL corriendo
- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 5173
- [ ] Health check responde: `curl http://localhost:3001/health`
- [ ] Frontend carga en navegador: http://localhost:5173
- [ ] Migraciones aplicadas: `npx prisma migrate status`

---

**Última actualización**: 2026-01-23
