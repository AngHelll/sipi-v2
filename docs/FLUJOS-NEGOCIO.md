# 📋 Flujos de Negocio - SIPI-V2

**Última actualización:** 2026-06-11

Este documento centraliza todos los flujos de negocio principales del sistema.

> **Canon inglés:** `/api/academic-activities/*`. Las rutas `/api/enrollments/english/*` respondieron **410 Gone** desde 2026-05-24.

---

## 🎓 Flujos Académicos

### Exámenes de Diagnóstico

#### Flujo de Solicitud (Estudiante)
1. Estudiante solicita examen: `POST /api/academic-activities/exams` body `{ "examType": "DIAGNOSTICO", "periodId"?: "..." }`
   - **Sin `periodId`** (primer diagnóstico): estatus **`LISTA_ESPERA`**, sin pago. El admin asigna período cuando publique uno (`PUT .../exams/:id/assign-period`).
   - **Con `periodId`**: inscripción al período → `PENDIENTE_PAGO` o `INSCRITO` según cobro del período.
   - **Segundo diagnóstico** (ya tiene examen `APROBADO`/`EVALUADO`): solo vía `periodId`; puede tener costo según el período.
2. Sistema crea `academic_activity` (tipo: EXAM) y `exam` (tipo: DIAGNOSTICO, `nivelIngles: null` hasta calificar).
3. Sistema registra en `activity_history`.
4. Si hay período asociado, incrementa `cupoActual`.
5. El **nivel de placement no se captura en la solicitud**; lo define `PUT .../exams/:id/result`.

#### Lista de espera (exámenes)
- Admin consulta demanda: `GET /api/academic-activities/exams/waitlist/summary`
- Admin asigna período: `PUT /api/academic-activities/exams/:id/assign-period` body `{ "periodId" }` → `PENDIENTE_PAGO` o `INSCRITO` según el período.

#### Cancelación de Solicitud
- Estudiante: `PUT /api/academic-activities/exams/:id/cancel` — solo sus propias solicitudes, en estados tempranos (`LISTA_ESPERA`, `PENDIENTE_PAGO`, `INSCRITO`) y sin resultado registrado.
- Admin: misma ruta, cualquier estado no terminal, con `motivo` requerido.
- Efectos: estatus → `CANCELADO`, y se **revierte el cupo** del período (`cupoActual - 1`).

#### Flujo de Procesamiento (Admin/Teacher)
1. Admin visualiza inscripciones: `GET /api/academic-activities/exams`
2. Admin procesa resultado: `PUT /api/academic-activities/exams/:id/result` (solo `INSCRITO`/`EN_CURSO`, pago aprobado si aplica, sin resultado previo)
3. Placement: si no se envía `nivelIngles`, se calcula por bandas de calificación; `nivelIngles: 0` con ≥70 coloca al alumno en nivel 6 sin cursos fantasma.
4. Sistema actualiza calificación y estatus (`APROBADO` ≥70, `EVALUADO` <70 — estados **terminales** para nuevas solicitudes)

#### Pago rechazado (examen)
- Admin: `PUT .../exams/:id/reject-payment` — deja `PENDIENTE_PAGO` con `pagoAprobado: false` y observaciones con el motivo.
- El alumno debe **cancelar** la solicitud y volver a inscribirse con comprobante correcto (o elegir otro período).

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
3. **Con `groupId`** (grupo publicado): valida que el grupo sea de inglés, del mismo nivel y con cupo → estatus `PENDIENTE_PAGO`. El alumno paga y el admin aprueba (`receive-and-approve-payment`), lo que activa la inscripción y consume cupo.
4. **Sin `groupId`** (no hay grupo publicado): la solicitud entra a **`LISTA_ESPERA`**, sin pago. No es una inscripción evaluable.
5. La política de pago la decide **el servidor**; el cliente no puede enviar `requierePago`.

#### Lista de Espera (Admin)
1. Admin consulta demanda: `GET /api/academic-activities/special-courses/waitlist/summary` — interesados por tipo de curso y nivel.
2. Si hay demanda suficiente, admin crea un grupo de inglés del nivel.
3. Admin asigna el grupo a cada solicitud: `PUT /api/academic-activities/special-courses/:id/assign-group` body `{ groupId, requierePago }`.
   - Con pago → `PENDIENTE_PAGO` (el cupo se consume al aprobar el pago).
   - Sin pago → `INSCRITO` directo (consume cupo de inmediato).

#### Calificación de Curso (Admin/Teacher)
1. `PUT /api/academic-activities/special-courses/:id/complete` — solo en `INSCRITO`/`EN_CURSO`, pago aprobado si aplica, sin calificación previa; no aplica a cursos acreditados por diagnóstico.
2. Al aprobar (≥70) un curso real de inglés, `nivelInglesActual` avanza al siguiente nivel (máx. 6).

#### Cancelación de Solicitud
- Estudiante: `PUT /api/academic-activities/special-courses/:id/cancel` — solo sus propias, en `LISTA_ESPERA`, `PENDIENTE_PAGO` o `INSCRITO`, sin calificación.
- Admin: misma ruta, cualquier estado no terminal, con `motivo` requerido.
- Efectos: estatus → `CANCELADO`; si estaba `INSCRITO` con grupo, se **revierte el cupo** del grupo.

#### Nivel Inicial / Equivalencia (Admin)
Para alumnos de transferencia que ya traen nivel de inglés acreditado:
1. Admin registra: `POST /api/academic-activities/special-courses/initial-level` body `{ studentId, nivel (1-6), calificacion (70-100) }`.
2. Sistema crea los registros canónicos de niveles acreditados (1..nivel-1) y posiciona al alumno en `nivel` (`nivelInglesActual`).
3. Solo se permite **una vez** y solo si el alumno no tiene nivel ni actividades de inglés activas. Después, el nivel se mueve únicamente por diagnóstico y cursos.
4. Los campos de inglés en `students` (`nivelInglesActual`, `promedioIngles`, `cumpleRequisitoIngles`, etc.) **nunca se editan a mano**: son derivados del flujo canónico.

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
