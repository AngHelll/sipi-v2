# Solución: Columnas createdAt/updatedAt Faltantes

## 🔍 Problema

Error al ejecutar queries de Prisma:
```
Invalid `prisma.group.findMany()` invocation
The column `sipi_db.groups.createdAt` does not exist in the current database.
```

## 🔍 Causa

La migración inicial (`20251115103558_init`) no incluyó las columnas `createdAt` y `updatedAt` en varias tablas, pero el schema de Prisma (`schema.prisma`) sí las define.

**Tablas afectadas:**
- `groups`
- `subjects`
- `teachers`
- `students`
- `enrollments`

## ✅ Solución

El proyecto incluye un script que aplica todas las mejoras necesarias a la base de datos:

```powershell
cd backend
npm run db:improve
```

Este script:
1. ✅ Agrega `createdAt` y `updatedAt` a todas las tablas
2. ✅ Agrega índices necesarios
3. ✅ Normaliza valores de `estatus` a ENUM
4. ✅ Cambia `calificacion` a DECIMAL
5. ✅ Agrega constraints de longitud
6. ✅ Actualiza foreign keys

## 🔄 Después de Ejecutar el Script

### 1. Detener el Servidor Backend

Si el servidor está corriendo, deténlo primero:
- Presiona `Ctrl + C` en la terminal donde corre el backend

### 2. Regenerar Cliente de Prisma

```powershell
cd backend
npm run prisma:generate
```

**Nota:** Si hay error de permisos, asegúrate de que el servidor esté detenido.

### 3. Reiniciar el Servidor

```powershell
npm run dev
```

## ✅ Verificación

Verifica que las columnas se agregaron:

```powershell
# Verificar tabla groups
mysql -u root sipi_db -e "DESCRIBE groups;"
```

Deberías ver `createdAt` y `updatedAt` en la lista de columnas.

## 🚨 Si el Script Falla

Si `npm run db:improve` falla, puedes ejecutar los comandos SQL manualmente:

```sql
-- Agregar timestamps a groups
ALTER TABLE `groups` 
  ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Agregar timestamps a subjects
ALTER TABLE `subjects` 
  ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Agregar timestamps a teachers
ALTER TABLE `teachers` 
  ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Agregar timestamps a students
ALTER TABLE `students` 
  ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Agregar timestamps a enrollments
ALTER TABLE `enrollments` 
  ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
```

Luego regenera Prisma:
```powershell
npm run prisma:generate
```

## 📝 Notas

- El script `apply-database-improvements.ts` es idempotente (puede ejecutarse múltiples veces sin problemas)
- Si las columnas ya existen, el script las omite
- El script también agrega índices y otras mejoras de rendimiento

## 🔗 Archivos Relacionados

- **Script:** `backend/scripts/apply-database-improvements.ts`
- **Schema:** `backend/prisma/schema.prisma`
- **Migración inicial:** `backend/prisma/migrations/20251115103558_init/migration.sql`

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd")

