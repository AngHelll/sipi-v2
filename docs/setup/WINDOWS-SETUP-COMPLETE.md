# 📘 Guía Completa de Configuración para Windows - SIPI Modern

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd")

Esta guía centraliza toda la información de configuración específica para Windows, incluyendo soluciones a problemas comunes con XAMPP.

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Instalación de XAMPP](#instalación-de-xampp)
3. [Configuración del Proyecto](#configuración-del-proyecto)
4. [Problemas Comunes y Soluciones](#problemas-comunes-y-soluciones)
5. [Comandos Rápidos](#comandos-rápidos)

---

## 🔧 Prerrequisitos

### Node.js y npm
- **Instalación:** https://nodejs.org/ (versión LTS)
- **Verificación:** `node --version` y `npm --version`
- **Guía detallada:** `instalar-nodejs-windows.md`

### MySQL (XAMPP)
- **Instalación:** https://www.apachefriends.org/
- **Nota:** XAMPP viene con MySQL sin contraseña por defecto
- **Guía detallada:** `instalar-mysql-windows.md`

---

## 🚀 Instalación de XAMPP

### Configuración Inicial

1. **Descargar e instalar XAMPP**
   - URL: https://www.apachefriends.org/
   - Durante instalación, marcar **Apache** y **MySQL**

2. **Iniciar servicios:**
   - Abrir XAMPP Control Panel
   - Iniciar **Apache** (verde)
   - Iniciar **MySQL** (verde)

3. **Configuración de MySQL:**
   - XAMPP viene **sin contraseña** por defecto
   - URL de conexión: `mysql://root@localhost:3306/sipi_db`
   - **NO es necesario configurar contraseña** para desarrollo

### Crear Base de Datos

**Opción A: Desde phpMyAdmin**
- URL: `http://localhost/phpmyadmin/`
- Crear base de datos: `sipi_db`
- Collation: `utf8mb4_unicode_ci`

**Opción B: Desde línea de comandos**
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```
Luego:
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

## ⚙️ Configuración del Proyecto

### Backend

#### 1. Variables de Entorno (`backend/.env`)

```env
# Base de Datos (XAMPP sin contraseña)
DATABASE_URL="mysql://root@localhost:3306/sipi_db"

# Servidor
PORT=3001
NODE_ENV=development

# JWT (generar con PowerShell)
JWT_SECRET=tu_secret_generado_aqui
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

**Generar JWT_SECRET:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 2. Instalación y Configuración

```powershell
cd backend

# Instalar dependencias
npm install

# Verificar configuración
npm run verify:env

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Crear usuario administrador
npm run create:user
```

**Credenciales por defecto:**
- Username: `admin`
- Password: `admin123`
- ⚠️ **Cambiar después del primer login**

### Frontend

#### 1. Variables de Entorno (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

#### 2. Instalación

```powershell
cd frontend

# Instalar dependencias
npm install
```

---

## 🔧 Problemas Comunes y Soluciones

### Error: phpMyAdmin no se puede acceder (ERR_CONNECTION_REFUSED)

**Causa:** Apache no está corriendo

**Solución:**
1. Abrir XAMPP Control Panel
2. Iniciar **Apache** (debe estar verde)
3. Acceder a: `http://localhost/phpmyadmin/`

**Guía detallada:** `solucion-phpmyadmin-xampp.md`

---

### Error: "Access denied" en phpMyAdmin después de cambiar contraseña

**Causa:** phpMyAdmin configurado sin contraseña, pero MySQL tiene contraseña

**Solución:**
1. Editar: `C:\xampp\phpMyAdmin\config.inc.php`
2. Actualizar: `$cfg['Servers'][$i]['password'] = 'TuContraseña';`
3. O usar autenticación por cookie: `$cfg['Servers'][$i]['auth_type'] = 'cookie';`
4. Reiniciar Apache

**Guía detallada:** `configurar-contrasena-xampp.md`

---

### Error: No se puede resetear contraseña de MySQL

**Solución:** Reinstalar XAMPP completo (más rápido)

**Pasos:**
1. Desinstalar XAMPP
2. Reinstalar desde: https://www.apachefriends.org/
3. MySQL funcionará sin contraseña por defecto

**Guía detallada:** `reinstalar-xampp-mysql.md`

---

### Error: Script verify-env.js falla con DATABASE_URL sin contraseña

**Solución:** Ya está corregido. El script acepta ambos formatos:
- Con contraseña: `mysql://user:password@host:port/db`
- Sin contraseña: `mysql://user@host:port/db` (XAMPP)

**Archivo:** `backend/scripts/verify-env.js`

---

### Error: Puerto 80 o 3306 en uso

**Solución:**
```powershell
# Ver qué usa el puerto
netstat -ano | findstr :80
netstat -ano | findstr :3306

# Matar proceso (reemplazar <PID>)
taskkill /PID <PID> /F
```

O cambiar puertos en XAMPP:
- Apache: `C:\xampp\apache\conf\httpd.conf` → `Listen 8080`
- MySQL: Generalmente no es necesario cambiar

---

### Error: "node-gyp" o dependencias nativas fallan

**Solución:**
1. Instalar "Build Tools for Visual Studio"
   - URL: https://visualstudio.microsoft.com/downloads/
   - Seleccionar "Desktop development with C++"
2. O instalar globalmente:
```powershell
npm install --global windows-build-tools
```

---

## 📝 Comandos Rápidos

### Verificar Estado

```powershell
# Verificar MySQL corriendo
Get-Process | Where-Object {$_.ProcessName -like "*mysqld*"}

# Verificar servicios XAMPP
Get-Service | Where-Object {$_.Name -like "*mysql*"}

# Verificar Node.js
node --version
npm --version
```

### Iniciar Proyecto

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Acceder a la Aplicación

- Frontend: `http://localhost:5173/`
- Backend Health: `http://localhost:3001/health`
- phpMyAdmin: `http://localhost/phpmyadmin/`

### Credenciales por Defecto

- **Usuario Admin:** `admin` / `admin123`
- **MySQL (XAMPP):** `root` (sin contraseña)

---

## 📚 Documentación Relacionada

- **Instalación Completa:** `windows-installation.md`
- **Instalar Node.js:** `instalar-nodejs-windows.md`
- **Instalar MySQL:** `instalar-mysql-windows.md`
- **Solución phpMyAdmin:** `solucion-phpmyadmin-xampp.md`
- **Configurar Contraseña:** `configurar-contrasena-xampp.md`
- **Resetear Contraseña:** `resetear-contrasena-mysql-xampp.md`
- **Reinstalar XAMPP:** `reinstalar-xampp-mysql.md`
- **Checklist:** `checklist-instalacion-windows.md`
- **Solución de Problemas:** `troubleshooting.md`

---

## ✅ Checklist de Configuración

- [ ] Node.js 18+ instalado
- [ ] npm instalado
- [ ] XAMPP instalado
- [ ] MySQL corriendo en XAMPP (verde)
- [ ] Apache corriendo en XAMPP (verde)
- [ ] Base de datos `sipi_db` creada
- [ ] `backend/.env` configurado
- [ ] `frontend/.env` configurado
- [ ] Dependencias del backend instaladas
- [ ] Dependencias del frontend instaladas
- [ ] Prisma configurado (cliente generado)
- [ ] Migraciones ejecutadas
- [ ] Usuario administrador creado
- [ ] Backend inicia correctamente
- [ ] Frontend inicia correctamente
- [ ] Puedes iniciar sesión en la aplicación

---

## 🔄 Actualización del Repositorio

### Antes de hacer Pull

1. **Guardar cambios locales importantes:**
   - Configuraciones de `.env` (no se commitean, pero verificar)
   - Cualquier cambio personal que quieras mantener

2. **Limpiar archivos temporales:**
   ```powershell
   # Eliminar archivos temporales
   Remove-Item -Path "*.tmp" -ErrorAction SilentlyContinue
   Remove-Item -Path "jwt_secret*.txt" -ErrorAction SilentlyContinue
   Remove-Item -Path "**\*.log" -ErrorAction SilentlyContinue
   ```

3. **Verificar estado de Git:**
   ```powershell
   git status
   ```

### Después del Pull

1. **Verificar que `.env` sigue correcto:**
   ```powershell
   cd backend
   npm run verify:env
   ```

2. **Si hay cambios en dependencias:**
   ```powershell
   cd backend
   npm install
   
   cd ..\frontend
   npm install
   ```

3. **Si hay nuevas migraciones:**
   ```powershell
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   ```

---

## 📌 Notas Importantes para Windows

1. **XAMPP sin contraseña:** Por defecto, MySQL en XAMPP no tiene contraseña. Esto es normal y seguro para desarrollo local.

2. **Rutas:** Windows usa `\` pero Node.js maneja esto automáticamente. Los scripts npm funcionan bien en Windows.

3. **PowerShell vs CMD:** Se recomienda usar PowerShell para mejor experiencia.

4. **Firewall:** Puede ser necesario permitir MySQL y Node.js en Windows Firewall.

5. **Permisos:** Si hay problemas de permisos, ejecutar PowerShell como Administrador.

---

## 🆘 Obtener Ayuda

1. Revisar esta guía completa
2. Consultar guías específicas en `docs/setup/`
3. Revisar `troubleshooting.md` para problemas comunes
4. Verificar logs de error en las terminales

---

**Última actualización:** Documentación consolidada para Windows con todas las soluciones y configuraciones específicas.

