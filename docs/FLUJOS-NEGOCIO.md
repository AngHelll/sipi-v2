# 📋 Flujos de Negocio - SIPI-V2

**Última actualización:** 2025-01-23

Este documento centraliza todos los flujos de negocio principales del sistema.

---

## 🎓 Flujos Académicos

### Exámenes de Diagnóstico

#### Flujo de Solicitud (Estudiante)
1. Estudiante solicita examen: `POST /api/academic-activities/exams`
2. Sistema crea `academic_activity` (tipo: EXAM, estatus: INSCRITO)
3. Sistema crea `exam` (tipo: DIAGNOSTICO)
4. Sistema registra en `activity_history`
5. Si hay período asociado, incrementa `cupoActual`

#### Flujo de Procesamiento (Admin/Teacher)
1. Admin visualiza inscripciones: `GET /api/academic-activities/exams`
2. Admin procesa resultado: `PUT /api/academic-activities/exams/:id/result`
3. Sistema actualiza calificación y estatus
4. Sistema asigna nivel de inglés al estudiante si aplica

### Períodos de Exámenes

#### Apertura de Períodos
1. Admin crea período: `POST /api/academic-activities/exam-periods`
   - Estado inicial: `PLANEADO`
2. Admin abre período: `PUT /api/academic-activities/exam-periods/:id/abrir`
   - Cambia estado a `ABIERTO`
   - Valida fechas de inscripción
3. Estudiantes pueden inscribirse durante período abierto
4. Sistema valida cupos y fechas automáticamente

### Cursos de Inglés

#### Solicitud de Curso (Estudiante)
1. Estudiante solicita curso: `POST /api/academic-activities/special-courses`
2. Sistema valida nivel de inglés y requisitos
3. Sistema crea `academic_activity` y `special_course`
4. Si requiere pago, crea registro de pago pendiente
5. Admin aprueba pago y activa curso

---

## 📝 Flujos de Inscripciones

### Inscripción Regular
1. Admin/Estudiante crea inscripción: `POST /api/enrollments`
2. Sistema valida cupos disponibles
3. Sistema actualiza `cupoActual` del grupo
4. Sistema crea registro en `enrollment_history`

### Gestión de Calificaciones
1. Teacher actualiza calificaciones: `PUT /api/enrollments/:id`
2. Sistema calcula promedio automáticamente
3. Sistema actualiza estatus (APROBADO/REPROBADO)
4. Sistema registra en `enrollment_history`

---

## 🔐 Flujos de Autenticación

### Login
1. Usuario envía credenciales: `POST /api/auth/login`
2. Sistema valida credenciales
3. Sistema genera JWT y lo envía en cookie HTTP-only
4. Sistema registra último acceso

### Logout
1. Usuario solicita logout: `POST /api/auth/logout`
2. Sistema invalida cookie
3. Sistema registra cierre de sesión

---

## 📊 Flujos de Reportes

### Exportación de Datos
1. Usuario aplica filtros en listado
2. Usuario solicita exportación: `GET /api/export/{entidad}`
3. Sistema genera Excel con filtros aplicados
4. Sistema descarga archivo

---

**Para detalles técnicos de implementación, consultar:**
- [docs/architecture/](architecture/) - Arquitectura del sistema
- [docs/development/](development/) - Guías de desarrollo
