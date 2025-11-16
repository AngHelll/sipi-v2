# Configuración de Base de Datos

## Requisitos

- MySQL 8.0 o superior
- Usuario con permisos para crear bases de datos

## Instalación de MySQL

### macOS (Homebrew)

```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Windows

Descargar e instalar desde [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)

## Configuración Inicial

### 1. Acceder a MySQL

```bash
mysql -u root -p
```

### 2. Crear Base de Datos

```sql
CREATE DATABASE sipi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Crear Usuario (Opcional)

```sql
CREATE USER 'sipi_user'@'localhost' IDENTIFIED BY 'tu_password_segura';
GRANT ALL PRIVILEGES ON sipi_db.* TO 'sipi_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configurar Variables de Entorno

Editar `backend/.env`:

```env
DATABASE_URL="mysql://sipi_user:tu_password_segura@localhost:3306/sipi_db"
```

## Migraciones con Prisma

### Generar Cliente de Prisma

```bash
cd backend
npm run prisma:generate
```

### Ejecutar Migraciones

```bash
npm run prisma:migrate
```

Esto creará todas las tablas según el esquema definido en `prisma/schema.prisma`.

## Prisma Studio

Para visualizar y editar datos de forma visual:

```bash
cd backend
npm run prisma:studio
```

Abre `http://localhost:5555` en tu navegador.

## Estructura de la Base de Datos

### Entidades Principales

- **users**: Usuarios del sistema (autenticación)
- **students**: Perfiles de estudiantes
- **teachers**: Perfiles de maestros
- **subjects**: Materias académicas
- **groups**: Grupos de clase
- **enrollments**: Inscripciones estudiante-grupo

Ver `backend/prisma/schema.prisma` para el esquema completo.

## Resolución de Problemas

### Error: Can't connect to MySQL server

1. Verificar que MySQL esté corriendo:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mysql
   ```

2. Verificar conexión:
   ```bash
   mysql -u root -p -h localhost
   ```

3. Verificar puerto (por defecto 3306):
   ```bash
   netstat -an | grep 3306
   ```

### Error: Access denied

Verificar credenciales en `.env` y permisos del usuario MySQL.

### Error: Database does not exist

Crear la base de datos manualmente o verificar el nombre en `DATABASE_URL`.

