# Cambios Propuestos al Schema - Cursos de Inglés y Exámenes

## 📊 Análisis del Schema Actual

### ✅ Lo que ya tenemos y funciona:
1. **`groups`**: Ya tiene `cupoMaximo`, `cupoActual`, `fechaInicio`, `fechaFin`, `estatus`, `horario`, `aula`
2. **`exams`**: Ya tiene `examType`, `nivelIngles`, `requierePago`, etc.
3. **`special_courses`**: Ya tiene `groupId` opcional (perfecto para cursos con grupo)
4. **`academic_activities`**: Base polimórfica funcionando correctamente

### ❌ Lo que necesitamos agregar:
1. **Campos en `groups`** para identificar y controlar cursos de inglés
2. **Nueva tabla `diagnostic_exam_periods`** para períodos de exámenes
3. **Campo `periodId` en `exams`** para relacionar con períodos

---

## 🎯 Cambios Propuestos

### 1. Extender `groups` para Cursos de Inglés

**Campos a agregar:**
```prisma
model groups {
  // ... campos existentes ...
  
  // Nuevos campos para cursos de inglés
  nivelIngles              Int?              // Nivel del curso (1-6) si es curso de inglés
  fechaInscripcionInicio  DateTime?         // Fecha de apertura de inscripciones
  fechaInscripcionFin     DateTime?         // Fecha de cierre de inscripciones
  esCursoIngles           Boolean           @default(false) // Flag para identificar cursos de inglés
  
  // ... relaciones existentes ...
  
  // Nuevos índices
  @@index([esCursoIngles])
  @@index([nivelIngles])
  @@index([fechaInscripcionInicio, fechaInscripcionFin])
  @@index([esCursoIngles, estatus])
}
```

**Justificación:**
- `nivelIngles`: Identifica el nivel del curso (1-6)
- `fechaInscripcionInicio/Fin`: Controla períodos de inscripción
- `esCursoIngles`: Flag para filtrar fácilmente cursos de inglés
- Índices para búsquedas eficientes

---

### 2. Nueva Tabla: `diagnostic_exam_periods`

```prisma
model diagnostic_exam_periods {
  id                      String              @id @default(uuid())
  nombre                  String               @db.VarChar(200) // Ej: "Examen Diagnóstico Enero 2025"
  descripcion             String?              @db.Text
  fechaInicio             DateTime             // Fecha de inicio del período de exámenes
  fechaFin                DateTime             // Fecha de fin del período de exámenes
  fechaInscripcionInicio  DateTime             // Fecha de apertura de inscripciones
  fechaInscripcionFin     DateTime             // Fecha de cierre de inscripciones
  cupoMaximo              Int                  @default(100)
  cupoActual              Int                  @default(0)
  estatus                 exam_period_status   @default(PLANEADO)
  requierePago            Boolean              @default(false)
  montoPago               Decimal?             @db.Decimal(10, 2)
  observaciones           String?              @db.Text
  createdAt               DateTime             @default(now())
  updatedAt               DateTime             @updatedAt
  deletedAt               DateTime?
  createdBy               String?
  updatedBy               String?
  
  // Relación con exámenes creados en este período
  exams                   exams[]
  
  @@index([estatus])
  @@index([fechaInscripcionInicio, fechaInscripcionFin])
  @@index([deletedAt])
  @@index([fechaInicio, fechaFin])
}

enum exam_period_status {
  PLANEADO      // Período creado pero no abierto
  ABIERTO       // Inscripciones abiertas
  CERRADO       // Inscripciones cerradas
  EN_PROCESO    // Exámenes en curso
  FINALIZADO    // Período completado
}
```

**Justificación:**
- Tabla dedicada para períodos de exámenes
- Control centralizado de fechas y cupos
- Relación con `exams` para tracking
- Enum para estados claros

---

### 3. Agregar `periodId` a `exams`

```prisma
model exams {
  id                String    @id @default(uuid())
  activityId        String    @unique
  examType          ExamType
  subjectId         String?
  nivelIngles       Int?
  periodId          String?   // ← NUEVO: Relación con período
  resultado         Decimal?  @db.Decimal(5, 2)
  fechaExamen       DateTime?
  fechaResultado    DateTime?
  requierePago      Boolean   @default(false)
  pagoAprobado      Boolean?
  fechaPagoAprobado DateTime?
  montoPago         Decimal?  @db.Decimal(10, 2)
  comprobantePago   String?   @db.VarChar(255)

  academic_activities academic_activities @relation(fields: [activityId], references: [id], onDelete: Cascade)
  subjects            subjects?           @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  diagnostic_exam_periods diagnostic_exam_periods? @relation(fields: [periodId], references: [id], onDelete: SetNull) // ← NUEVA RELACIÓN

  @@index([activityId])
  @@index([examType])
  @@index([subjectId])
  @@index([nivelIngles])
  @@index([requierePago])
  @@index([periodId]) // ← NUEVO ÍNDICE
}
```

**Justificación:**
- Campo opcional: permite exámenes con o sin período
- Relación con `diagnostic_exam_periods`
- Índice para búsquedas eficientes
- `onDelete: SetNull` para mantener flexibilidad

---

## 📋 Resumen de Cambios

### Tablas Modificadas:
1. **`groups`**: +4 campos, +4 índices
2. **`exams`**: +1 campo, +1 relación, +1 índice

### Tablas Nuevas:
1. **`diagnostic_exam_periods`**: Tabla completa nueva
2. **`exam_period_status`**: Enum nuevo

### Total:
- **Campos nuevos**: 5 (4 en groups, 1 en exams)
- **Tablas nuevas**: 1
- **Enums nuevos**: 1
- **Índices nuevos**: 6
- **Relaciones nuevas**: 1

---

## ✅ Ventajas de esta Solución

1. **Mínimos cambios**: Reutiliza infraestructura existente
2. **Flexibilidad**: Mantiene capacidad de solicitud directa
3. **Escalabilidad**: Fácil agregar más campos si es necesario
4. **Performance**: Índices optimizados para búsquedas
5. **Compatibilidad**: No rompe código existente

---

## 🔄 Migración Propuesta

### Paso 1: Agregar campos a `groups`
```sql
ALTER TABLE groups
  ADD COLUMN nivelIngles INT NULL,
  ADD COLUMN fechaInscripcionInicio DATETIME NULL,
  ADD COLUMN fechaInscripcionFin DATETIME NULL,
  ADD COLUMN esCursoIngles BOOLEAN DEFAULT FALSE;

CREATE INDEX groups_esCursoIngles_idx ON groups(esCursoIngles);
CREATE INDEX groups_nivelIngles_idx ON groups(nivelIngles);
CREATE INDEX groups_fechaInscripcion_idx ON groups(fechaInscripcionInicio, fechaInscripcionFin);
CREATE INDEX groups_esCursoIngles_estatus_idx ON groups(esCursoIngles, estatus);
```

### Paso 2: Crear tabla `diagnostic_exam_periods`
```sql
CREATE TABLE diagnostic_exam_periods (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fechaInicio DATETIME NOT NULL,
  fechaFin DATETIME NOT NULL,
  fechaInscripcionInicio DATETIME NOT NULL,
  fechaInscripcionFin DATETIME NOT NULL,
  cupoMaximo INT DEFAULT 100,
  cupoActual INT DEFAULT 0,
  estatus ENUM('PLANEADO', 'ABIERTO', 'CERRADO', 'EN_PROCESO', 'FINALIZADO') DEFAULT 'PLANEADO',
  requierePago BOOLEAN DEFAULT FALSE,
  montoPago DECIMAL(10, 2),
  observaciones TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  createdBy VARCHAR(36) NULL,
  updatedBy VARCHAR(36) NULL
);

CREATE INDEX diagnostic_exam_periods_estatus_idx ON diagnostic_exam_periods(estatus);
CREATE INDEX diagnostic_exam_periods_fechaInscripcion_idx ON diagnostic_exam_periods(fechaInscripcionInicio, fechaInscripcionFin);
CREATE INDEX diagnostic_exam_periods_deletedAt_idx ON diagnostic_exam_periods(deletedAt);
CREATE INDEX diagnostic_exam_periods_fecha_idx ON diagnostic_exam_periods(fechaInicio, fechaFin);
```

### Paso 3: Agregar `periodId` a `exams`
```sql
ALTER TABLE exams
  ADD COLUMN periodId VARCHAR(36) NULL,
  ADD CONSTRAINT exams_periodId_fk FOREIGN KEY (periodId) REFERENCES diagnostic_exam_periods(id) ON DELETE SET NULL;

CREATE INDEX exams_periodId_idx ON exams(periodId);
```

---

## 🎯 Validación de la Solución

### ✅ Cumple con los requisitos:
1. **Cursos de inglés**: Grupos pueden ser identificados y controlados
2. **Períodos de exámenes**: Tabla dedicada con control completo
3. **Flexibilidad**: Mantiene solicitud directa sin período
4. **Performance**: Índices optimizados
5. **Escalabilidad**: Fácil agregar más campos

### ✅ No rompe código existente:
- Todos los campos nuevos son opcionales
- Relaciones nuevas son opcionales
- No se eliminan campos existentes

---

## 📝 Próximos Pasos

1. **Aprobar cambios**: Revisar y aprobar esta propuesta
2. **Crear migración**: Generar migración de Prisma
3. **Aplicar migración**: Ejecutar `prisma migrate dev`
4. **Actualizar servicios**: Implementar lógica de negocio
5. **Testing**: Probar flujos completos


