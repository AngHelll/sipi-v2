# Propuesta: Flujo Completo para Cursos de Inglés y Exámenes de Diagnóstico

## 📋 Estado Actual

### ✅ Lo que ya existe:
1. **Arquitectura V2 implementada**: `academic_activities`, `exams`, `special_courses`
2. **Endpoints de estudiantes**:
   - `POST /api/academic-activities/exams` - Solicitar examen de diagnóstico
   - `POST /api/academic-activities/special-courses` - Solicitar curso de inglés
3. **Validaciones básicas**: Nivel de inglés, duplicados, pagos

### ❌ Lo que falta:
1. **Sistema de ofertas**: No hay forma de que admins creen cursos/exámenes disponibles
2. **Períodos de inscripción**: No hay control de fechas de apertura/cierre
3. **Gestión de cupos**: No hay gestión centralizada de disponibilidad
4. **Catálogo visible**: Estudiantes no pueden ver cursos/exámenes disponibles
5. **Separación de responsabilidades**: No hay diferencia entre "crear oferta" (admin) y "inscribirse" (estudiante)

---

## 🎯 Objetivo

Crear un sistema completo donde:
1. **Admins** pueden crear y gestionar ofertas de cursos de inglés y períodos de exámenes
2. **Estudiantes** pueden ver ofertas disponibles e inscribirse
3. **Sistema** controla períodos de inscripción, cupos y disponibilidad
4. **Mantiene flexibilidad** para casos especiales (solicitud directa)

---

## 🏗️ Arquitectura Propuesta

### Opción 1: Tablas de Ofertas (Recomendada)

```
┌─────────────────────────┐
│  english_course_offers   │  ← Ofertas de cursos de inglés
│  - id                    │
│  - nivelIngles (1-6)     │
│  - teacherId             │
│  - groupId (opcional)    │
│  - cupoMaximo            │
│  - cupoActual            │
│  - fechaInicio           │
│  - fechaFin              │
│  - fechaInscripcionInicio│
│  - fechaInscripcionFin    │
│  - estatus (ABIERTO/CERRADO)│
│  - requierePago          │
│  - montoPago             │
│  - horario               │
│  - aula                  │
└─────────────────────────┘

┌─────────────────────────┐
│  diagnostic_exam_periods│  ← Períodos de exámenes
│  - id                    │
│  - nombre                │
│  - fechaInicio           │
│  - fechaFin              │
│  - fechaInscripcionInicio│
│  - fechaInscripcionFin   │
│  - cupoMaximo            │
│  - cupoActual            │
│  - estatus (ABIERTO/CERRADO)│
│  - requierePago         │
│  - montoPago             │
└─────────────────────────┘
```

**Ventajas:**
- ✅ Separación clara entre oferta y inscripción
- ✅ Control centralizado de períodos y cupos
- ✅ Fácil consulta de disponibilidad
- ✅ Historial de ofertas

**Desventajas:**
- ⚠️ Requiere nuevas tablas
- ⚠️ Más complejidad inicial

---

### Opción 2: Usar `groups` para Cursos de Inglés (Más Simple)

**Para cursos de inglés:**
- Usar tabla `groups` existente con `subjectId` de materia de inglés
- Agregar campos opcionales: `nivelIngles`, `fechaInscripcionInicio`, `fechaInscripcionFin`
- Los estudiantes se inscriben al grupo (que es la oferta)

**Para exámenes:**
- Crear tabla `diagnostic_exam_periods` (más simple que ofertas de cursos)

**Ventajas:**
- ✅ Reutiliza infraestructura existente
- ✅ Menos tablas nuevas
- ✅ Integración más fácil

**Desventajas:**
- ⚠️ Mezcla conceptos (grupos para materias regulares vs. cursos de inglés)
- ⚠️ Requiere modificar `groups` para campos específicos de inglés

---

## 🎯 Recomendación: Opción 2 (Híbrida)

### Justificación:
1. **Reutilización**: Aprovecha `groups` existente
2. **Simplicidad**: Menos tablas nuevas
3. **Flexibilidad**: Grupos pueden ser para materias regulares o inglés
4. **Escalabilidad**: Fácil agregar más campos si es necesario

---

## 📐 Diseño Detallado

### 1. Extender `groups` para Cursos de Inglés

```prisma
model groups {
  // ... campos existentes ...
  
  // Nuevos campos para cursos de inglés
  nivelIngles              Int?              // Nivel del curso (1-6) si es curso de inglés
  fechaInscripcionInicio  DateTime?         // Fecha de apertura de inscripciones
  fechaInscripcionFin     DateTime?         // Fecha de cierre de inscripciones
  esCursoIngles           Boolean           @default(false) // Flag para identificar cursos de inglés
  
  // ... relaciones existentes ...
}
```

**Lógica:**
- Si `esCursoIngles = true`, el grupo es una oferta de curso de inglés
- `nivelIngles` define el nivel del curso
- `fechaInscripcionInicio` y `fechaInscripcionFin` controlan el período de inscripción
- Los estudiantes se inscriben usando `special_courses` con `groupId` opcional

---

### 2. Nueva Tabla: `diagnostic_exam_periods`

```prisma
model diagnostic_exam_periods {
  id                      String    @id @default(uuid())
  nombre                  String    @db.VarChar(200) // Ej: "Examen Diagnóstico Enero 2025"
  descripcion             String?   @db.Text
  fechaInicio             DateTime  // Fecha de inicio del período de exámenes
  fechaFin                DateTime  // Fecha de fin del período de exámenes
  fechaInscripcionInicio  DateTime  // Fecha de apertura de inscripciones
  fechaInscripcionFin     DateTime  // Fecha de cierre de inscripciones
  cupoMaximo              Int       @default(100)
  cupoActual              Int       @default(0)
  estatus                 exam_period_status @default(PLANEADO)
  requierePago            Boolean   @default(false)
  montoPago               Decimal?  @db.Decimal(10, 2)
  observaciones           String?   @db.Text
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  deletedAt               DateTime?
  createdBy               String?
  updatedBy               String?
  
  // Relación con exámenes creados en este período
  exams                   exams[]  // Relación opcional para tracking
  
  @@index([estatus])
  @@index([fechaInscripcionInicio, fechaInscripcionFin])
  @@index([deletedAt])
}

enum exam_period_status {
  PLANEADO      // Período creado pero no abierto
  ABIERTO       // Inscripciones abiertas
  CERRADO       // Inscripciones cerradas
  EN_PROCESO    // Exámenes en curso
  FINALIZADO    // Período completado
}
```

---

## 🔄 Flujos de Negocio Propuestos

### Flujo 1: Admin Crea Oferta de Curso de Inglés

```
1. Admin crea grupo de inglés
   → POST /api/groups
   → {
       subjectId: "materia-ingles-id",
       teacherId: "teacher-id",
       nombre: "Inglés Nivel 3 - Grupo A",
       nivelIngles: 3,
       esCursoIngles: true,
       fechaInscripcionInicio: "2025-02-01",
       fechaInscripcionFin: "2025-02-15",
       cupoMaximo: 25,
       horario: "Lunes y Miércoles 10:00-12:00",
       aula: "A-101"
     }
   → Crea grupo con estatus: ABIERTO

2. Sistema valida:
   - Materia existe
   - Maestro existe
   - Fechas válidas
   - Cupo válido

3. Grupo aparece en catálogo de cursos disponibles
```

---

### Flujo 2: Estudiante Ve Cursos Disponibles e Inscribe

```
1. Estudiante consulta cursos disponibles
   → GET /api/academic-activities/special-courses/available
   → Filtra grupos con:
     - esCursoIngles = true
     - estatus = ABIERTO
     - fechaInscripcionInicio <= hoy <= fechaInscripcionFin
     - cupoActual < cupoMaximo

2. Estudiante selecciona curso
   → POST /api/academic-activities/special-courses
   → {
       courseType: "INGLES",
       nivelIngles: 3,
       groupId: "grupo-id",  // ← Ahora puede venir de oferta
       requierePago: true
     }

3. Sistema valida:
   - Curso disponible (fechas, cupo)
   - Nivel apropiado (>= nivelInglesActual)
   - No duplicado

4. Crea academic_activity + special_course
   → Estatus: PENDIENTE_PAGO
   → Incrementa cupoActual del grupo (si requierePago = false)
```

---

### Flujo 3: Admin Abre Período de Exámenes de Diagnóstico

```
1. Admin crea período de exámenes
   → POST /api/academic-activities/exams/periods
   → {
       nombre: "Examen Diagnóstico Enero 2025",
       fechaInicio: "2025-01-15",
       fechaFin: "2025-01-30",
       fechaInscripcionInicio: "2025-01-01",
       fechaInscripcionFin: "2025-01-10",
       cupoMaximo: 100,
       requierePago: false
     }
   → Estatus: PLANEADO

2. Admin abre período
   → PUT /api/academic-activities/exams/periods/:id/open
   → Estatus: ABIERTO

3. Período aparece en catálogo de exámenes disponibles
```

---

### Flujo 4: Estudiante Ve Exámenes Disponibles e Inscribe

```
1. Estudiante consulta períodos disponibles
   → GET /api/academic-activities/exams/periods/available
   → Filtra períodos con:
     - estatus = ABIERTO
     - fechaInscripcionInicio <= hoy <= fechaInscripcionFin
     - cupoActual < cupoMaximo

2. Estudiante selecciona período
   → POST /api/academic-activities/exams
   → {
       examType: "DIAGNOSTICO",
       periodId: "period-id",  // ← Nuevo campo opcional
       nivelIngles: null  // Se determina después
     }

3. Sistema valida:
   - Período disponible
   - Cupo disponible
   - No duplicado (estudiante no tiene examen pendiente)

4. Crea academic_activity + exam
   → Estatus: INSCRITO
   → Incrementa cupoActual del período
```

---

## 📊 Endpoints Propuestos

### Para Cursos de Inglés

#### Admin
- `POST /api/groups` - Crear grupo (extendido para inglés)
- `PUT /api/groups/:id` - Actualizar grupo
- `GET /api/groups?esCursoIngles=true` - Listar cursos de inglés
- `PUT /api/groups/:id/open-registration` - Abrir inscripciones
- `PUT /api/groups/:id/close-registration` - Cerrar inscripciones

#### Estudiante
- `GET /api/academic-activities/special-courses/available` - Ver cursos disponibles
- `POST /api/academic-activities/special-courses` - Inscribirse (con o sin groupId)

---

### Para Exámenes de Diagnóstico

#### Admin
- `POST /api/academic-activities/exams/periods` - Crear período
- `GET /api/academic-activities/exams/periods` - Listar períodos
- `PUT /api/academic-activities/exams/periods/:id` - Actualizar período
- `PUT /api/academic-activities/exams/periods/:id/open` - Abrir período
- `PUT /api/academic-activities/exams/periods/:id/close` - Cerrar período
- `GET /api/academic-activities/exams/periods/:id/inscriptions` - Ver inscripciones

#### Estudiante
- `GET /api/academic-activities/exams/periods/available` - Ver períodos disponibles
- `POST /api/academic-activities/exams` - Inscribirse (con o sin periodId)

---

## 🔧 Cambios Técnicos Necesarios

### Backend

1. **Schema Prisma**:
   - Agregar campos a `groups` (nivelIngles, fechaInscripcionInicio, fechaInscripcionFin, esCursoIngles)
   - Crear tabla `diagnostic_exam_periods`
   - Agregar `periodId` opcional a `exams`

2. **Servicios**:
   - `groups.service.ts`: Lógica para cursos de inglés
   - `exams.service.ts`: Nuevos métodos para períodos
   - `special-courses.service.ts`: Validar disponibilidad de grupos

3. **Validadores**:
   - Validar fechas de inscripción
   - Validar cupos disponibles
   - Validar períodos abiertos

4. **Controllers**:
   - Nuevos endpoints para períodos de exámenes
   - Endpoints para listar ofertas disponibles

---

### Frontend

1. **Páginas Admin**:
   - `CreateEnglishCoursePage.tsx` - Crear oferta de curso
   - `ManageExamPeriodsPage.tsx` - Gestionar períodos de exámenes
   - `EnglishCoursesListPage.tsx` - Listar cursos de inglés

2. **Páginas Estudiante**:
   - `AvailableEnglishCoursesPage.tsx` - Ver cursos disponibles
   - `AvailableExamsPage.tsx` - Ver exámenes disponibles
   - Actualizar `RequestEnglishCoursePage.tsx` - Mostrar ofertas disponibles

3. **Componentes**:
   - `EnglishCourseCard.tsx` - Tarjeta de curso disponible
   - `ExamPeriodCard.tsx` - Tarjeta de período disponible
   - `RegistrationPeriodBadge.tsx` - Badge de estado de inscripción

---

## 🎨 Mejoras de UX

1. **Catálogo Visual**: Grid de tarjetas con cursos/exámenes disponibles
2. **Filtros**: Por nivel, horario, fecha, maestro
3. **Búsqueda**: Buscar por nombre, código, maestro
4. **Estados Visuales**: Badges para "Disponible", "Lleno", "Cerrado"
5. **Calendario**: Vista de calendario para períodos de inscripción

---

## 📋 Plan de Implementación

### Fase 1: Base de Datos (1-2 días)
- [ ] Migración: Agregar campos a `groups`
- [ ] Migración: Crear `diagnostic_exam_periods`
- [ ] Migración: Agregar `periodId` a `exams`
- [ ] Regenerar Prisma Client

### Fase 2: Backend - Cursos de Inglés (2-3 días)
- [ ] Actualizar `groups.service.ts` para cursos de inglés
- [ ] Crear endpoints de gestión de cursos
- [ ] Crear endpoint `GET /available` para estudiantes
- [ ] Validadores de disponibilidad

### Fase 3: Backend - Exámenes (2-3 días)
- [ ] Crear `exams-periods.service.ts`
- [ ] Crear endpoints de gestión de períodos
- [ ] Crear endpoint `GET /periods/available` para estudiantes
- [ ] Actualizar `exams.service.ts` para usar períodos

### Fase 4: Frontend - Admin (3-4 días)
- [ ] Página de creación de cursos de inglés
- [ ] Página de gestión de períodos de exámenes
- [ ] Lista de cursos de inglés
- [ ] Formularios con validación

### Fase 5: Frontend - Estudiante (3-4 días)
- [ ] Catálogo de cursos disponibles
- [ ] Catálogo de exámenes disponibles
- [ ] Actualizar flujo de inscripción
- [ ] Mejoras de UX (filtros, búsqueda, badges)

### Fase 6: Testing y Ajustes (2-3 días)
- [ ] Pruebas de integración
- [ ] Pruebas de flujos completos
- [ ] Ajustes de UX
- [ ] Documentación

**Total estimado: 13-19 días**

---

## 💡 Consideraciones Adicionales

1. **Compatibilidad hacia atrás**: Mantener capacidad de solicitud directa (sin oferta)
2. **Notificaciones**: Notificar a estudiantes cuando se abren nuevos períodos
3. **Reportes**: Reportes de inscripciones por período/curso
4. **Límites**: Límite de inscripciones por estudiante por período

---

## ❓ Preguntas para Discutir

1. ¿Mantenemos la capacidad de solicitud directa (sin oferta)?
2. ¿Los cursos de inglés siempre requieren grupo o pueden ser sin grupo?
3. ¿Necesitamos notificaciones automáticas?
4. ¿Qué información adicional necesitan los estudiantes en el catálogo?
5. ¿Necesitamos límites de inscripción por estudiante?

---

## ✅ Próximos Pasos

1. **Revisar y aprobar** esta propuesta
2. **Definir prioridades** (¿empezar con cursos o exámenes?)
3. **Crear migraciones** de base de datos
4. **Implementar backend** (servicios y endpoints)
5. **Implementar frontend** (páginas y componentes)
6. **Testing y ajustes**


