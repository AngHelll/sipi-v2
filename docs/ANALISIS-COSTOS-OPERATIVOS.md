# Análisis de Costos Operativos - SIPI Modern

## 📊 Escenario Base de Análisis

**Suposiciones:**
- **Usuarios concurrentes**: 100 usuarios activos simultáneos
- **Usuarios totales**: 1,000 usuarios registrados
- **Horas pico**: 8 horas/día (horario escolar)
- **Días activos**: 20 días/mes (mes académico)
- **Datos**: 5,000 estudiantes, 200 maestros, 500 materias, 1,000 grupos

---

## 🏗️ Arquitectura Actual

### Stack Tecnológico
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Base de Datos**: MySQL 8.0 + Prisma ORM
- **Autenticación**: JWT (HTTP-only cookies)
- **Deployment**: Servidor único (monolito)

---

## 💰 Costos Operativos Actuales

### 1. Servidor de Aplicación (Node.js)

#### **CPU**
- **Idle**: ~1-2% (solo Express escuchando)
- **Carga normal**: ~5-15% (100 usuarios concurrentes)
- **Carga pico**: ~20-30% (picos de tráfico)
- **Promedio**: ~10% CPU

**Cálculo:**
- Servidor típico: 2-4 vCPUs
- Uso promedio: 10% de 4 vCPUs = 0.4 vCPUs efectivos
- **Costo estimado**: $10-20/mes (VPS 2GB RAM, 2 vCPU)

#### **Memoria (RAM)**
- **Node.js base**: ~50-80 MB
- **Prisma Client**: ~20-30 MB
- **Express + middleware**: ~30-50 MB
- **Por request**: ~2-5 MB (temporal, garbage collected)
- **Total idle**: ~100-150 MB
- **Con carga (100 usuarios)**: ~200-300 MB
- **Pico**: ~400-500 MB

**Cálculo:**
- Necesario: 512 MB - 1 GB
- Recomendado: 2 GB (margen de seguridad)
- **Costo estimado**: Incluido en VPS

#### **Almacenamiento**
- **Código compilado**: ~50 MB (backend dist/)
- **Frontend build**: ~5-10 MB (gzipped)
- **Logs**: ~100-500 MB/mes
- **Total**: ~200 MB - 1 GB

**Costo**: Incluido en VPS (típicamente 20-40 GB SSD)

---

### 2. Base de Datos (MySQL)

#### **CPU**
- **Idle**: ~1-2%
- **Carga normal**: ~5-10% (queries simples)
- **Carga pico**: ~15-25% (queries complejas, exports)
- **Promedio**: ~8% CPU

#### **Memoria (RAM)**
- **MySQL base**: ~200-300 MB
- **Buffer pool**: ~500 MB - 1 GB (caché de datos)
- **Conexiones**: ~5-10 MB por conexión (máx 100 conexiones)
- **Total**: ~1-2 GB

#### **Almacenamiento**
- **Datos estimados**:
  - Estudiantes (5,000): ~50-100 MB
  - Maestros (200): ~2-5 MB
  - Materias (500): ~1-2 MB
  - Grupos (1,000): ~10-20 MB
  - Inscripciones (10,000): ~50-100 MB
  - Actividades académicas: ~20-50 MB
  - **Total datos**: ~150-300 MB
- **Índices**: ~50-100 MB
- **Logs binarios**: ~100-200 MB/mes
- **Backups**: ~500 MB - 1 GB (retención 30 días)
- **Total**: ~1-2 GB

**Cálculo:**
- Necesario: 2-5 GB
- Recomendado: 10 GB (crecimiento futuro)
- **Costo estimado**: $5-15/mes (MySQL en VPS o servicio gestionado)

---

### 3. Red/Bandwidth

#### **Tráfico Estimado**

**Requests por usuario/día:**
- Login: 1 request (~2 KB)
- Dashboard: 5-10 requests (~50-100 KB)
- Navegación: 20-50 requests (~200-500 KB)
- Búsquedas: 10-20 requests (~50-100 KB)
- **Total por usuario/día**: ~300-700 KB

**Cálculo mensual:**
- 100 usuarios × 20 días × 500 KB promedio = **1 GB/mes**
- Frontend assets (primera carga): ~2-3 MB × 100 usuarios = **200-300 MB/mes**
- **Total**: ~1.5 GB/mes

**Costo**: Típicamente incluido en VPS (1-10 TB/mes)

---

### 4. Operaciones Costosas

#### **Exportaciones a Excel**
- **Frecuencia**: ~50-100 exports/mes
- **Tamaño promedio**: 1-5 MB por archivo
- **CPU**: ~500-1000ms por export
- **Memoria**: ~50-100 MB temporal
- **Impacto**: Moderado (operación pesada pero infrecuente)

#### **Búsquedas Globales**
- **Frecuencia**: ~500-1000 búsquedas/día
- **Queries**: 4 queries paralelas (students, teachers, subjects, groups)
- **CPU**: ~50-200ms por búsqueda
- **Impacto**: Bajo (queries optimizadas con índices)

#### **Queries Complejas**
- **Dashboard admin**: ~5-10 queries por carga
- **Listados con filtros**: ~2-3 queries
- **Detalles con relaciones**: ~3-5 queries
- **Impacto**: Moderado (paginación ayuda)

---

## 📈 Resumen de Costos Mensuales

### Escenario Base (100 usuarios concurrentes)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **VPS/Servidor** | 2 vCPU, 2GB RAM, 40GB SSD | $10-20 |
| **Base de Datos** | MySQL (incluido o gestionado) | $0-15 |
| **Bandwidth** | 1.5 GB/mes | $0 (incluido) |
| **Backups** | Automáticos (incluidos) | $0-5 |
| **Monitoreo** | Básico (opcional) | $0-10 |
| **TOTAL** | | **$10-50/mes** |

### Escenario Escalado (500 usuarios concurrentes)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **VPS/Servidor** | 4 vCPU, 4GB RAM, 80GB SSD | $30-50 |
| **Base de Datos** | MySQL gestionado | $20-40 |
| **Bandwidth** | 7.5 GB/mes | $0-5 |
| **Backups** | Automáticos | $5-10 |
| **Monitoreo** | Avanzado | $10-20 |
| **TOTAL** | | **$65-125/mes** |

### Escenario Enterprise (2,000 usuarios concurrentes)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **Servidor App** | 8 vCPU, 8GB RAM | $80-150 |
| **Base de Datos** | MySQL gestionado (RDS) | $100-200 |
| **Load Balancer** | (si se requiere) | $20-50 |
| **Bandwidth** | 30 GB/mes | $10-20 |
| **CDN** | (opcional) | $20-50 |
| **Backups** | Automáticos + redundancia | $20-40 |
| **Monitoreo** | Enterprise | $30-50 |
| **TOTAL** | | **$270-520/mes** |

---

## 🚀 Opciones de Optimización y Mejora

### Nivel 1: Optimizaciones Sin Costo Adicional (ROI: ⭐⭐⭐⭐⭐)

#### **1.1. Caché de Consultas Frecuentes**
**Impacto**: Alto | **Esfuerzo**: Medio | **Costo**: $0

- **Qué**: Cachear resultados de queries frecuentes (dashboards, listados)
- **Cómo**: Redis o memoria en Node.js
- **Ahorro**: 50-70% reducción en queries a BD
- **Beneficio**: Menor carga en BD, respuestas más rápidas

**Implementación:**
```typescript
// Ejemplo: Cachear dashboard por 5 minutos
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
```

**Impacto en costos:**
- Reduce CPU de BD: 50-70%
- Reduce I/O de disco: 60-80%
- **Ahorro potencial**: $5-10/mes (menor necesidad de BD más potente)

---

#### **1.2. Compresión de Respuestas HTTP**
**Impacto**: Alto | **Esfuerzo**: Bajo | **Costo**: $0

- **Qué**: Comprimir JSON responses con gzip/brotli
- **Cómo**: Middleware de Express (`compression`)
- **Ahorro**: 60-80% reducción en bandwidth
- **Beneficio**: Respuestas más rápidas, menos bandwidth

**Implementación:**
```typescript
import compression from 'compression';
app.use(compression());
```

**Impacto en costos:**
- Reduce bandwidth: 60-80%
- **Ahorro potencial**: $2-5/mes (en escenarios grandes)

---

#### **1.3. Optimización de Queries Prisma**
**Impacto**: Alto | **Esfuerzo**: Medio | **Costo**: $0

- **Qué**: Agregar índices, optimizar queries, usar `select` específico
- **Cómo**: Revisar queries lentas, agregar índices en schema
- **Ahorro**: 30-50% reducción en tiempo de queries
- **Beneficio**: Menor carga en BD, mejor UX

**Ejemplo:**
```prisma
model Students {
  // Agregar índices en campos de búsqueda frecuente
  @@index([matricula])
  @@index([carrera, semestre])
  @@index([estatus])
}
```

**Impacto en costos:**
- Reduce CPU de BD: 30-50%
- **Ahorro potencial**: $3-8/mes

---

#### **1.4. Paginación Eficiente**
**Impacto**: Medio | **Esfuerzo**: Bajo | **Costo**: $0

- **Qué**: Ya implementado, pero optimizar límites
- **Cómo**: Usar cursor-based pagination para grandes datasets
- **Ahorro**: 40-60% reducción en memoria y tiempo
- **Beneficio**: Mejor performance en listados grandes

**Impacto en costos:**
- Reduce memoria: 20-30%
- **Ahorro potencial**: $2-5/mes

---

#### **1.5. Lazy Loading de Componentes**
**Impacto**: Medio | **Esfuerzo**: Medio | **Costo**: $0

- **Qué**: Code splitting en frontend
- **Cómo**: `React.lazy()` y `Suspense`
- **Ahorro**: 30-50% reducción en bundle inicial
- **Beneficio**: Carga inicial más rápida

**Impacto en costos:**
- Reduce bandwidth inicial: 30-50%
- **Ahorro potencial**: $1-3/mes

---

### Nivel 2: Mejoras con Bajo Costo (ROI: ⭐⭐⭐⭐)

#### **2.1. Redis para Caché (Opcional)**
**Impacto**: Alto | **Esfuerzo**: Medio | **Costo**: $5-15/mes

- **Qué**: Caché distribuido para múltiples instancias
- **Cuándo**: Si escalas a múltiples servidores
- **Beneficio**: Caché compartido, mejor performance
- **ROI**: Solo si tienes >200 usuarios concurrentes

**Costo adicional**: $5-15/mes
**Ahorro potencial**: $10-20/mes (menor carga en BD)

---

#### **2.2. CDN para Assets Estáticos**
**Impacto**: Medio | **Esfuerzo**: Bajo | **Costo**: $0-20/mes

- **Qué**: Servir JS/CSS/images desde CDN
- **Cómo**: Cloudflare (gratis) o AWS CloudFront
- **Ahorro**: 70-90% reducción en bandwidth del servidor
- **Beneficio**: Carga más rápida, menos carga en servidor

**Costo**: $0 (Cloudflare free) o $5-20/mes (pago)
**Ahorro potencial**: $5-15/mes (menor bandwidth)

---

#### **2.3. Compresión de Imágenes**
**Impacto**: Medio | **Esfuerzo**: Bajo | **Costo**: $0

- **Qué**: Optimizar imágenes antes de subir
- **Cómo**: WebP, compresión, lazy loading
- **Ahorro**: 60-80% reducción en tamaño de imágenes
- **Beneficio**: Menor bandwidth, carga más rápida

**Impacto en costos:**
- Reduce bandwidth: 20-30%
- **Ahorro potencial**: $1-3/mes

---

### Nivel 3: Mejoras con Costo Moderado (ROI: ⭐⭐⭐)

#### **3.1. Base de Datos Gestionada (RDS/Cloud SQL)**
**Impacto**: Alto | **Esfuerzo**: Bajo | **Costo**: $20-100/mes

- **Qué**: MySQL gestionado con backups automáticos
- **Beneficio**: Backups automáticos, alta disponibilidad, menos mantenimiento
- **ROI**: Solo si valoras tiempo de mantenimiento

**Costo adicional**: $20-100/mes
**Ahorro en tiempo**: 2-4 horas/mes de mantenimiento

---

#### **3.2. Load Balancer + Múltiples Instancias**
**Impacto**: Alto | **Esfuerzo**: Alto | **Costo**: $20-50/mes

- **Qué**: Balancear carga entre múltiples servidores
- **Cuándo**: >500 usuarios concurrentes
- **Beneficio**: Alta disponibilidad, escalabilidad horizontal
- **ROI**: Solo si necesitas alta disponibilidad

**Costo adicional**: $20-50/mes + servidores adicionales
**Beneficio**: 99.9% uptime vs 99% uptime

---

#### **3.3. Monitoreo y Alertas Avanzado**
**Impacto**: Medio | **Esfuerzo**: Medio | **Costo**: $10-30/mes

- **Qué**: Sentry, Datadog, New Relic
- **Beneficio**: Detección temprana de problemas, analytics
- **ROI**: Reduce tiempo de debugging

**Costo adicional**: $10-30/mes
**Ahorro en tiempo**: 4-8 horas/mes de debugging

---

## 📊 Comparativa de Escenarios

### Escenario Actual (Sin Optimizaciones)
- **Costo**: $10-50/mes
- **Performance**: Buena
- **Escalabilidad**: Hasta ~200 usuarios concurrentes

### Escenario Optimizado (Nivel 1)
- **Costo**: $10-50/mes (igual)
- **Performance**: Excelente (+50-70%)
- **Escalabilidad**: Hasta ~500 usuarios concurrentes
- **ROI**: ⭐⭐⭐⭐⭐ (mejora sin costo)

### Escenario Optimizado (Nivel 1 + 2)
- **Costo**: $15-65/mes (+$5-15)
- **Performance**: Excelente (+70-90%)
- **Escalabilidad**: Hasta ~1,000 usuarios concurrentes
- **ROI**: ⭐⭐⭐⭐ (bajo costo, alto beneficio)

### Escenario Enterprise (Nivel 1 + 2 + 3)
- **Costo**: $50-200/mes
- **Performance**: Óptima
- **Escalabilidad**: 2,000+ usuarios concurrentes
- **ROI**: ⭐⭐⭐ (costo justificado por necesidades)

---

## 🎯 Recomendaciones Prioritarias

### Fase 1: Inmediato (Sin Costo)
1. ✅ **Compresión HTTP** - Implementar `compression` middleware
2. ✅ **Optimización de Queries** - Agregar índices en Prisma
3. ✅ **Caché en Memoria** - Cachear dashboards y listados frecuentes
4. ✅ **Lazy Loading** - Code splitting en frontend

**Impacto esperado**: +50-70% performance, $0 costo adicional

---

### Fase 2: Corto Plazo (Bajo Costo)
1. ✅ **CDN** - Cloudflare (gratis) para assets estáticos
2. ✅ **Redis** - Solo si escalas a múltiples servidores
3. ✅ **Monitoreo Básico** - Uptime monitoring gratuito

**Impacto esperado**: +20-30% performance adicional, $5-15/mes

---

### Fase 3: Mediano Plazo (Según Necesidad)
1. ⚠️ **Base de Datos Gestionada** - Solo si necesitas backups automáticos
2. ⚠️ **Load Balancer** - Solo si >500 usuarios concurrentes
3. ⚠️ **Monitoreo Avanzado** - Solo si necesitas analytics detallados

**Impacto esperado**: Alta disponibilidad, $20-100/mes adicional

---

## 💡 Conclusión

### Costo Actual Estimado
- **Mínimo viable**: $10-20/mes (VPS básico)
- **Recomendado**: $20-50/mes (VPS con margen)
- **Escalado**: $50-125/mes (500 usuarios)

### Optimizaciones Recomendadas (ROI Alto)
1. **Compresión HTTP** → $0, +60% bandwidth savings
2. **Caché en memoria** → $0, +50% query reduction
3. **Índices en BD** → $0, +40% query speed
4. **CDN (Cloudflare)** → $0, +70% asset delivery speed

**Total optimizaciones Nivel 1**: $0 costo, +50-70% performance

### Proyección de Costos

| Usuarios Concurrentes | Costo Actual | Costo Optimizado | Ahorro |
|----------------------|--------------|------------------|--------|
| 100 | $10-20/mes | $10-20/mes | $0 (mejor performance) |
| 500 | $30-50/mes | $20-40/mes | $10-20/mes |
| 1,000 | $65-125/mes | $40-80/mes | $25-45/mes |
| 2,000 | $270-520/mes | $150-300/mes | $120-220/mes |

**Conclusión**: Las optimizaciones Nivel 1 permiten escalar 2-3x sin aumentar costos significativamente.
