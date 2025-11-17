# Solución: phpMyAdmin No Se Puede Acceder (ERR_CONNECTION_REFUSED)

## 🔍 Diagnóstico del Problema

El error `ERR_CONNECTION_REFUSED` en `localhost/phpmyadmin/` generalmente significa que **Apache no está corriendo** en XAMPP.

phpMyAdmin requiere **Apache** para funcionar, no solo MySQL.

---

## ✅ Solución Rápida

### Paso 1: Verificar XAMPP Control Panel

1. Abre **XAMPP Control Panel**
2. Busca **Apache** en la lista
3. Si dice **"Stopped"** o no hay marca verde, necesitas iniciarlo:
   - Haz clic en **"Start"** junto a Apache
   - Espera a que cambie a **verde** (corriendo)

4. También verifica que **MySQL** esté corriendo (debería estar verde)

### Paso 2: Verificar Puertos

Si Apache no inicia, puede ser que el puerto **80** (HTTP) esté en uso por otro programa.

**Verificar qué usa el puerto 80:**
```powershell
netstat -ano | findstr :80
```

**Si hay un proceso usando el puerto 80, tienes opciones:**

**Opción A: Cambiar el puerto de Apache en XAMPP**
1. En XAMPP Control Panel, haz clic en **"Config"** junto a Apache
2. Selecciona **"httpd.conf"**
3. Busca la línea: `Listen 80`
4. Cámbiala a: `Listen 8080` (o cualquier otro puerto libre)
5. Guarda el archivo
6. Reinicia Apache desde XAMPP Control Panel

Luego accede a phpMyAdmin en: `http://localhost:8080/phpmyadmin/`

**Opción B: Detener el servicio que usa el puerto 80**

Si el puerto 80 está siendo usado por otro servicio (como IIS de Windows):

```powershell
# Ver qué servicio usa el puerto 80
netstat -ano | findstr :80

# Detener IIS si está corriendo
Stop-Service W3SVC
Set-Service W3SVC -StartupType Disabled
```

---

## 🔧 Soluciones Detalladas

### Problema 1: Apache No Inicia

**Síntomas:** Apache muestra "Stopped" o se detiene inmediatamente después de iniciarlo.

**Solución A: Verificar conflictos de puertos**
```powershell
# Verificar puerto 80 (HTTP)
netstat -ano | findstr :80

# Verificar puerto 443 (HTTPS)
netstat -ano | findstr :443
```

**Solución B: Verificar logs de error**
1. En XAMPP Control Panel, haz clic en **"Logs"** junto a Apache
2. Busca el archivo `error.log`
3. Revisa los errores más recientes

**Solución C: Cambiar puertos de Apache**
1. Abre `C:\xampp\apache\conf\httpd.conf`
2. Busca: `Listen 80` → Cambia a `Listen 8080`
3. Busca: `ServerName localhost:80` → Cambia a `ServerName localhost:8080`
4. Guarda el archivo
5. Reinicia Apache

### Problema 2: Firewall Bloqueando Apache

**Solución:**
1. Abre **"Windows Defender Firewall"**
2. Haz clic en **"Permitir una app o característica"**
3. Busca **Apache** o **XAMPP**
4. Si no está, haz clic en **"Permitir otra app"**
5. Busca `C:\xampp\apache\bin\httpd.exe`
6. Marca **"Privado"** y **"Público"**
7. Haz clic en **"Aceptar"**

O desactiva temporalmente el firewall para probar:
```powershell
# Desactivar firewall temporalmente (NO recomendado para producción)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

### Problema 3: Servicio IIS de Windows Interfiriendo

Si tienes IIS (Internet Information Services) de Windows instalado, puede estar usando el puerto 80.

**Verificar si IIS está corriendo:**
```powershell
Get-Service | Where-Object {$_.Name -like "*W3SVC*" -or $_.Name -like "*IIS*"}
```

**Detener y deshabilitar IIS:**
```powershell
# Detener IIS
Stop-Service W3SVC

# Deshabilitar IIS para que no inicie automáticamente
Set-Service W3SVC -StartupType Disabled
```

**O desinstalar IIS:**
1. Presiona `Windows + R`
2. Escribe: `appwiz.cpl`
3. Haz clic en **"Activar o desactivar las características de Windows"**
4. Desmarca **"Internet Information Services"**
5. Haz clic en **"Aceptar"**

### Problema 4: Skype u Otros Programas Usando Puerto 80

Algunos programas como Skype pueden usar el puerto 80.

**Verificar qué proceso usa el puerto 80:**
```powershell
netstat -ano | findstr :80

# Esto mostrará algo como:
# TCP    0.0.0.0:80    0.0.0.0:0    LISTENING    1234
# El último número (1234) es el PID del proceso

# Ver qué proceso es ese PID:
Get-Process -Id 1234
```

**Si es Skype:**
1. Abre Skype
2. Ve a **"Herramientas"** → **"Opciones"** → **"Avanzadas"** → **"Conexión"**
3. Desmarca **"Usar puertos 80 y 443"**
4. Reinicia Skype

---

## 🎯 Solución Alternativa: Usar MySQL Directamente (Sin phpMyAdmin)

Si no puedes hacer funcionar Apache/phpMyAdmin, puedes usar MySQL directamente desde la línea de comandos:

### Paso 1: Crear la Base de Datos

```powershell
# Navegar a la carpeta de MySQL en XAMPP
cd C:\xampp\mysql\bin

# Conectar a MySQL (XAMPP viene sin contraseña por defecto)
.\mysql.exe -u root
```

### Paso 2: Crear la Base de Datos

Una vez dentro de MySQL:
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Paso 3: Verificar

```powershell
.\mysql.exe -u root -e "SHOW DATABASES;"
```

Deberías ver `sipi_db` en la lista.

---

## 🔧 Script de Diagnóstico Completo

Ejecuta este script de PowerShell para diagnosticar el problema:

```powershell
# verify-xampp.ps1
Write-Host "=== Diagnóstico XAMPP ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si XAMPP está instalado
if (Test-Path "C:\xampp") {
    Write-Host "✅ XAMPP instalado en C:\xampp" -ForegroundColor Green
} else {
    Write-Host "❌ XAMPP no encontrado en C:\xampp" -ForegroundColor Red
    Write-Host "   Verifica la ruta de instalación" -ForegroundColor Yellow
    exit
}

# Verificar puerto 80
Write-Host "Verificando puerto 80..." -ForegroundColor Yellow
$port80 = netstat -ano | findstr ":80 "
if ($port80) {
    Write-Host "⚠️  Puerto 80 está en uso:" -ForegroundColor Yellow
    Write-Host $port80 -ForegroundColor Gray
} else {
    Write-Host "✅ Puerto 80 está libre" -ForegroundColor Green
}

# Verificar puerto 443
Write-Host "Verificando puerto 443..." -ForegroundColor Yellow
$port443 = netstat -ano | findstr ":443 "
if ($port443) {
    Write-Host "⚠️  Puerto 443 está en uso:" -ForegroundColor Yellow
    Write-Host $port443 -ForegroundColor Gray
} else {
    Write-Host "✅ Puerto 443 está libre" -ForegroundColor Green
}

# Verificar servicios de Windows
Write-Host "Verificando servicios de Windows..." -ForegroundColor Yellow
$iis = Get-Service | Where-Object {$_.Name -like "*W3SVC*" -or $_.Name -like "*IIS*"}
if ($iis) {
    Write-Host "⚠️  IIS encontrado:" -ForegroundColor Yellow
    $iis | ForEach-Object {
        Write-Host "   $($_.Name): $($_.Status)" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ IIS no encontrado" -ForegroundColor Green
}

# Verificar procesos Apache
Write-Host "Verificando procesos Apache..." -ForegroundColor Yellow
$apache = Get-Process | Where-Object {$_.ProcessName -like "*httpd*" -or $_.ProcessName -like "*apache*"}
if ($apache) {
    Write-Host "✅ Apache está corriendo:" -ForegroundColor Green
    $apache | ForEach-Object {
        Write-Host "   $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Apache NO está corriendo" -ForegroundColor Red
    Write-Host "   Inicia Apache desde XAMPP Control Panel" -ForegroundColor Yellow
}

# Verificar procesos MySQL
Write-Host "Verificando procesos MySQL..." -ForegroundColor Yellow
$mysql = Get-Process | Where-Object {$_.ProcessName -like "*mysqld*" -or $_.ProcessName -like "*mysql*"}
if ($mysql) {
    Write-Host "✅ MySQL está corriendo:" -ForegroundColor Green
    $mysql | ForEach-Object {
        Write-Host "   $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ MySQL NO está corriendo" -ForegroundColor Red
    Write-Host "   Inicia MySQL desde XAMPP Control Panel" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Fin del Diagnóstico ===" -ForegroundColor Cyan
```

Guarda el script como `verify-xampp.ps1` y ejecútalo:
```powershell
.\verify-xampp.ps1
```

---

## ✅ Checklist de Verificación

Antes de acceder a phpMyAdmin, verifica:

- [ ] XAMPP Control Panel está abierto
- [ ] **Apache** está corriendo (verde en XAMPP)
- [ ] **MySQL** está corriendo (verde en XAMPP)
- [ ] Puerto 80 está libre (o Apache usa otro puerto)
- [ ] Firewall permite Apache
- [ ] IIS no está corriendo (si está instalado)
- [ ] Intentas acceder a `http://localhost/phpmyadmin/` (no `https://`)

---

## 🚀 Acceso a phpMyAdmin

Una vez que Apache esté corriendo:

**URL por defecto:**
```
http://localhost/phpmyadmin/
```

**Si cambiaste el puerto a 8080:**
```
http://localhost:8080/phpmyadmin/
```

**Credenciales por defecto en XAMPP:**
- Usuario: `root`
- Contraseña: (vacía - sin contraseña)

---

## 🆘 Si Nada Funciona

Si después de todos estos pasos phpMyAdmin sigue sin funcionar:

1. **Usa MySQL directamente desde la línea de comandos** (ver sección arriba)
2. **Instala MySQL Workbench** (si usas MySQL Installer)
3. **Usa una herramienta alternativa** como HeidiSQL o DBeaver

---

## 📚 Enlaces Útiles

- **Documentación XAMPP**: https://www.apachefriends.org/docs/
- **Foros XAMPP**: https://community.apachefriends.org/
- **Solución de Problemas**: `docs/setup/troubleshooting.md`


