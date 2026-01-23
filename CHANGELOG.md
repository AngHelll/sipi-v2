# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Seguridad
- Corregidas 5 vulnerabilidades en backend (2 high, 2 moderate, 1 low)
- Corregidas 2 vulnerabilidades en frontend (1 high, 1 moderate)
- Actualizado `react-router-dom` a 7.12.0 para corregir vulnerabilidades CSRF y XSS
- Todas las dependencias ahora sin vulnerabilidades conocidas

### Dependencias
- Backend: Actualizadas dependencias menores y parches (express, prisma, eslint, etc.)
- Frontend: Actualizadas dependencias menores y parches (react, vite, tailwindcss, etc.)
- Mantenidas versiones actuales de Prisma 6.x (evaluar migración a 7.x en el futuro)

### Documentación
- Consolidación de documentación: eliminados archivos duplicados y de sesiones de trabajo
- Creado `docs/ESTADO-SISTEMA.md` - Estado centralizado del sistema
- Creado `docs/FLUJOS-NEGOCIO.md` - Flujos de negocio consolidados
- Creado `docs/ESTRATEGIAS.md` - Estrategias y decisiones de diseño
- Consolidada documentación de Windows en `docs/setup/windows-installation.md`
- Actualizado `docs/README.md` con estructura clara de documentación
- Eliminados archivos obsoletos: resúmenes ejecutivos duplicados, changelogs por fase, archivos de cambios implementados
- Eliminada información sensible (IPs internas, URLs privadas)

### Frontend
- Diseño responsivo implementado: sidebar móvil, tablas adaptativas, formularios responsivos
- Vista de cards para móvil en listados de estudiantes
- Optimización de dashboards para pantallas pequeñas

---

## [1.0.0] - 2024-11-16

### Agregado
- Sistema completo de autenticación con JWT y cookies HTTP-only
- Gestión de estudiantes con CRUD completo
- Gestión de maestros con CRUD completo
- Gestión de materias académicas
- Gestión de grupos de clase
- Sistema de inscripciones estudiantiles
- Gestión de calificaciones para maestros
- Dashboards personalizados por rol (Estudiante, Maestro, Administrador)
- Búsqueda global avanzada con autocompletado
- Exportación de datos a Excel con filtros aplicados
- Rate limiting para protección contra abuso
- Sanitización y validación de entrada
- Manejo robusto de errores con ErrorBoundary
- Notificaciones toast para feedback al usuario
- Gráficas interactivas con Recharts (estilos optimizados)
- Filtros y paginación en todas las listas
- Validación de UUIDs en parámetros
- Componentes UI reutilizables (Card, Badge, Avatar, Icon, etc.)
- Formularios con validación en tiempo real
- Documentación completa del proyecto
- Documentos estratégicos (ESTATUS_EJECUTIVO.md, SUGERENCIAS_MEJORA.md)

### Seguridad
- Autenticación JWT con cookies HTTP-only
- Rate limiting en endpoints críticos
- Sanitización de entrada para prevenir XSS
- Validación centralizada con express-validator
- Validación de UUIDs en parámetros de ruta
- CORS configurado correctamente
- Manejo seguro de contraseñas con bcrypt

### Arquitectura
- Backend con arquitectura en capas (Routes → Controllers → Services → Database)
- Frontend con arquitectura component-based
- TypeScript en todo el proyecto
- Prisma ORM para gestión de base de datos
- Separación clara de responsabilidades

### Mejorado
- Optimización de estilos en gráficas (mejor legibilidad de textos)
- Mejora de componentes UI con diseño más profesional
- Refinamiento de dashboards con estadísticas más claras
- Optimización de rendimiento en listados con paginación
- Mejora de experiencia de usuario en formularios

### Removido
- Modo oscuro/claro (removido temporalmente para re-implementación futura más robusta)
- Archivos temporales de desarrollo y scripts de migración

### Documentación
- README completo con instrucciones de instalación
- CONTRIBUTING.md con guía de contribución
- ESTATUS_EJECUTIVO.md con análisis completo del proyecto
- SUGERENCIAS_MEJORA.md con plan de mejoras priorizado
- RECOMENDACIONES.md con roadmap técnico
- Templates de Issues y Pull Requests
- Documentación de API
- Ejemplos de configuración (.env.example)

---

[1.0.0]: https://github.com/tu-usuario/sipi-modern/releases/tag/v1.0.0

