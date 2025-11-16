# Guía de Configuración Git para Push

## ⚠️ Configuración de Usuario Git

Si el repositorio es de un usuario diferente al configurado en Git, necesitas configurar el usuario para este repositorio específico.

### Opción 1: Configuración Local (Solo para este repositorio) - RECOMENDADO

```bash
cd sipi-modern

# Configurar usuario y email solo para este repositorio
git config user.name "AngHelll"
git config user.email "tu-email-de-anghelll@ejemplo.com"

# Verificar configuración
git config user.name
git config user.email
```

### Opción 2: Configuración Global (Para todos los repositorios)

```bash
# Configurar usuario globalmente
git config --global user.name "AngHelll"
git config --global user.email "tu-email-de-anghelll@ejemplo.com"
```

## Pasos para Hacer Push al Repositorio

### 1. Verificar que no hay datos sensibles

```bash
# Verificar que .env está en .gitignore
git check-ignore backend/.env frontend/.env

# Si no muestra nada, verificar .gitignore
cat .gitignore | grep -E "\.env|node_modules|dist"
```

### 2. Inicializar Git (si no está inicializado)

```bash
cd sipi-modern
git init
```

### 3. Configurar usuario (si es diferente)

```bash
# Configurar usuario local para este repositorio
git config user.name "AngHelll"
git config user.email "tu-email@ejemplo.com"
```

### 4. Agregar todos los archivos

```bash
# Ver qué archivos se van a agregar (revisar que no haya .env)
git add .

# Verificar el estado (debe mostrar que .env está ignorado)
git status
```

### 5. Hacer commit inicial

```bash
git commit -m "feat: initial commit - SIPI Modern student registration system

- Sistema completo de gestión académica
- Backend con Node.js, Express, TypeScript, Prisma
- Frontend con React, Vite, TypeScript, Tailwind CSS
- Autenticación JWT con cookies HTTP-only
- Roles: Estudiante, Maestro, Administrador
- CRUD completo para todas las entidades
- Dashboards personalizados por rol
- Búsqueda global y exportación a Excel
- Modo oscuro/claro
- Rate limiting y seguridad implementada"
```

### 6. Agregar remote y hacer push

```bash
# Agregar el remote
git remote add origin git@github.com:AngHelll/sipi-v2.git

# Verificar que se agregó correctamente
git remote -v

# Cambiar a rama main (si es necesario)
git branch -M main

# Hacer push
git push -u origin main
```

## Configuración de SSH para Múltiples Usuarios

Si tienes múltiples cuentas de GitHub, puedes configurar SSH específico:

### 1. Crear o usar clave SSH específica

```bash
# Generar nueva clave SSH para este usuario (si no tienes una)
ssh-keygen -t ed25519 -C "tu-email-anghelll@ejemplo.com" -f ~/.ssh/id_ed25519_anghelll

# Agregar la clave al ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_anghelll
```

### 2. Configurar SSH config

Editar `~/.ssh/config`:

```
# Cuenta principal (si existe)
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519

# Cuenta AngHelll
Host github-anghelll
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_anghelll
```

### 3. Usar el host específico en el remote

```bash
# En lugar de git@github.com, usar:
git remote add origin git@github-anghelll:AngHelll/sipi-v2.git
```

## Si el Repositorio ya Existe en GitHub

Si el repositorio remoto ya tiene commits:

```bash
# Primero hacer pull para sincronizar
git pull origin main --allow-unrelated-histories

# Resolver conflictos si los hay, luego:
git push -u origin main
```

## Verificación Final

Después del push, verificar en GitHub:
- ✅ No hay archivos `.env` en el repositorio
- ✅ No hay `node_modules/` en el repositorio
- ✅ No hay `dist/` en el repositorio
- ✅ Los archivos de documentación están presentes
- ✅ El README.md se muestra correctamente
- ✅ Los commits muestran el usuario correcto (AngHelll)

## Comandos Rápidos (Todo en Uno)

```bash
cd sipi-modern

# 1. Configurar usuario (IMPORTANTE si es diferente)
git config user.name "AngHelll"
git config user.email "tu-email@ejemplo.com"

# 2. Inicializar (si es necesario)
git init

# 3. Agregar archivos
git add .

# 4. Commit
git commit -m "feat: initial commit - SIPI Modern student registration system"

# 5. Agregar remote
git remote add origin git@github.com:AngHelll/sipi-v2.git

# 6. Push
git branch -M main
git push -u origin main
```

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin git@github.com:AngHelll/sipi-v2.git
```

### Error: "failed to push some refs"
```bash
# Si el repositorio remoto tiene contenido diferente
git pull origin main --allow-unrelated-histories
# Resolver conflictos y luego:
git push -u origin main
```

### Error de autenticación SSH
```bash
# Verificar que tu clave SSH está agregada a GitHub
ssh -T git@github.com

# Si no funciona, usar HTTPS en su lugar:
git remote set-url origin https://github.com/AngHelll/sipi-v2.git
```

### Verificar usuario configurado
```bash
# Ver configuración local (solo este repo)
git config user.name
git config user.email

# Ver configuración global
git config --global user.name
git config --global user.email
```
