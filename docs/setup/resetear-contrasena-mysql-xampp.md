# Resetear Contraseña de MySQL en XAMPP

## 🔍 Entendiendo el Problema

phpMyAdmin no tiene su propia contraseña. Usa las credenciales de MySQL. Si cambiaste la contraseña de MySQL y ahora phpMyAdmin no funciona, necesitas:

1. **Resetear la contraseña de MySQL** (volver a sin contraseña o cambiar a una nueva)
2. **Actualizar config.inc.php de phpMyAdmin** para que coincida

---

## ✅ Método 1: Resetear a Sin Contraseña (Más Fácil para Desarrollo)

### Paso 1: Detener MySQL

1. Abre **XAMPP Control Panel**
2. Haz clic en **"Stop"** junto a MySQL
3. Espera a que se detenga completamente

### Paso 2: Iniciar MySQL en Modo Seguro

1. Abre **PowerShell como Administrador**:
   - Presiona `Windows + X`
   - Selecciona **"Windows PowerShell (Administrador)"** o **"Terminal (Administrador)"**

2. Navega a la carpeta de MySQL:
   ```powershell
   cd C:\xampp\mysql\bin
   ```

3. Inicia MySQL en modo seguro (sin verificación de contraseñas):
   ```powershell
   .\mysqld.exe --skip-grant-tables --skip-external-locking
   ```

   **Nota:** Deja esta ventana abierta. Verás que MySQL está corriendo.

### Paso 3: Conectar a MySQL (Sin Contraseña)

Abre **otra ventana** de PowerShell (no necesitas ser administrador):

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

Deberías conectarte sin problemas.

### Paso 4: Resetear la Contraseña

Una vez dentro de MySQL/MariaDB, ejecuta estos comandos **UNO POR UNO** (copia solo el texto SQL, NO los bloques de código):

**IMPORTANTE:** Copia solo el texto SQL, NO incluyas ```sql o ```

**IMPORTANTE:** En modo `--skip-grant-tables`, `ALTER USER` NO funciona. Usa estos métodos:

**IMPORTANTE:** En MariaDB, `user` es una VISTA, no una tabla. Necesitas actualizar la tabla base directamente.

**Opción A: Actualizar tabla base mysql.user directamente (Para MariaDB) - RECOMENDADO:**
```
USE mysql;
```

Luego ejecuta (actualiza la tabla base, NO la vista):
```
UPDATE mysql.user SET password='' WHERE User='root' AND Host='localhost';
```

Luego:
```
FLUSH PRIVILEGES;
```

**Opción B: Si la Opción A da error de checksum, primero repara las tablas:**
```
USE mysql;
```

Luego repara las tablas:
```
REPAIR TABLE user;
```

Luego intenta de nuevo:
```
UPDATE mysql.user SET password='' WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;
```

**Opción C: Si ninguna funciona, actualiza usando la sintaxis completa de MariaDB:**
```
USE mysql;
```

Luego:
```
UPDATE mysql.user SET password=PASSWORD(''), plugin='mysql_native_password' WHERE User='root' AND Host='localhost';
```

Luego:
```
FLUSH PRIVILEGES;
```

**Opción D: Si hay errores de checksum, sal del modo seguro y usa otro método:**
1. Sal de MySQL: `EXIT;`
2. Detén MySQL en modo seguro (Ctrl+C)
3. Inicia MySQL normalmente desde XAMPP
4. Conecta: `mysql.exe -u root -p` (usa la contraseña actual)
5. Luego ejecuta: `ALTER USER 'root'@'localhost' IDENTIFIED BY '';`

**Nota:** En MariaDB, `user` es una vista. Usa `mysql.user` para actualizar la tabla base directamente.

### Paso 5: Salir y Reiniciar MySQL Normalmente

1. En la ventana de MySQL, escribe:
   ```sql
   EXIT;
   ```

2. En la ventana donde está MySQL en modo seguro, presiona `Ctrl + C` para detenerlo

3. En **XAMPP Control Panel**, inicia MySQL normalmente (haz clic en **"Start"**)

### Paso 6: Verificar que Funciona Sin Contraseña

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

Deberías conectarte sin pedir contraseña.

### Paso 7: Actualizar phpMyAdmin

1. Abre: `C:\xampp\phpMyAdmin\config.inc.php`

2. Asegúrate de que la contraseña esté vacía:
   ```php
   $cfg['Servers'][$i]['password'] = '';
   ```

3. Guarda el archivo

4. Reinicia Apache en XAMPP Control Panel

5. Accede a: `http://localhost/phpmyadmin/`

---

## ✅ Método 2: Cambiar a una Nueva Contraseña

Si prefieres tener una contraseña pero cambiarla a una nueva:

### Paso 1-3: Igual que el Método 1

Sigue los pasos 1-3 del Método 1 para iniciar MySQL en modo seguro y conectarte.

### Paso 4: Establecer Nueva Contraseña

Una vez dentro de MySQL/MariaDB, ejecuta **UNO POR UNO**:

**IMPORTANTE:** Copia solo el texto SQL, NO incluyas ```sql o ```

Primero:
```
USE mysql;
```

**Opción A: Para MariaDB (XAMPP moderno) - RECOMENDADO:**
```
UPDATE user SET password=PASSWORD('NuevaContraseña123') WHERE User='root' AND Host='localhost';
```

Luego:
```
FLUSH PRIVILEGES;
```

**Opción B: Si la Opción A no funciona:**
```
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NuevaContraseña123';
```

Luego:
```
FLUSH PRIVILEGES;
```

**Nota:** Reemplaza `NuevaContraseña123` con la contraseña que quieras usar.

### Paso 5-6: Igual que el Método 1

Sigue los pasos 5-6 para reiniciar MySQL normalmente.

### Paso 7: Actualizar phpMyAdmin con Nueva Contraseña

1. Abre: `C:\xampp\phpMyAdmin\config.inc.php`

2. Actualiza la contraseña:
   ```php
   $cfg['Servers'][$i]['password'] = 'NuevaContraseña123';
   ```

3. Guarda el archivo

4. Reinicia Apache

5. Actualiza también `backend/.env`:
   ```env
   DATABASE_URL="mysql://root:NuevaContraseña123@localhost:3306/sipi_db"
   ```

---

## 🔧 Método 3: Usando XAMPP Shell (Alternativa)

Si los métodos anteriores no funcionan:

### Paso 1: Abrir XAMPP Shell

1. En **XAMPP Control Panel**, haz clic en **"Shell"** (botón en la parte inferior)

2. Esto abrirá una ventana de comandos en la carpeta de XAMPP

### Paso 2: Detener MySQL

```bash
mysql\bin\mysqladmin.exe -u root shutdown
```

### Paso 3: Iniciar MySQL en Modo Seguro

En una nueva ventana de PowerShell como Administrador:

```powershell
cd C:\xampp\mysql\bin
.\mysqld.exe --skip-grant-tables
```

### Paso 4: Resetear Contraseña

En otra ventana de PowerShell:

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

Luego en MySQL/MariaDB, ejecuta **UNO POR UNO** (copia solo el SQL, sin ```sql):

```
USE mysql;
```

Luego:
```
UPDATE user SET authentication_string='' WHERE User='root' AND Host='localhost';
```

Luego:
```
FLUSH PRIVILEGES;
```

Luego:
```
EXIT;
```

### Paso 5: Reiniciar MySQL

1. Detén MySQL en modo seguro (Ctrl+C)
2. Inicia MySQL desde XAMPP Control Panel

---

## 🚨 Solución de Problemas

### Problema 1: "Access denied" al intentar conectar en modo seguro

**Solución:**
- Asegúrate de que MySQL esté completamente detenido antes de iniciarlo en modo seguro
- Verifica que no haya otro proceso de MySQL corriendo:
  ```powershell
  Get-Process | Where-Object {$_.ProcessName -like "*mysqld*"}
  ```
- Si hay procesos, detén MySQL desde XAMPP y espera unos segundos

### Problema 2: "Table 'mysql.user' doesn't exist"

**Solución:**
Esto significa que la base de datos `mysql` está corrupta. Necesitas reinstalar MySQL en XAMPP:

1. Haz backup de tus bases de datos (si tienes datos importantes)
2. Detén MySQL en XAMPP
3. Elimina la carpeta: `C:\xampp\mysql\data\mysql`
4. Copia la carpeta `mysql` desde `C:\xampp\mysql\backup\mysql` a `C:\xampp\mysql\data\`
5. Reinicia MySQL

### Problema 3: MySQL no inicia después de resetear

**Solución:**
1. Verifica los logs de error:
   - Abre XAMPP Control Panel
   - Haz clic en **"Logs"** junto a MySQL
   - Revisa el archivo `error.log`

2. Si hay errores, intenta:
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysqld.exe --console
   ```
   Esto mostrará los errores en la consola

### Problema 4: No puedo detener MySQL en modo seguro

**Solución:**
1. Presiona `Ctrl + C` en la ventana donde está corriendo
2. Si no funciona, cierra la ventana
3. Verifica que no haya procesos:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*mysqld*"} | Stop-Process -Force
   ```

---

## 📋 Resumen Rápido

**Para resetear a sin contraseña:**

1. Detén MySQL en XAMPP
2. Inicia MySQL en modo seguro: `mysqld.exe --skip-grant-tables`
3. Conecta: `mysql.exe -u root`
4. Ejecuta: `ALTER USER 'root'@'localhost' IDENTIFIED BY ''; FLUSH PRIVILEGES;`
5. Detén MySQL en modo seguro (Ctrl+C)
6. Inicia MySQL normalmente desde XAMPP
7. Actualiza `config.inc.php` de phpMyAdmin: `password = '';`
8. Reinicia Apache

---

## ✅ Verificación Final

Después de resetear, verifica:

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

Si te conecta sin pedir contraseña, ¡funcionó!

Luego accede a phpMyAdmin: `http://localhost/phpmyadmin/`

---

## 🔗 Enlaces Útiles

- **Documentación MySQL**: https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html
- **Configurar phpMyAdmin**: `docs/setup/configurar-contrasena-xampp.md`
- **Solución de Problemas**: `docs/setup/troubleshooting.md`

