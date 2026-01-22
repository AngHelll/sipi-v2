# Estrategia para Sistema de Inglés - Análisis y Propuesta

> ⚠️ **ESTE DOCUMENTO ESTÁ DEPRECADO**
>
> - Esta estrategia (Opción C basada en extender `enrollments`) fue el **diseño anterior**.
> - La solución vigente se basa en la arquitectura de `academic_activities` con tablas específicas (`exams`, `special_courses`, etc.).
> - Para la **fuente de verdad actual**, usar:
>   - `DISENO-BASE-DATOS-V2.md`
>   - `ARQUITECTURA-ACTIVIDADES-ACADEMICAS.md` (visión de alto nivel)
>   - `PLAN-IMPLEMENTACION-V2.md`
>
> Mantén este archivo solo como **historial de decisiones** para entender la evolución del sistema de inglés.

## 📋 Requisitos del Negocio

### Requisitos Funcionales
1. **Inglés como requisito de graduación**: El alumno debe cumplir al menos 70% de inglés para graduarse
2. **Niveles de inglés**: El alumno puede entrar desde nivel 1 o según examen de diagnóstico
3. **Examen de diagnóstico**: 
   - Gratis
   - Determina el nivel inicial del estudiante
   - No requiere aprobación de pago
4. **Cursos de inglés**:
   - Requieren pago
   - Requieren aprobación del administrador después del pago
   - El estudiante se inscribe al curso/nivel
5. **Certificación**: El alumno debe concluir los niveles faltantes para certificar el manejo de inglés (al menos 70%)
6. **Separación de calificaciones**: Las calificaciones de inglés son separadas de la calificación global (RB-037 ya implementado)

---

## 🔍 Análisis de Opciones

### Opción A: Extender enrollments existente
**Enfoque**: Agregar campos específicos para inglés en la tabla `enrollments`

**Ventajas**:
- ✅ Reutiliza toda la estructura existente
- ✅ Menos cambios en el código
- ✅ Un solo sistema de inscripciones
- ✅ Mantiene consistencia de datos

**Desventajas**:
- ⚠️ Algunos campos solo aplican a inglés (puede confundir)
- ⚠️ Lógica condicional más compleja
- ⚠️ Mezcla conceptos de inscripción regular vs inglés

**Campos a agregar**:
- `nivelIngles` (Int?): Nivel de inglés del estudiante (1-6)
- `esExamenDiagnostico` (Boolean): Si es examen de diagnóstico
- `requierePago` (Boolean): Si requiere pago
- `pagoAprobado` (Boolean?): Si el pago fue aprobado por admin
- `fechaPagoAprobado` (DateTime?): Fecha de aprobación del pago
- `montoPago` (Decimal?): Monto del pago (si aplica)

**Estados adicionales**:
- `PENDIENTE_PAGO`: Inscripción creada, esperando pago
- `PAGO_PENDIENTE_APROBACION`: Pago realizado, esperando aprobación admin
- `PAGO_APROBADO`: Pago aprobado, puede iniciar curso

---

### Opción B: Tabla separada para inglés
**Enfoque**: Crear tabla `english_enrollments` completamente separada

**Ventajas**:
- ✅ Separación clara de responsabilidades
- ✅ Lógica específica para inglés
- ✅ No contamina la tabla de enrollments regular

**Desventajas**:
- ❌ Duplicación de código y lógica
- ❌ Dos sistemas paralelos a mantener
- ❌ Más complejidad en queries y reportes
- ❌ Dificulta reutilización de componentes

---

### Opción C: Híbrido - Extender enrollments con flags y lógica específica
**Enfoque**: Extender enrollments pero con lógica separada en servicios específicos

**Ventajas**:
- ✅ Reutiliza estructura existente
- ✅ Permite separación lógica en servicios
- ✅ Mantiene consistencia
- ✅ Escalable y mantenible

**Desventajas**:
- ⚠️ Requiere refactorización de servicios
- ⚠️ Algunos campos opcionales solo para inglés

---

## 🎯 Recomendación: Opción C (Híbrido)

### Justificación
1. **Reutilización**: Aprovecha toda la infraestructura existente (validadores, calculadores, DTOs)
2. **Separación lógica**: Crea servicios específicos para inglés sin duplicar código
3. **Escalabilidad**: Fácil agregar más tipos de inscripciones especiales en el futuro
4. **Mantenibilidad**: Un solo sistema de inscripciones, lógica separada por servicios
5. **Consistencia**: Mantiene la separación de promedios (RB-037) ya implementada

---

## 📐 Diseño Propuesto

### 1. Extensión del Schema

```prisma
model enrollments {
  // ... campos existentes ...
  
  // RB-038: Campos específicos para inglés
  nivelIngles              Int?                    // Nivel de inglés (1-6)
  esExamenDiagnostico     Boolean                 @default(false)
  requierePago            Boolean                 @default(false)
  pagoAprobado            Boolean?                 // null = pendiente, true = aprobado, false = rechazado
  fechaPagoAprobado       DateTime?
  montoPago               Decimal?                @db.Decimal(10, 2)
  comprobantePago         String?                 @db.VarChar(255) // URL o referencia del comprobante
  
  // Índices adicionales
  @@index([esExamenDiagnostico])
  @@index([pagoAprobado])
  @@index([nivelIngles])
}

enum enrollments_tipoInscripcion {
  NORMAL
  ESPECIAL
  REPETICION
  EQUIVALENCIA
  EXAMEN_DIAGNOSTICO      // RB-038: Nuevo tipo para examen de diagnóstico
  CURSO_INGLES            // RB-038: Nuevo tipo para cursos de inglés
}

enum enrollments_estatus {
  INSCRITO
  EN_CURSO
  BAJA
  APROBADO
  REPROBADO
  CANCELADO
  PENDIENTE_PAGO          // RB-038: Esperando pago
  PAGO_PENDIENTE_APROBACION // RB-038: Pago realizado, esperando aprobación
  PAGO_APROBADO           // RB-038: Pago aprobado, puede iniciar
}
```

### 2. Extensión del Modelo de Estudiantes

```prisma
model students {
  // ... campos existentes ...
  
  // RB-038: Información de inglés del estudiante
  nivelInglesActual       Int?                    // Nivel actual según examen diagnóstico
  nivelInglesCertificado  Int?                    // Nivel certificado (completó todos los niveles)
  fechaExamenDiagnostico  DateTime?               // Fecha del último examen de diagnóstico
  porcentajeIngles        Decimal?                @db.Decimal(5, 2) // Porcentaje actual (promedioIngles)
  cumpleRequisitoIngles   Boolean                 @default(false) // >= 70%
  
  @@index([nivelInglesActual])
  @@index([cumpleRequisitoIngles])
}
```

### 3. Estructura de Servicios

```
backend/src/modules/
├── enrollments/
│   ├── enrollments.service.ts          // Servicio general (existente)
│   ├── enrollments.validators.ts        // Validadores generales (existente)
│   └── english/
│       ├── english-enrollments.service.ts    // Servicio específico para inglés
│       ├── english-enrollments.validators.ts // Validadores específicos
│       └── english-enrollments.controller.ts // Controller específico
```

### 4. Flujo de Negocio

#### 4.1 Examen de Diagnóstico
```
1. Estudiante solicita inscripción a examen de diagnóstico
2. Sistema crea enrollment con:
   - tipoInscripcion: EXAMEN_DIAGNOSTICO
   - esExamenDiagnostico: true
   - requierePago: false
   - estatus: INSCRITO (automáticamente aprobado)
3. Admin puede ver la solicitud pero no requiere aprobación de pago
4. Estudiante realiza examen
5. Maestro/Admin califica el examen
6. Sistema actualiza:
   - nivelInglesActual del estudiante
   - porcentajeIngles
   - cumpleRequisitoIngles (si >= 70%)
```

#### 4.2 Curso de Inglés
```
1. Estudiante solicita inscripción a curso de inglés
2. Sistema crea enrollment con:
   - tipoInscripcion: CURSO_INGLES
   - esExamenDiagnostico: false
   - requierePago: true
   - estatus: PENDIENTE_PAGO
   - nivelIngles: nivel del curso
3. Estudiante realiza pago y sube comprobante
4. Sistema actualiza:
   - estatus: PAGO_PENDIENTE_APROBACION
5. Admin revisa comprobante y aprueba/rechaza
6. Si aprobado:
   - estatus: PAGO_APROBADO
   - pagoAprobado: true
   - fechaPagoAprobado: now()
7. Cuando inicia el curso:
   - estatus: EN_CURSO
8. Al finalizar:
   - estatus: APROBADO/REPROBADO
   - Actualiza nivelInglesCertificado si aprobó
```

---

## 🔧 Implementación Propuesta

### Fase 1: Extensión del Schema
1. Agregar campos a `enrollments`
2. Agregar campos a `students`
3. Extender enums
4. Crear migración

### Fase 2: Servicios de Inglés
1. Crear `EnglishEnrollmentsService`
2. Crear `EnglishEnrollmentsValidators`
3. Implementar lógica de aprobación de pagos
4. Implementar lógica de examen de diagnóstico

### Fase 3: Endpoints API
1. `POST /api/enrollments/english/exam` - Solicitar examen diagnóstico
2. `POST /api/enrollments/english/course` - Solicitar curso
3. `POST /api/enrollments/english/:id/payment` - Subir comprobante de pago
4. `PUT /api/enrollments/english/:id/approve-payment` - Aprobar pago (admin)
5. `GET /api/enrollments/english/pending-approval` - Listar pendientes (admin)
6. `GET /api/students/:id/english-status` - Estado de inglés del estudiante

### Fase 4: Frontend
1. Vista de solicitud de examen diagnóstico
2. Vista de solicitud de curso de inglés
3. Vista de subida de comprobante
4. Vista de aprobación de pagos (admin)
5. Dashboard de estado de inglés (estudiante)

### Fase 5: Validaciones y Reglas
1. Validar que estudiante no tenga examen diagnóstico pendiente
2. Validar nivel de curso según nivelInglesActual
3. Validar requisito de 70% para graduación
4. Validar que no se pueda inscribir a nivel ya completado

---

## 📊 Ventajas de esta Estrategia

1. **Reutilización**: Aprovecha toda la infraestructura existente
2. **Separación lógica**: Servicios específicos para inglés sin duplicar código
3. **Escalabilidad**: Fácil agregar más tipos especiales
4. **Mantenibilidad**: Un solo sistema, lógica separada
5. **Consistencia**: Mantiene RB-037 (promedios separados)
6. **Flexibilidad**: Permite diferentes flujos para examen vs curso

---

## 🚀 Próximos Pasos

1. Revisar y aprobar esta estrategia
2. Implementar Fase 1 (Schema)
3. Implementar Fase 2 (Servicios)
4. Implementar Fase 3 (API)
5. Implementar Fase 4 (Frontend)
6. Implementar Fase 5 (Validaciones)

---

## 📝 Notas Adicionales

- El examen de diagnóstico puede ser un "grupo especial" sin maestro asignado
- Los cursos de inglés son grupos normales con maestro
- El sistema debe trackear el progreso del estudiante en inglés
- Se debe mostrar claramente qué niveles faltan para certificar
- El requisito de 70% se valida al momento de graduación


