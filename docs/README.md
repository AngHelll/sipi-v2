# Documentación - SIPI Modern

Esta carpeta contiene la documentación técnica del proyecto.

## Fuente de Verdad Actual (Arquitectura y Dirección)

Estos son los documentos **canónicos** para el estado actual del proyecto:

- **Arquitectura de actividades académicas y base de datos v2**
  - `DISENO-BASE-DATOS-V2.md` ← **Schema y modelos oficiales (academic_activities, exams, special_courses, etc.)**
  - `ARQUITECTURA-ACTIVIDADES-ACADEMICAS.md` ← Visión de alto nivel y motivación
- **Plan de implementación**
  - `PLAN-IMPLEMENTACION-V2.md` ← Fases 1–9 para desplegar la arquitectura v2
- **Reglas de negocio clave**
  - `REGLAS-NEGOCIO-ENROLLMENTS.md` ← Reglas actuales para inscripciones legacy (útil mientras convivan con v2)
- **Estrategia de reglas de negocio y desarrollo**
  - `development/ESTRATEGIA-REGLAS-NEGOCIO.md`
  - `development/best-practices.md`

Siempre que haya duda, **prioriza estos documentos** sobre cualquier otro.

## Estructura

### `/architecture`
Documentación sobre la arquitectura del sistema:
- `overview.md` - Visión general de la arquitectura (backend/frontend)
- `PLAN-IMPLEMENTACION-MEJORAS.md` - ⚠️ Histórico, reemplazado por `PLAN-IMPLEMENTACION-V2.md`
- `MEJORAS-SCHEMA-PROPUESTAS.md` - Propuestas previas (referencia histórica)

### `/setup`
Guías de configuración e instalación:
- `database.md` - Configuración de base de datos
- `database-access.md` - Acceso visual a la base de datos
- `mysql-setup.md` - Instalación de MySQL
- `troubleshooting.md` - Resolución de problemas comunes
- Otros archivos de instalación Windows/XAMPP

### `/development`
Guías para desarrolladores:
- `best-practices.md` - Mejores prácticas de desarrollo
- `ESTRATEGIA-REGLAS-NEGOCIO.md` - Cómo organizar reglas de negocio por capas
- `ESTRATEGIA-HOMOLOGACION-IDIOMAS.md` - Estrategia para homologar código a inglés
- `extensions.md` - Extensiones recomendadas para desarrollo
- `future-improvements.md` - Mejoras futuras sugeridas

### Otros documentos relevantes

- `FLUJO-APERTURA-PERIODOS-EXAMENES.md` - Flujo completo para crear y abrir períodos de exámenes de diagnóstico
- `PROBLEMA-ERROR-400-EXAMEN.md` - Análisis histórico del error 400 en exámenes (ya resuelto)
- `ESTRATEGIA-INGLES.md` - ⚠️ Deprecado; mantenido solo como historial (ver v2 para la solución actual)

## Documentación Principal del Proyecto

Para información general del proyecto (visión funcional, instalación rápida, etc.), ver el [README principal](../README.md).

