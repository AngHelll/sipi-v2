# Configurar Contraseña de MySQL en XAMPP y phpMyAdmin

## 🔍 Problema

Después de cambiar la contraseña de MySQL, phpMyAdmin no puede conectarse porque aún intenta conectarse sin contraseña.

Error: `Access denied for user 'root'@'localhost' (using password: NO)`

---

## ✅ Solución: Configurar phpMyAdmin con la Nueva Contraseña

### Paso 1: Editar config.inc.php de phpMyAdmin

1. **Abre el archivo de configuración de phpMyAdmin:**
   - Navega a: `C:\xampp\phpMyAdmin\`
   - Abre el archivo `config.inc.php` con un editor de texto (Notepad, VS Code, etc.)

2. **Busca la sección de configuración del servidor MySQL:**
   Busca una sección que se vea así:
   ```php
   /* Server parameters */
   $cfg['Servers'][$i]['host'] = 'localhost';
   $cfg['Servers'][$i]['user'] = 'root';
   $cfg['Servers'][$i]['password'] = '';
   ```

3. **Actualiza la contraseña:**
   Cambia la línea de password a tu nueva contraseña:
   ```php
   $cfg['Servers'][$i]['password'] = 'TuNuevaContraseñaAqui';
   ```

4. **Guarda el archivo**

5. **Reinicia Apache** desde XAMPP Control Panel (Stop y luego Start)

6. **Intenta acceder a phpMyAdmin nuevamente:**
   - Ve a: `http://localhost/phpmyadmin/`
   - Debería funcionar ahora

---

## 🔧 Solución Alternativa: Usar auth_type 'cookie' (Recomendado)

Si prefieres que phpMyAdmin te pida la contraseña cada vez (más seguro):

### Paso 1: Editar config.inc.php

1. **Abre:** `C:\xampp\phpMyAdmin\config.inc.php`

2. **Busca la línea:**
   ```php
   $cfg['Servers'][$i]['auth_type'] = 'config';
   ```

3. **Cámbiala a:**
   ```php
   $cfg['Servers'][$i]['auth_type'] = 'cookie';
   ```

4. **Asegúrate de que la contraseña esté vacía:**
   ```php
   $cfg['Servers'][$i]['password'] = '';
   ```

5. **Guarda el archivo**

6. **Reinicia Apache** desde XAMPP Control Panel

7. **Accede a phpMyAdmin:**
   - Ahora phpMyAdmin te pedirá usuario y contraseña en una pantalla de login
   - Usuario: `root`
   - Contraseña: La que configuraste en MySQL

---

## 🔄 Solución: Si Quieres Volver a Sin Contraseña

Si prefieres trabajar sin contraseña (solo para desarrollo):

### Paso 1: Conectar a MySQL desde la línea de comandos

1. Abre PowerShell
2. Navega a MySQL en XAMPP:
   ```powershell
   cd C:\xampp\mysql\bin
   ```

3. Si tienes la contraseña, conecta:
   ```powershell
   .\mysql.exe -u root -p
   # Ingresa tu contraseña
   ```

4. **Quita la contraseña:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Paso 2: Actualizar config.inc.php

1. **Abre:** `C:\xampp\phpMyAdmin\config.inc.php`

2. **Asegúrate de que la contraseña esté vacía:**
   ```php
   $cfg['Servers'][$i]['password'] = '';
   ```

3. **Guarda el archivo**

4. **Reinicia Apache**

---

## 📋 Configuración Completa de config.inc.php (Ejemplo)

Aquí tienes un ejemplo completo de cómo debería verse la configuración:

### Opción A: Con contraseña guardada (menos seguro, más conveniente)

```php
/* Server parameters */
$cfg['Servers'][$i]['host'] = 'localhost';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = false;
$cfg['Servers'][$i]['auth_type'] = 'config';
$cfg['Servers'][$i]['user'] = 'root';
$cfg['Servers'][$i]['password'] = 'TuContraseñaAqui';
```

### Opción B: Con autenticación por cookie (más seguro, pide contraseña)

```php
/* Server parameters */
$cfg['Servers'][$i]['host'] = 'localhost';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = false;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['user'] = 'root';
$cfg['Servers'][$i]['password'] = '';
```

---

## 🔐 Configurar Contraseña Correctamente en MySQL

Si quieres configurar una contraseña correctamente desde el principio:

### Paso 1: Conectar a MySQL (sin contraseña o con la anterior)

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
# O si tienes contraseña:
.\mysql.exe -u root -p
```

### Paso 2: Cambiar la contraseña

```sql
-- Cambiar contraseña para root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'TuNuevaContraseñaAqui';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 3: Verificar la nueva contraseña

```powershell
.\mysql.exe -u root -p
# Ingresa la nueva contraseña
# Si funciona, verás el prompt de MySQL
```

### Paso 4: Actualizar config.inc.php

Como se explicó arriba, actualiza el archivo `config.inc.php` con la nueva contraseña.

---

## ⚙️ Configurar el Proyecto con la Nueva Contraseña

Una vez que tengas la contraseña configurada correctamente, actualiza el archivo `.env` del backend:

### Editar backend/.env

1. Abre el archivo: `backend\.env`

2. Actualiza la línea `DATABASE_URL` con tu contraseña:

**Con contraseña:**
```env
DATABASE_URL="mysql://root:TuContraseñaAqui@localhost:3306/sipi_db"
```

**Sin contraseña (desarrollo):**
```env
DATABASE_URL="mysql://root@localhost:3306/sipi_db"
```

3. **Guarda el archivo**

---

## 🔧 Solución de Problemas

### Problema 1: "Access denied" incluso después de actualizar config.inc.php

**Solución:**
1. Verifica que guardaste el archivo `config.inc.php`
2. Reinicia Apache completamente (Stop y luego Start)
3. Verifica que la contraseña en `config.inc.php` sea exactamente la misma que configuraste en MySQL

### Problema 2: No puedo editar config.inc.php (permisos)

**Solución:**
1. Haz clic derecho en `config.inc.php`
2. Selecciona **"Propiedades"**
3. Ve a la pestaña **"Seguridad"**
4. Haz clic en **"Editar"**
5. Marca **"Control total"** para tu usuario
6. Haz clic en **"Aplicar"** y **"Aceptar"**

O ejecuta tu editor como Administrador:
1. Busca tu editor (Notepad, VS Code, etc.)
2. Haz clic derecho → **"Ejecutar como administrador"**
3. Abre el archivo `config.inc.php`

### Problema 3: phpMyAdmin se carga pero no puede conectarse

**Verifica:**
1. MySQL está corriendo en XAMPP Control Panel (verde)
2. La contraseña en `config.inc.php` es correcta
3. Puedes conectarte desde la línea de comandos con esa contraseña:
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysql.exe -u root -p
   # Ingresa tu contraseña
   ```

### Problema 4: Olvidé la contraseña que configuré

**Solución: Resetear la contraseña de root**

1. Detén MySQL desde XAMPP Control Panel
2. Abre PowerShell como Administrador
3. Inicia MySQL en modo seguro:
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysqld.exe --skip-grant-tables
   ```

4. Abre otra ventana de PowerShell:
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysql.exe -u root
   ```

5. Resetea la contraseña:
   ```sql
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```

6. Cierra el MySQL en modo seguro (Ctrl+C en la primera ventana)
7. Reinicia MySQL normalmente desde XAMPP Control Panel

---

## 📝 Resumen Rápido

**Para configurar phpMyAdmin con contraseña:**

1. Edita `C:\xampp\phpMyAdmin\config.inc.php`
2. Busca: `$cfg['Servers'][$i]['password'] = '';`
3. Cámbiala a: `$cfg['Servers'][$i]['password'] = 'TuContraseña';`
4. Guarda el archivo
5. Reinicia Apache en XAMPP
6. Actualiza `backend/.env` con la misma contraseña

**O usa autenticación por cookie (más seguro):**

1. Edita `C:\xampp\phpMyAdmin\config.inc.php`
2. Cambia: `$cfg['Servers'][$i]['auth_type'] = 'cookie';`
3. Deja la contraseña vacía: `$cfg['Servers'][$i]['password'] = '';`
4. Guarda y reinicia Apache
5. phpMyAdmin te pedirá usuario y contraseña al acceder

---

## ✅ Checklist

Después de configurar, verifica:

- [ ] MySQL está corriendo en XAMPP (verde)
- [ ] Apache está corriendo en XAMPP (verde)
- [ ] `config.inc.php` tiene la contraseña correcta (o auth_type='cookie')
- [ ] Puedes acceder a `http://localhost/phpmyadmin/`
- [ ] `backend/.env` tiene la misma contraseña en `DATABASE_URL`
- [ ] El proyecto puede conectarse a MySQL

---

## 🔗 Enlaces Útiles

- **Configuración phpMyAdmin**: https://docs.phpmyadmin.net/en/latest/config.html
- **Documentación MySQL**: https://dev.mysql.com/doc/
- **Solución de Problemas**: `docs/setup/troubleshooting.md`


