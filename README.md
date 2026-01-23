# 🎓 SIPI Modern - Sistema de Registro Estudiantil

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19.2-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)

**Sistema moderno de registro estudiantil para instituciones educativas**

Un sistema completo de gestión académica con roles diferenciados, autenticación segura y arquitectura escalable.

[Características](#-características) • [Instalación](#-instalación) • [Documentación](#-documentación) • [Tecnologías](#-tecnologías)

</div>

---

## 📸 Capturas de Pantalla

<div align="center">

### Dashboard del Administrador

![Dashboard Administrador](docs/images/dashboard-admin.png)

*Panel principal con estadísticas generales, gráficas interactivas y resumen del sistema*

### Gestión de Estudiantes

![Gestión de Estudiantes](docs/images/students-management.png)

*Listado completo de estudiantes con filtros avanzados por carrera, semestre y estatus, búsqueda y paginación*

### Gestión de Maestros

![Gestión de Maestros](docs/images/teachers-management.png)

*Administración de maestros con filtros por departamento, búsqueda y exportación a Excel*

### Gestión de Materias

![Gestión de Materias](docs/images/subjects-management.png)

*Catálogo de materias académicas con clave, nombre y créditos, ordenamiento y acciones rápidas*

### Gestión de Grupos

![Gestión de Grupos](docs/images/groups-management.png)

*Administración de grupos académicos con asignación de maestros y materias, filtros por período y exportación*

</div>

---

## 📋 Tabla de Contenidos

- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API](#-api)
- [Roles y Permisos](#-roles-y-permisos)
- [Desarrollo](#-desarrollo)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## ✨ Características

### 🔐 Seguridad
- Autenticación JWT con cookies HTTP-only
- Rate limiting para prevenir ataques de fuerza bruta
- Sanitización de entrada para prevenir XSS
- Validación centralizada de datos
- Roles y permisos basados en RBAC

### 👥 Gestión de Usuarios
- **Estudiantes**: Registro completo con matrícula, carrera, semestre y estatus
- **Maestros**: Gestión de departamentos y grupos asignados
- **Administradores**: Control total del sistema

### 📚 Gestión Académica
- **Materias**: Catálogo completo con claves y créditos
- **Grupos**: Creación y asignación de grupos por período
- **Inscripciones**: Gestión de inscripciones estudiantiles
- **Calificaciones**: Sistema de calificación para maestros

### 📊 Dashboards y Reportes
- Dashboards personalizados por rol
- Gráficas interactivas con Recharts
- Exportación a Excel de datos filtrados
- Búsqueda global avanzada
- Filtros y paginación en todas las listas

### 🎨 Interfaz de Usuario
- Diseño moderno y responsivo con Tailwind CSS
- Notificaciones toast para feedback al usuario
- Manejo de errores robusto
- Navegación intuitiva con sidebar y topbar
- Componentes UI reutilizables y profesionales
- Gráficas interactivas con estilos optimizados

## 🛠 Tecnologías

### Backend
- **Node.js** + **Express** + **TypeScript** - Servidor robusto y tipado
- **Prisma ORM** - Gestión de base de datos type-safe
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación segura
- **express-rate-limit** - Protección contra abuso
- **express-validator** - Validación de datos
- **ExcelJS** - Exportación de datos

### Frontend
- **React 19** + **TypeScript** - UI moderna y tipada
- **Vite** - Build tool rápido
- **Tailwind CSS 4** - Estilos utility-first
- **React Router** - Navegación SPA
- **Axios** - Cliente HTTP con interceptores
- **Recharts** - Visualización de datos

## 🏗 Arquitectura

### Backend - Arquitectura en Capas

```
Routes → Controllers → Services → Database (Prisma)
```

- **Routes**: Definición de endpoints y middlewares
- **Controllers**: Manejo de requests/responses HTTP
- **Services**: Lógica de negocio y validaciones
- **Database**: Acceso a datos mediante Prisma ORM

### Frontend - Arquitectura Component-Based

```
Pages → Components → Context → API Client
```

- **Pages**: Vistas principales por ruta
- **Components**: Componentes reutilizables (UI, Layout)
- **Context**: Estado global (Auth, Theme, Toast)
- **API Client**: Comunicación con backend

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ y npm
- MySQL 8.0+
- Git

> 📖 **Instalación en Windows**: Si estás en Windows, consulta la [Guía de Instalación para Windows](docs/setup/windows-installation.md) para instrucciones detalladas paso a paso.

### 1. Clonar el Repositorio

```bash
git clone https://github.com/AngHelll/sipi-v2.git
cd sipi-v2
```

O descarga el código fuente desde [GitHub Releases](https://github.com/AngHelll/sipi-v2/releases).

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
# ⚠️ IMPORTANTE: Usa credenciales seguras en producción
# DATABASE_URL="mysql://usuario:password@localhost:3306/sipi_db"
# JWT_SECRET="genera_un_secret_key_seguro_minimo_32_caracteres"
# PORT=3001
# FRONTEND_URL="http://localhost:5173"

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
# ⚠️ IMPORTANTE: Si es la primera vez, esto creará todas las tablas
# Si ya existe la base de datos, esto aplicará solo las migraciones pendientes
npm run prisma:migrate

# (Opcional) Si necesitas sincronizar el schema sin crear migración (solo desarrollo):
# npx prisma db push

# (Opcional) Crear usuario administrador inicial
# ⚠️ IMPORTANTE: Cambia las credenciales por defecto en producción
npm run create:user
```

### 3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Copiar archivo de ejemplo de variables de entorno
cp .env.example .env

# Editar .env si es necesario (por defecto usa http://localhost:3001/api)
# VITE_API_URL=http://localhost:3001/api
```

## ⚙️ Configuración

### Variables de Entorno - Backend

Crear archivo `backend/.env`:

```env
# Base de Datos
DATABASE_URL="mysql://usuario:password@localhost:3306/sipi_db"

# Servidor
PORT=3001
NODE_ENV=development

# JWT
# ⚠️ Genera un secret seguro y único para producción
# Puedes usar: openssl rand -base64 32
JWT_SECRET=genera_un_secret_key_seguro_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

### Variables de Entorno - Frontend

Crear archivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🚀 Uso

### Desarrollo

**Opción 1: Script automatizado (Recomendado)**
```bash
./start-dev.sh
```
Este script:
- Verifica prerrequisitos y dependencias
- Genera cliente de Prisma si es necesario
- Inicia backend y frontend automáticamente
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

**Opción 2: Manual**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Producción

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Servir la carpeta dist/ con tu servidor web preferido
```

## 📁 Estructura del Proyecto

```
sipi-modern/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app
│   │   ├── server.ts              # Server entry point
│   │   ├── config/                # Configuración
│   │   │   ├── database.ts        # Prisma client
│   │   │   └── env.ts             # Variables de entorno
│   │   ├── middleware/             # Middlewares
│   │   │   ├── auth.ts            # Autenticación/autorización
│   │   │   ├── errorHandler.ts    # Manejo de errores
│   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   ├── sanitize.ts        # Sanitización
│   │   │   └── validation.ts      # Validación
│   │   ├── modules/               # Módulos de negocio
│   │   │   ├── auth/              # Autenticación
│   │   │   ├── students/          # Estudiantes
│   │   │   ├── teachers/          # Maestros
│   │   │   ├── subjects/          # Materias
│   │   │   ├── groups/            # Grupos
│   │   │   ├── enrollments/       # Inscripciones
│   │   │   ├── search/            # Búsqueda global
│   │   │   └── export/            # Exportación
│   │   └── types/                 # Tipos TypeScript
│   ├── prisma/
│   │   ├── schema.prisma          # Esquema de base de datos
│   │   └── migrations/            # Migraciones
│   ├── scripts/                   # Scripts utilitarios
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # Entry point
│   │   ├── App.tsx                # App principal con rutas
│   │   ├── components/            # Componentes
│   │   │   ├── layout/           # Layout (Sidebar, Topbar)
│   │   │   ├── ui/               # Componentes UI (Toast, FormField, etc.)
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/                 # Páginas
│   │   │   ├── admin/            # Páginas de administrador
│   │   │   ├── dashboards/       # Dashboards por rol
│   │   │   ├── student/          # Páginas de estudiante
│   │   │   ├── teacher/          # Páginas de maestro
│   │   │   └── errors/           # Páginas de error
│   │   ├── context/              # Context API
│   │   │   ├── AuthContext.tsx
│   │   │   └── ToastContext.tsx
│   │   ├── lib/                   # Utilidades
│   │   │   └── api.ts            # Cliente API
│   │   └── types/                 # Tipos TypeScript
│   └── package.json
│
└── README.md
```

## 🔌 API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Estudiantes
- `GET /api/students` - Listar estudiantes (ADMIN)
- `POST /api/students` - Crear estudiante (ADMIN)
- `GET /api/students/:id` - Obtener estudiante (ADMIN)
- `PUT /api/students/:id` - Actualizar estudiante (ADMIN)
- `DELETE /api/students/:id` - Eliminar estudiante (ADMIN)
- `GET /api/students/me` - Obtener perfil propio (STUDENT)

### Maestros
- `GET /api/teachers` - Listar maestros (ADMIN)
- `POST /api/teachers` - Crear maestro (ADMIN)
- `GET /api/teachers/:id` - Obtener maestro (ADMIN)
- `PUT /api/teachers/:id` - Actualizar maestro (ADMIN)
- `DELETE /api/teachers/:id` - Eliminar maestro (ADMIN)

### Materias
- `GET /api/subjects` - Listar materias (ADMIN)
- `POST /api/subjects` - Crear materia (ADMIN)
- `GET /api/subjects/:id` - Obtener materia (ADMIN)
- `PUT /api/subjects/:id` - Actualizar materia (ADMIN)
- `DELETE /api/subjects/:id` - Eliminar materia (ADMIN)

### Grupos
- `GET /api/groups` - Listar grupos (todos los roles con filtros)
- `POST /api/groups` - Crear grupo (ADMIN)
- `GET /api/groups/:id` - Obtener grupo
- `PUT /api/groups/:id` - Actualizar grupo (ADMIN)
- `DELETE /api/groups/:id` - Eliminar grupo (ADMIN)

### Inscripciones
- `GET /api/enrollments/me` - Mis inscripciones (STUDENT)
- `GET /api/enrollments/group/:groupId` - Inscripciones de grupo (TEACHER/ADMIN)
- `POST /api/enrollments` - Crear inscripción (ADMIN)
- `PUT /api/enrollments/:id` - Actualizar inscripción (TEACHER/ADMIN)
- `DELETE /api/enrollments/:id` - Eliminar inscripción (ADMIN)

### Búsqueda y Exportación
- `GET /api/search?q=query` - Búsqueda global
- `GET /api/export/students` - Exportar estudiantes a Excel
- `GET /api/export/teachers` - Exportar maestros a Excel
- `GET /api/export/subjects` - Exportar materias a Excel
- `GET /api/export/groups` - Exportar grupos a Excel

### Health Check
- `GET /health` - Verificar estado del servidor

## 👥 Roles y Permisos

### 👨‍🎓 ESTUDENT (Estudiante)
- Ver su propio perfil y datos
- Ver sus inscripciones y calificaciones
- Ver grupos disponibles para inscribirse
- Dashboard con estadísticas personales

### 👨‍🏫 TEACHER (Maestro)
- Ver grupos asignados
- Gestionar calificaciones de sus grupos
- Ver estudiantes inscritos en sus grupos
- Dashboard con estadísticas de grupos

### 👨‍💼 ADMIN (Administrador)
- Acceso completo a todas las funcionalidades
- Gestión de estudiantes, maestros, materias y grupos
- Crear y eliminar inscripciones
- Exportar datos
- Dashboard con estadísticas generales

## 🛠 Desarrollo

### Scripts Disponibles

**Backend:**
```bash
npm run dev              # Desarrollo con hot-reload
npm run build           # Compilar TypeScript
npm start               # Ejecutar producción
npm run lint            # Linter
npm run prisma:generate # Generar cliente Prisma
npm run prisma:migrate  # Ejecutar migraciones
npm run prisma:studio   # Abrir Prisma Studio
npm run create:user     # Crear usuario admin inicial (solo desarrollo)
```

**Frontend:**
```bash
npm run dev             # Desarrollo con Vite
npm run build           # Build para producción
npm run preview         # Preview del build
npm run lint            # Linter
```

### Prisma Studio

Para visualizar y editar datos de la base de datos:

```bash
cd backend
npm run prisma:studio
```

Abre `http://localhost:5555` en tu navegador.

## 📝 Modelo de Datos

### Entidades Principales

- **User**: Usuario base con autenticación
- **Student**: Perfil de estudiante (matrícula, carrera, semestre, estatus)
- **Teacher**: Perfil de maestro (departamento)
- **Subject**: Materia académica (clave, nombre, créditos)
- **Group**: Grupo de clase (materia, maestro, nombre, período)
- **Enrollment**: Inscripción estudiante-grupo (con calificación)

Ver `backend/prisma/schema.prisma` para el esquema completo.

## 🔒 Seguridad

- ✅ Autenticación JWT con cookies HTTP-only
- ✅ Rate limiting en endpoints críticos
- ✅ Sanitización de entrada
- ✅ Validación de datos con express-validator
- ✅ Validación de UUIDs en parámetros
- ✅ CORS configurado
- ✅ Manejo seguro de contraseñas con bcrypt

**⚠️ Importante**: Después de la instalación inicial, cambia las credenciales por defecto y genera un JWT_SECRET seguro. Ver [SECURITY.md](SECURITY.md) para más detalles.

## 🎨 Características de UI

- 📱 Diseño responsivo y moderno
- 🔔 Notificaciones toast para feedback
- 🔍 Búsqueda global con autocompletado
- 📊 Gráficas interactivas con Recharts (estilos optimizados)
- 📥 Exportación a Excel con filtros aplicados
- ⚡ Carga rápida con Vite
- 🎯 Manejo de errores robusto con ErrorBoundary
- 🎨 Componentes UI reutilizables (Card, Badge, Avatar, etc.)
- 📋 Formularios con validación en tiempo real
- 🔄 Paginación y ordenamiento en todas las listas

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📚 Documentación

### Guías Principales
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guía de contribución
- [SECURITY.md](SECURITY.md) - Políticas de seguridad
- [CHANGELOG.md](CHANGELOG.md) - Historial de cambios

### Documentación Técnica
- [docs/ESTADO-SISTEMA.md](docs/ESTADO-SISTEMA.md) - Estado actual del sistema
- [docs/architecture/](docs/architecture/) - Arquitectura y diseño del sistema
- [docs/development/](docs/development/) - Guías de desarrollo

### Guías de Instalación
- [docs/setup/windows-installation.md](docs/setup/windows-installation.md) - Instalación en Windows
- [docs/setup/troubleshooting.md](docs/setup/troubleshooting.md) - Solución de problemas comunes

## 🙏 Agradecimientos

Sistema desarrollado como una solución moderna y escalable para la gestión académica en instituciones educativas.

---

<div align="center">

**Hecho con ❤️ para instituciones educativas**

⭐ Si te gusta este proyecto, considera darle una estrella

</div>
