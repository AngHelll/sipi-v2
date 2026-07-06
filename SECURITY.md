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

- Mantener `react-router-dom` ≥ 7.15.1 (CVEs de open redirect / XSS en componentes de ruta).

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
- [ ] Revisar y ajustar rate limiting según necesidades
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

