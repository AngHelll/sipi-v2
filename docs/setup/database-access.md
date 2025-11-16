# Acceso Visual a la Base de Datos

Este documento describe las diferentes formas de acceder visualmente a la base de datos MySQL del proyecto.

## Opción 1: Prisma Studio (Recomendada) ⭐

**Ventajas:**
- ✅ Ya está configurado en el proyecto
- ✅ Interfaz web moderna y fácil de usar
- ✅ Integrado con Prisma (muestra el schema directamente)
- ✅ Permite editar datos directamente
- ✅ Gratis y open source

**Cómo usarlo:**

```bash
# Desde la raíz del proyecto:
cd sipi-modern/backend
npm run prisma:studio

# O si ya estás en la raíz del proyecto:
cd backend
npm run prisma:studio
```

**⚠️ Importante:** Debes ejecutarlo desde el directorio `backend/` porque ahí está:
- El archivo `package.json` con el script
- El directorio `prisma/` con el schema
- El archivo `.env` con la configuración de la base de datos

Esto abrirá una interfaz web en: **http://localhost:5555**

**Características:**
- Ver todas las tablas (User, Student, Teacher, Subject, Group, Enrollment)
- Editar registros directamente
- Crear nuevos registros
- Filtrar y buscar datos
- Ver relaciones entre tablas

---

## Opción 2: TablePlus (macOS)

**Ventajas:**
- ✅ Interfaz muy moderna y rápida
- ✅ Soporta múltiples bases de datos
- ✅ Versión gratuita disponible
- ✅ Excelente para macOS

**Instalación:**

```bash
# Opción 1: Homebrew
brew install --cask tableplus

# Opción 2: Descargar desde https://tableplus.com/
```

**Configuración de conexión:**

1. Abre TablePlus
2. Click en "Create a new connection"
3. Selecciona "MySQL"
4. Configura:
   - **Name:** SIPI Database
   - **Host:** localhost
   - **Port:** 3306
   - **User:** root
   - **Password:** (tu contraseña de MySQL)
   - **Database:** sipi_db

---

## Opción 3: MySQL Workbench

**Ventajas:**
- ✅ Herramienta oficial de MySQL
- ✅ Muy completa para administración
- ✅ Gratis
- ✅ Multiplataforma

**Instalación:**

```bash
# Homebrew
brew install --cask mysql-workbench

# O descargar desde: https://dev.mysql.com/downloads/workbench/
```

**Configuración de conexión:**

1. Abre MySQL Workbench
2. Click en "+" para crear nueva conexión
3. Configura:
   - **Connection Name:** SIPI Database
   - **Hostname:** localhost
   - **Port:** 3306
   - **Username:** root
   - **Password:** (tu contraseña de MySQL)
4. Click en "Test Connection" y luego "OK"

---

## Opción 4: DBeaver Community Edition

**Ventajas:**
- ✅ Gratis y open source
- ✅ Multiplataforma
- ✅ Soporta muchos tipos de bases de datos
- ✅ Muy completo para desarrolladores

**Instalación:**

```bash
# Homebrew
brew install --cask dbeaver-community

# O descargar desde: https://dbeaver.io/download/
```

**Configuración:**

1. Abre DBeaver
2. Click en "New Database Connection"
3. Selecciona "MySQL"
4. Configura:
   - **Host:** localhost
   - **Port:** 3306
   - **Database:** sipi_db
   - **Username:** root
   - **Password:** (tu contraseña de MySQL)

---

## Información de Conexión

Para todas las herramientas (excepto Prisma Studio), usa estos datos:

```
Host: localhost
Port: 3306
Database: sipi_db
Username: root
Password: (la que configuraste en tu .env)
```

**Nota:** La contraseña está en tu archivo `.env` en la variable `DATABASE_URL`. 
Si tu contraseña contiene caracteres especiales como `@`, asegúrate de URL-encodearlos (ej: `@` → `%40`).

---

## Recomendación

Para este proyecto, **Prisma Studio** es la mejor opción porque:
1. Ya está configurado
2. No requiere configuración adicional
3. Entiende el schema de Prisma automáticamente
4. Es perfecto para desarrollo y testing

Para tareas más avanzadas de administración de base de datos, considera **TablePlus** o **MySQL Workbench**.

