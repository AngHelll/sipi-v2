# 🪟 Guía de Instalación para Windows - SIPI-V2

**Última actualización:** 2025-01-23

Esta guía centraliza toda la información necesaria para configurar SIPI-V2 en Windows, incluyendo soluciones a problemas comunes.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

### 1. Node.js y npm

**Versión requerida:** Node.js 18 o superior

> 📖 **Guía detallada:** Si necesitas ayuda detallada, consulta [Instalar Node.js y npm en Windows](instalar-nodejs-windows.md)

**Instalación rápida:**
1. Descarga Node.js desde [nodejs.org](https://nodejs.org/)
   - Selecciona la versión **LTS (Long Term Support)** - botón verde "Recommended"
   - Descarga el instalador `.msi` para Windows 64-bit
2. Ejecuta el instalador `.msi` descargado
3. Sigue el asistente de instalación:
   - Acepta los términos y condiciones
   - **IMPORTANTE:** Asegúrate de que **"Add to PATH"** esté marcado (por defecto lo está)
   - Marca **"Automatically install the necessary tools"** si aparece
   - Completa la instalación
4. **Cierra y abre una nueva ventana** de PowerShell o CMD
5. Verifica la instalación:

```powershell
node --version
npm --version
```

Deberías ver algo como:
```
v20.11.0
10.2.4
```

**Nota:** npm viene incluido automáticamente con Node.js. No necesitas instalarlo por separado.

### 2. MySQL 8.0+

> 📖 **Guía detallada:** Si necesitas ayuda detallada, consulta [Instalar MySQL en Windows](instalar-mysql-windows.md)

**Opción A: XAMPP (Recomendado para Desarrollo - Más Fácil)**
1. Descarga XAMPP desde [apachefriends.org](https://www.apachefriends.org/)
2. Ejecuta el instalador
3. Durante instalación, marca **Apache** y **MySQL**
4. Abre **XAMPP Control Panel** y haz clic en **"Start"** junto a MySQL
5. MySQL en XAMPP viene sin contraseña por defecto (opcional configurarla)

**Opción B: MySQL Installer (Recomendado para Producción)**
1. Descarga desde [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Selecciona "MySQL Installer for Windows"
3. Durante la instalación:
   - Selecciona "Developer Default" o "Server only"
   - **Guarda la contraseña del usuario root** (la necesitarás)
   - Asegúrate de que MySQL se inicie automáticamente como servicio

**Verificar MySQL:**
```powershell
mysql --version
```

**Iniciar MySQL (si no está corriendo):**
- **XAMPP**: Abre XAMPP Control Panel y haz clic en "Start" junto a MySQL
- **MySQL Installer**: Debería iniciarse automáticamente. Verifica con:
  ```powershell
  Get-Service | Where-Object {$_.Name -like "*mysql*"}
  ```

**Crear la Base de Datos:**
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Puedes hacerlo desde:
- **Línea de comandos**: `mysql -u root -p` luego ejecuta el comando SQL
- **phpMyAdmin** (si usas XAMPP): http://localhost/phpmyadmin
- **MySQL Workbench** (si usas MySQL Installer): Conéctate y crea la base de datos

### 3. Git (Opcional pero recomendado)

Descarga Git desde [git-scm.com](https://git-scm.com/download/win)

### 4. Editor de Código

Recomendado: [Visual Studio Code](https://code.visualstudio.com/)

---

## 🚀 Instalación del Proyecto

### Paso 1: Clonar o Descargar el Proyecto

Si tienes Git instalado:
```powershell
git clone <url-del-repositorio>
cd sipi-v2
```

O descarga el código y extrae el ZIP en una carpeta.

### Paso 2: Configurar Backend

1. **Navega a la carpeta del backend:**
```powershell
cd backend
```

2. **Instala las dependencias:**
```powershell
npm install
```

**Nota:** Si encuentras errores con `node-gyp` o dependencias nativas:
- Instala "Build Tools for Visual Studio" desde [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/)
- Selecciona "Desktop development with C++" durante la instalación

3. **Crea el archivo `.env`:**
```powershell
# Copia el archivo de ejemplo
copy .env.example .env
```

4. **Edita el archivo `.env`:**
   - Abre `backend\.env` con un editor de texto
   - Configura las variables según tu instalación de MySQL:

```env
# Ejemplo para MySQL local en Windows
DATABASE_URL="mysql://root:TuPasswordAqui@localhost:3306/sipi_db"
PORT=3001
NODE_ENV=development

# Genera un JWT_SECRET seguro usando PowerShell:
# [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
JWT_SECRET=tu_secret_generado_aqui
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

**Generar JWT_SECRET en PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

5. **Crea la base de datos MySQL:**

Abre MySQL desde la línea de comandos o desde un cliente gráfico (MySQL Workbench, phpMyAdmin):

**Opción A: MySQL Command Line**
```powershell
mysql -u root -p
```
Luego ejecuta:
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Opción B: MySQL Workbench**
- Abre MySQL Workbench
- Conéctate a tu servidor MySQL
- Ejecuta: `CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

**Opción C: phpMyAdmin (si usas XAMPP)**
- Ve a `http://localhost/phpmyadmin`
- Crea una nueva base de datos llamada `sipi_db`
- Selecciona collation: `utf8mb4_unicode_ci`

6. **Verifica la configuración del entorno:**
```powershell
npm run verify:env
```

7. **Genera el cliente de Prisma:**
```powershell
npm run prisma:generate
```

8. **Ejecuta las migraciones:**
```powershell
npm run prisma:migrate
```

9. **(Opcional) Crea el usuario administrador inicial:**
```powershell
npm run create:user
```

Esto creará un usuario con:
- Username: `admin`
- Password: `admin123`
- Role: `ADMIN`

**⚠️ IMPORTANTE:** Cambia estas credenciales después del primer inicio de sesión.

### Paso 3: Configurar Frontend

1. **Navega a la carpeta del frontend:**
```powershell
cd ..\frontend
```

2. **Instala las dependencias:**
```powershell
npm install
```

**Nota:** Si tienes problemas con `node_modules` o permisos:
- Ejecuta PowerShell como Administrador
- O desactiva temporalmente el antivirus durante la instalación

3. **Crea el archivo `.env`:**
```powershell
copy .env.example .env
```

4. **Edita el archivo `.env`:**
   - Abre `frontend\.env` con un editor de texto
   - Verifica que la URL del API sea correcta:

```env
VITE_API_URL=http://localhost:3001/api
```

---

## ▶️ Ejecutar el Proyecto

### Terminal 1: Backend

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

### Terminal 2: Frontend

```powershell
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v7.2.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Verificar que funciona

1. **Backend:** Abre en tu navegador: `http://localhost:3001/health`
   - Deberías ver: `{"status":"ok","timestamp":"..."}`

2. **Frontend:** Abre en tu navegador: `http://localhost:5173/`
   - Deberías ver la página de login

---

## 🔧 Solución de Problemas Comunes en Windows

### Problema 1: Error "node-gyp" o dependencias nativas

**Solución:**
```powershell
npm install --global windows-build-tools
```

O instala "Build Tools for Visual Studio" manualmente.

### Problema 2: Error de permisos al instalar npm packages

**Solución:**
- Ejecuta PowerShell como Administrador
- O desactiva temporalmente el antivirus

### Problema 3: MySQL no se conecta

**Verifica:**
1. MySQL está corriendo:
```powershell
# Ver servicios de Windows
Get-Service | Where-Object {$_.Name -like "*mysql*"}
```

2. La contraseña en `.env` es correcta
3. El puerto 3306 está disponible
4. Firewall de Windows no está bloqueando MySQL

### Problema 4: Puerto 3001 o 5173 ya está en uso

**Solución:**
```powershell
# Ver qué proceso usa el puerto 3001
netstat -ano | findstr :3001

# Matar el proceso (reemplaza PID con el número que encuentres)
taskkill /PID <PID> /F
```

O cambia el puerto en los archivos `.env`.

### Problema 5: Error "Cannot find module" en Windows

**Solución:**
1. Elimina `node_modules` y `package-lock.json`:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
```

2. Limpia la caché de npm:
```powershell
npm cache clean --force
```

3. Reinstala:
```powershell
npm install
```

### Problema 6: Rutas con backslashes en scripts

**Solución:** Los scripts npm usan rutas relativas que funcionan en Windows. Si tienes problemas, usa PowerShell en lugar de CMD.

### Problema 7: Prisma Client no se genera

**Solución:**
```powershell
cd backend
npx prisma generate
```

Si persiste, elimina `node_modules` y reinstala.

---

## 📝 Notas Importantes para Windows

1. **Rutas:** Windows usa `\` en lugar de `/`, pero Node.js maneja esto automáticamente en la mayoría de casos.

2. **Variables de Entorno:** En PowerShell, usa `$env:VARIABLE_NAME="valor"` para variables temporales.

3. **Scripts:** Los scripts en `package.json` usan comandos que funcionan tanto en Windows como en Mac/Linux gracias a `cross-env` o rutas relativas.

4. **Terminales:** Se recomienda usar PowerShell en lugar de CMD para mejor experiencia.

5. **Path demasiado largo:** Si encuentras errores de "path too long", habilita soporte para rutas largas en Windows:
   - Ejecuta PowerShell como Administrador
   - Ejecuta: `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force`
   - Reinicia el equipo

---

## ✅ Verificación Final

Una vez que todo esté instalado, verifica:

1. ✅ Backend se conecta a MySQL
2. ✅ Migraciones de Prisma ejecutadas correctamente
3. ✅ Frontend puede comunicarse con el backend
4. ✅ Puedes iniciar sesión con las credenciales por defecto

---

## 🆘 Obtener Ayuda

Si encuentras problemas que no están cubiertos aquí:

1. Revisa los logs de error en las terminales
2. Verifica que todos los prerrequisitos estén instalados
3. Consulta la documentación general en `README.md`
4. Revisa `docs/setup/troubleshooting.md`

---

¡Feliz desarrollo! 🚀

