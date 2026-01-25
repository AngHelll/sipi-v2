# Guía Completa: Migraciones de Prisma

## 🔍 ¿Qué Pasó? Análisis del Problema

### Problema Detectado

Las migraciones se "corrompieron" por varias razones:

1. **Migraciones con fechas inconsistentes**: 
   - Migraciones de "fase" con fecha `20250121*` (enero 2025) se ejecutaban ANTES de `init` (noviembre 2025)
   - Prisma ordena migraciones por nombre (fecha), causando orden incorrecto

2. **Migraciones duplicadas**:
   - Múltiples versiones de la misma migración (ej: `20250121*` y `20251122*`)
   - Migraciones vacías (carpetas sin `migration.sql`)

3. **Cambios manuales en BD**:
   - Cambios aplicados directamente en BD sin migración
   - Schema actualizado pero migraciones no sincronizadas

4. **Falta de sincronización**:
   - Schema.prisma tenía cambios que no tenían migración correspondiente
   - Migraciones aplicadas en BD pero no en el historial

---

## 📚 ¿Qué Son las Migraciones de Prisma?

### Concepto Básico

Las migraciones son **cambios versionados en la estructura de la base de datos**. Cada migración es un archivo SQL que modifica el esquema de la BD de forma incremental.

### Flujo Normal

```
1. Modificas schema.prisma
   ↓
2. Ejecutas: npx prisma migrate dev --name descripcion
   ↓
3. Prisma genera SQL automáticamente
   ↓
4. Prisma aplica el SQL a la BD
   ↓
5. Prisma registra la migración en _prisma_migrations
   ↓
6. Prisma regenera el cliente
```

---

## 🎯 ¿Cuándo se Genera una Migración?

### Desarrollo (`prisma migrate dev`)

**Cuándo usar**: Durante desarrollo, cuando modificas el schema.

```bash
# 1. Modificas schema.prisma
# 2. Ejecutas:
npx prisma migrate dev --name agregar_campo_nuevo

# Esto:
# - Genera el SQL de la migración
# - La aplica a tu BD local
# - La registra en _prisma_migrations
# - Regenera el cliente Prisma
```

**Características**:
- ✅ Crea la migración automáticamente
- ✅ La aplica inmediatamente
- ✅ Regenera el cliente
- ⚠️ Puede crear migraciones "baseline" si hay diferencias

### Producción (`prisma migrate deploy`)

**Cuándo usar**: En producción, para aplicar migraciones existentes.

```bash
npx prisma migrate deploy
```

**Características**:
- ✅ Solo aplica migraciones pendientes
- ✅ No crea nuevas migraciones
- ✅ No regenera el cliente (debe hacerse en build)
- ✅ Seguro para producción

### Crear sin Aplicar (`--create-only`)

**Cuándo usar**: Cuando quieres revisar el SQL antes de aplicarlo.

```bash
npx prisma migrate dev --name mi_migracion --create-only

# Revisa el SQL generado en:
# prisma/migrations/XXXXXX_mi_migracion/migration.sql

# Luego aplica:
npx prisma migrate dev
```

---

## ⚠️ ¿Por Qué se Corrompieron las Migraciones?

### Problema 1: Orden Cronológico Incorrecto

**Causa**: Prisma ordena migraciones por nombre (fecha en el nombre).

```
❌ MAL:
20250121200000_phase1_*  (enero 2025)
20251115103558_init      (noviembre 2025) ← Crea las tablas
```

**Resultado**: Prisma intenta modificar tablas que no existen.

**Solución**: Usar fechas consistentes o eliminar migraciones antiguas.

### Problema 2: Migraciones Duplicadas

**Causa**: Múltiples versiones de la misma migración.

```
❌ MAL:
20250121200000_phase1_*  (versión antigua)
20251122122658_phase1_*  (versión nueva)
```

**Resultado**: Confusión sobre cuál aplicar, errores de "ya aplicada".

**Solución**: Mantener solo una versión, eliminar duplicados.

### Problema 3: Migraciones Vacías

**Causa**: Carpetas de migración sin archivo `migration.sql`.

```
❌ MAL:
20251122122658_phase1_contact_security_softdelete/
  (vacía, sin migration.sql)
```

**Resultado**: Prisma no puede aplicar la migración.

**Solución**: Eliminar migraciones vacías o crear el archivo SQL.

### Problema 4: Cambios Manuales en BD

**Causa**: Modificar BD directamente sin migración.

```sql
-- ❌ MAL: Ejecutar directamente en BD
ALTER TABLE students ADD COLUMN nuevo_campo VARCHAR(100);
```

**Resultado**: Schema.prisma y BD desincronizados.

**Solución**: Siempre usar migraciones de Prisma.

---

## ✅ Mejores Prácticas

### 1. Siempre Modificar Schema Primero

```prisma
// ✅ CORRECTO
// 1. Modificar schema.prisma
model Students {
  nuevoCampo String? @db.VarChar(100)
}

// 2. Crear migración
npx prisma migrate dev --name agregar_nuevo_campo
```

### 2. Usar Nombres Descriptivos

```bash
# ✅ CORRECTO
npx prisma migrate dev --name agregar_campo_email_a_students
npx prisma migrate dev --name crear_indice_en_enrollments

# ❌ MAL
npx prisma migrate dev --name migracion1
npx prisma migrate dev --name cambios
```

### 3. Revisar SQL Generado

```bash
# Crear sin aplicar
npx prisma migrate dev --name mi_migracion --create-only

# Revisar el SQL
cat prisma/migrations/XXXXXX_mi_migracion/migration.sql

# Si está bien, aplicar
npx prisma migrate dev
```

### 4. Nunca Modificar Migraciones Aplicadas

**Regla de oro**: Una vez que una migración se aplica en producción, **NUNCA** la modifiques.

```bash
# ❌ NUNCA HACER:
# Editar prisma/migrations/20250101_xxx/migration.sql
# (si ya está aplicada en producción)
```

**Solución**: Crear una nueva migración que corrija el problema.

### 5. Verificar Estado Regularmente

```bash
# Verificar estado
npx prisma migrate status

# Debería mostrar: "Database schema is up to date!"
```

---

## 🚀 Integración con CI/CD (Drone)

### ¿Debo Ejecutar Migraciones Manualmente?

**Respuesta corta**: **NO**, deben ejecutarse automáticamente en el pipeline.

### Configuración Recomendada

#### Opción 1: En el Pipeline de Deploy (Recomendado)

**Ventajas**:
- ✅ Automático
- ✅ Versionado
- ✅ Rollback fácil

**Implementación**:

```yaml
# .drone.yml
- name: deploy
  image: appleboy/drone-ssh
  settings:
    host: your-server
    username: your-user
    # ... otras configuraciones
  script:
    - cd ~/raspylab/production/sipi/app
    - git pull origin main
    
    # 1. Aplicar migraciones ANTES del build
    - echo "=== Applying Database Migrations ==="
    - cd backend
    - npm ci
    - npx prisma migrate deploy
    - npx prisma generate
    
    # 2. Build backend
    - npm run build
    
    # 3. Build frontend
    - cd ../frontend
    - npm ci
    - npx vite build
    
    # 4. Copiar frontend a public
    - cd ../backend
    - rm -rf public/* public/.* 2>/dev/null || true
    - cp -r ../frontend/dist/* public/
    
    # 5. Reiniciar servicio
    - sudo systemctl restart sipi
```

#### Opción 2: Script Separado de Migraciones

**Ventajas**:
- ✅ Separación de responsabilidades
- ✅ Puede ejecutarse independientemente

**Implementación**:

```yaml
# .drone.yml
- name: migrate
  image: node:20
  commands:
    - cd backend
    - npm ci
    - npx prisma migrate deploy
  when:
    event:
      - push
    branch:
      - main

- name: deploy
  # ... resto del deploy
```

### ⚠️ Consideraciones Importantes

#### 1. Orden de Ejecución

**CRÍTICO**: Las migraciones deben ejecutarse **ANTES** del build.

```
✅ CORRECTO:
1. git pull
2. npm ci
3. npx prisma migrate deploy  ← PRIMERO
4. npx prisma generate
5. npm run build
6. Deploy

❌ MAL:
1. git pull
2. npm run build  ← Falla si schema cambió
3. npx prisma migrate deploy
```

#### 2. Variables de Entorno

Asegúrate de que `DATABASE_URL` esté configurada en el servidor:

```bash
# En el servidor
cat backend/.env | grep DATABASE_URL
```

#### 3. Backup Antes de Migraciones

**Recomendación**: Hacer backup antes de migraciones en producción.

```yaml
- name: backup-database
  script:
    - mysqldump -u root sipi_db > backup_$(date +%Y%m%d_%H%M%S).sql

- name: migrate
  script:
    - npx prisma migrate deploy
```

#### 4. Manejo de Errores

```yaml
- name: migrate
  script:
    - cd backend
    - npx prisma migrate deploy || {
        echo "Migration failed!"
        # Notificar (email, Slack, etc.)
        exit 1
      }
```

---

## 📋 Checklist para Migraciones

### Antes de Crear una Migración

- [ ] Schema.prisma está actualizado
- [ ] No hay cambios manuales pendientes en BD
- [ ] Estado de migraciones está limpio: `npx prisma migrate status`

### Al Crear una Migración

- [ ] Usar nombre descriptivo: `--name agregar_campo_x`
- [ ] Revisar SQL generado (usar `--create-only` primero)
- [ ] Probar localmente antes de commit

### Antes de Deploy a Producción

- [ ] Todas las migraciones están en el repositorio
- [ ] Migraciones están en orden correcto
- [ ] Backup de BD realizado
- [ ] Pipeline configurado para ejecutar migraciones

### Después de Deploy

- [ ] Verificar que migraciones se aplicaron: `npx prisma migrate status`
- [ ] Verificar que la aplicación funciona
- [ ] Monitorear logs por errores

---

## 🔧 Comandos Útiles

### Ver Estado

```bash
npx prisma migrate status
```

### Aplicar Migraciones Pendientes

```bash
# Desarrollo
npx prisma migrate dev

# Producción
npx prisma migrate deploy
```

### Crear Migración sin Aplicar

```bash
npx prisma migrate dev --name mi_migracion --create-only
```

### Marcar Migración como Aplicada

```bash
# Si una migración ya está aplicada manualmente
npx prisma migrate resolve --applied nombre_migracion
```

### Resetear Migraciones (Solo Desarrollo)

```bash
# ⚠️ ADVERTENCIA: Elimina todos los datos
npx prisma migrate reset
```

### Ver Historial

```bash
ls -la prisma/migrations/
```

---

## 🎓 Conceptos Clave a Entender

### 1. Schema.prisma es la Fuente de Verdad

- ✅ **SIEMPRE** modifica `schema.prisma` primero
- ✅ Las migraciones se generan desde el schema
- ❌ **NUNCA** modifiques la BD directamente

### 2. Migraciones son Incrementales

- Cada migración modifica la BD un paso a la vez
- Se aplican en orden cronológico (por nombre)
- No puedes "saltar" migraciones

### 3. Shadow Database

Prisma usa una "shadow database" temporal para validar migraciones:
- Crea una BD temporal
- Aplica todas las migraciones
- Compara con el schema actual
- Si hay diferencias, falla

**Por eso** es importante que todas las migraciones sean aplicables.

### 4. Tabla `_prisma_migrations`

Prisma mantiene un registro de migraciones aplicadas:

```sql
SELECT * FROM _prisma_migrations;
```

Esta tabla debe estar sincronizada con las migraciones en el sistema de archivos.

---

## 🚨 Errores Comunes y Soluciones

### Error: "Migration X failed to apply"

**Causa**: La migración tiene SQL inválido o depende de algo que no existe.

**Solución**:
1. Revisar el SQL de la migración
2. Verificar que las dependencias existen
3. Corregir el SQL o crear migración correctiva

### Error: "Migration not found"

**Causa**: La migración está en la BD pero no en el sistema de archivos (o viceversa).

**Solución**:
```bash
# Si está en BD pero no en archivos:
npx prisma migrate resolve --applied nombre_migracion

# Si está en archivos pero no en BD:
npx prisma migrate deploy
```

### Error: P3009 - "migrate found failed migrations"

**Causa**: Hay migraciones marcadas como "failed" en la tabla `_prisma_migrations` que bloquean nuevas migraciones.

**Solución**:
```bash
# Limpiar migraciones fallidas en producción
mysql -u root sipi_db -e "DELETE FROM _prisma_migrations WHERE migration_name IN ('20250121200000_phase1_contact_security_softdelete', '20250121210000_phase2_academic_periods_capacity_enrollments', '20250121220000_phase3_careers_subjects', '20250121230000_phase4_personal_academic_info', '20250121240000_phase5_history_documents', '20251121235731_test');"

# O usar el script de limpieza
mysql -u root sipi_db < backend/scripts/cleanup-old-migrations.sql

# Luego aplicar migraciones pendientes
npx prisma migrate deploy
```

**Nota**: El pipeline ahora limpia automáticamente estas migraciones antes de aplicar nuevas.

### Error: "Shadow database error"

**Causa**: Prisma no puede crear/limpiar la shadow database.

**Solución**:
- Verificar permisos de MySQL
- Verificar que `DATABASE_URL` es correcta
- Limpiar migraciones problemáticas

---

## 📊 Estado Actual de Migraciones

### Migraciones Principales (En Orden Cronológico)

1. ✅ `20251115103558_init` - Estructura base
2. ✅ `20251117110000_add_schema_improvements` - Mejoras (timestamps, índices básicos, ENUMs)
3. ✅ `20251125020647_add_promedio_ingles` - Agrega `promedioIngles` a `students`
4. ✅ `20251125025746_add_english_enrollment_fields` - Campos de inglés (RB-038)
5. ✅ `20260123000000_add_optimization_indexes` - Índices de optimización

### Migraciones Eliminadas (Ya Aplicadas o Duplicadas)

Las siguientes migraciones fueron eliminadas del sistema de archivos porque:
- Eran duplicadas de migraciones más recientes
- Sus cambios ya están en el schema actual
- Estaban causando conflictos de orden cronológico

- ❌ `20250121200000_phase1_contact_security_softdelete` - Eliminada (duplicada)
- ❌ `20250121210000_phase2_academic_periods_capacity_enrollments` - Eliminada (duplicada)
- ❌ `20250121220000_phase3_careers_subjects` - Eliminada (duplicada)
- ❌ `20250121230000_phase4_personal_academic_info` - Eliminada (duplicada)
- ❌ `20250121240000_phase5_history_documents` - Eliminada (duplicada)
- ❌ `20251121235731_test` - Eliminada (migración de prueba)
- ❌ `20251125020554_add_promedio_ingles` - Eliminada (duplicada de `20251125020647`)

**Nota**: Si estas migraciones están en la BD de producción, deben limpiarse manualmente usando el script `backend/scripts/cleanup-old-migrations.sql`.

---

## 📊 Resumen: Flujo Completo

### Desarrollo

```
1. Modificar schema.prisma
   ↓
2. npx prisma migrate dev --name descripcion
   ↓
3. Prisma genera SQL
   ↓
4. Prisma aplica a BD local
   ↓
5. Commit de migración
   ↓
6. Push a repositorio
```

### Producción (CI/CD)

```
1. Git pull en servidor
   ↓
2. npm ci (instalar dependencias)
   ↓
3. npx prisma migrate deploy (aplicar migraciones)
   ↓
4. npx prisma generate (regenerar cliente)
   ↓
5. npm run build (build aplicación)
   ↓
6. Reiniciar servicio
```

---

## 💡 Recomendaciones Finales

1. **Siempre usar migraciones**: Nunca modificar BD directamente
2. **Revisar SQL generado**: Especialmente en producción
3. **Nombres descriptivos**: Facilita el debugging
4. **Automatizar en CI/CD**: No ejecutar manualmente
5. **Backup antes de migraciones**: En producción siempre
6. **Probar localmente primero**: Antes de deployar

---

## 📚 Referencias

- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Migrate Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- Integración CI/CD: `docs/CI-CD-MIGRACIONES.md`
- Script de limpieza: `backend/scripts/cleanup-old-migrations.sql`
- README de migraciones: `backend/prisma/migrations/README.md`

---

**Última actualización**: 2026-01-24
