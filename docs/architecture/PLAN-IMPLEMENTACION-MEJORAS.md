# 📋 Plan de Implementación - Mejoras al Schema

> ⚠️ **PLAN PARCIAL / PRE-V2 – REEMPLAZADO**
>
> - Este plan corresponde a una fase anterior de mejoras incrementales al schema.
> - El plan vigente y completo para la arquitectura basada en `academic_activities` está en:
>   - `../DISENO-BASE-DATOS-V2.md`
>   - `../PLAN-IMPLEMENTACION-V2.md`
> - No uses este archivo como guía para nuevos cambios; consérvalo solo como referencia histórica.

**Fecha:** 2025-01-21  
**Objetivo:** Implementar mejoras de forma incremental sin romper funcionalidad existente

---

## 🎯 Estrategia de Implementación

### Principios
1. **Incremental:** Implementar por fases
2. **No Destructivo:** Mantener compatibilidad con datos existentes
3. **Reversible:** Cada fase debe poder revertirse
4. **Probado:** Validar cada fase antes de continuar

---

## 📅 Fases de Implementación

### FASE 1: Fundamentos (Semana 1-2)

#### 1.1 Campos de Contacto y Seguridad
**Prioridad:** ALTA  
**Impacto:** Bajo riesgo, alta utilidad

**Cambios:**
- Agregar `email`, `emailVerified`, `telefono` a `User`
- Agregar `lastLoginAt`, `loginAttempts` a `User`
- Agregar `email`, `telefono` a `Student` y `Teacher`

**Migración:**
```sql
-- Users
ALTER TABLE users 
  ADD COLUMN email VARCHAR(255) NULL UNIQUE,
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN telefono VARCHAR(20) NULL,
  ADD COLUMN last_login_at DATETIME(3) NULL,
  ADD COLUMN login_attempts INT DEFAULT 0;

CREATE INDEX users_email_idx ON users(email);

-- Students
ALTER TABLE students
  ADD COLUMN email VARCHAR(255) NULL UNIQUE,
  ADD COLUMN telefono VARCHAR(20) NULL,
  ADD COLUMN telefono_emergencia VARCHAR(20) NULL;

CREATE INDEX students_email_idx ON students(email);

-- Teachers
ALTER TABLE teachers
  ADD COLUMN email VARCHAR(255) NULL UNIQUE,
  ADD COLUMN telefono VARCHAR(20) NULL;

CREATE INDEX teachers_email_idx ON teachers(email);
```

**Validación:**
- Verificar que usuarios existentes siguen funcionando
- Probar login con y sin email
- Verificar índices

---

#### 1.2 Soft Delete Básico
**Prioridad:** MEDIA  
**Impacto:** Bajo riesgo, mejora gestión

**Cambios:**
- Agregar `deletedAt` a todas las entidades principales
- Agregar índices en `deletedAt`

**Migración:**
```sql
ALTER TABLE users ADD COLUMN deleted_at DATETIME(3) NULL;
ALTER TABLE students ADD COLUMN deleted_at DATETIME(3) NULL;
ALTER TABLE teachers ADD COLUMN deleted_at DATETIME(3) NULL;
ALTER TABLE subjects ADD COLUMN deleted_at DATETIME(3) NULL;
ALTER TABLE groups ADD COLUMN deleted_at DATETIME(3) NULL;
ALTER TABLE enrollments ADD COLUMN deleted_at DATETIME(3) NULL;

CREATE INDEX users_deleted_at_idx ON users(deleted_at);
CREATE INDEX students_deleted_at_idx ON students(deleted_at);
CREATE INDEX teachers_deleted_at_idx ON teachers(deleted_at);
CREATE INDEX subjects_deleted_at_idx ON subjects(deleted_at);
CREATE INDEX groups_deleted_at_idx ON groups(deleted_at);
CREATE INDEX enrollments_deleted_at_idx ON enrollments(deleted_at);
```

**Validación:**
- Verificar que consultas existentes siguen funcionando
- Probar filtros con `deletedAt IS NULL`

---

### FASE 2: Gestión Académica (Semana 3-4)

#### 2.1 AcademicPeriod (Períodos Académicos)
**Prioridad:** ALTA  
**Impacto:** Mejora significativa en gestión

**Cambios:**
- Crear tabla `academic_periods`
- Agregar `periodoId` a `Group` (opcional, mantener `periodo` por compatibilidad)

**Migración:**
```sql
CREATE TABLE academic_periods (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('SEMESTRAL', 'TRIMESTRAL', 'CUATRIMESTRAL', 'ANUAL') NOT NULL,
  fecha_inicio DATETIME(3) NOT NULL,
  fecha_fin DATETIME(3) NOT NULL,
  fecha_inscripcion_inicio DATETIME(3) NULL,
  fecha_inscripcion_fin DATETIME(3) NULL,
  estatus ENUM('PLANEADO', 'INSCRIPCIONES', 'EN_CURSO', 'FINALIZADO', 'CERRADO') DEFAULT 'PLANEADO',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE INDEX academic_periods_codigo_idx ON academic_periods(codigo);
CREATE INDEX academic_periods_estatus_idx ON academic_periods(estatus);
CREATE INDEX academic_periods_fechas_idx ON academic_periods(fecha_inicio, fecha_fin);

ALTER TABLE groups 
  ADD COLUMN periodo_id VARCHAR(191) NULL,
  ADD CONSTRAINT groups_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES academic_periods(id) ON DELETE SET NULL;

CREATE INDEX groups_periodo_id_idx ON groups(periodo_id);
```

**Datos Iniciales:**
```sql
-- Crear períodos existentes
INSERT INTO academic_periods (id, codigo, nombre, tipo, fecha_inicio, fecha_fin, estatus)
VALUES 
  (UUID(), '2024-1', 'Primer Semestre 2024', 'SEMESTRAL', '2024-01-15', '2024-06-30', 'FINALIZADO'),
  (UUID(), '2024-2', 'Segundo Semestre 2024', 'SEMESTRAL', '2024-08-01', '2024-12-20', 'FINALIZADO'),
  (UUID(), '2025-1', 'Primer Semestre 2025', 'SEMESTRAL', '2025-01-15', '2025-06-30', 'EN_CURSO'),
  (UUID(), '2025-2', 'Segundo Semestre 2025', 'SEMESTRAL', '2025-08-01', '2025-12-20', 'PLANEADO');
```

**Validación:**
- Verificar que grupos existentes siguen funcionando
- Probar creación de grupos con `periodoId`
- Verificar que `periodo` sigue funcionando

---

#### 2.2 Gestión de Cupos en Grupos
**Prioridad:** ALTA  
**Impacto:** Funcionalidad crítica

**Cambios:**
- Agregar `cupoMaximo`, `cupoMinimo`, `cupoActual` a `Group`
- Agregar `codigo` único a `Group`
- Agregar `estatus` a `Group`

**Migración:**
```sql
ALTER TABLE groups
  ADD COLUMN codigo VARCHAR(20) NULL UNIQUE,
  ADD COLUMN seccion VARCHAR(10) NULL,
  ADD COLUMN cupo_maximo INT DEFAULT 30,
  ADD COLUMN cupo_minimo INT DEFAULT 5,
  ADD COLUMN cupo_actual INT DEFAULT 0,
  ADD COLUMN estatus ENUM('ABIERTO', 'CERRADO', 'CANCELADO', 'EN_CURSO', 'FINALIZADO') DEFAULT 'ABIERTO';

-- Generar códigos para grupos existentes
UPDATE groups SET codigo = CONCAT('GRP-', LPAD(ROW_NUMBER() OVER (ORDER BY created_at), 6, '0'));

ALTER TABLE groups MODIFY COLUMN codigo VARCHAR(20) NOT NULL;

CREATE INDEX groups_codigo_idx ON groups(codigo);
CREATE INDEX groups_estatus_idx ON groups(estatus);
CREATE INDEX groups_subject_period_estatus_idx ON groups(subject_id, periodo_id, estatus);
```

**Validación:**
- Verificar que grupos existentes tienen códigos
- Probar creación de grupos con cupos
- Verificar que `cupoActual` se actualiza correctamente

---

#### 2.3 Mejoras a Enrollments
**Prioridad:** ALTA  
**Impacto:** Funcionalidad crítica

**Cambios:**
- Agregar `codigo`, `estatus`, `fechaBaja` a `Enrollment`
- Agregar calificaciones parciales
- Agregar asistencias

**Migración:**
```sql
ALTER TABLE enrollments
  ADD COLUMN codigo VARCHAR(30) NULL UNIQUE,
  ADD COLUMN fecha_inscripcion DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN fecha_baja DATETIME(3) NULL,
  ADD COLUMN tipo_inscripcion ENUM('NORMAL', 'ESPECIAL', 'REPETICION', 'EQUIVALENCIA') DEFAULT 'NORMAL',
  ADD COLUMN estatus ENUM('INSCRITO', 'EN_CURSO', 'BAJA', 'APROBADO', 'REPROBADO', 'CANCELADO') DEFAULT 'INSCRITO',
  ADD COLUMN calificacion_parcial1 DECIMAL(5,2) NULL,
  ADD COLUMN calificacion_parcial2 DECIMAL(5,2) NULL,
  ADD COLUMN calificacion_parcial3 DECIMAL(5,2) NULL,
  ADD COLUMN calificacion_final DECIMAL(5,2) NULL,
  ADD COLUMN calificacion_extra DECIMAL(5,2) NULL,
  ADD COLUMN asistencias INT DEFAULT 0,
  ADD COLUMN faltas INT DEFAULT 0,
  ADD COLUMN retardos INT DEFAULT 0,
  ADD COLUMN porcentaje_asistencia DECIMAL(5,2) NULL,
  ADD COLUMN aprobado BOOLEAN NULL,
  ADD COLUMN fecha_aprobacion DATETIME(3) NULL,
  ADD COLUMN observaciones TEXT NULL;

-- Generar códigos para inscripciones existentes
UPDATE enrollments SET codigo = CONCAT('ENR-', LPAD(ROW_NUMBER() OVER (ORDER BY created_at), 8, '0'));

ALTER TABLE enrollments MODIFY COLUMN codigo VARCHAR(30) NOT NULL;

CREATE INDEX enrollments_codigo_idx ON enrollments(codigo);
CREATE INDEX enrollments_estatus_idx ON enrollments(estatus);
CREATE INDEX enrollments_fecha_inscripcion_idx ON enrollments(fecha_inscripcion);
CREATE INDEX enrollments_fecha_baja_idx ON enrollments(fecha_baja);
CREATE INDEX enrollments_aprobado_idx ON enrollments(aprobado);
CREATE INDEX enrollments_student_estatus_idx ON enrollments(student_id, estatus);
CREATE INDEX enrollments_group_estatus_idx ON enrollments(group_id, estatus);
```

**Validación:**
- Verificar que inscripciones existentes tienen códigos
- Probar creación de inscripciones con nuevos campos
- Verificar que `calificacion` sigue funcionando

---

### FASE 3: Información Académica (Semana 5-6)

#### 3.1 Career (Normalización de Carreras)
**Prioridad:** MEDIA  
**Impacto:** Mejora en consistencia

**Cambios:**
- Crear tabla `careers`
- Agregar `carreraId` a `Student` y `Subject` (opcional, mantener `carrera` por compatibilidad)

**Migración:**
```sql
CREATE TABLE careers (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  nombre_corto VARCHAR(50) NULL,
  descripcion TEXT NULL,
  area VARCHAR(100) NULL,
  duracion INT NULL,
  creditos_totales INT NULL,
  estatus ENUM('ACTIVA', 'INACTIVA', 'DESCONTINUADA') DEFAULT 'ACTIVA',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE INDEX careers_codigo_idx ON careers(codigo);
CREATE INDEX careers_area_idx ON careers(area);
CREATE INDEX careers_estatus_idx ON careers(estatus);

-- Migrar carreras existentes
INSERT INTO careers (id, codigo, nombre, estatus)
SELECT DISTINCT 
  UUID() as id,
  UPPER(REPLACE(LEFT(carrera, 10), ' ', '')) as codigo,
  carrera as nombre,
  'ACTIVA' as estatus
FROM students
WHERE carrera IS NOT NULL AND carrera != '';

-- Agregar relación a students
ALTER TABLE students
  ADD COLUMN carrera_id VARCHAR(191) NULL,
  ADD CONSTRAINT students_carrera_id_fkey FOREIGN KEY (carrera_id) REFERENCES careers(id) ON DELETE SET NULL;

-- Actualizar relaciones
UPDATE students s
JOIN careers c ON s.carrera = c.nombre
SET s.carrera_id = c.id;

CREATE INDEX students_carrera_id_idx ON students(carrera_id);
```

**Validación:**
- Verificar que todas las carreras fueron migradas
- Probar consultas con `carreraId`
- Verificar que `carrera` sigue funcionando

---

#### 3.2 Mejoras a Subjects
**Prioridad:** MEDIA  
**Impacto:** Mejora en gestión de materias

**Cambios:**
- Agregar `tipo`, `areaAcademica`, `nivel`, `horas*`, `estatus` a `Subject`
- Crear tabla `prerequisites`

**Migración:**
```sql
ALTER TABLE subjects
  ADD COLUMN descripcion TEXT NULL,
  ADD COLUMN tipo ENUM('OBLIGATORIA', 'OPTATIVA', 'ELECTIVA', 'SERIACION') DEFAULT 'OBLIGATORIA',
  ADD COLUMN area_academica VARCHAR(100) NULL,
  ADD COLUMN nivel INT NULL,
  ADD COLUMN horas_teoria INT DEFAULT 0,
  ADD COLUMN horas_practica INT DEFAULT 0,
  ADD COLUMN horas_laboratorio INT DEFAULT 0,
  ADD COLUMN horas_total INT DEFAULT 0,
  ADD COLUMN grupos_activos INT DEFAULT 0,
  ADD COLUMN estudiantes_inscritos INT DEFAULT 0,
  ADD COLUMN estatus ENUM('ACTIVA', 'INACTIVA', 'DESCONTINUADA') DEFAULT 'ACTIVA',
  ADD COLUMN carrera_id VARCHAR(191) NULL,
  ADD CONSTRAINT subjects_carrera_id_fkey FOREIGN KEY (carrera_id) REFERENCES careers(id) ON DELETE SET NULL;

CREATE INDEX subjects_tipo_idx ON subjects(tipo);
CREATE INDEX subjects_area_academica_idx ON subjects(area_academica);
CREATE INDEX subjects_nivel_idx ON subjects(nivel);
CREATE INDEX subjects_estatus_idx ON subjects(estatus);
CREATE INDEX subjects_carrera_id_idx ON subjects(carrera_id);

-- Crear tabla de prerequisitos
CREATE TABLE prerequisites (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  subject_id VARCHAR(191) NOT NULL,
  prerequisite_id VARCHAR(191) NOT NULL,
  obligatorio BOOLEAN DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT prerequisites_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT prerequisites_prerequisite_id_fkey FOREIGN KEY (prerequisite_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  UNIQUE KEY prerequisites_subject_prerequisite_key (subject_id, prerequisite_id)
);

CREATE INDEX prerequisites_subject_id_idx ON prerequisites(subject_id);
CREATE INDEX prerequisites_prerequisite_id_idx ON prerequisites(prerequisite_id);
```

**Validación:**
- Verificar que materias existentes siguen funcionando
- Probar creación de prerequisitos
- Verificar que `horasTotal` se calcula correctamente

---

### FASE 4: Información Personal y Académica (Semana 7-8)

#### 4.1 Información Personal en Students
**Prioridad:** BAJA  
**Impacto:** Mejora en datos, no crítico

**Cambios:**
- Agregar campos personales a `Student`

**Migración:**
```sql
ALTER TABLE students
  ADD COLUMN fecha_nacimiento DATETIME(3) NULL,
  ADD COLUMN lugar_nacimiento VARCHAR(100) NULL,
  ADD COLUMN genero ENUM('MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR') NULL,
  ADD COLUMN nacionalidad VARCHAR(50) DEFAULT 'Mexicana',
  ADD COLUMN direccion TEXT NULL,
  ADD COLUMN promedio_general DECIMAL(5,2) NULL,
  ADD COLUMN creditos_aprobados INT DEFAULT 0,
  ADD COLUMN creditos_cursando INT DEFAULT 0,
  ADD COLUMN fecha_ingreso DATETIME(3) NULL,
  ADD COLUMN fecha_egreso DATETIME(3) NULL,
  ADD COLUMN tipo_ingreso ENUM('NUEVO_INGRESO', 'REINGRESO', 'TRANSFERENCIA') NULL,
  ADD COLUMN beca BOOLEAN DEFAULT FALSE,
  ADD COLUMN tipo_beca VARCHAR(50) NULL;

CREATE INDEX students_fecha_ingreso_idx ON students(fecha_ingreso);
CREATE INDEX students_fecha_egreso_idx ON students(fecha_egreso);
CREATE INDEX students_carrera_semestre_estatus_idx ON students(carrera_id, semestre, estatus);
```

**Validación:**
- Verificar que estudiantes existentes siguen funcionando
- Probar actualización de campos personales

---

#### 4.2 Información Académica en Teachers
**Prioridad:** BAJA  
**Impacto:** Mejora en datos, no crítico

**Cambios:**
- Agregar campos académicos y laborales a `Teacher`

**Migración:**
```sql
ALTER TABLE teachers
  ADD COLUMN fecha_nacimiento DATETIME(3) NULL,
  ADD COLUMN genero ENUM('MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR') NULL,
  ADD COLUMN telefono_emergencia VARCHAR(20) NULL,
  ADD COLUMN direccion TEXT NULL,
  ADD COLUMN grado_academico ENUM('LICENCIATURA', 'MAESTRIA', 'DOCTORADO', 'POSTDOCTORADO') NULL,
  ADD COLUMN especialidad VARCHAR(200) NULL,
  ADD COLUMN cedula_profesional VARCHAR(50) NULL UNIQUE,
  ADD COLUMN fecha_contratacion DATETIME(3) NULL,
  ADD COLUMN tipo_contrato ENUM('TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'HORAS_CLASE', 'CONSULTOR') NULL,
  ADD COLUMN estatus ENUM('ACTIVO', 'INACTIVO', 'JUBILADO', 'LICENCIA') DEFAULT 'ACTIVO',
  ADD COLUMN grupos_asignados INT DEFAULT 0,
  ADD COLUMN estudiantes_total INT DEFAULT 0;

CREATE INDEX teachers_cedula_profesional_idx ON teachers(cedula_profesional);
CREATE INDEX teachers_departamento_estatus_idx ON teachers(departamento, estatus);
```

**Validación:**
- Verificar que maestros existentes siguen funcionando
- Probar actualización de campos académicos

---

### FASE 5: Historial y Documentos (Semana 9-10)

#### 5.1 EnrollmentHistory
**Prioridad:** MEDIA  
**Impacto:** Auditoría y trazabilidad

**Cambios:**
- Crear tabla `enrollment_history`

**Migración:**
```sql
CREATE TABLE enrollment_history (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  enrollment_id VARCHAR(191) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  valor_anterior TEXT NULL,
  valor_nuevo TEXT NULL,
  observaciones TEXT NULL,
  realizado_por VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT enrollment_history_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);

CREATE INDEX enrollment_history_enrollment_id_idx ON enrollment_history(enrollment_id);
CREATE INDEX enrollment_history_accion_idx ON enrollment_history(accion);
CREATE INDEX enrollment_history_created_at_idx ON enrollment_history(created_at);
```

**Validación:**
- Probar creación de historial
- Verificar que se registran cambios

---

#### 5.2 AcademicHistory
**Prioridad:** MEDIA  
**Impacto:** Seguimiento académico

**Cambios:**
- Crear tabla `academic_history`

**Migración:**
```sql
CREATE TABLE academic_history (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  student_id VARCHAR(191) NOT NULL,
  periodo_id VARCHAR(191) NULL,
  promedio_periodo DECIMAL(5,2) NULL,
  creditos_aprobados INT DEFAULT 0,
  creditos_cursados INT DEFAULT 0,
  materias_aprobadas INT DEFAULT 0,
  materias_reprobadas INT DEFAULT 0,
  observaciones TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT academic_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT academic_history_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES academic_periods(id) ON DELETE SET NULL
);

CREATE INDEX academic_history_student_id_idx ON academic_history(student_id);
CREATE INDEX academic_history_periodo_id_idx ON academic_history(periodo_id);
CREATE INDEX academic_history_student_periodo_idx ON academic_history(student_id, periodo_id);
```

**Validación:**
- Probar creación de historial académico
- Verificar cálculos de promedios

---

#### 5.3 StudentDocument
**Prioridad:** BAJA  
**Impacto:** Gestión de documentos

**Cambios:**
- Crear tabla `student_documents`

**Migración:**
```sql
CREATE TABLE student_documents (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  student_id VARCHAR(191) NOT NULL,
  tipo ENUM('ACTA_NACIMIENTO', 'CURP', 'CERTIFICADO_BACHILLERATO', 'FOTOGRAFIA', 'COMPROBANTE_DOMICILIO', 'OTRO') NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NULL,
  tamano INT NULL,
  estatus ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'VENCIDO') DEFAULT 'PENDIENTE',
  observaciones TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT student_documents_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX student_documents_student_id_idx ON student_documents(student_id);
CREATE INDEX student_documents_tipo_idx ON student_documents(tipo);
CREATE INDEX student_documents_estatus_idx ON student_documents(estatus);
```

**Validación:**
- Probar creación de documentos
- Verificar gestión de archivos

---

## 🔄 Actualización de Código

### Servicios a Actualizar

1. **Students Service**
   - Actualizar DTOs con nuevos campos
   - Actualizar validaciones
   - Agregar lógica de cálculo de promedios

2. **Teachers Service**
   - Actualizar DTOs con nuevos campos
   - Actualizar validaciones
   - Agregar lógica de métricas

3. **Groups Service**
   - Actualizar lógica de cupos
   - Validar cupos al inscribir
   - Actualizar `cupoActual` automáticamente

4. **Enrollments Service**
   - Actualizar lógica de calificaciones parciales
   - Calcular promedio final
   - Registrar en historial

5. **Subjects Service**
   - Validar prerequisitos
   - Actualizar métricas

### Controllers a Actualizar

- Actualizar validaciones en todos los controllers
- Agregar filtros por nuevos campos
- Actualizar respuestas con nuevos datos

---

## ✅ Checklist de Validación por Fase

### Después de cada fase:

- [ ] Migración ejecutada sin errores
- [ ] Datos existentes siguen accesibles
- [ ] APIs existentes siguen funcionando
- [ ] Nuevos campos son opcionales inicialmente
- [ ] Índices creados correctamente
- [ ] Constraints funcionando
- [ ] Tests pasando (si existen)
- [ ] Frontend sigue funcionando

---

## 🚨 Rollback Plan

### Por cada fase:

1. **Backup de base de datos antes de migración**
2. **Documentar cambios realizados**
3. **Tener script de rollback listo**

### Ejemplo Rollback Fase 1.1:

```sql
-- Revertir campos de contacto
ALTER TABLE users 
  DROP COLUMN email,
  DROP COLUMN email_verified,
  DROP COLUMN telefono,
  DROP COLUMN last_login_at,
  DROP COLUMN login_attempts;

ALTER TABLE students
  DROP COLUMN email,
  DROP COLUMN telefono,
  DROP COLUMN telefono_emergencia;

ALTER TABLE teachers
  DROP COLUMN email,
  DROP COLUMN telefono;
```

---

## 📊 Métricas de Éxito

### Por fase:

- ✅ 0 errores en migración
- ✅ 100% de datos existentes accesibles
- ✅ 100% de APIs funcionando
- ✅ Tiempo de migración < 5 minutos
- ✅ Sin downtime (si es posible)

---

## 🎯 Próximos Pasos

1. **Revisar y aprobar plan**
2. **Crear branch para mejoras**
3. **Implementar Fase 1**
4. **Validar y probar**
5. **Continuar con siguientes fases**

---

**Nota:** Este plan es incremental y puede ajustarse según necesidades y prioridades del proyecto.

