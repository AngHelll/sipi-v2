# Flujo de Visualización de Exámenes de Diagnóstico para Admin

## 📋 Estado Actual

### ✅ Lo que existe:
1. **Estudiante puede solicitar examen:**
   - `POST /api/academic-activities/exams` (Student)
   - Crea un examen de diagnóstico
   - Se asocia a un período si se proporciona `periodId`

2. **Estudiante puede ver sus exámenes:**
   - `GET /api/academic-activities/exams/student` (Student)
   - Muestra solo los exámenes del estudiante autenticado

3. **Admin/Teacher puede procesar resultados:**
   - `PUT /api/academic-activities/exams/:id/result` (Admin/Teacher)
   - Permite registrar el resultado del examen

### ❌ Lo que falta:
1. **Admin no puede ver todas las inscripciones:**
   - No hay endpoint `GET /api/academic-activities/exams` para admin
   - No hay página en el frontend para visualizar inscripciones

2. **No hay filtros ni búsqueda:**
   - No se puede filtrar por estudiante, período, tipo, estatus, etc.
   - No hay paginación para listas grandes

## 🎯 Flujo Propuesto

### 1. Estudiante solicita examen
```
Estudiante → POST /api/academic-activities/exams
  ↓
Sistema crea:
  - academic_activity (tipo: EXAM, estatus: INSCRITO)
  - exam (tipo: DIAGNOSTICO, periodId: opcional)
  - activity_history (acción: CREATED)
  - Incrementa cupoActual del período (si aplica)
```

### 2. Admin visualiza inscripciones
```
Admin → GET /api/academic-activities/exams
  ↓
Sistema devuelve:
  - Lista de todos los exámenes
  - Con filtros opcionales:
    * studentId
    * periodId
    * examType
    * estatus
    * fechaInscripcion (rango)
  - Con paginación
  - Con información del estudiante y período
```

### 3. Admin procesa resultado
```
Admin → PUT /api/academic-activities/exams/:id/result
  ↓
Sistema actualiza:
  - exam.resultado
  - exam.fechaResultado
  - academic_activity.estatus (APROBADO/REPROBADO)
  - student.nivelInglesActual (si es diagnóstico de inglés)
  - activity_history (acción: GRADE_UPDATED)
```

## 📊 Estructura de Datos Esperada

### Request (GET /api/academic-activities/exams)
```typescript
Query params:
  - page?: number (default: 1)
  - limit?: number (default: 20, max: 100)
  - studentId?: string
  - periodId?: string
  - examType?: 'DIAGNOSTICO' | 'ADMISION' | 'CERTIFICACION'
  - estatus?: 'INSCRITO' | 'EN_CURSO' | 'APROBADO' | 'REPROBADO' | ...
  - fechaInicio?: string (ISO date)
  - fechaFin?: string (ISO date)
  - sortBy?: 'fechaInscripcion' | 'estatus' | 'examType'
  - sortOrder?: 'asc' | 'desc'
```

### Response
```typescript
{
  exams: [
    {
      id: string,
      codigo: string,
      estatus: string,
      fechaInscripcion: string,
      student: {
        id: string,
        matricula: string,
        nombre: string,
        apellidoPaterno: string,
        apellidoMaterno: string,
      },
      exam: {
        examType: string,
        nivelIngles?: number,
        resultado?: number,
        fechaExamen?: string,
        fechaResultado?: string,
        periodId?: string,
        period?: {
          id: string,
          nombre: string,
        },
        subject?: {
          id: string,
          clave: string,
          nombre: string,
        },
      },
    },
  ],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
  },
}
```

## 🔧 Implementación Requerida

### Backend:
1. ✅ Crear `getAllExams` en `exams.service.ts`
2. ✅ Crear `getAllExamsHandler` en `exams.controller.ts`
3. ✅ Agregar ruta `GET /api/academic-activities/exams` (Admin only)

### Frontend:
1. ✅ Crear `DiagnosticExamsListPage.tsx`
2. ✅ Agregar `getAllExams` en `api.ts`
3. ✅ Agregar ruta en `App.tsx`
4. ✅ Agregar link en `DashboardAdmin.tsx`

## 📋 Funcionalidades de la Página Admin

### Vista de Lista:
- Tabla con columnas:
  - Código
  - Estudiante (nombre completo + matrícula)
  - Tipo de examen
  - Período (si aplica)
  - Estatus
  - Fecha de inscripción
  - Resultado (si existe)
  - Acciones (ver detalles, procesar resultado)

### Filtros:
- Por estudiante (búsqueda por nombre/matrícula)
- Por período
- Por tipo de examen
- Por estatus
- Por rango de fechas

### Acciones:
- Ver detalles del examen
- Procesar resultado (si no está procesado)
- Ver historial de cambios

## 🎨 Diseño Sugerido

Similar a `EnrollmentsListPage.tsx` pero adaptado para exámenes:
- Misma estructura de filtros y búsqueda
- Tabla con información relevante de exámenes
- Badges de estatus con colores
- Botón para procesar resultado si está pendiente


