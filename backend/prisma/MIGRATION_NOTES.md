# 📋 Notas de Migración - SIPI Modern

## ⚠️ IMPORTANTE: Discrepancias Detectadas

El `schema.prisma` actual tiene mejoras que **NO están** en la migración inicial (`20251115103558_init`).

### 🔴 Diferencias Críticas Encontradas

#### 1. Tabla `students`
- ❌ **Migración inicial**: `estatus` es `VARCHAR(191)`
- ✅ **Schema actual**: `estatus` es `ENUM('ACTIVO', 'INACTIVO', 'EGRESADO')`
- ❌ **Migración inicial**: No tiene campo `curp`
- ✅ **Schema actual**: Tiene `curp String? @unique @db.VarChar(18)`
- ❌ **Migración inicial**: No tiene `createdAt` y `updatedAt`
- ✅ **Schema actual**: Tiene timestamps
- ❌ **Migración inicial**: Faltan índices (`carrera`, `semestre`, `estatus`, `curp`, `[carrera, semestre]`)
- ✅ **Schema actual**: Tiene todos los índices

#### 2. Tabla `teachers`
- ❌ **Migración inicial**: No tiene `createdAt` y `updatedAt`
- ✅ **Schema actual**: Tiene timestamps
- ❌ **Migración inicial**: No tiene índice en `departamento`
- ✅ **Schema actual**: Tiene índice en `departamento`

#### 3. Tabla `subjects`
- ❌ **Migración inicial**: No tiene `createdAt` y `updatedAt`
- ✅ **Schema actual**: Tiene timestamps
- ❌ **Migración inicial**: `clave` y `nombre` son `VARCHAR(191)` sin límites específicos
- ✅ **Schema actual**: `clave` es `@db.VarChar(20)`, `nombre` es `@db.VarChar(200)`

#### 4. Tabla `groups`
- ❌ **Migración inicial**: No tiene `createdAt` y `updatedAt`
- ✅ **Schema actual**: Tiene timestamps
- ❌ **Migración inicial**: `nombre` y `periodo` son `VARCHAR(191)` sin límites
- ✅ **Schema actual**: `nombre` es `@db.VarChar(50)`, `periodo` es `@db.VarChar(10)`
- ❌ **Migración inicial**: Faltan índices (`periodo`, `[subjectId, periodo]`, `[teacherId, periodo]`)
- ✅ **Schema actual**: Tiene todos los índices
- ❌ **Migración inicial**: `groups_subjectId_fkey` tiene `ON DELETE CASCADE`
- ✅ **Schema actual**: Tiene `ON DELETE RESTRICT` (más seguro)

#### 5. Tabla `enrollments`
- ❌ **Migración inicial**: `calificacion` es `DOUBLE`
- ✅ **Schema actual**: `calificacion` es `Decimal(5, 2)` (más preciso)
- ❌ **Migración inicial**: No tiene `createdAt` y `updatedAt`
- ✅ **Schema actual**: Tiene timestamps
- ❌ **Migración inicial**: Faltan índices (`[studentId]`, `[groupId]`, `[studentId, groupId]`)
- ✅ **Schema actual**: Tiene todos los índices

#### 6. Tabla `users`
- ❌ **Migración inicial**: `username` es `VARCHAR(191)` sin límite específico
- ✅ **Schema actual**: `username` es `@db.VarChar(50)`
- ❌ **Migración inicial**: No tiene índice explícito en `username` (solo UNIQUE)
- ✅ **Schema actual**: Tiene `@@index([username])` explícito

---

## ✅ Solución Recomendada

### Opción 1: Crear Nueva Migración (Recomendado)

Ejecuta Prisma para generar una migración que sincronice el schema con la base de datos:

```bash
cd backend
npm run prisma:migrate
# O manualmente:
npx prisma migrate dev --name update_schema_improvements
```

Esto creará una nueva migración que:
- Cambiará `estatus` de VARCHAR a ENUM
- Agregará el campo `curp` a `students`
- Agregará timestamps a todas las tablas
- Agregará todos los índices faltantes
- Cambiará tipos de datos (DOUBLE → DECIMAL)
- Actualizará constraints de foreign keys

### Opción 2: Resetear Base de Datos (Solo Desarrollo)

⚠️ **ADVERTENCIA**: Esto eliminará todos los datos.

```bash
cd backend
npx prisma migrate reset
```

### Opción 3: Usar `prisma db push` (Solo Desarrollo)

Para sincronizar sin crear migración (útil en desarrollo):

```bash
cd backend
npx prisma db push
```

---

## 📝 Estado Actual

- ✅ **Schema.prisma**: Actualizado con todas las mejoras
- ⚠️ **Migración inicial**: Desactualizada (faltan mejoras)
- ✅ **Base de datos**: Probablemente sincronizada con `prisma db push` o migraciones manuales

---

## 🎯 Recomendación Final

**Para el repositorio público:**

1. ✅ Mantener el `schema.prisma` actualizado (ya está bien)
2. ✅ Crear una nueva migración que sincronice todo:
   ```bash
   npx prisma migrate dev --name add_schema_improvements
   ```
3. ✅ Documentar en el README que se debe ejecutar `npm run prisma:migrate` después de clonar

**Para producción:**

- Ejecutar las migraciones en orden:
  1. `20251115103558_init` (migración inicial)
  2. Nueva migración con mejoras (a crear)

---

## 📚 Referencias

- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- Schema actual: `backend/prisma/schema.prisma`
- Migración inicial: `backend/prisma/migrations/20251115103558_init/migration.sql`

