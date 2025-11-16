# Solución: Error de Conexión a MySQL

## 🔍 Problema Identificado

Al intentar hacer login, aparece el error:
```
Can't reach database server at `localhost:3306`
```

## ✅ Soluciones Aplicadas

### 1. **Topbar.tsx Recreado**
- Archivo estaba vacío nuevamente
- Recreado con contenido completo

### 2. **MySQL en Modo Seguro**
- MySQL estaba corriendo con `--skip-grant-tables` y `--skip-networking`
- Esto impide conexiones de red (necesarias para Prisma)
- Solución: Detener y reiniciar MySQL normalmente

### 3. **Tablas No Existentes**
- Las migraciones no se habían ejecutado
- Solución: Ejecutar `npx prisma migrate deploy`

## 🚀 Pasos para Resolver

### Paso 1: Verificar Estado de MySQL
```bash
brew services list | grep mysql
ps aux | grep mysql | grep -v grep
```

### Paso 2: Si MySQL está en modo seguro, reiniciarlo
```bash
# Detener procesos MySQL
pkill -9 mysqld mysqld_safe

# Iniciar MySQL normalmente
/opt/homebrew/opt/mysql/bin/mysqld_safe --datadir=/opt/homebrew/var/mysql &

# O usar brew services
brew services restart mysql
```

### Paso 3: Verificar Conexión
```bash
mysql -u root -p'@Panama100' -e "SELECT 'MySQL OK' AS status;"
```

### Paso 4: Ejecutar Migraciones
```bash
cd backend
npx prisma migrate deploy
```

### Paso 5: Crear Usuario de Prueba
```bash
npm run create:user
```

## 🔧 Script de Verificación Rápida

```bash
#!/bin/bash
# verify-mysql.sh

echo "=== Verificando MySQL ==="

# Verificar si MySQL está corriendo
if mysql -u root -p'@Panama100' -e "SELECT 1" &>/dev/null; then
    echo "✅ MySQL está corriendo"
else
    echo "❌ MySQL no está corriendo"
    echo "Iniciando MySQL..."
    brew services start mysql
    sleep 5
fi

# Verificar tablas
cd backend
TABLES=$(mysql -u root -p'@Panama100' sipi_db -e "SHOW TABLES;" 2>/dev/null | wc -l)

if [ $TABLES -gt 1 ]; then
    echo "✅ Tablas existen ($TABLES tablas)"
else
    echo "⚠️  Tablas no existen, ejecutando migraciones..."
    npx prisma migrate deploy
fi

# Verificar usuario admin
USER_COUNT=$(mysql -u root -p'@Panama100' sipi_db -e "SELECT COUNT(*) FROM users WHERE username='admin';" 2>/dev/null | tail -1)

if [ "$USER_COUNT" -eq "1" ]; then
    echo "✅ Usuario admin existe"
else
    echo "⚠️  Usuario admin no existe, creándolo..."
    npm run create:user
fi

echo "=== Verificación completa ==="
```

## 📋 Comandos Útiles

```bash
# Iniciar MySQL
brew services start mysql
# o
/opt/homebrew/opt/mysql/bin/mysqld_safe --datadir=/opt/homebrew/var/mysql &

# Detener MySQL
brew services stop mysql
# o
pkill -9 mysqld mysqld_safe

# Ver estado
brew services list | grep mysql

# Conectar manualmente
mysql -u root -p'@Panama100' sipi_db

# Ver tablas
mysql -u root -p'@Panama100' sipi_db -e "SHOW TABLES;"

# Ver usuarios
mysql -u root -p'@Panama100' sipi_db -e "SELECT username, role FROM users;"
```

## 🎯 Estado Esperado

Después de seguir los pasos:
- ✅ MySQL corriendo normalmente (no en modo seguro)
- ✅ Tablas creadas (users, students, teachers, etc.)
- ✅ Usuario admin creado
- ✅ Backend puede conectarse a MySQL
- ✅ Login funciona correctamente

