# 🏗️ Propuesta de Mejoras al Schema - Sistema Estudiantil Mejorado

**Fecha:** 2025-01-21  
**Objetivo:** Escalabilidad, Consistencia y Funcionalidad Estratégica

---

## 📋 Análisis del Schema Actual

### Fortalezas Identificadas
- ✅ Uso de UUIDs para IDs (escalable)
- ✅ Índices bien diseñados
- ✅ Relaciones apropiadas
- ✅ Timestamps en todas las tablas
- ✅ Constraints de unicidad donde corresponde

### Limitaciones Identificadas
- ⚠️ Falta información de contacto (email, teléfono)
- ⚠️ No hay gestión de cupos en grupos
- ⚠️ No hay horarios y aulas
- ⚠️ No hay prerequisitos de materias
- ⚠️ No hay historial de cambios
- ⚠️ No hay soft-delete
- ⚠️ Limitaciones en formato de matrícula
- ⚠️ No hay información académica adicional
- ⚠️ No hay gestión de períodos académicos
- ⚠️ No hay auditoría de cambios

---

## 🎯 Mejoras Propuestas por Entidad

### 1. USERS (Usuarios)

#### Campos Actuales
```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique @db.VarChar(50)
  passwordHash String   @db.VarChar(255)
  role         UserRole
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### Campos Propuestos a Agregar
```prisma
model User {
  // ... campos existentes ...
  
  // Información de contacto
  email        String?  @unique @db.VarChar(255)
  emailVerified Boolean  @default(false)
  telefono     String?  @db.VarChar(20)
  
  // Seguridad y auditoría
  lastLoginAt  DateTime?
  loginAttempts Int     @default(0)
  lockedUntil  DateTime?
  passwordChangedAt DateTime?
  
  // Soft delete
  deletedAt    DateTime?
  
  // Auditoría
  createdBy    String?  // ID del usuario que creó este registro
  updatedBy    String?  // ID del usuario que actualizó este registro
  
  @@index([email])
  @@index([deletedAt])
  @@map("users")
}
```

**Justificación:**
- Email: esencial para comunicación y recuperación de cuenta
- EmailVerified: seguridad y validación
- Telefono: contacto alternativo
- lastLoginAt: seguridad y analytics
- Soft delete: mantener historial
- Auditoría: rastrear cambios

---

### 2. STUDENTS (Estudiantes)

#### Campos Actuales
```prisma
model Student {
  id              String        @id @default(uuid())
  userId          String        @unique
  matricula       String        @unique @db.VarChar(20)
  nombre          String        @db.VarChar(100)
  apellidoPaterno String        @db.VarChar(100)
  apellidoMaterno String        @db.VarChar(100)
  carrera         String        @db.VarChar(100)
  semestre        Int
  estatus         StudentStatus
  curp            String?       @unique @db.VarChar(18)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

#### Campos Propuestos a Agregar
```prisma
model Student {
  // ... campos existentes ...
  
  // Información personal adicional
  fechaNacimiento DateTime?
  lugarNacimiento String?      @db.VarChar(100)
  genero          Gender?       // ENUM: MASCULINO, FEMENINO, OTRO, PREFIERO_NO_DECIR
  nacionalidad    String?       @db.VarChar(50) @default("Mexicana")
  
  // Información de contacto
  email           String?       @unique @db.VarChar(255)
  telefono        String?       @db.VarChar(20)
  telefonoEmergencia String?    @db.VarChar(20)
  direccion       String?       @db.Text
  
  // Información académica
  promedioGeneral Decimal?      @db.Decimal(5, 2) // 0.00-100.00
  creditosAprobados Int         @default(0)
  creditosCursando  Int         @default(0)
  fechaIngreso    DateTime?     // Fecha de ingreso a la institución
  fechaEgreso     DateTime?     // Fecha de egreso/graduación
  
  // Información administrativa
  tipoIngreso     TipoIngreso?  // ENUM: NUEVO_INGRESO, REINGRESO, TRANSFERENCIA
  beca            Boolean        @default(false)
  tipoBeca        String?       @db.VarChar(50)
  
  // Soft delete y auditoría
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  // Relaciones adicionales
  academicHistory AcademicHistory[]
  documents       StudentDocument[]
  
  @@index([email])
  @@index([fechaIngreso])
  @@index([fechaEgreso])
  @@index([deletedAt])
  @@index([carrera, semestre, estatus]) // Composite para reportes
  @@map("students")
}

enum Gender {
  MASCULINO
  FEMENINO
  OTRO
  PREFIERO_NO_DECIR
}

enum TipoIngreso {
  NUEVO_INGRESO
  REINGRESO
  TRANSFERENCIA
}
```

**Justificación:**
- Información personal: necesaria para reportes y gestión
- Email/Telefono: comunicación esencial
- PromedioGeneral: cálculo automático para analytics
- Creditos: seguimiento de progreso académico
- Fechas: historial académico completo
- TipoIngreso: analytics de admisiones
- Beca: gestión de apoyos estudiantiles

---

### 3. TEACHERS (Maestros)

#### Campos Actuales
```prisma
model Teacher {
  id              String   @id @default(uuid())
  userId          String   @unique
  nombre          String   @db.VarChar(100)
  apellidoPaterno String   @db.VarChar(100)
  apellidoMaterno String   @db.VarChar(100)
  departamento    String   @db.VarChar(100)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Campos Propuestos a Agregar
```prisma
model Teacher {
  // ... campos existentes ...
  
  // Información personal
  fechaNacimiento DateTime?
  genero          Gender?
  
  // Información de contacto
  email           String?  @unique @db.VarChar(255)
  telefono        String?  @db.VarChar(20)
  telefonoEmergencia String? @db.VarChar(20)
  direccion       String?  @db.Text
  
  // Información académica
  gradoAcademico  GradoAcademico? // ENUM: LICENCIATURA, MAESTRIA, DOCTORADO
  especialidad    String?  @db.VarChar(200)
  cedulaProfesional String? @unique @db.VarChar(50)
  
  // Información laboral
  fechaContratacion DateTime?
  tipoContrato    TipoContrato? // ENUM: TIEMPO_COMPLETO, MEDIO_TIEMPO, HORAS_CLASE
  estatus         TeacherStatus @default(ACTIVO) // ENUM: ACTIVO, INACTIVO, JUBILADO
  
  // Métricas
  gruposAsignados Int      @default(0) // Calculado o almacenado
  estudiantesTotal Int     @default(0) // Total de estudiantes en sus grupos
  
  // Soft delete y auditoría
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  @@index([email])
  @@index([cedulaProfesional])
  @@index([departamento, estatus])
  @@index([deletedAt])
  @@map("teachers")
}

enum GradoAcademico {
  LICENCIATURA
  MAESTRIA
  DOCTORADO
  POSTDOCTORADO
}

enum TipoContrato {
  TIEMPO_COMPLETO
  MEDIO_TIEMPO
  HORAS_CLASE
  CONSULTOR
}

enum TeacherStatus {
  ACTIVO
  INACTIVO
  JUBILADO
  LICENCIA
}
```

**Justificación:**
- GradoAcademico: requisito para reportes académicos
- Especialidad: mejor asignación de materias
- TipoContrato: gestión de recursos humanos
- Métricas: analytics de carga de trabajo
- Estatus: mejor gestión de maestros

---

### 4. SUBJECTS (Materias)

#### Campos Actuales
```prisma
model Subject {
  id       String  @id @default(uuid())
  clave    String  @unique @db.VarChar(20)
  nombre   String  @db.VarChar(200)
  creditos Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Campos Propuestos a Agregar
```prisma
model Subject {
  // ... campos existentes ...
  
  // Información académica
  descripcion     String?  @db.Text
  tipo            TipoMateria @default(OBLIGATORIA) // ENUM
  areaAcademica   String?  @db.VarChar(100)
  nivel           Int?     // Nivel académico (1-12)
  
  // Horas
  horasTeoria     Int      @default(0)
  horasPractica   Int      @default(0)
  horasLaboratorio Int     @default(0)
  horasTotal      Int      // Calculado: teoria + practica + laboratorio
  
  // Prerequisitos
  prerequisitos   Prerequisite[]
  esPrerequisitoDe Prerequisite[] @relation("SubjectPrerequisites")
  
  // Métricas
  gruposActivos   Int      @default(0)
  estudiantesInscritos Int @default(0)
  
  // Estado
  estatus         SubjectStatus @default(ACTIVA) // ENUM: ACTIVA, INACTIVA, DESCONTINUADA
  
  // Soft delete y auditoría
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  @@index([tipo])
  @@index([areaAcademica])
  @@index([nivel])
  @@index([estatus])
  @@index([deletedAt])
  @@map("subjects")
}

enum TipoMateria {
  OBLIGATORIA
  OPTATIVA
  ELECTIVA
  SERIACION
}

enum SubjectStatus {
  ACTIVA
  INACTIVA
  DESCONTINUADA
}

// Nueva tabla para prerequisitos
model Prerequisite {
  id          String  @id @default(uuid())
  subjectId    String  // Materia que requiere el prerequisito
  prerequisiteId String // Materia que es prerequisito
  obligatorio  Boolean @default(true)
  
  subject      Subject @relation("SubjectPrerequisites", fields: [subjectId], references: [id], onDelete: Cascade)
  prerequisite Subject @relation("SubjectRequirements", fields: [prerequisiteId], references: [id], onDelete: Restrict)
  
  createdAt    DateTime @default(now())
  
  @@unique([subjectId, prerequisiteId])
  @@index([subjectId])
  @@index([prerequisiteId])
  @@map("prerequisites")
}
```

**Justificación:**
- Tipo: gestión de planes de estudio
- Horas: información curricular completa
- Prerequisitos: lógica académica esencial
- Nivel: organización por semestres
- Métricas: analytics de demanda
- Estatus: gestión del catálogo

---

### 5. GROUPS (Grupos)

#### Campos Actuales
```prisma
model Group {
  id        String   @id @default(uuid())
  subjectId String
  teacherId String
  nombre    String   @db.VarChar(50)
  periodo   String   @db.VarChar(10)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Campos Propuestos a Agregar
```prisma
model Group {
  // ... campos existentes ...
  
  // Información del grupo
  codigo          String   @unique @db.VarChar(20) // Código único del grupo
  seccion         String?  @db.VarChar(10) // Sección adicional (A, B, C, etc.)
  
  // Cupos
  cupoMaximo      Int      @default(30)
  cupoMinimo      Int      @default(5)
  cupoActual      Int      @default(0) // Calculado o almacenado
  
  // Horario y ubicación
  horario         String?  @db.VarChar(200) // "Lunes 8:00-10:00, Miércoles 8:00-10:00"
  aula            String?  @db.VarChar(50)
  edificio        String?  @db.VarChar(50)
  modalidad       Modalidad @default(PRESENCIAL) // ENUM
  
  // Período académico (mejorado)
  periodoId       String?  // Relación con AcademicPeriod
  fechaInicio     DateTime?
  fechaFin        DateTime?
  
  // Estado
  estatus         GroupStatus @default(ABIERTO) // ENUM
  
  // Métricas
  promedioGrupo   Decimal?  @db.Decimal(5, 2) // Promedio del grupo
  tasaAprobacion  Decimal?  @db.Decimal(5, 2) // % de aprobados
  
  // Soft delete y auditoría
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  @@index([codigo])
  @@index([periodoId])
  @@index([estatus])
  @@index([modalidad])
  @@index([subjectId, periodoId, estatus])
  @@index([teacherId, periodoId])
  @@index([deletedAt])
  @@map("groups")
}

enum Modalidad {
  PRESENCIAL
  VIRTUAL
  HIBRIDO
  SEMIPRESENCIAL
}

enum GroupStatus {
  ABIERTO
  CERRADO
  CANCELADO
  EN_CURSO
  FINALIZADO
}

// Nueva tabla para períodos académicos
model AcademicPeriod {
  id          String   @id @default(uuid())
  codigo      String   @unique @db.VarChar(20) // "2024-1", "2024-2"
  nombre      String   @db.VarChar(100) // "Primer Semestre 2024"
  tipo        TipoPeriodo // ENUM: SEMESTRAL, TRIMESTRAL, CUATRIMESTRAL, ANUAL
  fechaInicio DateTime
  fechaFin    DateTime
  fechaInscripcionInicio DateTime?
  fechaInscripcionFin    DateTime?
  estatus     PeriodStatus @default(PLANEADO) // ENUM
  
  groups      Group[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([codigo])
  @@index([estatus])
  @@index([fechaInicio, fechaFin])
  @@map("academic_periods")
}

enum TipoPeriodo {
  SEMESTRAL
  TRIMESTRAL
  CUATRIMESTRAL
  ANUAL
}

enum PeriodStatus {
  PLANEADO
  INSCRIPCIONES
  EN_CURSO
  FINALIZADO
  CERRADO
}
```

**Justificación:**
- Cupos: gestión esencial de capacidad
- Horario/Aula: información práctica necesaria
- Modalidad: flexibilidad educativa moderna
- AcademicPeriod: mejor gestión de períodos
- Estatus: control de ciclo de vida del grupo
- Métricas: analytics de rendimiento

---

### 6. ENROLLMENTS (Inscripciones)

#### Campos Actuales
```prisma
model Enrollment {
  id          String   @id @default(uuid())
  studentId   String
  groupId     String
  calificacion Decimal? @db.Decimal(5, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Campos Propuestos a Agregar
```prisma
model Enrollment {
  // ... campos existentes ...
  
  // Información de inscripción
  codigo          String   @unique @db.VarChar(30) // Código único de inscripción
  fechaInscripcion DateTime @default(now())
  fechaBaja       DateTime?
  tipoInscripcion TipoInscripcion @default(NORMAL) // ENUM
  
  // Estado
  estatus         EnrollmentStatus @default(INSCRITO) // ENUM
  
  // Calificaciones
  calificacionParcial1 Decimal? @db.Decimal(5, 2)
  calificacionParcial2 Decimal? @db.Decimal(5, 2)
  calificacionParcial3 Decimal? @db.Decimal(5, 2)
  calificacionFinal    Decimal? @db.Decimal(5, 2)
  calificacionExtra    Decimal? @db.Decimal(5, 2) // Para trabajos extra
  
  // Asistencias
  asistencias     Int      @default(0)
  faltas          Int      @default(0)
  retardos        Int      @default(0)
  porcentajeAsistencia Decimal? @db.Decimal(5, 2) // Calculado
  
  // Evaluación
  aprobado        Boolean? // null = pendiente, true = aprobado, false = reprobado
  fechaAprobacion DateTime?
  observaciones   String?  @db.Text
  
  // Historial
  historial       EnrollmentHistory[]
  
  // Soft delete y auditoría
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?
  
  @@index([codigo])
  @@index([estatus])
  @@index([fechaInscripcion])
  @@index([fechaBaja])
  @@index([aprobado])
  @@index([studentId, estatus])
  @@index([groupId, estatus])
  @@index([deletedAt])
  @@map("enrollments")
}

enum TipoInscripcion {
  NORMAL
  ESPECIAL
  REPETICION
  EQUIVALENCIA
}

enum EnrollmentStatus {
  INSCRITO
  EN_CURSO
  BAJA
  APROBADO
  REPROBADO
  CANCELADO
}

// Nueva tabla para historial de inscripciones
model EnrollmentHistory {
  id          String   @id @default(uuid())
  enrollmentId String
  accion      String   @db.VarChar(50) // "INSCRIPCION", "BAJA", "CALIFICACION", etc.
  valorAnterior String? @db.Text
  valorNuevo    String? @db.Text
  observaciones String? @db.Text
  realizadoPor  String? // User ID
  createdAt     DateTime @default(now())
  
  enrollment    Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  
  @@index([enrollmentId])
  @@index([accion])
  @@index([createdAt])
  @@map("enrollment_history")
}
```

**Justificación:**
- Calificaciones parciales: seguimiento detallado
- Asistencias: requisito académico
- Estatus: mejor control de ciclo de vida
- Historial: auditoría completa
- TipoInscripcion: flexibilidad administrativa

---

## 🆕 Nuevas Entidades Propuestas

### 7. ACADEMIC_HISTORY (Historial Académico)

```prisma
model AcademicHistory {
  id          String   @id @default(uuid())
  studentId   String
  periodoId   String?
  promedioPeriodo Decimal? @db.Decimal(5, 2)
  creditosAprobados Int     @default(0)
  creditosCursados  Int     @default(0)
  materiasAprobadas Int     @default(0)
  materiasReprobadas Int    @default(0)
  observaciones     String? @db.Text
  
  student     Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  periodo     AcademicPeriod? @relation(fields: [periodoId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([studentId])
  @@index([periodoId])
  @@index([studentId, periodoId])
  @@map("academic_history")
}
```

**Justificación:**
- Seguimiento histórico del progreso académico
- Analytics de rendimiento por período
- Reportes de progreso estudiantil

---

### 8. STUDENT_DOCUMENTS (Documentos Estudiantiles)

```prisma
model StudentDocument {
  id          String   @id @default(uuid())
  studentId   String
  tipo        TipoDocumento // ENUM
  nombre      String   @db.VarChar(200)
  rutaArchivo String   @db.VarChar(500)
  mimeType    String?  @db.VarChar(100)
  tamano      Int?     // Tamaño en bytes
  estatus     DocumentStatus @default(PENDIENTE) // ENUM
  observaciones String? @db.Text
  
  student     Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([studentId])
  @@index([tipo])
  @@index([estatus])
  @@map("student_documents")
}

enum TipoDocumento {
  ACTA_NACIMIENTO
  CURP
  CERTIFICADO_BACHILLERATO
  FOTOGRAFIA
  COMPROBANTE_DOMICILIO
  OTRO
}

enum DocumentStatus {
  PENDIENTE
  APROBADO
  RECHAZADO
  VENCIDO
}
```

**Justificación:**
- Gestión de documentos requeridos
- Control de expediente estudiantil
- Validación de documentos

---

### 9. CAREER (Carreras) - Nueva Entidad

```prisma
model Career {
  id          String   @id @default(uuid())
  codigo      String   @unique @db.VarChar(20)
  nombre      String   @db.VarChar(200)
  nombreCorto String?  @db.VarChar(50)
  descripcion String?  @db.Text
  area        String?  @db.VarChar(100) // Área académica
  duracion    Int?     // Semestres
  creditosTotales Int? // Total de créditos requeridos
  estatus     CareerStatus @default(ACTIVA) // ENUM
  
  students    Student[]
  subjects    Subject[] // Materias de la carrera
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([codigo])
  @@index([area])
  @@index([estatus])
  @@map("careers")
}

enum CareerStatus {
  ACTIVA
  INACTIVA
  DESCONTINUADA
}
```

**Justificación:**
- Normalización de carreras
- Mejor gestión y reportes
- Relación con materias

---

## 🔄 Mejoras en Relaciones

### Relaciones Mejoradas

1. **Student → Career** (en lugar de string)
   - Normalización
   - Mejor integridad referencial
   - Analytics mejorados

2. **Group → AcademicPeriod** (en lugar de string)
   - Validación de períodos
   - Fechas automáticas
   - Mejor gestión

3. **Enrollment → EnrollmentHistory**
   - Auditoría completa
   - Historial de cambios
   - Trazabilidad

---

## 📊 Índices Adicionales Propuestos

### Para Performance

```prisma
// En Student
@@index([carrera, semestre, estatus]) // Reportes combinados
@@index([fechaIngreso, fechaEgreso]) // Analytics temporales

// En Group
@@index([periodoId, estatus, cupoActual]) // Búsqueda de grupos disponibles
@@index([subjectId, periodoId, modalidad]) // Filtros avanzados

// En Enrollment
@@index([studentId, aprobado, estatus]) // Historial académico
@@index([groupId, estatus, calificacion]) // Reportes de grupo
```

---

## 🔐 Mejoras de Seguridad y Auditoría

### Campos de Auditoría Estándar

Todas las entidades principales deberían tener:
- `createdBy`: String? (User ID)
- `updatedBy`: String? (User ID)
- `deletedAt`: DateTime? (Soft delete)

### Tabla de Auditoría Global (Opcional)

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  tabla       String   @db.VarChar(50)
  registroId  String
  accion      String   @db.VarChar(50) // CREATE, UPDATE, DELETE
  valoresAnteriores Json?
  valoresNuevos     Json?
  realizadoPor String? // User ID
  ipAddress   String?  @db.VarChar(45)
  userAgent   String?  @db.VarChar(500)
  createdAt   DateTime @default(now())
  
  @@index([tabla, registroId])
  @@index([realizadoPor])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 📈 Campos Calculados vs. Almacenados

### Estrategia Recomendada

**Almacenar (para performance):**
- `cupoActual` en Group
- `promedioGeneral` en Student
- `gruposAsignados` en Teacher
- `estudiantesInscritos` en Subject

**Calcular (para consistencia):**
- `porcentajeAsistencia` en Enrollment
- `horasTotal` en Subject
- `promedioGrupo` en Group

**Actualizar mediante:**
- Triggers de base de datos (MySQL)
- Hooks de Prisma (middleware)
- Jobs programados (cron)

---

## 🎯 Priorización de Implementación

### Fase 1: Crítico (Implementar Primero)
1. ✅ Campos de contacto (email, teléfono)
2. ✅ Gestión de cupos en grupos
3. ✅ Estatus en grupos e inscripciones
4. ✅ AcademicPeriod (períodos académicos)
5. ✅ Soft delete básico

### Fase 2: Importante (Próximas 2 Semanas)
6. ✅ Calificaciones parciales
7. ✅ Asistencias
8. ✅ Prerequisitos de materias
9. ✅ Career (normalización)
10. ✅ Campos académicos adicionales

### Fase 3: Mejoras (Próximo Mes)
11. ✅ Historial académico
12. ✅ Documentos estudiantiles
13. ✅ Auditoría completa
14. ✅ Métricas almacenadas
15. ✅ Horarios y aulas

---

## 📝 Notas de Migración

### Consideraciones

1. **Migraciones Incrementales**
   - Implementar por fases
   - No romper funcionalidad existente
   - Campos nuevos como opcionales inicialmente

2. **Datos Existentes**
   - Migrar datos de carrera a tabla Career
   - Generar códigos únicos para grupos e inscripciones
   - Calcular campos históricos si es posible

3. **Validaciones**
   - Agregar validaciones en aplicación
   - Constraints de base de datos
   - Validaciones de negocio

---

## 🚀 Beneficios Esperados

### Escalabilidad
- ✅ Mejor organización de datos
- ✅ Índices optimizados
- ✅ Relaciones normalizadas

### Consistencia
- ✅ Constraints de integridad
- ✅ Validaciones centralizadas
- ✅ Soft delete para historial

### Funcionalidad
- ✅ Información completa
- ✅ Analytics mejorados
- ✅ Reportes detallados

### Estratégico
- ✅ Toma de decisiones basada en datos
- ✅ Seguimiento de métricas
- ✅ Auditoría completa

---

**Próximo Paso:** Crear migración incremental con estas mejoras.

