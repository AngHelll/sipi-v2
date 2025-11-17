# Instalar MySQL en Windows

Esta guía te ayudará a instalar MySQL en Windows para el proyecto SIPI Modern.

## 🎯 Recomendación por Tipo de Usuario

### Para Desarrollo (Más Fácil) 👨‍💻
**Recomendado: XAMPP**
- ✅ Instalación simple
- ✅ Panel de control visual
- ✅ Incluye phpMyAdmin (interfaz web)
- ✅ No requiere configuración compleja
- ⚠️ Menos optimizado para producción

### Para Producción (Más Completo) 🚀
**Recomendado: MySQL Installer**
- ✅ Instalación completa y profesional
- ✅ Optimizado para producción
- ✅ Herramientas adicionales (MySQL Workbench)
- ✅ Mejor rendimiento
- ⚠️ Requiere más configuración

---

## 📥 Opción 1: XAMPP (Recomendado para Desarrollo)

### Paso 1: Descargar XAMPP

1. Ve a la página oficial: https://www.apachefriends.org/
2. Haz clic en **"Download"** para Windows
3. Descarga la versión más reciente (incluye MySQL 8.0+)
4. El archivo será algo como: `xampp-windows-x64-8.x.x-installer.exe`

### Paso 2: Instalar XAMPP

1. Ejecuta el instalador descargado
2. Si aparece una advertencia de Windows Defender, haz clic en **"Más información"** y **"Ejecutar de todos modos"**
3. En el asistente de instalación:
   - Selecciona los componentes: Marca **Apache** y **MySQL** (PHP es opcional para este proyecto)
   - Elige la carpeta de instalación (por defecto: `C:\xampp`)
   - Marca **"Service"** para Apache y MySQL si quieres que inicien automáticamente (opcional)
   - Completa la instalación

### Paso 3: Iniciar MySQL

1. Abre **XAMPP Control Panel** desde el menú de inicio
2. Busca **MySQL** en la lista
3. Haz clic en **"Start"** junto a MySQL
4. Deberías ver que MySQL cambia a color **verde** (corriendo)

### Paso 4: Configurar MySQL

**MySQL en XAMPP viene sin contraseña por defecto:**

1. Abre PowerShell o CMD
2. Navega a la carpeta de MySQL en XAMPP:
   ```powershell
   cd C:\xampp\mysql\bin
   ```

3. Conecta a MySQL (sin contraseña):
   ```powershell
   .\mysql.exe -u root
   ```

4. Una vez dentro de MySQL, configura una contraseña (recomendado):
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'TuPasswordAqui';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. Verifica la conexión con contraseña:
   ```powershell
   .\mysql.exe -u root -p
   # Ingresa la contraseña que acabas de crear
   ```

### Paso 5: Agregar MySQL al PATH (Opcional pero Recomendado)

Para poder usar `mysql` desde cualquier lugar:

1. Abre **"Variables de entorno"**:
   - Presiona `Windows + R`
   - Escribe: `sysdm.cpl`
   - Ve a la pestaña **"Opciones avanzadas"**
   - Haz clic en **"Variables de entorno"**

2. En **"Variables del sistema"**, busca `Path` y haz clic en **"Editar"**

3. Haz clic en **"Nuevo"** y agrega:
   ```
   C:\xampp\mysql\bin
   ```

4. Haz clic en **"Aceptar"** en todas las ventanas

5. **Cierra y abre una nueva ventana** de PowerShell/CMD

6. Verifica:
   ```powershell
   mysql --version
   ```

### Paso 6: Crear la Base de Datos

Opción A: Desde la línea de comandos
```powershell
mysql -u root -p
```

Luego ejecuta:
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Opción B: Desde phpMyAdmin (Más fácil)
1. En XAMPP Control Panel, inicia **Apache** (si no está corriendo)
2. Abre tu navegador y ve a: http://localhost/phpmyadmin
3. Haz clic en **"Nueva"** en el menú lateral
4. Nombre de la base de datos: `sipi_db`
5. Cotejamiento (Collation): `utf8mb4_unicode_ci`
6. Haz clic en **"Crear"**

---

## 📥 Opción 2: MySQL Installer (Recomendado para Producción)

### Paso 1: Descargar MySQL Installer

1. Ve a: https://dev.mysql.com/downloads/installer/
2. Hay dos opciones:
   - **MySQL Installer (Full)**: Incluye todo (~400MB)
   - **MySQL Installer (Web)**: Descarga solo lo necesario (~3MB)
3. Descarga el **"MySQL Installer (Full)"** o el **"Web"** (recomendado)

### Paso 2: Instalar MySQL

1. Ejecuta el instalador descargado
2. Si aparece advertencia de Windows Defender, haz clic en **"Más información"** y **"Ejecutar de todos modos"**
3. Selecciona el tipo de instalación:
   - **"Developer Default"**: Para desarrollo (incluye MySQL Workbench, etc.)
   - **"Server only"**: Solo el servidor MySQL (más ligero)
4. Haz clic en **"Execute"** para instalar los componentes necesarios
5. Sigue el asistente:
   - **Configuración del servidor**: Usa el puerto por defecto `3306`
   - **Tipo de servidor**: "Development Computer" para desarrollo
   - **Autenticación**: "Use Strong Password Encryption" (recomendado)
   - **Configuración de cuentas**: 
     - Crea una contraseña para el usuario `root`
     - **¡GUARDA ESTA CONTRASEÑA!** La necesitarás para el proyecto
   - **Servicio Windows**: Marca **"Start the MySQL Server at System Startup"**
   - **Aplicar configuración**: Haz clic en **"Execute"**

### Paso 3: Verificar MySQL

1. Abre PowerShell o CMD
2. Verifica la instalación:
   ```powershell
   mysql --version
   ```

3. Verifica que MySQL esté corriendo:
   ```powershell
   # Ver servicios de Windows
   Get-Service | Where-Object {$_.Name -like "*mysql*"}
   ```

   Deberías ver MySQL con estado **"Running"**

4. Conecta a MySQL:
   ```powershell
   mysql -u root -p
   # Ingresa la contraseña que configuraste durante la instalación
   ```

### Paso 4: Crear la Base de Datos

Desde la línea de comandos:
```powershell
mysql -u root -p
```

Luego ejecuta:
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

O desde MySQL Workbench:
1. Abre **MySQL Workbench** (instalado con MySQL Installer)
2. Conéctate a tu servidor local
3. En el menú, ve a **Database > Create Database**
4. Nombre: `sipi_db`
5. Collation: `utf8mb4_unicode_ci`
6. Haz clic en **"Apply"**

---

## 🔧 Opción 3: MySQL usando Chocolatey (Si ya lo tienes)

Si ya tienes Chocolatey instalado:

```powershell
# Instalar MySQL
choco install mysql

# O instalar XAMPP (incluye MySQL)
choco install xampp-81
```

---

## 🔧 Opción 4: MySQL usando Winget (Windows 10/11)

```powershell
# Buscar MySQL
winget search mysql

# Instalar MySQL
winget install Oracle.MySQL

# O instalar XAMPP
winget install ApacheFriends.XAMPP
```

---

## ✅ Verificar Instalación

Después de instalar MySQL, verifica que todo funciona:

```powershell
# 1. Verificar que MySQL está instalado
mysql --version

# 2. Verificar que MySQL está corriendo
Get-Service | Where-Object {$_.Name -like "*mysql*"}

# 3. Probar conexión (reemplaza 'TuPassword' con tu contraseña)
mysql -u root -p -e "SELECT 'MySQL OK' AS status;"
```

Deberías ver:
```
mysql  Ver 8.0.xx for Win64 on x86_64
Status   Name               DisplayName
------   ----               -----------
Running  MySQL80            MySQL80
status
MySQL OK
```

---

## 🔐 Configurar Contraseña (Si usas XAMPP)

XAMPP viene sin contraseña por defecto. Para mayor seguridad, configura una:

**Opción A: Desde la línea de comandos**
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

Luego en MySQL:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'TuPasswordSegura';
FLUSH PRIVILEGES;
EXIT;
```

**Opción B: Usar el panel de XAMPP**
1. Abre XAMPP Control Panel
2. Haz clic en **"Admin"** junto a MySQL
3. Esto abre phpMyAdmin
4. Ve a la pestaña **"Cuentas de usuario"**
5. Haz clic en **"root"** y luego **"Editar privilegios"**
6. Haz clic en **"Cambiar contraseña"**
7. Ingresa y confirma la nueva contraseña
8. Haz clic en **"Ir"**

---

## 🚨 Solución de Problemas

### Problema 1: MySQL no se inicia (XAMPP)

**Solución:**
1. Verifica que el puerto 3306 no esté en uso:
   ```powershell
   netstat -ano | findstr :3306
   ```
2. Si hay un proceso usando el puerto, detén MySQL desde XAMPP y vuelve a iniciarlo
3. Si persiste, reinicia tu computadora

### Problema 2: "mysql no se reconoce como comando"

**Solución:**
1. Agrega MySQL al PATH (ver Paso 5 de XAMPP arriba)
2. O usa la ruta completa:
   - XAMPP: `C:\xampp\mysql\bin\mysql.exe`
   - MySQL Installer: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`

### Problema 3: Error de autenticación

**Solución:**
1. Verifica que estás usando la contraseña correcta
2. Si olvidaste la contraseña de root:
   - XAMPP: MySQL viene sin contraseña, intenta sin `-p`
   - MySQL Installer: Necesitas resetear la contraseña (consulta documentación de MySQL)

### Problema 4: Firewall bloqueando MySQL

**Solución:**
1. Abre **"Windows Defender Firewall"**
2. Haz clic en **"Permitir una app o característica"**
3. Busca **MySQL** y marca **"Privado"** y **"Público"**
4. O crea una regla de entrada para el puerto 3306

### Problema 5: Puerto 3306 ya está en uso

**Solución:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3306

# Matar el proceso (reemplaza <PID> con el número que encuentres)
taskkill /PID <PID> /F
```

---

## 📋 Configuración para el Proyecto

Una vez instalado MySQL y creada la base de datos `sipi_db`, configura el archivo `.env` del backend:

```env
DATABASE_URL="mysql://root:TuPasswordAqui@localhost:3306/sipi_db"
```

**Ejemplos:**
- XAMPP sin contraseña: `DATABASE_URL="mysql://root@localhost:3306/sipi_db"`
- XAMPP con contraseña: `DATABASE_URL="mysql://root:MiPassword123@localhost:3306/sipi_db"`
- MySQL Installer: `DATABASE_URL="mysql://root:LaPasswordDeInstalacion@localhost:3306/sipi_db"`

---

## 🎯 Recomendación Final

Para **desarrollo rápido**: Usa **XAMPP**
- Instalación más simple
- Panel visual para gestionar servicios
- phpMyAdmin incluido para administrar bases de datos

Para **aprender mejor** o **producción**: Usa **MySQL Installer**
- Instalación más completa
- MySQL Workbench incluido (herramienta profesional)
- Mejor rendimiento

---

## 📚 Enlaces Útiles

- **XAMPP**: https://www.apachefriends.org/
- **MySQL Installer**: https://dev.mysql.com/downloads/installer/
- **MySQL Workbench**: https://dev.mysql.com/downloads/workbench/
- **Documentación MySQL**: https://dev.mysql.com/doc/

---

## ✅ Próximo Paso

Después de instalar MySQL y crear la base de datos `sipi_db`:

1. Configura `backend/.env` con tu `DATABASE_URL`
2. Continúa con la instalación: `docs/setup/windows-installation.md`


