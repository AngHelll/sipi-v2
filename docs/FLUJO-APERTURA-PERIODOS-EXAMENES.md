# Flujo de Apertura de Períodos de Exámenes

## 📋 Resumen

Los períodos de exámenes de diagnóstico se crean en estado `PLANEADO` y deben ser abiertos manualmente por un administrador para que los estudiantes puedan inscribirse.

## 🔄 Flujo Completo

### 1. Creación del Período (Admin)

**Endpoint:** `POST /api/academic-activities/exam-periods`

**Estado inicial:** `PLANEADO` (por defecto)

**Campos requeridos:**
- `nombre`: Nombre del período
- `fechaInicio`: Fecha de inicio del período de exámenes
- `fechaFin`: Fecha de fin del período de exámenes
- `fechaInscripcionInicio`: Fecha de inicio de inscripciones
- `fechaInscripcionFin`: Fecha de fin de inscripciones

**Campos opcionales:**
- `descripcion`: Descripción del período
- `cupoMaximo`: Cupo máximo (default: 100)
- `requierePago`: Si requiere pago (default: false)
- `montoPago`: Monto del pago (si requierePago es true)
- `observaciones`: Observaciones adicionales

**Validaciones al crear:**
- `fechaInscripcionInicio < fechaInscripcionFin`
- `fechaInicio < fechaFin`
- `fechaInscripcionFin <= fechaInicio` (inscripciones deben cerrar antes o el mismo día que inician los exámenes)
- `fechaInscripcionInicio < fechaInicio` (inscripciones deben iniciar antes del período de exámenes)

**Código relevante:**
```typescript
// backend/src/modules/academic-activities/exam-periods/exam-periods.service.ts
export const createExamPeriod = async (
  data: CreateExamPeriodDto,
  createdBy?: string
): Promise<ExamPeriodResponseDto> => {
  // Validaciones de fechas
  ExamPeriodsValidators.validateDates(...);
  
  const period = await prisma.diagnostic_exam_periods.create({
    data: {
      // ...
      estatus: 'PLANEADO', // ← Estado por defecto
      cupoActual: 0,
      // ...
    },
  });
};
```

### 2. Apertura del Período (Admin)

**Endpoint:** `PUT /api/academic-activities/exam-periods/:id/open`

**Acción:** Cambia el estado de `PLANEADO` a `ABIERTO`

**Permisos:** Solo ADMIN

**Validaciones:**
- El período debe existir
- No hay validaciones de transición de estado (a diferencia de enrollments)
- Cualquier período en `PLANEADO` puede ser abierto

**Código relevante:**
```typescript
// backend/src/modules/academic-activities/exam-periods/exam-periods.service.ts
export const openExamPeriod = async (
  id: string,
  updatedBy?: string
): Promise<ExamPeriodResponseDto> => {
  return updateExamPeriod(id, { estatus: 'ABIERTO' }, updatedBy);
};
```

### 3. Visualización para Estudiantes

**Endpoint:** `GET /api/academic-activities/exam-periods/available`

**Filtros aplicados:**
- `estatus = 'ABIERTO'`
- `deletedAt IS NULL`
- `fechaInscripcionInicio <= now`
- `fechaInscripcionFin >= now`
- `cupoActual < cupoMaximo` (calculado después de la consulta)

**Código relevante:**
```typescript
// backend/src/modules/academic-activities/exam-periods/exam-periods.service.ts
export const getAvailableExamPeriods = async (): Promise<AvailableExamPeriodResponseDto[]> => {
  const now = new Date();
  
  const periods = await prisma.diagnostic_exam_periods.findMany({
    where: {
      estatus: 'ABIERTO', // ← Solo períodos abiertos
      deletedAt: null,
      fechaInscripcionInicio: { lte: now },
      fechaInscripcionFin: { gte: now },
    },
  });
  
  return periods.map((period) => {
    const cuposDisponibles = period.cupoMaximo - period.cupoActual;
    const estaDisponible = cuposDisponibles > 0;
    
    return {
      // ...
      estaDisponible, // ← Calculado basado en cupos
    };
  });
};
```

## 🎯 Estados del Período

| Estado | Descripción | Visible para Estudiantes |
|--------|-------------|--------------------------|
| `PLANEADO` | Período creado pero no abierto | ❌ No |
| `ABIERTO` | Período abierto para inscripciones | ✅ Sí (si está en rango de fechas) |
| `CERRADO` | Período cerrado manualmente | ❌ No |
| `EN_PROCESO` | Exámenes en curso | ❌ No (no implementado aún) |
| `FINALIZADO` | Período finalizado | ❌ No |

## 🔧 Interfaz de Usuario

### Admin - Lista de Períodos

**Ruta:** `/admin/exam-periods`

**Acciones disponibles:**
- **Editar**: Editar cualquier campo del período
- **Abrir**: Solo visible cuando `estatus = 'PLANEADO'`
- **Cerrar**: Solo visible cuando `estatus = 'ABIERTO'`

**Código relevante:**
```typescript
// frontend/src/pages/admin/ExamPeriodsListPage.tsx
{period.estatus === 'PLANEADO' && (
  <button onClick={() => handleOpen(period.id, period.nombre)}>
    Abrir
  </button>
)}
{period.estatus === 'ABIERTO' && (
  <button onClick={() => handleClose(period.id, period.nombre)}>
    Cerrar
  </button>
)}
```

### Estudiante - Períodos Disponibles

**Ruta:** `/student/english/available-exam-periods`

**Comportamiento:**
- Solo muestra períodos en estado `ABIERTO`
- Solo muestra períodos dentro del rango de fechas de inscripción
- Solo muestra períodos con cupos disponibles
- Si no hay períodos, muestra mensaje y botón para solicitar examen directamente

## ⚠️ Consideraciones

### 1. No hay validación de transición de estado

A diferencia de `enrollments` que tiene validaciones estrictas de transición de estado, los períodos de exámenes **no tienen validaciones de transición**. Esto significa que:

- Un período puede pasar de `PLANEADO` → `ABIERTO` ✅
- Un período puede pasar de `ABIERTO` → `CERRADO` ✅
- Un período puede pasar de `CERRADO` → `ABIERTO` ✅ (si se implementa)
- Un período puede pasar de `FINALIZADO` → `ABIERTO` ✅ (si se implementa)

**¿Debería haber validaciones?**
- **Ventaja de tenerlas:** Más control y consistencia
- **Desventaja:** Menos flexibilidad para casos especiales
- **Recomendación:** Considerar agregar validaciones si se necesita más control

### 2. Apertura automática

Actualmente **no hay apertura automática** basada en fechas. Un período en `PLANEADO` permanecerá en ese estado hasta que un admin lo abra manualmente.

**¿Debería haber apertura automática?**
- **Ventaja:** Menos trabajo manual para el admin
- **Desventaja:** Menos control sobre cuándo se abren los períodos
- **Recomendación:** Considerar agregar un job/cron que abra períodos automáticamente cuando llegue `fechaInscripcionInicio`

### 3. Cierre automático

Actualmente **no hay cierre automático** cuando llega `fechaInscripcionFin`. Un período en `ABIERTO` permanecerá abierto hasta que un admin lo cierre manualmente.

**¿Debería haber cierre automático?**
- **Ventaja:** Evita inscripciones fuera del período permitido
- **Desventaja:** Puede cerrar antes de tiempo si hay problemas técnicos
- **Recomendación:** Considerar agregar un job/cron que cierre períodos automáticamente cuando pase `fechaInscripcionFin`

## 📝 Checklist para Admin

Cuando creas un nuevo período de exámenes:

1. ✅ Crear el período con todas las fechas correctas
2. ✅ Verificar que las fechas sean lógicas (inscripciones antes de exámenes)
3. ✅ **Abrir el período** para que los estudiantes lo vean
4. ⚠️ Monitorear cupos disponibles
5. ⚠️ Cerrar el período cuando termine el período de inscripciones (o dejar que se cierre automáticamente si se implementa)

## 🔄 Flujo Visual

```
┌─────────────────┐
│ Admin crea       │
│ período         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Estado:         │
│ PLANEADO        │
└────────┬────────┘
         │
         │ Admin hace clic en "Abrir"
         ▼
┌─────────────────┐
│ Estado:         │
│ ABIERTO         │
└────────┬────────┘
         │
         │ Estudiantes pueden ver y inscribirse
         ▼
┌─────────────────┐
│ Estudiantes     │
│ se inscriben    │
└────────┬────────┘
         │
         │ Admin cierra o se cierra automáticamente
         ▼
┌─────────────────┐
│ Estado:         │
│ CERRADO         │
└─────────────────┘
```

## 🚀 Mejoras Futuras Sugeridas

1. **Validaciones de transición de estado:**
   - Definir transiciones válidas (ej: `PLANEADO` → `ABIERTO` → `CERRADO` → `FINALIZADO`)
   - Prevenir transiciones inválidas

2. **Apertura automática:**
   - Job/cron que abra períodos cuando llegue `fechaInscripcionInicio`
   - Notificación al admin cuando se abre automáticamente

3. **Cierre automático:**
   - Job/cron que cierre períodos cuando pase `fechaInscripcionFin`
   - Notificación al admin cuando se cierra automáticamente

4. **Notificaciones:**
   - Notificar a estudiantes cuando se abre un nuevo período
   - Notificar a estudiantes cuando se acerca el cierre de inscripciones

5. **Dashboard de admin:**
   - Vista de períodos próximos a abrir
   - Alertas de períodos que necesitan atención


