# 🎯 Estrategias y Decisiones de Diseño - SIPI-V2

> **Archivo histórico (2025-01-23).** Para alcance, roadmap y design system vigentes: [PRODUCTO.md](PRODUCTO.md), [ROADMAP.md](ROADMAP.md), [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

**Última actualización:** 2025-01-23

Este documento centraliza las estrategias y decisiones de diseño importantes del sistema.

---

## 🏗️ Arquitectura del Sistema

### Sistema de Inglés

El sistema de inglés se implementa mediante la arquitectura de `academic_activities`:

- **Exámenes de diagnóstico**: Tabla `exams` con tipo `DIAGNOSTICO`
- **Cursos de inglés**: Tabla `special_courses` con relación a grupos
- **Períodos de exámenes**: Tabla `diagnostic_exam_periods` para gestión de cupos y fechas

**Documentación técnica:**
- Ver `docs/ARQUITECTURA-ACTIVIDADES-ACADEMICAS.md`
- Ver `docs/DISENO-BASE-DATOS-V2.md`

### Reglas de Negocio

#### Inscripciones
- Validación de cupos antes de crear inscripción
- Actualización automática de `cupoActual` en grupos
- Historial completo en `enrollment_history`

**Documentación:** Ver `docs/REGLAS-NEGOCIO-ENROLLMENTS.md`

#### Validadores
- Arquitectura centralizada de validadores
- Reutilización de lógica de validación

**Documentación:** Ver `docs/development/ARQUITECTURA-VALIDADORES.md`

---

## 🔄 Migraciones y Evolución

### Migración Frontend
- Estrategia de migración gradual
- Mantenimiento de compatibilidad durante transición

**Documentación:** Ver `docs/development/ESTRATEGIA-MIGRACION-FRONTEND.md`

### Mejoras al Schema
- Plan de implementación por fases
- Compatibilidad retroactiva

**Documentación:** Ver `docs/architecture/MEJORAS-SCHEMA-PROPUESTAS.md`

---

## 📝 Convenciones

### Nomenclatura
- Base de datos: Español (legacy)
- Código backend/frontend: Inglés
- UI al usuario: Español

### Mejores Prácticas
- Ver `docs/development/best-practices.md`
- Ver `docs/development/future-improvements.md`

---

**Para detalles técnicos específicos, consultar la documentación en `docs/architecture/` y `docs/development/`**
