# Actividades académicas — módulo canónico (SIPI Inglés)

## Producto

**Alcance actual:** programa de **inglés** (exámenes de diagnóstico, cursos por nivel, pagos, placement).

**Diseño extensible:** la misma capa soporta otros tipos sin reescribir el core:

| Capa | Inglés hoy | Extensión futura |
|------|------------|------------------|
| `ActivityType` | `EXAM`, `SPECIAL_COURSE` | `SOCIAL_SERVICE`, `PROFESSIONAL_PRACTICE`, `ENROLLMENT` |
| `SpecialCourseType` | `INGLES` | `VERANO`, `TALLER`, `DIPLOMADO`, … |
| `ExamType` | `DIAGNOSTICO` | `CERTIFICACION`, `EXTRAORDINARIO`, … |

Tablas `social_service` y `professional_practices` existen en schema; **sin API** hasta que haya requisito de producto.

## API

```
/api/academic-activities/exams
/api/academic-activities/exam-periods
/api/academic-activities/special-courses
```

Ver [docs/PRODUCTO.md](../../../docs/PRODUCTO.md) y [docs/FLUJOS-NEGOCIO.md](../../../docs/FLUJOS-NEGOCIO.md).

## No usar para inglés

- `POST /api/enrollments` con `tipoInscripcion` `EXAMEN_DIAGNOSTICO` / `CURSO_INGLES`
- Columnas RB-038 en `enrollments` (solo datos históricos)
- `/api/enrollments/english/*` (410 Gone)
