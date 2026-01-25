# Migraciones en CI/CD - Drone Pipeline

## 🎯 Respuesta Directa

**¿Debo ejecutar migraciones manualmente en producción?**

**NO**. Las migraciones deben ejecutarse automáticamente en el pipeline de CI/CD.

---

## ✅ Configuración Actualizada

### Pipeline de Deploy (.drone.yml)

El pipeline ahora incluye migraciones automáticas:

```yaml
script:
  - cd ~/raspylab/production/sipi/app
  - git pull origin main
  
  # 1. Instalar dependencias backend
  - cd backend && npm ci
  
  # 2. Aplicar migraciones (NUEVO)
  - npx prisma migrate deploy
  - npx prisma generate
  
  # 3. Build backend
  - npm run build
  
  # 4. Instalar dependencias de producción
  - npm ci --omit=dev
  
  # 5. Build frontend
  - cd ../frontend && npm ci && npx vite build
  
  # 6. Copiar frontend a public
  - cd ../backend
  - rm -rf public/* public/.* 2>/dev/null || true
  - cp -r ../frontend/dist/* public/
  
  # 7. Reiniciar servicio
  - sudo systemctl restart sipi
```

### ¿Por Qué Este Orden?

1. **`npm ci`**: Instala dependencias (incluye Prisma CLI)
2. **`npx prisma migrate deploy`**: Aplica migraciones pendientes
3. **`npx prisma generate`**: Regenera cliente Prisma con schema actualizado
4. **`npm run build`**: Compila TypeScript (necesita cliente Prisma actualizado)

**⚠️ CRÍTICO**: Las migraciones deben ejecutarse ANTES del build.

---

## 🔍 ¿Qué Hace `prisma migrate deploy`?

### En Producción

```bash
npx prisma migrate deploy
```

**Comportamiento**:
- ✅ Lee todas las migraciones en `prisma/migrations/`
- ✅ Compara con `_prisma_migrations` en BD
- ✅ Aplica solo las migraciones pendientes
- ✅ No crea nuevas migraciones
- ✅ No regenera el cliente (debe hacerse manualmente)

**Seguro para producción**: Solo aplica, no modifica.

---

## 📋 Flujo Completo en CI/CD

### 1. Desarrollo Local

```bash
# Desarrollador modifica schema.prisma
# Crea migración
npx prisma migrate dev --name agregar_campo_nuevo

# Commit y push
git add .
git commit -m "feat: agregar campo nuevo"
git push origin main
```

### 2. Pipeline Automático

```
Push a main
  ↓
Drone detecta push
  ↓
Ejecuta pipeline de deploy
  ↓
1. git pull (obtiene nueva migración)
  ↓
2. npm ci (instala dependencias)
  ↓
3. npx prisma migrate deploy (aplica migración)
  ↓
4. npx prisma generate (regenera cliente)
  ↓
5. npm run build (compila con cliente actualizado)
  ↓
6. Deploy aplicación
  ↓
7. Reinicia servicio
```

### 3. Resultado

- ✅ Migración aplicada automáticamente
- ✅ Aplicación actualizada
- ✅ Sin intervención manual

---

## ⚠️ Consideraciones de Seguridad

### 1. Backup Automático (Recomendado)

Agregar backup antes de migraciones:

```yaml
- name: backup-database
  script:
    - mysqldump -u root sipi_db > /backups/sipi_db_$(date +%Y%m%d_%H%M%S).sql
    - echo "Backup completed"

- name: deploy
  # ... resto del deploy
```

### 2. Rollback Plan

Si una migración falla:

```bash
# En el servidor (manual, solo si es necesario)
cd ~/raspylab/production/sipi/app/backend

# Ver estado
npx prisma migrate status

# Si hay problema, restaurar backup
mysql -u root sipi_db < /backups/sipi_db_YYYYMMDD_HHMMSS.sql
```

### 3. Variables de Entorno

Asegurar que `DATABASE_URL` esté configurada:

```bash
# En el servidor
cat backend/.env | grep DATABASE_URL
```

---

## 🔧 Troubleshooting en CI/CD

### Error: "Migration failed"

**Causa**: Migración tiene SQL inválido o conflicto.

**Solución**:
1. Revisar logs del pipeline
2. Verificar SQL de la migración
3. Corregir y hacer nuevo commit
4. El pipeline reintentará automáticamente

### Error: "Migration not found"

**Causa**: Migración no está en el repositorio.

**Solución**:
- Verificar que la migración está commiteada
- Verificar que se hizo push

### Error: "Database connection failed"

**Causa**: `DATABASE_URL` incorrecta o BD no disponible.

**Solución**:
- Verificar variables de entorno en servidor
- Verificar que MySQL está corriendo

---

## 📊 Monitoreo

### Verificar Migraciones Aplicadas

```bash
# En el servidor después del deploy
cd ~/raspylab/production/sipi/app/backend
npx prisma migrate status
```

**Resultado esperado**: "Database schema is up to date!"

### Ver Logs del Pipeline

En la interfaz de Drone, revisar:
- Logs del paso "deploy"
- Buscar "Applying migration" o errores

---

## ✅ Checklist para CI/CD

### Antes de Push

- [ ] Migración creada y probada localmente
- [ ] Migración commiteada
- [ ] Schema.prisma actualizado
- [ ] Estado limpio: `npx prisma migrate status`

### Después de Deploy

- [ ] Pipeline ejecutado exitosamente
- [ ] Migraciones aplicadas (verificar logs)
- [ ] Aplicación funciona correctamente
- [ ] Verificar BD: `npx prisma migrate status`

---

## 🎓 Resumen

### ¿Cuándo se Genera una Migración?

**En desarrollo**, cuando ejecutas:
```bash
npx prisma migrate dev --name descripcion
```

### ¿Cuándo se Aplica una Migración?

**Automáticamente en CI/CD**, cuando:
- Haces push a `main`
- El pipeline ejecuta `npx prisma migrate deploy`

### ¿Debo Ejecutar Manualmente?

**NO**. El pipeline lo hace automáticamente.

**Excepción**: Solo si hay un error crítico y necesitas rollback manual.

---

## 🔧 Manejo de Migraciones Fallidas

Si en el futuro hay migraciones marcadas como "failed" en la BD (error P3009), se pueden resolver manualmente:

```bash
# En el servidor de producción
cd ~/raspylab/production/sipi/app/backend

# Opción 1: Usar script de limpieza
mysql -u root sipi_db < scripts/cleanup-old-migrations.sql

# Opción 2: Limpieza manual específica
mysql -u root sipi_db -e "DELETE FROM _prisma_migrations WHERE migration_name = 'nombre_migracion_fallida';"

# Luego aplicar migraciones
npx prisma migrate deploy
```

**Nota**: El pipeline no incluye limpieza automática porque:
- Prisma maneja las migraciones automáticamente
- Los problemas de migraciones fallidas son casos excepcionales
- Es mejor resolverlos manualmente cuando ocurren
- Mantener comandos que pueden fallar no es buena práctica

---

## 📚 Referencias

- Guía completa: `docs/GUIA-MIGRACIONES-PRISMA.md`
- Pipeline config: `.drone.yml`
- Script de limpieza: `backend/scripts/cleanup-old-migrations.sql`
- [Prisma Migrate Deploy](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-deploy)

---

**Última actualización**: 2026-01-24
