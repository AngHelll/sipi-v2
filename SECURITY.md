# Guía de Seguridad - SIPI Modern

## ⚠️ Configuración Inicial de Seguridad

### 1. Cambiar Credenciales por Defecto

Después de la instalación inicial, **cambia inmediatamente** las credenciales por defecto:

#### Usuario Administrador

El script `npm run create:user` crea un usuario con credenciales por defecto:
- Username: `admin`
- Password: `admin123`

**Acción requerida:**
1. Inicia sesión con las credenciales por defecto
2. Cambia la contraseña inmediatamente
3. Considera cambiar también el username si es necesario

#### JWT Secret

Genera un secret seguro y único (**mínimo 32 caracteres**; el servidor rechaza arranque con secret más corto):

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Actualiza `backend/.env`:
```env
JWT_SECRET=tu_secret_generado_aqui
```

### 8. Headers y RBAC (2026-07)

- **Helmet** activo en el backend: CSP compatible con el SPA (`/public`), Google Fonts y `crossOriginEmbedderPolicy: false`.
- **`GET /api/groups/:id`**: acceso por rol (ADMIN / TEACHER propio / STUDENT inscrito); grupos eliminados → 404 para no-admin; **`costo` oculto a TEACHER** en listado y detalle.
- **`GET /api/enrollments/:id`**: sin permiso → **403** (`ForbiddenError`), no 500.
- **Errores en producción**: mensajes internos de fallos 500 no se exponen al cliente; 4xx y errores de autenticación/autorización sí llevan mensaje seguro.
- **Frontend**: caché en memoria (`requestCache`) se limpia en logout y al recibir **401**.

### 9. Dependencias

- Frontend: `react-router-dom` resuelve a `react-router@8.3.1` (alias npm; cierra GHSA-qwww-vcr4-c8h2). Mantener ≥ 8.3.0.
- Backend: override `uuid` ≥ 11.1.1 (transitivo de `exceljs`); override `deepmerge-ts` ≥ 8.0.2 (transitivo de `prisma` → `@prisma/config`; cierra GHSA-ggr8-5vv4-36mx / CVE-2026-40345 hasta que upstream suba la dep); `body-parser` ≥ 2.3.0.
- Revisar `npm audit` periódicamente; deps de dev (`vite`, `tmp`) pueden requerir upgrades planificados.

### 10. Endurecimiento P1–P2 (2026-07)

**P1 (aplicado)**

- `ForbiddenError` (403) en enrollments sin permiso; `errorHandler` sanitiza mensajes 500 en producción.
- `JWT_SECRET` ≥ 32 caracteres validado al arranque.
- `requestCache` del frontend se limpia en logout y 401.

**P2 (aplicado / en curso)**

- **`strictLimiter`** (10 req/hora por IP) en `GET /api/search` y todas las rutas `GET /api/export/*` — superficie masiva de PII.
- **`sanitizeSoft`** global en el backend (trim de body/query); no se usa `sanitizeInput` con escape HTML en la API JSON (escapar al persistir corrompería datos; React escapa en salida).
- **Tests RBAC** en CI: `groups.access`, `enrollments.access`, `auth.middleware`, `errorHandler`.

**P3 deps (aplicado 2026-08 / refresh 2026-09-01)**

- `npm audit` limpio (high/critical = 0) en frontend y backend tras refresh de lockfiles.
- Frontend: React 19.2.8 + `react-router@8.3.1` vía alias de `react-router-dom`; Vite 8.x; `js-yaml` ≥ 4.3.2, `nanoid` ≥ 3.3.18 (transitivos).
- Backend: Prisma **7.10** + `@prisma/adapter-mariadb`; override `mariadb@^3.5.3` (transitivo del adapter); override `uuid@^11.1.1`; override `deepmerge-ts@^8.0.2` si aplica al CLI.
- **Node:** 22 LTS en CI (Drone) y `.nvmrc`; mínimo 20.19 / 22.12+.

**Pendiente (mejora continua)**

- [ ] Tests de integración HTTP (supertest) para rutas críticas.
- [ ] Política de contraseñas fuerte en creación de usuarios (opcional producto).

### 2. Variables de Entorno

Nunca commitees archivos `.env` al repositorio. Ya están en `.gitignore`, pero verifica:

```bash
git check-ignore backend/.env frontend/.env
```

### 3. Base de Datos

- Usa un usuario de base de datos con permisos mínimos necesarios
- No uses el usuario `root` en producción
- Cambia las contraseñas por defecto de MySQL

### 4. Producción

#### Checklist de Seguridad para Producción

- [ ] Cambiar todas las credenciales por defecto
- [ ] Generar JWT_SECRET único y seguro (**≥ 32 caracteres**)
- [ ] Configurar HTTPS (no HTTP)
- [ ] Usar variables de entorno para todas las configuraciones sensibles
- [ ] Configurar CORS correctamente para tu dominio
- [ ] Revisar y ajustar rate limiting según necesidades (search/export ya usan `strictLimiter`)
- [ ] Habilitar logs de seguridad
- [ ] Configurar backup automático de base de datos
- [ ] Revisar permisos de archivos del servidor
- [ ] Mantener dependencias actualizadas

### 5. Timeout de Inactividad

El sistema incluye timeout automático de inactividad para mayor seguridad:
- **Timeout**: 30 minutos de inactividad
- **Advertencia**: Se muestra 5 minutos antes del cierre automático
- **Implementación**: Frontend-only (sin costo de servidor)
- **Eventos detectados**: Mouse, teclado, scroll, touch
- **Backup**: JWT expira en 7 días (seguridad adicional)

El usuario recibe una advertencia visual con countdown y puede continuar su sesión haciendo clic en "Continuar Sesión" o realizando cualquier acción en la página.

### 6. Rate Limiting

El sistema incluye rate limiting configurado:
- Login: 5 intentos por 15 minutos
- API general: 100 solicitudes por 15 minutos (desarrollo), 100 (producción)

Ajusta estos valores en `backend/src/middleware/rateLimiter.ts` según tus necesidades.

### 7. Contraseñas

- Las contraseñas se hashean con bcrypt (10 salt rounds)
- Nunca almacenes contraseñas en texto plano
- Implementa políticas de contraseñas fuertes si es necesario

### 7. Cookies

- Las cookies de autenticación son HTTP-only (no accesibles desde JavaScript)
- Configuradas como `secure: true` en producción
- `sameSite: 'strict'` para prevenir CSRF

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor:
1. NO crees un issue público
2. Contacta directamente a los mantenedores del proyecto
3. Proporciona detalles suficientes para reproducir el problema

## Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

