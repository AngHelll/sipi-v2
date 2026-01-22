# Estrategia de Homologación de Idiomas - Español → Inglés

## 📊 Análisis del Problema

**Situación actual:** Mezcla de español e inglés en:
- Base de datos (schema.prisma): ~70% español, ~30% inglés
- Backend (código): ~60% español, ~40% inglés  
- Frontend (types): ~50% español, ~50% inglés

**Impacto estimado:**
- **1043+ ocurrencias** de palabras en español en el código
- **39 archivos** afectados directamente
- **Todas las tablas** de la base de datos
- **Todos los DTOs** (backend y frontend)
- **Todos los types** (frontend)

## 🎯 Objetivo

Homologar **todo el código** a inglés, manteniendo español solo para:
- Mensajes de UI al usuario final
- Comentarios de documentación (opcional)
- Documentación de usuario

## 📋 Mapeo de Campos Principales

### Base de Datos

| Español (Actual) | Inglés (Propuesto) |
|------------------|-------------------|
| `nombre` | `name` |
| `apellidoPaterno` | `lastName` o `paternalLastName` |
| `apellidoMaterno` | `mothersMaidenName` o `maternalLastName` |
| `fechaNacimiento` | `birthDate` |
| `fechaInscripcion` | `enrollmentDate` |
| `fechaBaja` | `dropDate` |
| `estatus` | `status` |
| `cupoMaximo` | `maxCapacity` |
| `cupoMinimo` | `minCapacity` |
| `cupoActual` | `currentCapacity` |
| `nivelIngles` | `englishLevel` |
| `calificacion` | `grade` o `score` |
| `asistencias` | `attendances` |
| `faltas` | `absences` |
| `retardos` | `tardies` |
| `materia` | `subject` (ya está) |
| `maestro` | `teacher` (ya está) |
| `alumno/estudiante` | `student` (ya está) |
| `carrera` | `career` (ya está) |
| `periodo` | `period` |
| `codigo` | `code` |
| `aula` | `classroom` |
| `edificio` | `building` |
| `horario` | `schedule` |
| `modalidad` | `modality` |
| `observaciones` | `observations` o `notes` |
| `descripcion` | `description` |
| `requierePago` | `requiresPayment` |
| `pagoAprobado` | `paymentApproved` |
| `montoPago` | `paymentAmount` |
| `comprobantePago` | `paymentReceipt` |

### Funciones y Métodos

| Español (Actual) | Inglés (Propuesto) |
|------------------|-------------------|
| `crear` | `create` |
| `actualizar` | `update` |
| `obtener` | `get` |
| `eliminar` | `delete` |
| `validar` | `validate` |
| `buscar` | `search` |

## 🚀 Estrategia de Implementación

### Fase 1: Preparación (1-2 días)
1. ✅ Crear este documento de estrategia
2. ✅ Definir mapeo completo de campos
3. ✅ Crear script de migración de base de datos
4. ✅ Crear script de refactoring de código

### Fase 2: Base de Datos (2-3 días)
1. Crear migración de Prisma con `@map` para mantener compatibilidad temporal
2. Ejecutar migración en desarrollo
3. Verificar integridad de datos
4. Actualizar Prisma Client

### Fase 3: Backend (3-4 días)
1. Actualizar schema.prisma (usar `@map` para transición)
2. Actualizar todos los DTOs
3. Actualizar todos los services
4. Actualizar todos los controllers
5. Actualizar validators
6. Ejecutar tests

### Fase 4: Frontend (2-3 días)
1. Actualizar todos los types
2. Actualizar componentes que usan los campos
3. Actualizar API client
4. Verificar que todo compile

### Fase 5: Testing y Validación (2 días)
1. Tests end-to-end
2. Verificar que no haya regresiones
3. Actualizar documentación

## ⚠️ Consideraciones Importantes

### 1. Compatibilidad Temporal
Usar `@map` en Prisma para mantener nombres en español en BD mientras el código usa inglés:

```prisma
model students {
  name String @map("nombre")
  lastName String @map("apellidoPaterno")
  // ...
}
```

### 2. Migración Gradual
- Opción A: Cambio completo en una fase (más rápido, más riesgo)
- Opción B: Cambio gradual módulo por módulo (más seguro, más lento)

### 3. Riesgos
- **Alto:** Cambios en base de datos pueden romper producción
- **Medio:** Refactoring masivo puede introducir bugs
- **Bajo:** Cambios en frontend (solo types)

## 📅 Recomendación

**Hacerlo DESPUÉS de completar la implementación actual** porque:
1. Estamos en medio de una implementación activa
2. Sería muy disruptivo ahora
3. Mejor hacerlo en una fase dedicada de refactoring
4. Permite hacerlo con más cuidado y testing

**Alternativa:** Si es crítico hacerlo ahora, podemos empezar con un módulo piloto (ej: `exam-periods` que es nuevo) para validar el enfoque.

## 🎯 Decisión Requerida

¿Prefieres:
1. **Documentarlo y hacerlo después** (recomendado)
2. **Hacerlo ahora** (alto riesgo, muy disruptivo)
3. **Piloto con módulo nuevo** (exam-periods como prueba)


