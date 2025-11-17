# ✅ Checklist de Instalación - SIPI Modern en Windows

## 📋 Estado de la Instalación

Usa este checklist para verificar qué falta configurar.

---

## ✅ Paso 1: Prerrequisitos

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] MySQL/MariaDB instalado y corriendo
- [ ] XAMPP instalado y MySQL iniciado

**Verificar:**
```powershell
node --version
npm --version
Get-Process | Where-Object {$_.ProcessName -like "*mysqld*"}
```

---

## ✅ Paso 2: Base de Datos MySQL

- [ ] MySQL está corriendo en XAMPP (verde)
- [ ] Base de datos `sipi_db` creada
- [ ] Puedes conectarte a MySQL sin contraseña

**Crear base de datos:**
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

Luego en MySQL:
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Verificar:**
```powershell
.\mysql.exe -u root -e "SHOW DATABASES;"
```

Deberías ver `sipi_db` en la lista.

---

## ✅ Paso 3: Configurar Backend

### 3.1 Instalar Dependencias

- [ ] Dependencias del backend instaladas

**Comando:**
```powershell
cd backend
npm install
```

Esto puede tomar varios minutos la primera vez.

### 3.2 Configurar Variables de Entorno

- [ ] Archivo `.env` creado en `backend/`
- [ ] `DATABASE_URL` configurado correctamente
- [ ] `JWT_SECRET` generado y configurado
- [ ] `PORT` configurado (3001 por defecto)
- [ ] `FRONTEND_URL` configurado

**Crear .env:**
```powershell
cd backend
copy .env.example .env
notepad .env
```

**Configurar .env:**
```env
DATABASE_URL="mysql://root@localhost:3306/sipi_db"
PORT=3001
NODE_ENV=development
JWT_SECRET=tu_secret_generado_aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

**Generar JWT_SECRET:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Verificar configuración:**
```powershell
npm run verify:env
```

### 3.3 Configurar Prisma

- [ ] Cliente de Prisma generado
- [ ] Migraciones ejecutadas
- [ ] Tablas creadas en la base de datos

**Comandos:**
```powershell
cd backend
npm run prisma:generate
npm run prisma:migrate
```

**Verificar tablas:**
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root sipi_db -e "SHOW TABLES;"
```

Deberías ver tablas como: `users`, `students`, `teachers`, `subjects`, `groups`, `enrollments`

### 3.4 Crear Usuario Administrador

- [ ] Usuario administrador creado

**Comando:**
```powershell
cd backend
npm run create:user
```

Esto crea:
- Username: `admin`
- Password: `admin123`
- Role: `ADMIN`

⚠️ **IMPORTANTE:** Cambia estas credenciales después del primer login.

---

## ✅ Paso 4: Configurar Frontend

### 4.1 Instalar Dependencias

- [ ] Dependencias del frontend instaladas

**Comando:**
```powershell
cd frontend
npm install
```

Esto puede tomar varios minutos la primera vez.

### 4.2 Configurar Variables de Entorno

- [ ] Archivo `.env` creado en `frontend/`
- [ ] `VITE_API_URL` configurado

**Crear .env:**
```powershell
cd frontend
copy .env.example .env
notepad .env
```

**Configurar .env:**
```env
VITE_API_URL=http://localhost:3001/api
```

---

## ✅ Paso 5: Verificar Instalación

### 5.1 Backend

- [ ] Backend inicia sin errores
- [ ] Health check responde correctamente

**Iniciar backend:**
```powershell
cd backend
npm run dev
```

Deberías ver:
```
🚀 Server running on port 3001
📝 Environment: development
🔗 Health check: http://localhost:3001/health
```

**Verificar en navegador:**
- Abre: `http://localhost:3001/health`
- Deberías ver: `{"status":"ok","timestamp":"..."}`

### 5.2 Frontend

- [ ] Frontend inicia sin errores
- [ ] Puedes acceder a la aplicación

**Iniciar frontend (en otra terminal):**
```powershell
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v7.2.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

**Verificar en navegador:**
- Abre: `http://localhost:5173/`
- Deberías ver la página de login

### 5.3 Login

- [ ] Puedes iniciar sesión con credenciales por defecto
- [ ] El dashboard carga correctamente

**Credenciales por defecto:**
- Username: `admin`
- Password: `admin123`

---

## 🚨 Problemas Comunes

### Backend no inicia

**Verificar:**
1. MySQL está corriendo
2. `DATABASE_URL` en `.env` es correcta
3. Puerto 3001 no está en uso
4. Dependencias instaladas: `npm install`

### Frontend no se conecta al backend

**Verificar:**
1. Backend está corriendo en puerto 3001
2. `VITE_API_URL` en `frontend/.env` es correcta
3. CORS está configurado en backend

### Error de conexión a MySQL

**Verificar:**
1. MySQL está corriendo en XAMPP
2. Base de datos `sipi_db` existe
3. `DATABASE_URL` en `backend/.env` es correcta
4. No hay contraseña (o la contraseña es correcta)

### Prisma no genera cliente

**Solución:**
```powershell
cd backend
Remove-Item -Recurse -Force node_modules\.prisma
npm run prisma:generate
```

---

## 📋 Resumen de Comandos Rápidos

```powershell
# 1. Crear base de datos
cd C:\xampp\mysql\bin
.\mysql.exe -u root
# CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# EXIT;

# 2. Configurar backend
cd C:\Users\Angel\source\repos\sipi-v2\backend
npm install
copy .env.example .env
# Editar .env con tus configuraciones
npm run prisma:generate
npm run prisma:migrate
npm run create:user

# 3. Configurar frontend
cd ..\frontend
npm install
copy .env.example .env
# Editar .env si es necesario

# 4. Iniciar proyecto
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev
```

---

## ✅ Estado Final Esperado

Cuando todo esté configurado:

- ✅ MySQL corriendo con base de datos `sipi_db` creada
- ✅ Backend corriendo en `http://localhost:3001`
- ✅ Frontend corriendo en `http://localhost:5173`
- ✅ Puedes iniciar sesión con `admin` / `admin123`
- ✅ Dashboard carga correctamente según tu rol

---

## 🔗 Enlaces Útiles

- **Guía Completa Windows**: `docs/setup/windows-installation.md`
- **Solución de Problemas**: `docs/setup/troubleshooting.md`
- **Reinstalar XAMPP**: `docs/setup/reinstalar-xampp-mysql.md`

