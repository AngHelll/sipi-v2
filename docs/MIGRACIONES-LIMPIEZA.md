# Limpieza de Migraciones - Guía de Ejecución

## ✅ Migraciones Eliminadas

### 1. Migración Duplicada Eliminada

- ❌ **Eliminada**: `20251125020554_add_promedio_ingles`
- ✅ **Mantenida**: `20251125020647_add_promedio_ingles` (mejor documentada, incluye referencia RB-037)

**Razón**: Ambas migraciones hacen exactamente lo mismo (agregar `promedioIngles` a `students`). La segunda tiene mejor documentación.

---

## 🚀 Cómo Aplicar en Producción

### Opción A: Si la Migración NO Está Aplicada en Producción

Si la migración duplicada nunca se aplicó en producción, simplemente hacer pull del código:

```bash
# En el servidor de producción
cd ~/raspylab/production/sipi/app
git pull origin main

# Verificar que la migración fue eliminada
ls -la backend/prisma/migrations/ | grep promedio
# Solo debería aparecer: 20251125020647_add_promedio_ingles

# Verificar estado de migraciones
cd backend
npx prisma migrate status
```

**Resultado esperado**: Prisma mostrará que todas las migraciones están aplicadas (o mostrará solo las pendientes).

---

### Opción B: Si la Migración YA Está Aplicada en Producción

Si la migración duplicada ya se aplicó en producción, Prisma la esperará. Necesitas marcarla como "resuelta" antes de eliminarla:

```bash
# En el servidor de producción
cd ~/raspylab/production/sipi/app/backend

# 1. Marcar la migración duplicada como resuelta (si ya está aplicada)
npx prisma migrate resolve --applied 20251125020554_add_promedio_ingles

# 2. Hacer pull del código (que ya no tiene esa migración)
cd ..
git pull origin main

# 3. Verificar estado
cd backend
npx prisma migrate status
```

**Nota**: Si la migración duplicada nunca se aplicó (porque la segunda ya agregó la columna), simplemente hacer pull es suficiente.

---

## 🔍 Verificación

### 1. Verificar que la Columna Existe

```sql
-- En MySQL
DESCRIBE students;
-- O
SHOW COLUMNS FROM students LIKE 'promedioIngles';
```

Deberías ver la columna `promedioIngles` de tipo `DECIMAL(5,2)`.

### 2. Verificar Estado de Migraciones

```bash
cd backend
npx prisma migrate status
```

**Resultado esperado**: 
- Si todo está bien: "Database schema is up to date!"
- Si hay problemas: Prisma mostrará qué migraciones faltan o están desincronizadas

### 3. Verificar que No Hay Duplicados

```bash
ls -la backend/prisma/migrations/ | grep promedio
```

Solo debería aparecer una migración: `20251125020647_add_promedio_ingles`

---

## ⚠️ Si Hay Problemas

### Error: "Migration X not found"

Si Prisma busca la migración eliminada y no la encuentra:

```bash
# Marcar como resuelta (si ya está aplicada en BD)
npx prisma migrate resolve --applied 20251125020554_add_promedio_ingles

# O si nunca se aplicó, simplemente sincronizar
npx prisma migrate deploy
```

### Error: "Column already exists"

Si intentas aplicar la migración y la columna ya existe:

```bash
# Marcar ambas como resueltas
npx prisma migrate resolve --applied 20251125020554_add_promedio_ingles
npx prisma migrate resolve --applied 20251125020647_add_promedio_ingles
```

---

## 📋 Checklist de Aplicación

- [ ] Hacer pull del código en producción
- [ ] Verificar que la migración duplicada fue eliminada
- [ ] Verificar estado: `npx prisma migrate status`
- [ ] Si la migración ya estaba aplicada, marcarla como resuelta
- [ ] Aplicar migraciones pendientes si las hay
- [ ] Verificar que la columna `promedioIngles` existe en BD
- [ ] Verificar que no hay errores en logs

---

## 🎯 Recomendación

**Hacerlo local primero para verificar**:

1. **Local**:
   ```bash
   cd backend
   npx prisma migrate status
   # Verificar que todo está bien
   ```

2. **Producción**:
   ```bash
   # Hacer pull
   git pull origin main
   
   # Verificar estado
   cd backend
   npx prisma migrate status
   
   # Si hay problemas, marcar como resuelta
   npx prisma migrate resolve --applied 20251125020554_add_promedio_ingles
   ```

---

## 📚 Referencias

- Documentación de alineación: `docs/MIGRACIONES-ALINEACION.md`
- Guía de consolidación: `backend/prisma/MIGRACIONES-CONSOLIDACION.md`
- [Prisma Migrate Resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)

---

**Última actualización**: 2026-01-23
**Estado**: Migración duplicada eliminada ✅
