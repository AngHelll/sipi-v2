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

Genera un secret seguro y único:

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
- [ ] Generar JWT_SECRET único y seguro
- [ ] Configurar HTTPS (no HTTP)
- [ ] Usar variables de entorno para todas las configuraciones sensibles
- [ ] Configurar CORS correctamente para tu dominio
- [ ] Revisar y ajustar rate limiting según necesidades
- [ ] Habilitar logs de seguridad
- [ ] Configurar backup automático de base de datos
- [ ] Revisar permisos de archivos del servidor
- [ ] Mantener dependencias actualizadas

### 5. Rate Limiting

El sistema incluye rate limiting configurado:
- Login: 5 intentos por 15 minutos
- API general: 100 solicitudes por 15 minutos (desarrollo), 100 (producción)

Ajusta estos valores en `backend/src/middleware/rateLimiter.ts` según tus necesidades.

### 6. Contraseñas

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

