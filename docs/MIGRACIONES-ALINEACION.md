# Alineación de Migraciones - SIPI Modern

## 📋 Problema Identificado

Las migraciones de Prisma no estaban completamente alineadas con el schema actual. Se han identificado y corregido las siguientes inconsistencias:

### 🔴 Problemas Encontrados

1. **Índices de optimización faltantes**: Los índices compuestos agregados en el schema no tenían migración correspondiente
2. **Migraciones desordenadas**: Múltiples migraciones con fechas inconsistentes
3. **Falta de sincronización**: Algunos cambios en el schema no tenían migración

---

## ✅ Solución Implementada

### 1. Migración de Índices de Optimización

**Archivo**: `backend/prisma/migrations/20260123000000_add_optimization_indexes/migration.sql`

Esta migración agrega los índices compuestos necesarios para optimizar queries frecuentes:

#### Índices en `enrollments`:
- `enrollments_studentId_deletedAt_idx`: Para búsquedas de inscripciones por estudiante con soft delete
- `enrollments_estatus_deletedAt_idx`: Para listados con filtro de estatus

#### Índices en `students`:
- `students_estatus_deletedAt_idx`: Para listados con filtro de estatus
- `students_carrera_estatus_deletedAt_idx`: Para búsquedas por carrera y estatus (queries comunes del admin)

### 2. Verificación de Alineación

Para verificar que el schema y las migraciones están alineados:

```bash
cd backend
npx prisma migrate status
```

Si hay diferencias, Prisma las mostrará.

---

## 📝 Estado Actual de Migraciones

### Migraciones Principales (En Orden de Aplicación)

1. **20251115103558_init** - Migración inicial (estructura base)
2. **20251117110000_add_schema_improvements** - Mejoras de schema (timestamps, índices básicos, ENUMs)
3. **20251125025746_add_english_enrollment_fields** - Campos de inglés (RB-038)
4. **20260123000000_add_optimization_indexes** - Índices de optimización (NUEVA - Nivel 1 optimizations)

### Migraciones Duplicadas Detectadas

⚠️ **Problema**: Hay dos migraciones que hacen lo mismo:

1. `20251125020554_add_promedio_ingles` - Agrega `promedioIngles` a `students`
2. `20251125020647_add_promedio_ingles` - Agrega `promedioIngles` a `students` (duplicado)

**Problema**: Si se aplican ambas, la segunda fallará porque la columna ya existe.

**Solución**: 
- Si la BD ya tiene la columna, marcar ambas como aplicadas:
  ```bash
  npx prisma migrate resolve --applied 20251125020554_add_promedio_ingles
  npx prisma migrate resolve --applied 20251125020647_add_promedio_ingles
  ```
- O eliminar una de las dos migraciones (recomendado: eliminar la primera, mantener la segunda que tiene mejor documentación)

### Migraciones Manuales/Históricas (No usar en producción nueva)

Las siguientes migraciones parecen ser manuales o de desarrollo y no deberían usarse en instalaciones nuevas:

- `20250121200000_phase1_*` - Migraciones de fase (probablemente manuales)
- `20250121210000_phase2_*` - Migraciones de fase (probablemente manuales)
- `20250121220000_phase3_*` - Migraciones de fase (probablemente manuales)
- `20250121230000_phase4_*` - Migraciones de fase (probablemente manuales)
- `20250121240000_phase5_*` - Migraciones de fase (probablemente manuales)
- `20251121235731_test` - Migración de prueba

**Nota**: Estas migraciones pueden estar presentes en bases de datos existentes, pero no son necesarias para nuevas instalaciones si el schema actual las incluye.

### Migraciones Manuales (No usar en producción)

Las siguientes migraciones parecen ser manuales o de desarrollo y no deberían usarse en producción:

- `20250121200000_phase1_*` - Migraciones de fase (probablemente manuales)
- `20250121210000_phase2_*` - Migraciones de fase (probablemente manuales)
- `20250121220000_phase3_*` - Migraciones de fase (probablemente manuales)
- `20250121230000_phase4_*` - Migraciones de fase (probablemente manuales)
- `20250121240000_phase5_*` - Migraciones de fase (probablemente manuales)
- `20251121235731_test` - Migración de prueba

**Recomendación**: Estas migraciones deberían consolidarse o eliminarse si no son necesarias.

---

## 🚀 Aplicar Migraciones

### En Desarrollo

```bash
cd backend
npx prisma migrate dev
```

Esto aplicará todas las migraciones pendientes y regenerará el cliente de Prisma.

### En Producción

```bash
cd backend
npx prisma migrate deploy
```

Esto aplicará solo las migraciones pendientes sin interactuar con el usuario.

---

## ✅ Verificación Post-Migración

### 1. Verificar Estado

```bash
npx prisma migrate status
```

Debería mostrar: "Database schema is up to date!"

### 2. Verificar Índices en Base de Datos

```sql
-- Ver índices de enrollments
SHOW INDEXES FROM enrollments;

-- Ver índices de students
SHOW INDEXES FROM students;
```

Deberías ver los nuevos índices:
- `enrollments_studentId_deletedAt_idx`
- `enrollments_estatus_deletedAt_idx`
- `students_estatus_deletedAt_idx`
- `students_carrera_estatus_deletedAt_idx`

### 3. Verificar Schema

```bash
npx prisma validate
```

Debería pasar sin errores.

---

## 📋 Checklist de Alineación

- [x] ✅ Schema.prisma actualizado con índices de optimización
- [x] ✅ Migración creada para índices de optimización
- [x] ✅ Índices compuestos agregados para queries frecuentes
- [x] ✅ Documentación actualizada
- [ ] ⚠️ Revisar y consolidar migraciones manuales (fase 1-5)
- [ ] ⚠️ Eliminar migración de prueba (`20251121235731_test`)

---

## 🔄 Próximos Pasos Recomendados

### 1. Consolidar Migraciones Manuales

Si las migraciones de "fase" no son necesarias, considerar:

```bash
# Opción 1: Eliminar si no se usan
rm -rf prisma/migrations/202501212*

# Opción 2: Consolidar en una sola migración baseline
# (Requiere resetear BD o crear migración baseline)
```

### 2. Limpiar Migraciones de Prueba

```bash
rm -rf prisma/migrations/20251121235731_test
```

### 3. Crear Migración Baseline (Opcional)

Si quieres empezar desde cero con una migración limpia:

```bash
# 1. Backup de datos
mysqldump -u root sipi_db > backup.sql

# 2. Resetear migraciones (solo desarrollo)
rm -rf prisma/migrations/*

# 3. Crear migración inicial desde schema actual
npx prisma migrate dev --name init_consolidated

# 4. Restaurar datos
mysql -u root sipi_db < backup.sql
```

**⚠️ ADVERTENCIA**: Esto requiere resetear la base de datos. Solo hacer en desarrollo.

---

## 📚 Referencias

- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- Schema actual: `backend/prisma/schema.prisma`
- Documentación de optimizaciones: `docs/OPTIMIZACIONES-IMPLEMENTADAS.md`

---

## 💡 Notas Importantes

1. **NUNCA modificar migraciones ya aplicadas en producción**
2. **Siempre crear nuevas migraciones para cambios**
3. **Verificar con `prisma migrate status` antes de deployar**
4. **Las migraciones deben ser idempotentes cuando sea posible**

---

**Última actualización**: 2026-01-23
**Estado**: Migraciones alineadas con schema actual ✅
