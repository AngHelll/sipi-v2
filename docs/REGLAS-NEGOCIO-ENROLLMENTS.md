# Reglas de Negocio - Edición de Inscripciones

## 📋 Índice
1. [Validaciones de Integridad](#validaciones-de-integridad)
2. [Reglas de Capacidad](#reglas-de-capacidad)
3. [Reglas de Calificaciones](#reglas-de-calificaciones)
4. [Reglas de Asistencia](#reglas-de-asistencia)
5. [Reglas de Estado](#reglas-de-estado)
6. [Reglas de Transición](#reglas-de-transición)
7. [Reglas de Edición](#reglas-de-edición)
8. [Validaciones de Consistencia](#validaciones-de-consistencia)

---

## 1. Validaciones de Integridad

### 1.1 Estudiante y Grupo
- ✅ **RB-001**: El estudiante debe existir y estar activo
  - No se puede inscribir un estudiante con estatus `INACTIVO` o `EGRESADO`
  - Validar que el estudiante no esté eliminado (soft delete)

- ✅ **RB-002**: El grupo debe existir y estar disponible
  - No se puede inscribir en grupos con estatus `CERRADO`, `CANCELADO` o `FINALIZADO`
  - Solo grupos con estatus `ABIERTO` o `EN_CURSO` permiten nuevas inscripciones

- ✅ **RB-003**: Prevenir duplicados
  - No se puede inscribir el mismo estudiante dos veces en el mismo grupo
  - Al editar, si se cambia `studentId` o `groupId`, validar que no exista otra inscripción con esa combinación

### 1.2 Compatibilidad Académica
- ✅ **RB-004**: Validar carrera del estudiante vs materia del grupo
  - Si la materia tiene `carreraId`, el estudiante debe pertenecer a esa carrera
  - Permitir excepciones para materias optativas/electivas (sin `carreraId`)

- ✅ **RB-005**: Validar semestre del estudiante vs nivel de la materia
  - El estudiante debe estar en un semestre igual o superior al nivel de la materia
  - Permitir excepciones para materias de nivel superior con autorización especial

---

## 2. Reglas de Capacidad

### 2.1 Validación de Cupos
- ✅ **RB-006**: Validar capacidad al crear nueva inscripción
  - `cupoActual < cupoMaximo` antes de crear
  - Mostrar advertencia si `cupoActual >= cupoMaximo * 0.9` (90% de capacidad)

- ✅ **RB-007**: Validar capacidad al cambiar grupo
  - Si se edita `groupId` y se cambia a otro grupo, validar capacidad del nuevo grupo
  - No validar capacidad si solo se editan otros campos (calificaciones, asistencia, etc.)

- ✅ **RB-008**: Actualizar cupo al cambiar grupo
  - Si se cambia `groupId`, decrementar `cupoActual` del grupo anterior
  - Incrementar `cupoActual` del nuevo grupo
  - Validar que el nuevo grupo tenga capacidad disponible

### 2.2 Cupo Mínimo
- ⚠️ **RB-009**: Advertencia de cupo mínimo
  - Si `cupoActual < cupoMinimo`, mostrar advertencia pero permitir la operación
  - El grupo puede continuar con menos estudiantes del mínimo requerido

---

## 3. Reglas de Calificaciones

### 3.1 Validación de Rangos
- ✅ **RB-010**: Calificaciones entre 0 y 100
  - Todas las calificaciones (parciales, final, extra) deben estar en rango [0, 100]
  - Máximo 2 decimales

- ✅ **RB-011**: Calificación final automática
  - Si se ingresan las 3 parciales, calcular automáticamente el promedio
  - Permitir sobrescribir manualmente la calificación final
  - Si se modifica la final manualmente, no recalcular automáticamente

### 3.2 Consistencia de Calificaciones
- ✅ **RB-012**: Validar lógica de calificaciones parciales
  - Si hay `calificacionFinal`, debe ser coherente con las parciales
  - Advertencia si la final difiere significativamente del promedio de parciales (>5 puntos)

- ✅ **RB-013**: Calificación extra
  - Solo permitir `calificacionExtra` si hay `calificacionFinal`
  - La calificación extra no puede exceder 10 puntos adicionales

### 3.3 Aprobación
- ✅ **RB-014**: Lógica de aprobación
  - Si `calificacionFinal >= 70`, sugerir `aprobado = true`
  - Si `calificacionFinal < 70`, sugerir `aprobado = false`
  - Permitir sobrescribir manualmente

- ✅ **RB-015**: Fecha de aprobación
  - Si `aprobado = true`, requerir `fechaAprobacion`
  - Si `aprobado = false`, limpiar `fechaAprobacion`
  - `fechaAprobacion` no puede ser anterior a `fechaInscripcion`

---

## 4. Reglas de Asistencia

### 4.1 Cálculo Automático
- ✅ **RB-016**: Porcentaje de asistencia automático
  - Calcular: `porcentajeAsistencia = (asistencias / (asistencias + faltas)) * 100`
  - Recalcular automáticamente cuando cambien `asistencias` o `faltas`
  - Si `asistencias + faltas = 0`, `porcentajeAsistencia = null`

### 4.2 Validación de Asistencia
- ✅ **RB-017**: Asistencias y faltas no negativas
  - `asistencias >= 0`
  - `faltas >= 0`
  - `retardos >= 0`

- ✅ **RB-018**: Límite de faltas
  - Advertencia si `porcentajeAsistencia < 80%` (requisito típico para aprobar)
  - Bloquear aprobación si `porcentajeAsistencia < 60%` (a menos que sea excepción especial)

---

## 5. Reglas de Estado

### 5.1 Estados Válidos
- ✅ **RB-019**: Estados permitidos según contexto
  - `INSCRITO`: Solo al crear o al inicio del período
  - `EN_CURSO`: Durante el período académico activo
  - `BAJA`: Estudiante se dio de baja
  - `APROBADO`: Al finalizar con calificación >= 70
  - `REPROBADO`: Al finalizar con calificación < 70
  - `CANCELADO`: Inscripción cancelada antes de iniciar

### 5.2 Restricciones por Estado
- ✅ **RB-020**: Campos editables según estado
  - `INSCRITO` / `EN_CURSO`: Todos los campos editables
  - `BAJA`: Solo `observaciones` y `fechaBaja` editables
  - `APROBADO` / `REPROBADO`: Solo `observaciones` editables (requiere permiso especial)
  - `CANCELADO`: Solo `observaciones` editables

---

## 6. Reglas de Transición

### 6.1 Transiciones de Estado Válidas
- ✅ **RB-021**: Transiciones permitidas
  ```
  INSCRITO → EN_CURSO (automático al iniciar período)
  INSCRITO → BAJA
  INSCRITO → CANCELADO
  EN_CURSO → BAJA
  EN_CURSO → APROBADO (con calificación >= 70)
  EN_CURSO → REPROBADO (con calificación < 70)
  BAJA → EN_CURSO (solo con autorización especial)
  ```

- ✅ **RB-022**: Validar transiciones
  - No permitir transiciones inválidas (ej: `APROBADO` → `INSCRITO`)
  - Requerir confirmación para transiciones críticas (ej: `EN_CURSO` → `BAJA`)

### 6.2 Cambios de Grupo
- ✅ **RB-023**: Cambiar grupo solo en estados iniciales
  - Permitir cambiar `groupId` solo si `estatus = INSCRITO` o `EN_CURSO`
  - No permitir cambiar grupo si `estatus = APROBADO`, `REPROBADO`, `BAJA`, `CANCELADO`
  - Si se cambia grupo, resetear calificaciones y asistencia (o requerir confirmación)

### 6.3 Cambios de Estudiante
- ⚠️ **RB-024**: Cambiar estudiante (caso especial)
  - Solo permitir si `estatus = INSCRITO` o `CANCELADO`
  - Requerir confirmación explícita del administrador
  - Considerar crear nueva inscripción en lugar de editar

---

## 7. Reglas de Edición

### 7.1 Campos Inmutables
- ✅ **RB-025**: Campos que no se pueden editar
  - `codigo`: Generado automáticamente, no editable
  - `fechaInscripcion`: Solo lectura (fecha de creación)
  - `createdAt`: Solo lectura

### 7.2 Campos Condicionales
- ✅ **RB-026**: Campos requeridos según estado
  - Si `estatus = APROBADO` o `REPROBADO`: Requerir `calificacionFinal`
  - Si `aprobado = true`: Requerir `fechaAprobacion`
  - Si `estatus = BAJA`: Requerir `fechaBaja`

### 7.3 Historial de Cambios
- ✅ **RB-027**: Registrar cambios importantes
  - Registrar en `EnrollmentHistory` cuando se cambie:
    - `estatus`
    - `calificacionFinal` o calificaciones parciales
    - `aprobado`
    - `groupId` (cambio de grupo)
    - `estatus = BAJA` (registrar `fechaBaja`)

---

## 8. Validaciones de Consistencia

### 8.1 Validaciones Cruzadas
- ✅ **RB-028**: Consistencia entre campos
  - Si `estatus = APROBADO`, `aprobado` debe ser `true`
  - Si `estatus = REPROBADO`, `aprobado` debe ser `false`
  - Si `calificacionFinal >= 70`, sugerir `aprobado = true`
  - Si `calificacionFinal < 70`, sugerir `aprobado = false`

### 8.2 Validaciones Temporales
- ✅ **RB-029**: Fechas válidas
  - `fechaAprobacion` no puede ser anterior a `fechaInscripcion`
  - `fechaBaja` no puede ser anterior a `fechaInscripcion`
  - `fechaAprobacion` no puede ser futura (a menos que sea proyección)

### 8.3 Validaciones de Período
- ✅ **RB-030**: Validar período académico
  - El grupo debe pertenecer a un período académico activo o futuro
  - No permitir inscripciones en grupos de períodos pasados (a menos que sea corrección histórica)

---

## 9. Reglas de UI/UX

### 9.1 Advertencias Visuales
- ⚠️ **RB-031**: Mostrar advertencias
  - Grupo cerca de capacidad (90%): Badge amarillo
  - Grupo lleno: Badge rojo, deshabilitar selector
  - Estudiante inactivo: Badge de advertencia
  - Calificación inconsistente: Mensaje de advertencia

### 9.2 Confirmaciones
- ⚠️ **RB-032**: Requerir confirmación para acciones críticas
  - Cambiar grupo (especialmente si hay calificaciones)
  - Cambiar estudiante
  - Cambiar estado a `BAJA` o `CANCELADO`
  - Editar inscripciones con estado `APROBADO` o `REPROBADO`

### 9.3 Validación en Tiempo Real
- ✅ **RB-033**: Validación mientras se escribe
  - Validar formato de calificaciones mientras se escribe
  - Calcular porcentaje de asistencia automáticamente
  - Mostrar errores de validación inmediatamente

---

## 10. Reglas de Permisos

### 10.1 Por Rol
- ✅ **RB-034**: Permisos de edición
  - **ADMIN**: Puede editar todos los campos
  - **TEACHER**: Solo puede editar calificaciones y asistencia de sus grupos
  - **STUDENT**: Solo lectura de sus propias inscripciones

### 10.2 Campos Restringidos
- ✅ **RB-035**: Campos solo para ADMIN
  - `studentId`: Solo ADMIN puede cambiar
  - `groupId`: Solo ADMIN puede cambiar
  - `tipoInscripcion`: Solo ADMIN puede cambiar
  - `estatus`: Solo ADMIN puede cambiar (excepto transiciones automáticas)

- ✅ **RB-036**: No se puede cambiar el estudiante al editar
  - `studentId` no puede ser modificado cuando se edita una inscripción existente
  - Los estudiantes se gestionan de forma independiente
  - Cambiar el estudiante de una inscripción podría causar inconsistencias en el historial académico
  - Si se necesita cambiar el estudiante, se debe crear una nueva inscripción y eliminar/cancelar la anterior

---

## 11. Reglas de Promedios Académicos

### 11.1 Separación de Promedios
- ✅ **RB-037**: La calificación de inglés es independiente de la calificación general
  - El `promedioGeneral` se calcula excluyendo las materias de inglés
  - El `promedioIngles` se calcula solo con las materias de inglés
  - Las materias de inglés se identifican por:
    - Clave que inicia con "ING-", "LE-", "EN-", "ENG-" (case insensitive)
    - Nombre que contiene "inglés", "ingles", "english" (case insensitive)
  - Los promedios se recalculan automáticamente cuando:
    - Se crea una inscripción con calificación
    - Se actualiza una calificación en una inscripción
    - Se cambia el grupo de una inscripción (si tiene calificación)
  - Los promedios se muestran en:
    - Dashboard del estudiante (ambos promedios)
    - Lista de estudiantes (admin) - columnas separadas
    - Perfil del estudiante

### 11.2 Cálculo de Promedios
- ✅ **RB-037.1**: Cálculo de promedioGeneral
  - Se calcula como el promedio de todas las calificaciones finales (o calificaciones) de materias NO de inglés
  - Se redondea a 2 decimales
  - Si no hay calificaciones válidas, el promedio es `undefined` (null en BD)

- ✅ **RB-037.2**: Cálculo de promedioIngles
  - Se calcula como el promedio de todas las calificaciones finales (o calificaciones) de materias de inglés
  - Se redondea a 2 decimales
  - Si no hay calificaciones de inglés válidas, el promedio es `undefined` (null en BD)

---

## 📝 Resumen de Prioridades

### 🔴 CRÍTICAS (Implementar primero)
1. RB-001, RB-002: Validar estudiante y grupo activos
2. RB-003: Prevenir duplicados
3. RB-006, RB-007: Validar capacidad
4. RB-010: Validar rangos de calificaciones
5. RB-021: Validar transiciones de estado

### 🟡 IMPORTANTES (Implementar después)
6. RB-011: Calificación final automática
7. RB-014: Lógica de aprobación
8. RB-016: Porcentaje de asistencia automático
9. RB-020: Restricciones por estado
10. RB-023: Cambios de grupo

### 🟢 MEJORAS (Implementar cuando sea posible)
11. RB-004, RB-005: Compatibilidad académica
12. RB-012, RB-013: Consistencia de calificaciones
13. RB-027: Historial de cambios
14. RB-031, RB-032: Advertencias y confirmaciones

---

## 🔧 Implementación Sugerida

### Frontend
- Validaciones en tiempo real en el formulario
- Mensajes de error claros y específicos
- Confirmaciones para acciones críticas
- Cálculos automáticos (porcentaje asistencia, calificación final)

### Backend
- Validaciones en el servicio antes de guardar
- Transacciones para operaciones atómicas (cambios de grupo)
- Registro en `EnrollmentHistory` para auditoría
- Validaciones de permisos por rol

### Base de Datos
- Constraints de unicidad (`studentId` + `groupId`)
- Triggers para actualizar `cupoActual` automáticamente (opcional)
- Índices para búsquedas rápidas

