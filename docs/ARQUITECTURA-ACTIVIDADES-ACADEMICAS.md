# Arquitectura de Actividades Académicas - Propuesta de Rediseño

> ℹ️ **ESTE DOCUMENTO ES UNA VISIÓN DE ALTO NIVEL**
>
> - El **diseño de base de datos canónico** y actualizado está en `DISENO-BASE-DATOS-V2.md`.
> - El **plan de ejecución** detallado está en `PLAN-IMPLEMENTACION-V2.md`.
> - Usa este archivo para entender los conceptos y motivación; para detalles de campos, relaciones y enums, consulta siempre `DISENO-BASE-DATOS-V2.md`.

## 📋 Problema Actual

El sistema actual tiene limitaciones conceptuales:

1. **Mezcla de conceptos**: `enrollments` se usa para todo (materias regulares, exámenes, cursos de inglés, etc.)
2. **Falta de separación**: No hay distinción clara entre diferentes tipos de actividades académicas
3. **Complejidad creciente**: Agregar nuevos tipos (servicio social, prácticas profesionales) requiere más campos opcionales
4. **Flujos confusos**: Un examen de diagnóstico no debería requerir un "grupo" en el sentido tradicional
5. **Error 400**: Problemas al solicitar exámenes debido a validaciones inadecuadas

---

## 🎯 Objetivo

Crear una arquitectura que separe claramente:
- **Materias Regulares**: Inscripciones a grupos de materias del plan de estudios
- **Exámenes**: Exámenes de diagnóstico, de admisión, de certificación, etc.
- **Cursos Especiales**: Cursos de inglés, cursos de verano, cursos extracurriculares
- **Servicio Social**: Actividades de servicio social
- **Prácticas Profesionales**: Prácticas profesionales y residencias

---

## 🏗️ Arquitectura Propuesta

### Opción 1: Tablas Separadas (Recomendada)

```
┌─────────────────┐
│   activities    │  ← Tabla base polimórfica
└─────────────────┘
        │
        ├─── enrollments (materias regulares)
        ├─── exams (exámenes)
        ├─── special_courses (cursos especiales)
        ├─── social_service (servicio social)
        └─── professional_practices (prácticas profesionales)
```

**Ventajas**:
- ✅ Separación clara de responsabilidades
- ✅ Cada tipo tiene sus campos específicos
- ✅ Fácil agregar nuevos tipos
- ✅ Queries más eficientes
- ✅ Validaciones específicas por tipo

**Desventajas**:
- ⚠️ Requiere migración de datos
- ⚠️ Más tablas que mantener

---

### Opción 2: Tabla Unificada con Discriminador

```
┌─────────────────────────────────────┐
│         academic_activities         │
│  - id                               │
│  - studentId                        │
│  - activityType (discriminador)    │
│  - activityData (JSON polimórfico)  │
│  - commonFields...                  │
└─────────────────────────────────────┘
```

**Ventajas**:
- ✅ Una sola tabla
- ✅ Fácil agregar nuevos tipos
- ✅ Queries unificadas

**Desventajas**:
- ❌ JSON polimórfico es difícil de validar
- ❌ Queries complejas
- ❌ Menos eficiente

---

### Opción 3: Tabla Base + Tablas Específicas (Híbrida)

```
┌──────────────────────┐
│ academic_activities  │  ← Campos comunes
│  - id                │
│  - studentId         │
│  - activityType      │
│  - estatus           │
│  - fechaInscripcion  │
│  - createdAt         │
└──────────────────────┘
        │
        ├─── enrollments (materias regulares)
        │    - groupId
        │    - calificacion
        │    - asistencias
        │
        ├─── exams (exámenes)
        │    - examType (DIAGNOSTICO, ADMISION, CERTIFICACION)
        │    - subjectId (opcional)
        │    - resultado
        │    - requierePago
        │
        ├─── special_courses (cursos especiales)
        │    - courseType (INGLES, VERANO, EXTRACURRICULAR)
        │    - nivel (para inglés)
        │    - requierePago
        │    - pagoAprobado
        │
        ├─── social_service (servicio social)
        │    - organizationId
        │    - horasRequeridas
        │    - horasCompletadas
        │    - supervisor
        │
        └─── professional_practices (prácticas)
             - companyId
             - periodo
             - horasRequeridas
             - horasCompletadas
             - supervisor
```

**Ventajas**:
- ✅ Mejor de ambos mundos
- ✅ Campos comunes en una tabla
- ✅ Campos específicos en tablas separadas
- ✅ Validaciones por tipo
- ✅ Queries eficientes

**Desventajas**:
- ⚠️ Requiere JOINs para queries completas
- ⚠️ Más complejidad en el modelo

---

## 🎯 Recomendación: Opción 3 (Híbrida)

### Justificación

1. **Separación clara**: Cada tipo de actividad tiene su tabla
2. **Campos comunes**: Evita duplicación
3. **Escalabilidad**: Fácil agregar nuevos tipos
4. **Validaciones**: Cada tipo tiene sus propias reglas
5. **Performance**: Queries optimizadas por tipo

---

## 📐 Diseño Detallado

### 1. Tabla Base: `academic_activities`

```prisma
model academic_activities {
  id                String                      @id
  studentId         String
  activityType      ActivityType                 // Discriminador
  estatus           ActivityStatus               @default(INSCRITO)
  fechaInscripcion  DateTime                    @default(now())
  fechaBaja         DateTime?
  codigo            String                      @unique @db.VarChar(30)
  observaciones     String?                     @db.Text
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime
  deletedAt         DateTime?
  createdBy         String?
  updatedBy         String?
  
  students          students                    @relation(fields: [studentId], references: [id])
  
  // Relaciones polimórficas
  enrollments       enrollments?                 // Materias regulares
  exams             exams?                      // Exámenes
  special_courses   special_courses?            // Cursos especiales
  social_service    social_service?             // Servicio social
  professional_practices professional_practices? // Prácticas
  
  @@index([studentId])
  @@index([activityType])
  @@index([estatus])
  @@index([deletedAt])
}

enum ActivityType {
  ENROLLMENT          // Materia regular
  EXAM                // Examen
  SPECIAL_COURSE      // Curso especial
  SOCIAL_SERVICE      // Servicio social
  PROFESSIONAL_PRACTICE // Práctica profesional
}

enum ActivityStatus {
  INSCRITO
  EN_CURSO
  BAJA
  APROBADO
  REPROBADO
  CANCELADO
  PENDIENTE_PAGO
  PAGO_PENDIENTE_APROBACION
  PAGO_APROBADO
}
```

### 2. Tabla: `enrollments` (Materias Regulares)

```prisma
model enrollments {
  id                   String                @id
  activityId           String                @unique
  groupId              String
  calificacion         Decimal?              @db.Decimal(5, 2)
  calificacionParcial1 Decimal?              @db.Decimal(5, 2)
  calificacionParcial2 Decimal?              @db.Decimal(5, 2)
  calificacionParcial3 Decimal?              @db.Decimal(5, 2)
  calificacionFinal    Decimal?              @db.Decimal(5, 2)
  asistencias          Int                   @default(0)
  faltas               Int                   @default(0)
  retardos             Int                   @default(0)
  porcentajeAsistencia Decimal?              @db.Decimal(5, 2)
  aprobado             Boolean?
  fechaAprobacion      DateTime?
  
  academic_activities academic_activities    @relation(fields: [activityId], references: [id], onDelete: Cascade)
  groups               groups                @relation(fields: [groupId], references: [id])
  
  @@index([groupId])
  @@index([activityId])
}
```

### 3. Tabla: `exams` (Exámenes)

```prisma
model exams {
  id                String                @id
  activityId        String                @unique
  examType          ExamType
  subjectId         String?               // Opcional: para exámenes de materias específicas
  nivelIngles       Int?                  // Para exámenes de diagnóstico de inglés
  resultado         Decimal?              @db.Decimal(5, 2)
  requierePago      Boolean               @default(false)
  pagoAprobado      Boolean?
  fechaPagoAprobado DateTime?
  montoPago         Decimal?              @db.Decimal(10, 2)
  comprobantePago   String?               @db.VarChar(255)
  fechaExamen       DateTime?
  fechaResultado    DateTime?
  
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  subjects            subjects?          @relation(fields: [subjectId], references: [id])
  
  @@index([activityId])
  @@index([examType])
  @@index([nivelIngles])
}

enum ExamType {
  DIAGNOSTICO      // Examen de diagnóstico (inglés, nivelación)
  ADMISION         // Examen de admisión
  CERTIFICACION    // Examen de certificación
  EXTRAORDINARIO   // Examen extraordinario
  REGULAR          // Examen regular de materia
}
```

### 4. Tabla: `special_courses` (Cursos Especiales)

```prisma
model special_courses {
  id                String                @id
  activityId        String                @unique
  courseType        SpecialCourseType
  nivelIngles       Int?                  // Para cursos de inglés (1-6)
  requierePago      Boolean               @default(true)
  pagoAprobado      Boolean?
  fechaPagoAprobado DateTime?
  montoPago         Decimal?              @db.Decimal(10, 2)
  comprobantePago   String?              @db.VarChar(255)
  calificacion      Decimal?             @db.Decimal(5, 2)
  aprobado          Boolean?
  fechaAprobacion   DateTime?
  
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  @@index([activityId])
  @@index([courseType])
  @@index([nivelIngles])
}

enum SpecialCourseType {
  INGLES           // Curso de inglés
  VERANO           // Curso de verano
  EXTRACURRICULAR  // Curso extracurricular
  TALLER           // Taller
  SEMINARIO        // Seminario
}
```

### 5. Tabla: `social_service` (Servicio Social)

```prisma
model social_service {
  id                String                @id
  activityId        String                @unique
  organizationId    String
  organizationName  String                @db.VarChar(200)
  horasRequeridas   Int
  horasCompletadas  Int                   @default(0)
  supervisor        String?               @db.VarChar(200)
  supervisorEmail   String?               @db.VarChar(255)
  fechaInicio       DateTime?
  fechaFin          DateTime?
  observaciones     String?               @db.Text
  
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  @@index([activityId])
  @@index([organizationId])
}
```

### 6. Tabla: `professional_practices` (Prácticas Profesionales)

```prisma
model professional_practices {
  id                String                @id
  activityId        String                @unique
  companyId         String
  companyName       String                @db.VarChar(200)
  periodo           String                @db.VarChar(50)
  horasRequeridas   Int
  horasCompletadas  Int                   @default(0)
  supervisor        String?               @db.VarChar(200)
  supervisorEmail   String?               @db.VarChar(255)
  calificacion      Decimal?             @db.Decimal(5, 2)
  aprobado          Boolean?
  fechaInicio       DateTime?
  fechaFin          DateTime?
  observaciones     String?              @db.Text
  
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  @@index([activityId])
  @@index([companyId])
}
```

---

## 🔄 Flujos de Negocio

### Flujo 1: Solicitar Examen de Diagnóstico

```
1. Estudiante solicita examen
   → POST /api/academic-activities/exams
   → Crea academic_activity (type: EXAM)
   → Crea exam (examType: DIAGNOSTICO)
   → Estatus: INSCRITO (auto-aprobado)

2. Estudiante realiza examen
   → Maestro/Admin califica
   → PUT /api/academic-activities/exams/:id/result
   → Actualiza resultado y estatus

3. Sistema actualiza nivelInglesActual del estudiante
```

### Flujo 2: Solicitar Curso de Inglés

```
1. Estudiante solicita curso
   → POST /api/academic-activities/special-courses
   → Crea academic_activity (type: SPECIAL_COURSE)
   → Crea special_course (courseType: INGLES, nivelIngles: X)
   → Estatus: PENDIENTE_PAGO

2. Estudiante sube comprobante
   → POST /api/academic-activities/special-courses/:id/payment
   → Estatus: PAGO_PENDIENTE_APROBACION

3. Admin aprueba pago
   → PUT /api/academic-activities/special-courses/:id/approve-payment
   → Estatus: PAGO_APROBADO → EN_CURSO

4. Al finalizar
   → PUT /api/academic-activities/special-courses/:id/complete
   → Estatus: APROBADO/REPROBADO
```

### Flujo 3: Inscribirse a Materia Regular

```
1. Admin crea inscripción
   → POST /api/academic-activities/enrollments
   → Crea academic_activity (type: ENROLLMENT)
   → Crea enrollment (groupId: X)
   → Estatus: INSCRITO

2. Durante el curso
   → Maestro actualiza calificaciones
   → PUT /api/academic-activities/enrollments/:id/grades

3. Al finalizar
   → Sistema calcula calificacionFinal
   → Estatus: APROBADO/REPROBADO
```

---

## 📊 Ventajas de esta Arquitectura

1. **Separación clara**: Cada tipo de actividad tiene su tabla y lógica
2. **Escalabilidad**: Fácil agregar nuevos tipos (talleres, seminarios, etc.)
3. **Validaciones específicas**: Cada tipo tiene sus propias reglas de negocio
4. **Queries eficientes**: No necesitas filtrar por campos opcionales
5. **Mantenibilidad**: Código más limpio y organizado
6. **Flexibilidad**: Cada tipo puede evolucionar independientemente

---

## 🚀 Plan de Migración

### Fase 1: Crear nuevas tablas
- Crear `academic_activities`
- Crear `exams`, `special_courses`, etc.
- Mantener `enrollments` existente

### Fase 2: Migrar datos
- Migrar enrollments existentes a nueva estructura
- Crear `academic_activity` para cada enrollment
- Mover datos específicos a tablas correspondientes

### Fase 3: Actualizar servicios
- Crear servicios específicos por tipo
- Actualizar controllers
- Actualizar validadores

### Fase 4: Actualizar frontend
- Actualizar tipos TypeScript
- Actualizar componentes
- Actualizar rutas

### Fase 5: Deprecar código viejo
- Eliminar campos obsoletos
- Limpiar código no usado

---

## 💡 Próximos Pasos

1. **Aprobar arquitectura**: Revisar y aprobar esta propuesta
2. **Crear migración**: Generar migraciones de Prisma
3. **Implementar servicios**: Crear servicios por tipo de actividad
4. **Actualizar API**: Actualizar endpoints
5. **Migrar datos**: Migrar datos existentes
6. **Actualizar frontend**: Actualizar componentes

---

## ❓ Preguntas para Discutir

1. ¿Mantenemos `enrollments` como está o lo migramos completamente?
2. ¿Cómo manejamos las relaciones con `groups` para exámenes que no tienen grupo?
3. ¿Necesitamos una tabla de `organizations` para servicio social?
4. ¿Necesitamos una tabla de `companies` para prácticas profesionales?
5. ¿Cómo manejamos los reportes que necesitan datos de todos los tipos?


