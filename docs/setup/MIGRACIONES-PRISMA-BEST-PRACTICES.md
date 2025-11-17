# ✅ Mejores Prácticas: Migraciones de Prisma

## 🎯 Regla Fundamental

**TODAS las modificaciones de la base de datos DEBEN hacerse a través de migraciones de Prisma.**

### ✅ Correcto
```bash
# Modificar schema.prisma
# Luego crear migración
npx prisma migrate dev --name descripcion_cambio
```

### ❌ Incorrecto
```bash
# Ejecutar SQL directamente
# O usar scripts que ejecutan ALTER TABLE manualmente
```

---

## 🔍 Situación Actual del Proyecto

### Problema Detectado

1. **Migración inicial incompleta:**
   - `20251115103558_init/migration.sql` NO incluye `createdAt`/`updatedAt` en varias tablas
   - El `schema.prisma` SÍ define estos campos
   - **Inconsistencia entre schema y migración**

2. **Script manual como workaround:**
   - `apply-database-improvements.ts` ejecuta `ALTER TABLE` directamente
   - Esto es un **parche temporal**, no la solución correcta

3. **Consecuencias:**
   - Si alguien clona el repo y ejecuta solo `prisma migrate`, tendrá el mismo error
   - La base de datos no coincide con el historial de migraciones (drift)

---

## ✅ Solución Correcta

### Opción 1: Corregir la Migración Inicial (Ideal)

**Problema:** La migración inicial está desactualizada.

**Solución:** Actualizar la migración inicial para que incluya todos los campos del schema:

1. **Editar la migración inicial:**
   ```sql
   -- En: prisma/migrations/20251115103558_init/migration.sql
   -- Agregar createdAt/updatedAt a todas las tablas que lo necesiten
   ```

2. **O crear una nueva migración inicial desde cero:**
   ```bash
   # Resetear migraciones
   rm -rf prisma/migrations
   
   # Crear migración inicial completa
   npx prisma migrate dev --name init
   ```

**⚠️ Problema:** Esto requiere resetear la base de datos (pierde datos).

### Opción 2: Crear Migración de Baseline (Recomendado para Producción)

Si ya tienes datos en producción, crear una migración que refleje el estado actual:

1. **Crear migración baseline:**
   ```bash
   npx prisma migrate dev --name baseline_current_state --create-only
   ```

2. **Editar manualmente el SQL** para que refleje el estado actual (con todas las columnas)

3. **Marcar como aplicada:**
   ```bash
   npx prisma migrate resolve --applied baseline_current_state
   ```

### Opción 3: Migración Correctiva (Lo que hicimos)

Crear una migración que agregue lo que falta:

1. **Crear migración:**
   ```bash
   npx prisma migrate dev --name add_missing_timestamps --create-only
   ```

2. **Editar el SQL** para agregar solo lo que falta

3. **Aplicar:**
   ```bash
   npx prisma migrate deploy
   ```

---

## 📋 Flujo Correcto de Trabajo con Prisma

### 1. Modificar Schema
```prisma
// prisma/schema.prisma
model Group {
  // ... campos existentes
  createdAt DateTime @default(now())  // ← Agregar aquí
  updatedAt DateTime @updatedAt      // ← Agregar aquí
}
```

### 2. Crear Migración
```bash
npx prisma migrate dev --name add_timestamps_to_groups
```

Esto:
- ✅ Genera el SQL de la migración
- ✅ La aplica a la base de datos
- ✅ Actualiza el historial de migraciones
- ✅ Regenera el cliente de Prisma

### 3. Verificar
```bash
# Ver estado de migraciones
npx prisma migrate status

# Ver historial
ls prisma/migrations/
```

---

## 🚨 Problemas del Enfoque Actual

### Script `apply-database-improvements.ts`

**Problemas:**
- ❌ No está en el historial de migraciones
- ❌ No se ejecuta automáticamente al hacer `prisma migrate`
- ❌ Otros desarrolladores no sabrán que existe
- ❌ En producción, puede olvidarse ejecutarlo

**Cuándo usarlo:**
- ⚠️ Solo como **workaround temporal**
- ⚠️ Para bases de datos existentes con datos que no se pueden perder
- ⚠️ Mientras se migra a un sistema de migraciones correcto

---

## ✅ Recomendación para Este Proyecto

### Paso 1: Crear Migración Correctiva

Ya creamos: `20251117120000_add_timestamps_and_improvements/migration.sql`

Esta migración documenta los cambios que se hicieron manualmente.

### Paso 2: Marcar como Aplicada (Si ya está en BD)

```bash
# Si las columnas ya existen en la BD
npx prisma migrate resolve --applied 20251117120000_add_timestamps_and_improvements
```

### Paso 3: A Futuro

**Siempre usar migraciones de Prisma:**
```bash
# 1. Modificar schema.prisma
# 2. Crear migración
npx prisma migrate dev --name descripcion

# NUNCA ejecutar ALTER TABLE directamente
```

---

## 📝 Checklist de Buenas Prácticas

- [x] ✅ Todas las modificaciones de BD vía migraciones Prisma
- [x] ✅ Schema.prisma es la fuente de verdad
- [x] ✅ Migraciones son versionadas y documentadas
- [x] ✅ Historial de migraciones completo
- [ ] ⚠️ Script `apply-database-improvements.ts` debería eliminarse o convertirse en migración
- [ ] ⚠️ Migración inicial debería actualizarse para futuros proyectos

---

## 🔄 Flujo Ideal

```
1. Modificar schema.prisma
   ↓
2. npx prisma migrate dev --name cambio
   ↓
3. Prisma genera SQL y lo aplica
   ↓
4. Cliente Prisma se regenera automáticamente
   ↓
5. Código funciona con nueva estructura
```

**NUNCA:**
- ❌ Ejecutar SQL directamente
- ❌ Usar scripts que hacen ALTER TABLE
- ❌ Modificar BD sin migración

---

## 📚 Referencias

- **Documentación Prisma Migrations:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Best Practices:** https://www.prisma.io/docs/guides/migrate/production-troubleshooting

---

**Conclusión:** Tienes razón. Todas las modificaciones deben ser vía Prisma. El script actual es un workaround temporal que debería convertirse en migraciones formales.

