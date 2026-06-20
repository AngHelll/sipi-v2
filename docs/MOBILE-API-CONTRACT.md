# Contrato API móvil — SIPI (iOS hoy, Android después)

Contrato compartido entre el backend `sipi-v2` y los clientes móviles (`sipi-mobile-ios` y la futura app Android). Define qué endpoints son canónicos, cuáles son legacy y cómo debe consumirse el flujo de inglés (producto principal: requisito del 70%).

- **Base URL producción**: `https://sipi.ak-solutions.app`
- **Prefijo API**: `/api` (excepto `GET /health`)
- **Auth**: cookie HTTP-only `token` (JWT). `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Un `401` en cualquier endpoint invalida la sesión local.
- **Sesión**: cookie con `httpOnly`, `secure` (producción) y `sameSite: strict`. El cliente debe enviar cookies en cada request (`URLSession` / equivalente con almacenamiento de cookies del sistema).

---

## 1. Regla de oro: inglés se consume desde academic-activities

La API canónica del proceso de inglés es **`/api/academic-activities/*`**. Los clientes móviles NO deben derivar el estado de inglés desde `/api/enrollments/*`.

### Deprecaciones vigentes

| Qué | Estado | Acción del cliente |
|-----|--------|--------------------|
| `/api/enrollments/english/*` (todas las rutas) | **410 Gone** | No llamar. Respuesta incluye `replacement: /api/academic-activities` |
| Campos RB-038 en `enrollments` (`esExamenDiagnostico`, `requierePago`, `pagoAprobado`, `montoPago`, `comprobantePago`, `fechaPagoAprobado`) | **Eliminados de los DTOs** | Quitar del modelo `Enrollment` móvil; nunca usarlos para estatus de inglés |
| Filas legacy de inglés en `enrollments` (`tipoInscripcion: EXAMEN_DIAGNOSTICO / CURSO_INGLES`) | **Filtradas de todos los listados** (`/me`, `/`, `/group/:id`) | El alumno ya no verá inglés legacy en sus inscripciones; el flujo vivo está en academic-activities |

Nota de impacto iOS: la sección "Inglés / pagos" de `EnrollmentDetailView` y los campos de inglés en `EnrollmentsModels.swift` quedan obsoletos. La información de inglés del alumno debe venir de `english-status` (sección 2).

---

## 2. Flujo de inglés — rol STUDENT

### 2.1 Estatus de inglés (pantalla principal "Inglés")

```
GET /api/academic-activities/exams/student/english-status
```

Respuesta (campos principales):

```json
{
  "student": { "id": "...", "matricula": "...", "nombre": "..." },
  "nivelInglesActual": 3,
  "nivelInglesCertificado": 3,
  "porcentajeIngles": 75.5,
  "promedioIngles": 80.0,
  "cumpleRequisitoIngles": false,
  "fechaExamenDiagnostico": "2026-05-25T...",
  "diagnosticExams": [ { "id", "codigo", "estatus", "calificacion", "nivelIngles", "period", "requierePago", "pagoAprobado", "montoPago", "observaciones" } ],
  "englishCourses": [ { "id", "codigo", "estatus", "nivelIngles", "calificacion", "aprobado", "group" } ],
  "completedLevels": [1, 2, 3],
  "missingLevels": [4, 5, 6],
  "pendingExam": { "id", "codigo", "estatus", "period", "requierePago", "pagoAprobado", "montoPago", "observaciones" },
  "progress": { "totalLevels": 6, "completed": 3, "percentage": 50 },
  "requirementDetails": { "razonNoCumple": "..." }
}
```

Este endpoint es la fuente de verdad del requisito 70% (`cumpleRequisitoIngles`, `progress`).

### 2.2 Examen diagnóstico

| Acción | Endpoint | Rol |
|--------|----------|-----|
| Ver períodos disponibles | `GET /api/academic-activities/exam-periods/available` | STUDENT |
| Solicitar examen (primer diagnóstico, sin período) | `POST /api/academic-activities/exams` body `{ "examType": "DIAGNOSTICO" }` → `LISTA_ESPERA` | STUDENT |
| Solicitar examen (con período) | `POST /api/academic-activities/exams` body `{ "examType": "DIAGNOSTICO", "periodId": "..." }` | STUDENT |
| Ver mis exámenes | `GET /api/academic-activities/exams/student` | STUDENT |
| Cancelar solicitud | `PUT /api/academic-activities/exams/:id/cancel` | STUDENT (propias, sin resultado) / ADMIN (`motivo` requerido) |
| Demanda lista de espera exámenes | `GET /api/academic-activities/exams/waitlist/summary` | ADMIN |
| Asignar período desde lista de espera | `PUT /api/academic-activities/exams/:id/assign-period` body `{ "periodId" }` | ADMIN |

Reglas de contrato (exámenes, 2026-06-11; asignación admin actualizada 2026-06-15):

- **`assign-period` (ADMIN, lista de espera)**: la solicitud debe estar en `LISTA_ESPERA`, **sin** `periodId` previo. El período destino debe estar `ABIERTO` con cupo disponible. **No** se exige que la ventana pública de inscripciones esté activa (el admin puede asignar fuera de fechas de inscripción alumno).

- **`nivelIngles` ya no se acepta** en `POST .../exams`: el placement lo define el admin/maestro al procesar el resultado.
- **Primer diagnóstico sin `periodId`** → `LISTA_ESPERA` (gratuito, sin cupo de período hasta asignar).
- **Segundo diagnóstico** (examen previo `APROBADO`/`EVALUADO`): solo con `periodId`; el período puede requerir pago.
- **`APROBADO`/`EVALUADO` son terminales**: no bloquean una nueva solicitud si no hay otra activa; el retake es solo vía período.
- **`LISTA_ESPERA`** en exámenes: mostrar como lista de espera (no inscripción activa); incluido en `pendingExam` de `english-status`.
- **Pago rechazado**: `pagoAprobado: false` en `PENDIENTE_PAGO`; el alumno cancela y vuelve a solicitar.

Estados de pago del examen: `PENDIENTE_PAGO` → (admin aprueba) → inscripción activa → examen → `APROBADO`/`EVALUADO`. El pago se entrega físicamente; el admin lo registra con `receive-and-approve-payment`. La cancelación revierte el cupo del período si aplica.

### 2.3 Curso de inglés (niveles 1–6)

| Acción | Endpoint | Rol |
|--------|----------|-----|
| Ver grupos de inglés disponibles | `GET /api/groups/available/english-courses` | STUDENT |
| Solicitar curso (grupo publicado) | `POST /api/academic-activities/special-courses` body `{ "courseType": "INGLES", "nivelIngles": N, "groupId": "..." }` | STUDENT |
| Unirse a lista de espera (sin grupo) | `POST /api/academic-activities/special-courses` body `{ "courseType": "INGLES", "nivelIngles": N }` (sin `groupId`) | STUDENT |
| Cancelar solicitud | `PUT /api/academic-activities/special-courses/:id/cancel` | STUDENT (propias, sin calificación) / ADMIN (`motivo` requerido) |
| Demanda de lista de espera | `GET /api/academic-activities/special-courses/waitlist/summary` | ADMIN |
| Asignar grupo desde lista de espera | `PUT /api/academic-activities/special-courses/:id/assign-group` body `{ "groupId", "requierePago" }` | ADMIN |
| Registrar nivel inicial (equivalencia) | `POST /api/academic-activities/special-courses/initial-level` body `{ "studentId", "nivel", "calificacion" }` | ADMIN |

Reglas de contrato (cursos, 2026-06-11; asignación admin 2026-06-15):

- **`assign-group` (ADMIN, lista de espera)**: la solicitud debe estar en `LISTA_ESPERA`. El grupo debe coincidir en tipo/nivel de inglés, no estar `CERRADO`/`CANCELADO`/`FINALIZADO`, y tener cupo. Para listar opciones de grupo en admin usar `GET /api/groups` (con filtros); **no** usar `GET /api/groups/available/english-courses` (ese endpoint es para el alumno al solicitar curso).
- **`requierePago` ya no se acepta** en el body de `POST .../special-courses`: la política de pago la decide el servidor (con grupo → `PENDIENTE_PAGO`; sin grupo → `LISTA_ESPERA` sin pago).
- **Los grupos de inglés siempre traen `nivelIngles` (1-6)** (2026-06-20): el backend exige el nivel al crear/editar un grupo con `esCursoIngles=true`, por lo que los clientes pueden filtrar `GET /api/groups/available/english-courses` por nivel sin descartar grupos por nivel ausente.
- **Regla canónica de "grupo disponible"** (2026-06-20): un grupo aparece en `GET /api/groups/available/english-courses` **si y solo si** cumple TODO: `esCursoIngles=true`, `estatus = ABIERTO` (no `EN_CURSO`/`CERRADO`/`CANCELADO`/`FINALIZADO`), ventana de inscripción vigente (`fechaInscripcionInicio ≤ ahora ≤ fechaInscripcionFin`, o sin fechas) y cupo libre (`cupoActual < cupoMaximo`). El `POST .../special-courses` aplica **exactamente la misma regla**: lo que se lista es lo que se puede solicitar. Si el grupo dejó de estar disponible entre el listado y el envío, el POST responde **`400`** con `error` explicando el motivo (estatus, ventana cerrada o sin cupo) — el cliente debe refrescar el listado, **no** reintentar a ciegas.
- Nuevo estatus de actividad: **`LISTA_ESPERA`** — solicitud de curso sin grupo publicado. Los clientes deben mostrarlo como "en lista de espera" (no como inscripción activa) y permitir cancelarla.
- El avance del curso (calificación, aprobado) se refleja en `english-status.englishCourses`.

---

## 3. Endpoints genéricos (ya consumidos por la app iOS)

Sin cambios de contrato, con la semántica post-limpieza:

| Endpoint | Notas |
|----------|-------|
| `GET /health` | Health check (sin `/api`) |
| `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | Sin cambios |
| `GET /api/students/me` | Incluye perfil de inglés del alumno (`nivelInglesActual`, `porcentajeIngles`, `cumpleRequisitoIngles`, `promedioIngles`) — útil para badges, pero la pantalla de inglés debe usar `english-status` |
| `GET /api/enrollments/me` | Solo inscripciones de materias regulares (inglés legacy filtrado) |
| `GET /api/enrollments/:id` | Resuelve también actividades V2 (cursos de inglés con grupo) por id de actividad |
| `GET /api/enrollments/group/:groupId` | Fusiona inscripciones regulares + cursos de inglés V2 del grupo; campos `isSpecialCourse`, `courseType`, `nivelIngles` |
| `GET /api/groups` (+ `periodo`, `esCursoIngles`) | Sin cambios |
| `GET /api/students`, `/api/teachers`, `/api/subjects` | Directorio admin, sin cambios |
| `GET /api/careers` | **Nuevo** — catálogo de carreras (ADMIN/TEACHER). Para filtros por carrera con UTF-8 correcto |
| `GET /api/search` | Sin cambios |

---

## 4. Mapa pantalla → endpoint sugerido (pestaña "Inglés" móvil, rol alumno)

| Pantalla | Endpoints |
|----------|-----------|
| Estatus 70% (progreso, niveles, requisito) | `GET .../exams/student/english-status` |
| Solicitar examen diagnóstico | `GET .../exam-periods/available` + `POST .../exams` |
| Solicitar curso de inglés / lista de espera | `GET /api/groups/available/english-courses` + `POST .../special-courses` |
| Cancelar solicitud (examen o curso) | `PUT .../exams/:id/cancel` / `PUT .../special-courses/:id/cancel` |
| Pagos pendientes (informativo) | `english-status.pendingExam` / `diagnosticExams[].estatus` |

Roles TEACHER/ADMIN en móvil (futuro): listados `GET .../exams`, `GET .../special-courses`, aprobación de pagos (`receive-and-approve-payment`, `reject-payment`) y captura de resultados (`PUT .../exams/:id/result`, `PUT .../special-courses/:id/complete`).

---

## 5. Límites de tasa (rate limiting) y comportamiento del cliente

Desde 2026-06-15 el backend aplica límites por IP (detrás de Cloudflare Tunnel / reverse proxy). Los clientes móviles deben tratarlos como parte del contrato, no como error transitorio a reintentar en bucle.

### Límites vigentes (producción)

| Ámbito | Ventana | Máximo | Notas |
|--------|---------|--------|-------|
| `POST /api/auth/login` | 15 min | 5 intentos fallidos | Los logins exitosos **no** cuentan (`skipSuccessfulRequests`) |
| Resto de `/api/*` | 15 min | 400 requests | Incluye navegación con muchas pantallas o paginación |
| Desarrollo | 15 min | 500 requests / 20 logins | Solo si el cliente apunta a un backend local |

`GET /health` queda **fuera** del limitador general.

### Respuesta `429 Too Many Requests`

Cuerpo JSON típico:

```json
{ "error": "Demasiadas solicitudes. Por favor intenta de nuevo más tarde." }
```

Login bloqueado:

```json
{ "error": "Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos." }
```

Headers estándar `RateLimit-*` (p. ej. `RateLimit-Remaining`, `RateLimit-Reset`) informan cuota restante.

### Obligaciones del cliente móvil

1. **No reintentar automáticamente** un `429` (a diferencia de errores de red o `5xx`). Mostrar mensaje al usuario y esperar al reset del límite o a una acción explícita.
2. **Evitar ráfagas** al abrir pestañas o listas: no disparar en paralelo decenas de `GET` idénticos al montar varias pantallas.
3. **Caché en memoria** (recomendado, alineado con la web):
   - `GET .../exams/student/english-status` — TTL ~20 s entre navegaciones; **invalidar y volver a pedir** tras crear/cancelar examen o curso.
   - Catálogos estables (`GET /api/careers`, listas de períodos derivadas de `GET /api/groups` paginado) — TTL ~5 min o invalidar tras mutaciones admin.
4. **Paginación**: preferir `page` + `limit` del servidor en lugar de recorrer todas las páginas en cada apertura de filtro (patrón que disparaba 429 en web admin).
5. **`401`**: limpiar sesión local y redirigir a login (sin reintentos con la misma cookie).

No hay endpoints nuevos por esta optimización: es política de consumo sobre los mismos contratos de las secciones 2–3.

---

## 6. Versionado y compatibilidad

- Cambios incompatibles en endpoints canónicos se anunciarán en este documento antes de desplegarse.
- Las rutas retiradas responden `410 Gone` con `{ error, message, replacement, docs }` — los clientes deben tratar 410 como "actualiza la integración", no como error transitorio.
- Fuente de verdad del producto: `docs/PRODUCTO.md`. Flujos de negocio: `docs/FLUJOS-NEGOCIO.md`.

**Última actualización**: 2026-06-20 (grupos de inglés siempre con `nivelIngles`; regla canónica de "grupo disponible" compartida entre listado y solicitud; contrato aplicable a iOS y Android)
