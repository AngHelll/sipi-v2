# 📚 Documentación - SIPI-V2

Este directorio contiene toda la documentación del proyecto organizada por categorías.

---

## 📖 Guías Principales

### Canónico (leer primero — humanos e IA)

| Documento | Rol |
|-----------|-----|
| [PRODUCTO.md](PRODUCTO.md) | Alcance y leyes de producto |
| [ROADMAP.md](ROADMAP.md) | Cola por capas 0→4 + Capa 4-UX |
| [FLUJOS-NEGOCIO.md](FLUJOS-NEGOCIO.md) | Verdad de negocio |
| [MOBILE-API-CONTRACT.md](MOBILE-API-CONTRACT.md) | Contrato API móvil |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Design system: semántico + web + móvil |
| [EVOLUCION.md](EVOLUCION.md) | Log de hipótesis y decisiones |
| [CAPTURAS-PARIDAD-UX.md](CAPTURAS-PARIDAD-UX.md) | Checklist capturas iOS/Android (cierre Capa 4-UX) |
| [SECURITY.md](../SECURITY.md) | Endurecimiento P0–P2 |

### Producto y alcance (detalle)
- **[PRODUCTO.md](PRODUCTO.md)** - Enfoque actual (SIPI Inglés + SIS básico), API canónica, roadmap
- **[ROADMAP.md](ROADMAP.md)** - Workflow por capas: Producto → Flujos → Contratos → Web → Móvil
- **[MOBILE-API-CONTRACT.md](MOBILE-API-CONTRACT.md)** - Contrato API para clientes móviles (iOS/Android)
- **[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)** - Tokens, componentes, paridad móvil, reglas web
- **[EVOLUCION.md](EVOLUCION.md)** - Marco de evolución del producto y proceso

### Estado y Visión General
- **[ESTADO-SISTEMA.md](ESTADO-SISTEMA.md)** - Estado actual del sistema y métricas

### Flujos y Estrategias
- **[FLUJOS-NEGOCIO.md](FLUJOS-NEGOCIO.md)** - Flujos de negocio principales
- **[ESTRATEGIAS.md](ESTRATEGIAS.md)** - Estrategias y decisiones de diseño

### Arquitectura
- **[architecture/](architecture/)** - Arquitectura del sistema
  - `overview.md` - Visión general de la arquitectura
  - `MEJORAS-SCHEMA-PROPUESTAS.md` - Propuestas de mejoras al schema
  - `PLAN-IMPLEMENTACION-MEJORAS.md` - Plan de implementación
  - `MEJORAS-NECESARIAS.md` - Mejoras necesarias en servicios

### Desarrollo
- **[development/](development/)** - Guías de desarrollo
  - `best-practices.md` - Mejores prácticas
  - `ARQUITECTURA-VALIDADORES.md` - Arquitectura de validadores
  - `ESTRATEGIA-REGLAS-NEGOCIO.md` - Estrategia de reglas de negocio
  - `ESTRATEGIA-MIGRACION-FRONTEND.md` - Estrategia de migración
  - `future-improvements.md` - Mejoras futuras
  - `extensions.md` - Extensiones posibles

### Instalación y Configuración
- **[setup/](setup/)** - Guías de instalación
  - `windows-installation.md` - **Guía completa para Windows** (Mac/Linux ver README.md principal)
  - `troubleshooting.md` - Solución de problemas comunes
  - `JWT-SECRET-GUIDE.md` - Guía para generar JWT_SECRET
  - `MIGRACIONES-PRISMA-BEST-PRACTICES.md` - Mejores prácticas de migraciones

### Documentación Técnica Específica
- `ARQUITECTURA-ACTIVIDADES-ACADEMICAS.md` - Arquitectura de actividades académicas
- `DISENO-BASE-DATOS-V2.md` - Diseño de base de datos
- `REGLAS-NEGOCIO-ENROLLMENTS.md` - Reglas de negocio de inscripciones
- `OPTIMIZACIONES-IMPLEMENTADAS.md` - Optimizaciones de rendimiento
- `GUIA-MIGRACIONES-PRISMA.md` - Guía completa de migraciones
- `CI-CD-MIGRACIONES.md` - Integración de migraciones en CI/CD
- `ANALISIS-RECURSOS-SERVIDOR.md` - Análisis de recursos del servidor
- `ANALISIS-COSTOS-OPERATIVOS.md` - Análisis de costos operativos
- `ANALISIS-PIPELINE-CI-CD.md` - Análisis y mejoras del pipeline

---

## 🚀 Inicio Rápido

1. **Instalación:**
   - Mac/Linux: Ver [README.md](../README.md#-instalación)
   - Windows: Ver [setup/windows-installation.md](setup/windows-installation.md)

2. **Configuración:**
   - Backend: Ver [README.md](../README.md#-configuración)
   - Frontend: Ver [README.md](../README.md#-configuración)

3. **Desarrollo:**
   - Ver [development/best-practices.md](development/best-practices.md)
   - Ver [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 📋 Estructura de Documentación

```
docs/
├── README.md (este archivo)
├── ESTADO-SISTEMA.md
├── FLUJOS-NEGOCIO.md
├── ESTRATEGIAS.md
├── architecture/
│   ├── overview.md
│   ├── MEJORAS-SCHEMA-PROPUESTAS.md
│   ├── PLAN-IMPLEMENTACION-MEJORAS.md
│   └── MEJORAS-NECESARIAS.md
├── development/
│   ├── best-practices.md
│   ├── ARQUITECTURA-VALIDADORES.md
│   ├── ESTRATEGIA-REGLAS-NEGOCIO.md
│   ├── ESTRATEGIA-MIGRACION-FRONTEND.md
│   ├── future-improvements.md
│   └── extensions.md
└── setup/
    ├── windows-installation.md
    ├── troubleshooting.md
    ├── JWT-SECRET-GUIDE.md
    └── MIGRACIONES-PRISMA-BEST-PRACTICES.md
```

---

## 🔄 Seguimiento de Cambios

Para ver el historial de cambios del proyecto, consulta:
- **[CHANGELOG.md](../CHANGELOG.md)** - Historial de cambios del proyecto

---

**Última actualización:** 2026-07-07
