# Solución: Error de Migración Fallida en Producción

## 🔴 Error Detectado en Pipeline

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20250121200000_phase1_contact_security_softdelete` migration started at 2026-01-22 08:40:12.686 UTC failed
```

## 🔍 Causa del Problema

En producción, la migración `20250121200000_phase1_contact_security_softdelete` está marcada como **"failed"** en la tabla `_prisma_migrations`. 

Aunque:
- ✅ La migración fue eliminada del sistema de archivos (porque era duplicada)
- ✅ Los cambios ya están aplicados en la BD
- ✅ El schema actual está correcto

Prisma **bloquea nuevas migraciones** si detecta migraciones fallidas en la BD.

---

## ✅ Solución: Limpiar Migración Fallida

### Opción 1: Script SQL (Recomendado)

Ejecutar en el servidor de producción:

```bash
# Conectar a MySQL
mysql -u root sipi_db

# Ejecutar limpieza
source /ruta/a/backend/scripts/cleanup-old-migrations.sql

# O directamente:
mysql -u root sipi_db < ~/raspylab/production/sipi/app/backend/scripts/cleanup-old-migrations.sql
```

### Opción 2: Comando Directo

```bash
# En el servidor de producción
cd ~/raspylab/production/sipi/app/backend

mysql -u root sipi_db << EOF
-- Eliminar migración fallida
DELETE FROM _prisma_migrations 
WHERE migration_name = '20250121200000_phase1_contact_security_softdelete';

-- Verificar
SELECT migration_name, finished_at, applied_steps_count 
FROM _prisma_migrations 
ORDER BY finished_at;
EOF
```

### Opción 3: Usar Prisma Migrate Resolve

```bash
# En el servidor de producción
cd ~/raspylab/production/sipi/app/backend

# Marcar como resuelta (si los cambios ya están aplicados)
npx prisma migrate resolve --rolled-back 20250121200000_phase1_contact_security_softdelete
```

**Nota**: `--rolled-back` marca la migración como "rolled back" (revertida), lo que permite continuar.

---

## 🔄 Después de Limpiar

### 1. Verificar Estado

```bash
cd ~/raspylab/production/sipi/app/backend
npx prisma migrate status
```

**Resultado esperado**: Debería mostrar las migraciones pendientes sin el error de "failed migration".

### 2. Aplicar Migraciones Pendientes

```bash
npx prisma migrate deploy
```

Esto aplicará:
- `20260123000000_add_optimization_indexes` (índices de optimización)

### 3. Verificar Índices

```sql
-- Verificar que los índices se crearon
SHOW INDEXES FROM enrollments WHERE Key_name LIKE '%deletedAt%';
SHOW INDEXES FROM students WHERE Key_name LIKE '%deletedAt%';
```

---

## 🚀 Integrar en Pipeline (Opcional)

Si quieres automatizar la limpieza en el pipeline, puedes agregar esto al `.drone.yml`:

```yaml
- name: cleanup-failed-migrations
  script:
    - cd backend
    - mysql -u root sipi_db -e "DELETE FROM _prisma_migrations WHERE migration_name = '20250121200000_phase1_contact_security_softdelete';" || true

- name: migrate
  script:
    - npx prisma migrate deploy
```

**Nota**: El `|| true` evita que el pipeline falle si la migración ya no existe.

---

## 📋 Checklist de Solución

- [ ] Conectar a servidor de producción
- [ ] Ejecutar script de limpieza o comando SQL
- [ ] Verificar que la migración fallida fue eliminada
- [ ] Ejecutar `npx prisma migrate status` (debe mostrar migraciones pendientes sin error)
- [ ] Ejecutar `npx prisma migrate deploy` (aplica migración de índices)
- [ ] Verificar que los índices se crearon
- [ ] Verificar que la aplicación funciona correctamente

---

## ⚠️ Notas Importantes

1. **Solo ejecutar en producción** si estás seguro de que los cambios de la migración fallida ya están aplicados
2. **Hacer backup** antes de modificar `_prisma_migrations`
3. **Verificar** que el schema actual coincide con la BD después de limpiar

---

## 🔍 Verificar Estado Actual

Para ver qué migraciones están en la BD:

```sql
SELECT 
  migration_name, 
  finished_at, 
  applied_steps_count,
  CASE 
    WHEN finished_at IS NULL THEN 'PENDING'
    WHEN applied_steps_count = 0 THEN 'FAILED'
    ELSE 'APPLIED'
  END as status
FROM _prisma_migrations 
ORDER BY started_at;
```

---

**Última actualización**: 2026-01-24
**Estado**: Solución documentada ✅
