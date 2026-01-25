# Guía de Consolidación de Migraciones

## 🎯 Objetivo

Alinear todas las migraciones con el schema actual y eliminar duplicados o inconsistencias.

## 📋 Estado Actual

### Migraciones Principales (Aplicar en este orden)

1. ✅ `20251115103558_init` - Estructura base
2. ✅ `20251117110000_add_schema_improvements` - Mejoras (timestamps, índices, ENUMs)
3. ⚠️ `20251125020554_add_promedio_ingles` - **DUPLICADO** (ver abajo)
4. ✅ `20251125020647_add_promedio_ingles` - Agrega promedioIngles (mantener esta)
5. ✅ `20251125025746_add_english_enrollment_fields` - Campos de inglés (RB-038)
6. ✅ `20260123000000_add_optimization_indexes` - Índices de optimización

### Problemas Identificados

#### 1. Migraciones Duplicadas

**Problema**: `20251125020554_add_promedio_ingles` y `20251125020647_add_promedio_ingles` hacen lo mismo.

**Solución**: 
- **Opción A (Recomendada)**: Eliminar la primera migración duplicada
  ```bash
  rm -rf backend/prisma/migrations/20251125020554_add_promedio_ingles
  ```
- **Opción B**: Si la BD ya tiene ambas aplicadas, marcar como resueltas:
  ```bash
  npx prisma migrate resolve --applied 20251125020554_add_promedio_ingles
  npx prisma migrate resolve --applied 20251125020647_add_promedio_ingles
  ```

#### 2. Migraciones Manuales/Históricas

Las siguientes migraciones parecen ser manuales y pueden no ser necesarias para nuevas instalaciones:

- `20250121200000_phase1_*` - Fase 1 (contacto, seguridad, soft delete)
- `20250121210000_phase2_*` - Fase 2 (períodos académicos, capacidad)
- `20250121220000_phase3_*` - Fase 3 (carreras, materias)
- `20250121230000_phase4_*` - Fase 4 (info personal/académica)
- `20250121240000_phase5_*` - Fase 5 (historial, documentos)
- `20251121235731_test` - Migración de prueba

**Recomendación**: 
- Si estas migraciones ya están aplicadas en producción, mantenerlas
- Si son para nuevas instalaciones, verificar si el schema actual las incluye
- Si el schema actual las incluye, estas migraciones son redundantes

---

## ✅ Plan de Consolidación

### Paso 1: Verificar Estado Actual

```bash
cd backend
npx prisma migrate status
```

Esto mostrará qué migraciones están aplicadas y cuáles faltan.

### Paso 2: Eliminar Duplicados

```bash
# Eliminar migración duplicada de promedioIngles
rm -rf backend/prisma/migrations/20251125020554_add_promedio_ingles
```

### Paso 3: Verificar Schema

```bash
npx prisma validate
```

Debería pasar sin errores.

### Paso 4: Aplicar Migraciones Pendientes

```bash
# En desarrollo
npx prisma migrate dev

# En producción
npx prisma migrate deploy
```

### Paso 5: Verificar Índices

```sql
-- Verificar que los índices de optimización existen
SHOW INDEXES FROM enrollments WHERE Key_name LIKE '%deletedAt%';
SHOW INDEXES FROM students WHERE Key_name LIKE '%deletedAt%';
```

---

## 🔄 Para Nuevas Instalaciones

Si estás creando una nueva instalación desde cero:

### Opción 1: Usar Migraciones Existentes (Recomendado)

```bash
cd backend
npx prisma migrate deploy
```

Esto aplicará todas las migraciones en orden.

### Opción 2: Crear Migración Baseline (Si quieres empezar limpio)

```bash
# 1. Backup del schema actual
cp prisma/schema.prisma prisma/schema.backup.prisma

# 2. Eliminar migraciones existentes
rm -rf prisma/migrations/*

# 3. Crear migración inicial desde schema actual
npx prisma migrate dev --name init_consolidated

# 4. Verificar
npx prisma migrate status
```

**⚠️ ADVERTENCIA**: Esto requiere resetear la base de datos. Solo hacer en desarrollo.

---

## 📝 Checklist de Consolidación

- [ ] Verificar estado de migraciones: `npx prisma migrate status`
- [ ] Eliminar migración duplicada `20251125020554_add_promedio_ingles`
- [ ] Verificar que schema está alineado: `npx prisma validate`
- [ ] Aplicar migraciones pendientes
- [ ] Verificar índices de optimización en BD
- [ ] Documentar cualquier migración manual que se mantenga

---

## 🚨 Notas Importantes

1. **NUNCA eliminar migraciones ya aplicadas en producción** sin hacer backup
2. **Siempre verificar** con `prisma migrate status` antes de hacer cambios
3. **Las migraciones deben ser idempotentes** cuando sea posible (usar `IF NOT EXISTS`)
4. **Documentar** cualquier migración manual que se mantenga

---

## 📚 Referencias

- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- Documentación de alineación: `docs/MIGRACIONES-ALINEACION.md`
- Documentación de optimizaciones: `docs/OPTIMIZACIONES-IMPLEMENTADAS.md`

---

**Última actualización**: 2026-01-23
**Estado**: En proceso de consolidación ⚠️
