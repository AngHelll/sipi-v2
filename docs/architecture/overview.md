# Arquitectura del Sistema - SIPI Modern

## Visión General

SIPI Modern es un sistema de gestión académica construido con una arquitectura moderna de tres capas: Frontend (React), Backend (Node.js/Express), y Base de Datos (MySQL).

## Arquitectura Backend

### Patrón: Arquitectura en Capas

```
┌─────────────────────────────────────────┐
│           HTTP Request                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Routes Layer                    │
│  - Definición de endpoints              │
│  - Middlewares (auth, validation)      │
│  - Enrutamiento                         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│       Controllers Layer                 │
│  - Manejo de HTTP (req/res)            │
│  - Validación básica                   │
│  - Llamadas a servicios                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Services Layer                   │
│  - Lógica de negocio                   │
│  - Validaciones complejas              │
│  - Transformación de datos              │
│  - Reglas de negocio                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Database Layer (Prisma)           │
│  - Acceso a datos                      │
│  - Queries optimizadas                 │
│  - Transacciones                       │
└─────────────────────────────────────────┘
```

### Módulos del Backend

Cada módulo sigue la estructura:

```
modules/
└── [module-name]/
    ├── [module].routes.ts      # Rutas y middlewares
    ├── [module].controller.ts  # Controladores HTTP
    ├── [module].service.ts     # Lógica de negocio
    └── [module].dtos.ts        # Data Transfer Objects
```

**Ejemplo: Módulo de Estudiantes**

- **Routes**: Define endpoints `/api/students/*` y aplica middlewares
- **Controller**: Maneja requests/responses HTTP, valida entrada básica
- **Service**: Contiene lógica de negocio (validaciones, transformaciones)
- **DTOs**: Define tipos TypeScript para requests/responses

## Arquitectura Frontend

### Patrón: Component-Based Architecture

```
┌─────────────────────────────────────────┐
│         Pages (Routes)                  │
│  - Vistas principales                  │
│  - Manejo de estado local              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Components                      │
│  - Componentes reutilizables            │
│  - UI Components                        │
│  - Layout Components                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Context API                    │
│  - Estado global                       │
│  - AuthContext, ThemeContext, etc.     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         API Client (Axios)             │
│  - Comunicación con backend            │
│  - Interceptores                        │
│  - Manejo de errores                   │
└─────────────────────────────────────────┘
```

### Estructura de Componentes

```
components/
├── layout/              # Componentes de layout
│   ├── Layout.tsx       # Layout principal
│   ├── Sidebar.tsx      # Barra lateral
│   └── Topbar.tsx       # Barra superior
├── ui/                  # Componentes UI reutilizables
│   ├── Toast.tsx        # Notificaciones
│   ├── FormField.tsx    # Campo de formulario
│   └── ConfirmDialog.tsx # Diálogo de confirmación
└── ProtectedRoute.tsx   # Ruta protegida
```

## Flujo de Datos

### Autenticación

1. Usuario ingresa credenciales en `LoginPage`
2. Frontend envía POST a `/api/auth/login`
3. Backend valida credenciales y genera JWT
4. Backend establece cookie HTTP-only con token
5. Frontend redirige según rol del usuario
6. Requests subsecuentes incluyen cookie automáticamente

### Request Típico

1. **Frontend**: Usuario interactúa con UI
2. **API Client**: Axios envía request con credenciales
3. **Backend Routes**: Middleware de autenticación valida token
4. **Backend Controller**: Procesa request y llama servicio
5. **Backend Service**: Ejecuta lógica de negocio y consulta DB
6. **Database**: Prisma ejecuta query y retorna datos
7. **Response**: Datos fluyen de vuelta al frontend
8. **UI Update**: React actualiza componentes con nuevos datos

## Middlewares del Backend

### Orden de Ejecución

```
Request
  ↓
CORS Middleware
  ↓
Body Parser (JSON)
  ↓
Cookie Parser
  ↓
Sanitization Middleware
  ↓
Rate Limiting
  ↓
Route Handler
  ↓
Authentication Middleware (si aplica)
  ↓
Authorization Middleware (si aplica)
  ↓
Validation Middleware (si aplica)
  ↓
Controller
  ↓
Service
  ↓
Database
  ↓
Response
```

### Middlewares Principales

- **auth.ts**: Autenticación JWT y autorización por roles
- **rateLimiter.ts**: Protección contra abuso de API
- **sanitize.ts**: Sanitización de entrada
- **validation.ts**: Validación de datos con express-validator
- **errorHandler.ts**: Manejo centralizado de errores

## Seguridad

### Capas de Seguridad

1. **Autenticación**: JWT con cookies HTTP-only
2. **Autorización**: RBAC (Role-Based Access Control)
3. **Rate Limiting**: Protección contra abuso
4. **Sanitización**: Prevención de XSS
5. **Validación**: Validación de tipos y formatos
6. **CORS**: Configuración restrictiva
7. **Password Hashing**: bcrypt con salt rounds

## Escalabilidad

### Consideraciones de Escalabilidad

- **Horizontal**: Múltiples instancias de backend con load balancer
- **Base de Datos**: Índices optimizados en campos frecuentes
- **Caching**: Preparado para implementar Redis
- **Rate Limiting**: Por IP, escalable con Redis store
- **Stateless**: Backend sin estado, escalable horizontalmente

## Tecnologías Clave

- **Backend**: Node.js, Express, TypeScript, Prisma
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: MySQL 8.0+
- **Auth**: JWT, bcrypt
- **Validation**: express-validator
- **Security**: express-rate-limit, validator

