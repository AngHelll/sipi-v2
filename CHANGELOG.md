# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
- Búsqueda global avanzada
- Exportación de datos a Excel
- Modo oscuro/claro
- Rate limiting para protección contra abuso
- Sanitización y validación de entrada
- Manejo robusto de errores
- Notificaciones toast
- Gráficas interactivas con Recharts
- Filtros y paginación en todas las listas
- Validación de UUIDs en parámetros
- Documentación completa del proyecto

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

### Documentación
- README completo con instrucciones de instalación
- CONTRIBUTING.md con guía de contribución
- Templates de Issues y Pull Requests
- Documentación de API
- Ejemplos de configuración (.env.example)

---

[1.0.0]: https://github.com/tu-usuario/sipi-modern/releases/tag/v1.0.0

