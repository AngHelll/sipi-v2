# Migraciones de Base de Datos - SIPI Modern

## 📋 Orden de Aplicación

Las migraciones se aplican en orden cronológico (por nombre de carpeta). Este es el orden correcto:

1. **20251115103558_init** - Estructura base inicial (crea todas las tablas principales)
2. **20251117110000_add_schema_improvements** - Mejoras de schema (timestamps, índices, ENUMs)
3. **20251125020647_add_promedio_ingles** - Agrega promedioIngles a students
4. **20251125025746_add_english_enrollment_fields** - Campos de inglés (RB-038)
5. **20260123000000_add_optimization_indexes** - Índices de optimización (Nivel 1) ✅
6. **20260524100000_add_academic_activities_v2** - Tablas V2 (inglés, exámenes, cursos especiales) ✅
7. **20260610120000_add_careers_catalog** - Catálogo de carreras + carreraId en students/subjects ✅

**Nota**: Las migraciones de "fase" (20251122*) fueron eliminadas porque:
- Estaban vacías (sin archivo migration.sql)
- Los cambios ya están aplicados en la BD (fueron aplicados por versiones anteriores)
- Estaban marcadas como aplicadas en la tabla `_prisma_migrations`

---

## ⚠️ Migraciones Eliminadas

Las siguientes migraciones fueron eliminadas por ser duplicadas, problemáticas o vacías:

### Migraciones Antiguas (Fechas Incorrectas)
- ❌ `20250121200000_phase1_*` - Duplicado (versión antigua, fechas incorrectas)
- ❌ `20250121210000_phase2_*` - Duplicado (versión antigua, fechas incorrectas)
- ❌ `20250121220000_phase3_*` - Duplicado (versión antigua, fechas incorrectas)
- ❌ `20250121230000_phase4_*` - Duplicado (versión antigua, fechas incorrectas)
- ❌ `20250121240000_phase5_*` - Duplicado (versión antigua, fechas incorrectas)

**Razón**: Tenían fechas que las hacían ejecutarse antes de `init`, causando errores porque intentaban modificar tablas que no existían.

### Migraciones Vacías
- ❌ `20251122122658_phase1_*` - Vacía (sin migration.sql)
- ❌ `20251122123424_phase2_*` - Vacía (sin migration.sql)
- ❌ `20251122125000_phase3_*` - Vacía (sin migration.sql)
- ❌ `20251122130024_phase4_*` - Vacía (sin migration.sql)
- ❌ `20251122130659_phase5_*` - Vacía (sin migration.sql)

**Razón**: Estaban vacías y los cambios ya estaban aplicados en la BD (por versiones anteriores).

### Otras
- ❌ `20251121235731_test` - Migración de prueba
- ❌ `20251125020554_add_promedio_ingles` - Duplicado (mantenida versión 20251125020647)

---

## 🚀 Aplicar Migraciones

### Desarrollo

```bash
cd backend
npx prisma migrate dev
```

### Producción

```bash
cd backend
npx prisma migrate deploy
```

---

## ✅ Verificar Estado

```bash
npx prisma migrate status
```

Debería mostrar: "Database schema is up to date!"

---

## 📚 Referencias

- Documentación de alineación: `docs/MIGRACIONES-ALINEACION.md`
- Guía de limpieza: `docs/MIGRACIONES-LIMPIEZA.md`
- Guía de consolidación: `backend/prisma/MIGRACIONES-CONSOLIDACION.md`

---

### Migraciones en entornos que ya tienen las tablas

Si aplicaste el schema con `db push` (o las migraciones "phase" antiguas) y las tablas ya existen, marca las migraciones como aplicadas sin ejecutarlas:

```bash
npx prisma migrate resolve --applied 20260524100000_add_academic_activities_v2
npx prisma migrate resolve --applied 20260610120000_add_careers_catalog
```

Después de la migración de careers, carga el catálogo:

```bash
npm run seed:careers
```

---

**Última actualización**: 2026-06-10
