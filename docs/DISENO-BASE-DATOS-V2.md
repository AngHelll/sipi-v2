# Diseño de Base de Datos V2 - Arquitectura Completa

## 🎯 Principios de Diseño

1. **Separación de Responsabilidades**: Cada tipo de actividad académica tiene su propia tabla
2. **Reutilización**: Campos comunes en tabla base, específicos en tablas derivadas
3. **Normalización**: Evitar redundancia, mantener integridad referencial
4. **Escalabilidad**: Fácil agregar nuevos tipos de actividades
5. **Mantenibilidad**: Código limpio, validaciones claras
6. **Performance**: Índices apropiados, queries optimizadas

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────┐
│   academic_activities       │  ← Tabla base (campos comunes)
│   - id (PK)                 │
│   - studentId (FK)          │
│   - activityType (disc)    │
│   - estatus                 │
│   - fechaInscripcion        │
│   - codigo                  │
│   - observaciones           │
└─────────────────────────────┘
        │
        ├─── enrollments (1:1) ← Materias regulares
        ├─── exams (1:1)       ← Exámenes
        ├─── special_courses (1:1) ← Cursos especiales
        ├─── social_service (1:1) ← Servicio social
        └─── professional_practices (1:1) ← Prácticas
```

**Ventajas**:
- ✅ Campos comunes centralizados
- ✅ Campos específicos en tablas separadas
- ✅ Relaciones 1:1 garantizan integridad
- ✅ Fácil agregar nuevos tipos
- ✅ Queries eficientes por tipo

---

## 📐 Schema Detallado

### 1. Tabla Base: `academic_activities`

```prisma
model academic_activities {
  id                String                      @id @default(uuid())
  studentId         String
  activityType      ActivityType                 // Discriminador
  codigo            String                      @unique @db.VarChar(30)
  estatus           ActivityStatus               @default(INSCRITO)
  fechaInscripcion  DateTime                    @default(now())
  fechaBaja         DateTime?
  observaciones     String?                     @db.Text
  
  // Auditoría
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  deletedAt        DateTime?
  createdBy        String?
  updatedBy        String?
  
  // Relaciones
  students          students                    @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  // Relaciones polimórficas 1:1
  enrollments       enrollments?
  exams             exams?
  special_courses   special_courses?
  social_service    social_service?
  professional_practices professional_practices?
  
  // Historial (reutilizable)
  activity_history  activity_history[]
  
  @@index([studentId])
  @@index([activityType])
  @@index([estatus])
  @@index([codigo])
  @@index([fechaInscripcion])
  @@index([deletedAt])
  @@index([studentId, activityType])
  @@index([studentId, estatus])
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
  COMPLETADO
  EN_REVISION
}
```

### 2. Tabla: `enrollments` (Materias Regulares)

```prisma
model enrollments {
  id                   String                @id @default(uuid())
  activityId           String                @unique
  
  // Relación con grupo (requerida para materias)
  groupId              String
  
  // Calificaciones
  calificacion         Decimal?              @db.Decimal(5, 2) // Mantener por compatibilidad
  calificacionParcial1 Decimal?              @db.Decimal(5, 2)
  calificacionParcial2 Decimal?              @db.Decimal(5, 2)
  calificacionParcial3 Decimal?              @db.Decimal(5, 2)
  calificacionFinal    Decimal?              @db.Decimal(5, 2)
  calificacionExtra    Decimal?              @db.Decimal(5, 2)
  
  // Asistencias
  asistencias          Int                   @default(0)
  faltas               Int                   @default(0)
  retardos             Int                   @default(0)
  porcentajeAsistencia Decimal?              @db.Decimal(5, 2)
  
  // Evaluación
  aprobado             Boolean?
  fechaAprobacion      DateTime?
  
  // Relaciones
  academic_activities  academic_activities   @relation(fields: [activityId], references: [id], onDelete: Cascade)
  groups               groups                @relation(fields: [groupId], references: [id], onDelete: Restrict)
  
  @@index([activityId])
  @@index([groupId])
  @@index([aprobado])
}
```

### 3. Tabla: `exams` (Exámenes)

```prisma
model exams {
  id                String                @id @default(uuid())
  activityId        String                @unique
  
  // Tipo de examen
  examType          ExamType
  
  // Relación con materia (opcional - solo para exámenes de materias específicas)
  subjectId         String?
  
  // Para exámenes de diagnóstico de inglés
  nivelIngles       Int?                  // Nivel que se está evaluando (1-6)
  
  // Resultado
  resultado         Decimal?              @db.Decimal(5, 2)
  fechaExamen       DateTime?
  fechaResultado    DateTime?
  
  // Pago (para exámenes que requieren pago)
  requierePago      Boolean               @default(false)
  pagoAprobado       Boolean?
  fechaPagoAprobado DateTime?
  montoPago         Decimal?              @db.Decimal(10, 2)
  comprobantePago   String?              @db.VarChar(255)
  
  // Relaciones
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  subjects            subjects?          @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  
  @@index([activityId])
  @@index([examType])
  @@index([subjectId])
  @@index([nivelIngles])
  @@index([requierePago])
}

enum ExamType {
  DIAGNOSTICO      // Examen de diagnóstico (inglés, nivelación)
  ADMISION         // Examen de admisión
  CERTIFICACION    // Examen de certificación
  EXTRAORDINARIO   // Examen extraordinario
  REGULAR          // Examen regular de materia
  RECUPERACION     // Examen de recuperación
  TITULACION       // Examen de titulación
}
```

### 4. Tabla: `special_courses` (Cursos Especiales)

```prisma
model special_courses {
  id                String                @id @default(uuid())
  activityId        String                @unique
  
  // Tipo de curso
  courseType        SpecialCourseType
  
  // Nivel (para cursos de inglés)
  nivelIngles       Int?                  // 1-6
  
  // Relación con grupo (opcional - algunos cursos pueden tener grupo)
  groupId           String?
  
  // Calificación
  calificacion      Decimal?             @db.Decimal(5, 2)
  aprobado          Boolean?
  fechaAprobacion   DateTime?
  
  // Pago
  requierePago      Boolean               @default(true)
  pagoAprobado      Boolean?
  fechaPagoAprobado DateTime?
  montoPago         Decimal?              @db.Decimal(10, 2)
  comprobantePago   String?              @db.VarChar(255)
  
  // Relaciones
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  groups             groups?             @relation(fields: [groupId], references: [id], onDelete: SetNull)
  
  @@index([activityId])
  @@index([courseType])
  @@index([nivelIngles])
  @@index([groupId])
  @@index([requierePago])
}

enum SpecialCourseType {
  INGLES           // Curso de inglés
  VERANO           // Curso de verano
  EXTRACURRICULAR  // Curso extracurricular
  TALLER           // Taller
  SEMINARIO        // Seminario
  DIPLOMADO        // Diplomado
  CERTIFICACION    // Curso de certificación
}
```

### 5. Tabla: `social_service` (Servicio Social)

```prisma
model social_service {
  id                String                @id @default(uuid())
  activityId        String                @unique
  
  // Organización
  organizationId    String?               // FK a tabla organizations (si existe)
  organizationName  String                @db.VarChar(200)
  organizationType  String?               @db.VarChar(50) // ONG, Gobierno, etc.
  
  // Horas
  horasRequeridas   Int
  horasCompletadas  Int                   @default(0)
  
  // Supervisor
  supervisor        String?               @db.VarChar(200)
  supervisorEmail   String?               @db.VarChar(255)
  supervisorPhone   String?              @db.VarChar(20)
  
  // Fechas
  fechaInicio       DateTime?
  fechaFin          DateTime?
  fechaAprobacion   DateTime?
  
  // Evaluación
  aprobado          Boolean?
  calificacion      Decimal?             @db.Decimal(5, 2)
  
  // Relaciones
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  @@index([activityId])
  @@index([organizationId])
  @@index([aprobado])
  @@index([fechaInicio, fechaFin])
}
```

### 6. Tabla: `professional_practices` (Prácticas Profesionales)

```prisma
model professional_practices {
  id                String                @id @default(uuid())
  activityId        String                @unique
  
  // Empresa
  companyId         String?               // FK a tabla companies (si existe)
  companyName       String                @db.VarChar(200)
  companyType       String?               @db.VarChar(50)
  
  // Período
  periodo           String                @db.VarChar(50)
  periodoId         String?               // FK a academic_periods
  
  // Horas
  horasRequeridas   Int
  horasCompletadas  Int                   @default(0)
  
  // Supervisor
  supervisor        String?               @db.VarChar(200)
  supervisorEmail   String?               @db.VarChar(255)
  supervisorPhone   String?              @db.VarChar(20)
  
  // Fechas
  fechaInicio       DateTime?
  fechaFin          DateTime?
  fechaAprobacion   DateTime?
  
  // Evaluación
  aprobado          Boolean?
  calificacion      Decimal?             @db.Decimal(5, 2)
  
  // Relaciones
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  academic_periods    academic_periods?   @relation(fields: [periodoId], references: [id], onDelete: SetNull)
  
  @@index([activityId])
  @@index([companyId])
  @@index([periodoId])
  @@index([aprobado])
  @@index([fechaInicio, fechaFin])
}
```

### 7. Tabla: `activity_history` (Historial Reutilizable)

```prisma
model activity_history {
  id            String                    @id @default(uuid())
  activityId    String
  accion        ActivityHistoryAction
  campoAnterior String?                   @db.VarChar(100)
  valorAnterior String?                   @db.Text
  valorNuevo    String?                   @db.Text
  descripcion   String?                   @db.Text
  realizadoPor  String?
  createdAt     DateTime                  @default(now())
  
  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  @@index([activityId])
  @@index([accion])
  @@index([createdAt])
  @@index([activityId, createdAt])
}

enum ActivityHistoryAction {
  CREATED
  UPDATED
  DELETED
  STATUS_CHANGED
  GRADE_UPDATED
  ATTENDANCE_UPDATED
  PAYMENT_SUBMITTED
  PAYMENT_APPROVED
  PAYMENT_REJECTED
}
```

---

## 🔄 Actualización de Tablas Existentes

### `students` - Agregar relación

```prisma
model students {
  // ... campos existentes ...
  
  // Nueva relación
  academic_activities academic_activities[]
  
  // Mantener enrollments por compatibilidad durante migración
  enrollments        enrollments[]        // Deprecar gradualmente
}
```

### `groups` - Actualizar relación

```prisma
model groups {
  // ... campos existentes ...
  
  // Relaciones actualizadas
  enrollments        enrollments[]        // Solo para materias regulares
  special_courses    special_courses[]    // Para cursos especiales con grupo
}
```

### `subjects` - Agregar relación

```prisma
model subjects {
  // ... campos existentes ...
  
  // Nueva relación
  exams              exams[]              // Para exámenes de materias específicas
}
```

---

## 📊 Ventajas del Nuevo Diseño

### 1. Separación Clara
- ✅ Cada tipo de actividad tiene su tabla
- ✅ Campos específicos no contaminan otros tipos
- ✅ Validaciones por tipo más claras

### 2. Reutilización
- ✅ Campos comunes en `academic_activities`
- ✅ Historial reutilizable (`activity_history`)
- ✅ Estados comunes (`ActivityStatus`)

### 3. Escalabilidad
- ✅ Fácil agregar nuevos tipos (ej: `workshops`, `seminars`)
- ✅ No requiere modificar tablas existentes
- ✅ Cada tipo evoluciona independientemente

### 4. Performance
- ✅ Queries más eficientes (no filtrar por campos opcionales)
- ✅ Índices específicos por tipo
- ✅ Menos JOINs innecesarios

### 5. Mantenibilidad
- ✅ Código más limpio y organizado
- ✅ Validaciones específicas por tipo
- ✅ Fácil entender qué campos aplican a qué tipo

---

## 🔄 Plan de Migración

### Fase 1: Crear Nuevas Tablas (Sin Romper Existente)

1. Crear `academic_activities`
2. Crear `exams`, `special_courses`, etc.
3. Mantener `enrollments` existente
4. Sistema funciona con ambos esquemas

### Fase 2: Migrar Datos Gradualmente

1. Script de migración:
   - Crear `academic_activity` para cada `enrollment` existente
   - Mover datos específicos a tablas correspondientes
   - Mantener `enrollment` original por compatibilidad

2. Validación:
   - Verificar integridad de datos
   - Comparar conteos
   - Validar relaciones

### Fase 3: Actualizar Código

1. Crear servicios nuevos:
   - `AcademicActivitiesService`
   - `ExamsService`
   - `SpecialCoursesService`
   - etc.

2. Actualizar controllers:
   - Nuevos endpoints para nuevos tipos
   - Mantener endpoints antiguos (deprecated)

3. Actualizar frontend:
   - Nuevos tipos TypeScript
   - Nuevos componentes
   - Migrar gradualmente

### Fase 4: Deprecar Código Viejo

1. Marcar endpoints antiguos como deprecated
2. Redirigir a nuevos endpoints
3. Eliminar código no usado
4. Eliminar campos obsoletos de `enrollments`

---

## 🎯 Flujos de Negocio Rediseñados

### Flujo 1: Solicitar Examen de Diagnóstico

```
1. POST /api/academic-activities/exams
   {
     "examType": "DIAGNOSTICO",
     "subjectId": "id-materia-ingles" (opcional)
   }
   
2. Sistema crea:
   - academic_activity (type: EXAM, estatus: INSCRITO)
   - exam (examType: DIAGNOSTICO)
   
3. NO requiere grupo ✅
```

### Flujo 2: Solicitar Curso de Inglés

```
1. POST /api/academic-activities/special-courses
   {
     "courseType": "INGLES",
     "nivelIngles": 1,
     "groupId": "id-grupo" (opcional)
   }
   
2. Sistema crea:
   - academic_activity (type: SPECIAL_COURSE, estatus: PENDIENTE_PAGO)
   - special_course (courseType: INGLES, nivelIngles: 1)
   
3. Grupo es opcional ✅
```

### Flujo 3: Inscribirse a Materia Regular

```
1. POST /api/academic-activities/enrollments
   {
     "groupId": "id-grupo" (requerido)
   }
   
2. Sistema crea:
   - academic_activity (type: ENROLLMENT, estatus: INSCRITO)
   - enrollment (groupId: X)
   
3. Requiere grupo ✅
```

---

## 📝 Mejores Prácticas Aplicadas

1. **Single Responsibility**: Cada tabla tiene una responsabilidad clara
2. **DRY (Don't Repeat Yourself)**: Campos comunes en tabla base
3. **Open/Closed Principle**: Fácil extender sin modificar existente
4. **Normalización**: Evitar redundancia, mantener integridad
5. **Índices Apropiados**: Optimizar queries comunes
6. **Soft Delete**: Mantener historial con `deletedAt`
7. **Auditoría**: `createdBy`, `updatedBy`, timestamps
8. **Validaciones en DB**: Constraints, foreign keys, enums

---

## 🚀 Próximos Pasos

1. **Revisar y aprobar** este diseño
2. **Crear migraciones** de Prisma
3. **Implementar servicios** nuevos
4. **Crear scripts de migración** de datos
5. **Actualizar código** gradualmente
6. **Probar** exhaustivamente
7. **Deprecar** código viejo

---

## ❓ Decisiones Pendientes

1. ¿Crear tabla `organizations` para servicio social?
2. ¿Crear tabla `companies` para prácticas profesionales?
3. ¿Mantener `enrollments` actual durante migración o reemplazar inmediatamente?
4. ¿Cómo manejar reportes que necesitan todos los tipos?
5. ¿Necesitamos una vista materializada para queries complejas?



