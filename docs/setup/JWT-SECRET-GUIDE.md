# 🔐 Guía para Generar JWT_SECRET Seguro

## ¿Qué es JWT_SECRET?

El `JWT_SECRET` es una clave secreta utilizada para firmar y verificar los tokens JWT (JSON Web Tokens) en tu aplicación. Es **crítico** para la seguridad de la autenticación.

## ⚠️ Requisitos de Seguridad

- **Longitud mínima:** 32 caracteres (256 bits)
- **Aleatoriedad:** Debe ser completamente aleatorio e impredecible
- **Secreto:** Nunca debe ser compartido o commitido al repositorio
- **Único:** Diferente para cada entorno (desarrollo, staging, producción)

---

## 🚀 Métodos para Generar JWT_SECRET

### Método 1: OpenSSL (Recomendado - Más Compatible)

```bash
openssl rand -base64 32
```

**Ejemplo de salida:**
```
gG7W/YjenGjO+UNtvmU40BSDPS2RHwvGrSU/JUF0Tr0=
```

**Ventajas:**
- Disponible en la mayoría de sistemas
- Genera strings base64 seguros
- Fácil de copiar y pegar

---

### Método 2: OpenSSL (Hexadecimal)

```bash
openssl rand -hex 32
```

**Ejemplo de salida:**
```
6d35d7e15481568576e96c920a5258107592ad2bdb776169af48d32a5293dbab
```

**Ventajas:**
- Solo caracteres alfanuméricos (sin símbolos)
- Útil si tienes problemas con caracteres especiales

---

### Método 3: Node.js (Base64)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Ejemplo de salida:**
```
fgwP/Ek+cY0m7HlWAnABH04G2tkJsU7vKqBVPpElvUA=
```

**Ventajas:**
- Usa la misma librería que tu aplicación
- Disponible si ya tienes Node.js instalado

---

### Método 4: Node.js (Hexadecimal)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Ejemplo de salida:**
```
b967a934c1e7a1b32c992891c75a8186169f73b2cadf61d74b97ec3fc9bb5c1c
```

---

### Método 5: Usando el Script Incluido

```bash
cd backend
./scripts/generate-jwt-secret.sh
```

Este script muestra todos los métodos disponibles.

---

## 📝 Cómo Actualizar tu JWT_SECRET

### Paso 1: Generar el Secret

```bash
openssl rand -base64 32
```

Copia el resultado.

### Paso 2: Actualizar el archivo .env

Edita `backend/.env` y actualiza la línea `JWT_SECRET`:

```env
# Antes (desarrollo)
JWT_SECRET=development_jwt_secret_change_this_in_production_minimum_32_characters_long_for_security

# Después (con tu nuevo secret)
JWT_SECRET=gG7W/YjenGjO+UNtvmU40BSDPS2RHwvGrSU/JUF0Tr0=
```

### Paso 3: Reiniciar el Servidor

Si el servidor está corriendo, reinícialo para que cargue el nuevo secret:

```bash
# Detener el servidor (Ctrl+C)
# Luego iniciar de nuevo
cd backend
npm run dev
```

---

## 🔒 Mejores Prácticas

### 1. Diferentes Secrets por Entorno

```env
# .env.development
JWT_SECRET=dev_secret_here...

# .env.production
JWT_SECRET=prod_secret_here...
```

### 2. Nunca Commitees el Secret

Asegúrate de que `.env` esté en `.gitignore`:

```gitignore
# .gitignore
.env
.env.local
.env.production
```

### 3. Usa Variables de Entorno en Producción

**Heroku:**
```bash
heroku config:set JWT_SECRET=tu_secret_aqui
```

**Docker:**
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}
```

**Vercel/Netlify:**
- Configura en el dashboard de la plataforma

### 4. Rotación de Secrets

Si sospechas que un secret fue comprometido:

1. Genera un nuevo secret
2. Actualiza el `.env`
3. **Nota:** Todos los usuarios deberán iniciar sesión nuevamente (sus tokens actuales serán inválidos)

### 5. Longitud y Complejidad

- ✅ **Bueno:** 32+ caracteres aleatorios
- ❌ **Malo:** Palabras comunes, fechas, nombres
- ❌ **Malo:** Secrets cortos (< 32 caracteres)

---

## 🧪 Verificar que Funciona

Después de actualizar el JWT_SECRET:

1. **Inicia el servidor:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Intenta hacer login:**
   - Si el secret es válido, el login funcionará
   - Si hay error, verifica que el secret tenga al menos 32 caracteres

3. **Verifica el token:**
   ```bash
   # Después de login, verifica que el token se genera correctamente
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' \
     -c cookies.txt
   ```

---

## 📋 Ejemplo Completo

```bash
# 1. Generar secret
SECRET=$(openssl rand -base64 32)
echo "Tu JWT_SECRET: $SECRET"

# 2. Copiar el secret mostrado

# 3. Editar .env manualmente o usar sed (Linux/macOS)
# sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$SECRET/" backend/.env

# 4. Verificar
grep JWT_SECRET backend/.env
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar el mismo secret en desarrollo y producción?

**No.** Usa secrets diferentes para cada entorno por seguridad.

### ¿Qué pasa si cambio el secret?

Todos los tokens JWT existentes se invalidarán. Los usuarios deberán iniciar sesión nuevamente.

### ¿Cuánto tiempo debo mantener el mismo secret?

No hay un tiempo fijo, pero considera rotarlo:
- Si sospechas compromiso
- Cada 6-12 meses como práctica preventiva
- Después de incidentes de seguridad

### ¿Puedo usar un secret más corto?

No se recomienda. 32 caracteres (256 bits) es el mínimo recomendado para seguridad adecuada.

---

## 🔗 Referencias

- [JWT.io - Best Practices](https://jwt.io/introduction)
- [OWASP - JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)

---

**💡 Tip:** Guarda tus secrets de producción en un gestor de secretos (como AWS Secrets Manager, HashiCorp Vault, o similar) en lugar de archivos `.env` en producción.


