# Reinstalar MySQL en XAMPP (Solución Limpia)

## 🎯 Cuándo Reinstalar

Reinstala si:
- ✅ Hay errores de checksum en las tablas del sistema
- ✅ Las tablas están corruptas
- ✅ Nada de lo anterior funcionó
- ✅ Prefieres empezar desde cero

---

## ✅ Método 1: Reinstalar Solo MySQL en XAMPP (Recomendado)

Este método mantiene tus bases de datos si las tienes.

### Paso 1: Hacer Backup (Si Tienes Datos Importantes)

Si tienes bases de datos que quieres conservar:

1. Abre XAMPP Control Panel
2. Inicia MySQL (si no está corriendo)
3. Abre PowerShell:
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysql.exe -u root -p
   ```
   (Usa tu contraseña actual o déjala vacía si no tienes)

4. Lista tus bases de datos:
   ```sql
   SHOW DATABASES;
   ```

5. Si tienes datos importantes, haz backup:
   ```powershell
   # Sal de MySQL primero: EXIT;
   .\mysqldump.exe -u root -p --all-databases > C:\backup_mysql.sql
   ```

### Paso 2: Detener MySQL

1. En XAMPP Control Panel, haz clic en **"Stop"** junto a MySQL
2. Espera a que se detenga completamente

### Paso 3: Eliminar Carpeta de Datos de MySQL

1. Ve a: `C:\xampp\mysql\data\`
2. **IMPORTANTE:** Si tienes bases de datos importantes, haz backup de la carpeta completa antes
3. Elimina **SOLO** estas carpetas:
   - `mysql` (tablas del sistema)
   - `performance_schema` (opcional, se recreará)
   - `phpmyadmin` (opcional, se recreará)

   **NO elimines:**
   - Tus bases de datos personalizadas (si las tienes)
   - La carpeta `sipi_db` (si ya la creaste)

### Paso 4: Copiar Tablas del Sistema desde Backup

1. Ve a: `C:\xampp\mysql\backup\`
2. Copia la carpeta `mysql` a `C:\xampp\mysql\data\`
3. Si no existe la carpeta backup, ve al Paso 5

### Paso 5: Si No Hay Backup, Reinstalar XAMPP

Si no tienes carpeta backup o prefieres reinstalar todo:

1. **Desinstala XAMPP:**
   - Ve a "Configuración" → "Aplicaciones"
   - Busca "XAMPP" y desinstálalo
   - O simplemente elimina la carpeta `C:\xampp` (si no instalaste nada más ahí)

2. **Descarga XAMPP nuevamente:**
   - Ve a: https://www.apachefriends.org/
   - Descarga la última versión

3. **Instala XAMPP:**
   - Ejecuta el instalador
   - Durante instalación, marca **Apache** y **MySQL**
   - Completa la instalación

4. **Inicia MySQL:**
   - Abre XAMPP Control Panel
   - Haz clic en **"Start"** junto a MySQL

5. **Verifica que funciona:**
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysql.exe -u root
   ```
   Deberías conectarte sin problemas (sin contraseña por defecto)

### Paso 6: Restaurar Datos (Si Hiciste Backup)

Si hiciste backup de tus bases de datos:

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root < C:\backup_mysql.sql
```

---

## ✅ Método 2: Reinstalación Completa de XAMPP (Más Limpia)

Si quieres empezar completamente desde cero:

### Paso 1: Desinstalar XAMPP

1. Detén Apache y MySQL en XAMPP Control Panel
2. Cierra XAMPP Control Panel
3. Ve a "Configuración" → "Aplicaciones"
4. Busca "XAMPP" y desinstálalo
5. O elimina manualmente la carpeta `C:\xampp` (si no instalaste nada más ahí)

### Paso 2: Limpiar Registro (Opcional pero Recomendado)

1. Presiona `Windows + R`
2. Escribe: `regedit`
3. Busca: `HKEY_LOCAL_MACHINE\SOFTWARE\XAMPP`
4. Elimina la entrada (si existe)
5. Cierra el Editor del Registro

### Paso 3: Reinstalar XAMPP

1. Descarga XAMPP desde: https://www.apachefriends.org/
2. Ejecuta el instalador
3. Durante instalación:
   - Selecciona **Apache** y **MySQL**
   - Elige la carpeta de instalación (por defecto `C:\xampp`)
   - Completa la instalación

### Paso 4: Configurar MySQL

1. Abre XAMPP Control Panel
2. Inicia MySQL (haz clic en **"Start"**)
3. Verifica que funciona:
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysql.exe -u root
   ```

### Paso 5: Crear Base de Datos del Proyecto

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

Luego en MySQL:
```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

## 🔄 Método 3: Usar MySQL Installer en Lugar de XAMPP (Alternativa)

Si XAMPP te está dando muchos problemas, considera usar MySQL Installer oficial:

### Ventajas:
- ✅ Más estable
- ✅ Mejor para producción
- ✅ Incluye MySQL Workbench (herramienta profesional)
- ✅ Menos problemas de configuración

### Desventajas:
- ⚠️ Más complejo de instalar
- ⚠️ Requiere más configuración

**Instalación:**
1. Descarga desde: https://dev.mysql.com/downloads/installer/
2. Selecciona "MySQL Installer (Web)"
3. Durante instalación:
   - Selecciona "Developer Default" o "Server only"
   - Configura contraseña para root
   - Marca "Start the MySQL Server at System Startup"
4. Completa la instalación

**Configurar phpMyAdmin:**
Si quieres seguir usando phpMyAdmin, puedes instalarlo por separado o usar MySQL Workbench que viene incluido.

---

## 📋 Checklist Después de Reinstalar

Después de reinstalar, verifica:

- [ ] MySQL inicia correctamente en XAMPP
- [ ] Puedes conectarte: `mysql.exe -u root`
- [ ] phpMyAdmin funciona: `http://localhost/phpmyadmin/`
- [ ] Base de datos `sipi_db` creada (si la necesitas)
- [ ] `backend/.env` configurado correctamente
- [ ] El proyecto puede conectarse a MySQL

---

## 🚨 Si Reinstalar No Funciona

Si después de reinstalar sigues teniendo problemas:

1. **Verifica que no haya otros servicios MySQL corriendo:**
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*mysql*"}
   ```

2. **Verifica que el puerto 3306 esté libre:**
   ```powershell
   netstat -ano | findstr :3306
   ```

3. **Revisa los logs de error:**
   - XAMPP Control Panel → "Logs" junto a MySQL
   - Revisa `error.log`

4. **Considera usar Docker** (alternativa moderna):
   - Instala Docker Desktop
   - Usa un contenedor MySQL preconfigurado
   - Más fácil de resetear y configurar

---

## ✅ Recomendación Final

**Para desarrollo rápido:** Reinstala XAMPP completo (Método 2)
- Más limpio
- Empiezas desde cero
- Menos problemas

**Para producción o aprendizaje:** Usa MySQL Installer (Método 3)
- Más profesional
- Mejor rendimiento
- Herramientas incluidas

---

## 🔗 Enlaces Útiles

- **XAMPP**: https://www.apachefriends.org/
- **MySQL Installer**: https://dev.mysql.com/downloads/installer/
- **Guía de Instalación Windows**: `docs/setup/windows-installation.md`
- **Solución de Problemas**: `docs/setup/troubleshooting.md`



