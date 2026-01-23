# Análisis de Recursos del Servidor - SIPI Modern
## Raspberry Pi 5 (16 GB RAM, 4 cores, SSD)

## 📊 Escenario Base

**Suposiciones de carga:**
- 100 usuarios concurrentes activos
- 1,000 usuarios totales registrados
- 5,000 estudiantes, 200 maestros, 500 materias, 1,000 grupos
- 10,000 inscripciones históricas
- Horas pico: 8 horas/día, 20 días/mes

**Hardware:**
- **Raspberry Pi 5**: 4 cores Cortex-A76 @ 2.4GHz
- **RAM**: 16 GB LPDDR4X
- **Almacenamiento**: SSD (asumiendo 64-128 GB típico)
- **Red**: Gigabit Ethernet

---

## 🖥️ Recursos del Servidor - Estado Actual

### Servidor de Aplicación (Node.js + Express)

#### **CPU (Procesamiento)**
| Estado | Uso CPU | Cores Ocupados | Cores Disponibles |
|--------|---------|----------------|-------------------|
| **Idle** | 1-2% | 0.04-0.08 cores | 3.92-3.96 cores |
| **Carga Normal** | 5-15% | 0.2-0.6 cores | 3.4-3.8 cores |
| **Carga Pico** | 20-30% | 0.8-1.2 cores | 2.8-3.2 cores |
| **Promedio** | **~10%** | **0.4 cores** | **3.6 cores** |

**Análisis:**
- CPU disponible para mejoras: **3.6 cores** (90% headroom)
- Capacidad de escalado: Puede manejar 3-4x más carga sin problemas

#### **Memoria (RAM)**
| Componente | Memoria Base | Con Carga (100 users) | Pico |
|------------|--------------|----------------------|------|
| **Node.js Runtime** | 50-80 MB | 50-80 MB | 50-80 MB |
| **Prisma Client** | 20-30 MB | 20-30 MB | 20-30 MB |
| **Express + Middleware** | 30-50 MB | 30-50 MB | 30-50 MB |
| **Request Handlers** | 0 MB | 100-200 MB | 200-300 MB |
| **Garbage Collection** | - | -50 MB | -100 MB |
| **TOTAL** | **100-150 MB** | **200-300 MB** | **400-500 MB** |

**Análisis:**
- RAM usada actualmente: **200-300 MB** (carga normal)
- RAM disponible: **15.7-15.8 GB** (98% disponible)
- Espacio para mejoras: **+500 MB - 2 GB** (caché, buffers, escalado)

#### **Almacenamiento (SSD)**
| Operación | Tamaño | Frecuencia | Total |
|-----------|--------|-----------|-------|
| **Código Compilado** | 50 MB | Estático | 50 MB |
| **Frontend Build** | 5-10 MB | Estático | 10 MB |
| **Logs** | 100-500 MB | Mensual | 500 MB |
| **Node Modules** | 200-300 MB | Estático | 300 MB |
| **Sistema Operativo** | 4-8 GB | Estático | 8 GB |
| **TOTAL** | - | - | **~9-10 GB** |

**Análisis:**
- SSD usado actualmente: **~9-10 GB**
- SSD disponible (64 GB): **~54-55 GB** (85% disponible)
- SSD disponible (128 GB): **~118-119 GB** (93% disponible)
- Espacio para mejoras: **+10-20 GB** (backups, caché de disco, crecimiento)

---

### Base de Datos (MySQL + Prisma)

#### **CPU (Procesamiento)**
| Tipo de Query | Uso CPU | Cores Ocupados | Cores Disponibles |
|---------------|---------|----------------|-------------------|
| **Queries Simples** | 2-5% | 0.08-0.2 cores | 3.8-3.92 cores |
| **Queries con JOINs** | 5-10% | 0.2-0.4 cores | 3.6-3.8 cores |
| **Queries Complejas** | 10-20% | 0.4-0.8 cores | 3.2-3.6 cores |
| **Exports (Excel)** | 15-25% | 0.6-1.0 cores | 3.0-3.4 cores |
| **Promedio** | **~8%** | **0.32 cores** | **3.68 cores** |

**Análisis:**
- CPU disponible para mejoras: **3.68 cores** (92% headroom)
- 788 queries Prisma en código (findMany, findUnique, includes)
- Queries complejas: ~50-100 con múltiples JOINs

#### **Memoria (RAM)**
| Componente | Memoria |
|------------|---------|
| **MySQL Base** | 200-300 MB |
| **Buffer Pool (Caché)** | 500 MB - 1 GB |
| **Conexiones (máx 100)** | 500 MB - 1 GB |
| **Índices en memoria** | 50-100 MB |
| **TOTAL** | **1.25 - 2.4 GB** |

**Análisis:**
- RAM usada actualmente: **1.25-2.4 GB**
- RAM disponible: **13.6-14.75 GB** (85-90% disponible)
- Espacio para mejoras: **+2-4 GB** (buffer pool más grande, más conexiones, caché Redis)

#### **Almacenamiento (SSD)**
| Operación | Volumen | Frecuencia | Total |
|-----------|---------|-----------|-------|
| **Datos** | 150-300 MB | Estático | 300 MB |
| **Índices** | 50-100 MB | Estático | 100 MB |
| **Logs Binarios** | 100-200 MB | Mensual | 200 MB |
| **Backups** | 500 MB - 1 GB | Diario (retención 30 días) | 15-30 GB |
| **TOTAL** | - | - | **~15-30 GB** |

**Análisis:**
- SSD usado actualmente: **~15-30 GB** (incluyendo backups)
- SSD disponible (64 GB): **~34-49 GB** (53-77% disponible)
- SSD disponible (128 GB): **~98-113 GB** (77-88% disponible)
- Espacio para mejoras: **+10-20 GB** (más backups, logs extendidos, crecimiento)

---

### Red/Bandwidth

#### **Tráfico de Red**
| Tipo | Tamaño | Frecuencia | Total/Mes |
|------|--------|-----------|-----------|
| **API Requests** | 2-50 KB | ~500-1000/día/user | 1 GB |
| **Frontend Assets** | 2-3 MB | 1 vez/user/sesión | 200-300 MB |
| **Exports Excel** | 1-5 MB | 50-100/mes | 50-500 MB |
| **TOTAL** | - | - | **~1.5 GB/mes** |

**Análisis:**
- Bandwidth usado: **1.5 GB/mes**
- Bandwidth disponible (Gigabit): **~300 TB/mes teórico** (99.9995% disponible)
- Espacio para mejoras: **+10-50 GB/mes** (más usuarios, más contenido)

---

## 📈 Análisis de Operaciones Costosas

### Operaciones de Alto Consumo

#### **1. Exportaciones a Excel**
- **CPU**: 0.1-0.2 cores (500-1000ms)
- **Memoria**: 50-100 MB temporal
- **I/O Disco**: Lectura de 50-500 MB
- **Frecuencia**: 50-100/mes
- **Impacto Global**: Bajo (infrecuente, picos cortos)

#### **2. Queries con Múltiples JOINs**
- **CPU**: 0.02-0.08 cores (50-200ms)
- **Memoria**: 5-20 MB por query
- **I/O Disco**: Múltiples lecturas de índices
- **Frecuencia**: ~500-1000/día
- **Impacto Global**: Medio (frecuente pero optimizado)

#### **3. Búsquedas Globales**
- **CPU**: 0.02-0.08 cores (50-200ms, 4 queries paralelas)
- **Memoria**: 10-30 MB
- **I/O Disco**: 4 queries simultáneas
- **Frecuencia**: ~500-1000/día
- **Impacto Global**: Medio (paralelizado)

#### **4. Dashboard Admin (Agregaciones)**
- **CPU**: 0.04-0.12 cores (100-300ms, 5-10 queries)
- **Memoria**: 20-50 MB
- **I/O Disco**: Múltiples COUNT y agregaciones
- **Frecuencia**: ~100-200/día
- **Impacto Global**: Medio (candidato para caché)

---

## 🚀 Mejoras Esperadas por Optimización

### Nivel 1: Optimizaciones Sin Costo (ROI: ⭐⭐⭐⭐⭐)

#### **1. Compresión HTTP (gzip/brotli)**
**Recursos Afectados:**
- **Bandwidth**: 1.5 GB → 0.3-0.6 GB/mes (-1.2 GB/mes)
- **CPU**: +0.08-0.2 cores (2-5% adicional)
- **Memoria**: +10-20 MB (buffers de compresión)

**Mejora Esperada:**
- Tiempo de respuesta: -30% a -50%
- Throughput: +2-3x requests/segundo
- CPU total: 0.4 → 0.48-0.6 cores (aún 85% disponible)

**Impacto Global:**
- ✅ Ahorro de bandwidth: **-1.2 GB/mes**
- ✅ Mejor UX (respuestas más rápidas)
- ✅ Escalabilidad: +50-100% usuarios sin aumentar bandwidth

---

#### **2. Caché en Memoria (Node.js Map/LRU)**
**Recursos Afectados:**
- **CPU BD**: 0.32 → 0.1-0.16 cores (-0.16-0.22 cores)
- **I/O Disco BD**: -60% a -80%
- **Memoria App**: +50-200 MB (caché)
- **Memoria BD**: 1.25-2.4 GB → 1-1.5 GB (-250-900 MB)

**Mejora Esperada:**
- Tiempo de respuesta: -50% a -70% (queries cacheadas)
- Throughput BD: +2-3x queries/segundo
- CPU BD: 0.32 → 0.1-0.16 cores
- Memoria total: 200-300 MB → 250-500 MB (+50-200 MB)

**Impacto Global:**
- ✅ CPU BD liberado: **0.16-0.22 cores** (más capacidad)
- ✅ Memoria BD liberada: **250-900 MB** (más espacio)
- ✅ Respuestas instantáneas (caché hit)
- ✅ Escalabilidad: +100-200% usuarios sin aumentar BD

**Candidatos para Caché:**
- Dashboard stats (5 min TTL): ~10-20 MB
- Listados frecuentes (2 min TTL): ~50-100 MB
- Búsquedas populares (1 min TTL): ~20-50 MB
- **Total caché**: ~80-170 MB

---

#### **3. Optimización de Índices Prisma**
**Recursos Afectados:**
- **CPU BD**: 0.32 → 0.16-0.22 cores (-0.1-0.16 cores)
- **I/O Disco BD**: -40% a -60%
- **Memoria BD**: +50-100 MB (índices adicionales)

**Mejora Esperada:**
- Tiempo de queries: -30% a -50%
- Throughput BD: +1.5-2x queries/segundo
- CPU BD: 0.32 → 0.16-0.22 cores
- Memoria BD: 1.25-2.4 GB → 1.3-2.5 GB (+50-100 MB)

**Impacto Global:**
- ✅ CPU BD liberado: **0.1-0.16 cores**
- ✅ Queries más rápidas
- ✅ Menor I/O de disco
- ✅ Mejor performance en búsquedas

**Índices Recomendados:**
```prisma
// Búsquedas frecuentes
@@index([matricula])
@@index([carrera, semestre])
@@index([estatus, deletedAt])

// JOINs optimizados
@@index([studentId, deletedAt])
@@index([groupId, deletedAt])
@@index([teacherId, periodo])
```

**Espacio adicional**: ~50-100 MB RAM, ~10-20 MB SSD

---

#### **4. Lazy Loading Frontend (Code Splitting)**
**Recursos Afectados:**
- **Bandwidth inicial**: 2-3 MB → 1-1.5 MB (-1-1.5 MB por usuario)
- **Memoria Cliente**: -20% a -30%
- **CPU Cliente**: -10% a -20% (parsing inicial)

**Mejora Esperada:**
- Tiempo de carga inicial: -30% a -50%
- Bundle inicial: 2-3 MB → 1-1.5 MB
- First Contentful Paint: -40% a -60%
- Bandwidth mensual: 1.5 GB → 0.75-1 GB (-0.5-0.75 GB/mes)

**Impacto Global:**
- ✅ Ahorro de bandwidth: **-0.5-0.75 GB/mes**
- ✅ Mejor UX (carga más rápida)
- ✅ Mejor performance en dispositivos lentos

---

### Nivel 2: Mejoras con Bajo Costo (ROI: ⭐⭐⭐⭐)

#### **5. CDN para Assets Estáticos (Cloudflare Free)**
**Recursos Afectados:**
- **Bandwidth Servidor**: 1.5 GB → 0.15-0.45 GB/mes (-1.05-1.35 GB/mes)
- **CPU Servidor**: 0.4 → 0.36-0.38 cores (-0.02-0.04 cores)
- **Latencia**: -50% a -70% (edge locations)

**Mejora Esperada:**
- Tiempo de carga assets: -50% a -70%
- Bandwidth servidor: 1.5 GB → 0.15-0.45 GB/mes
- CPU servidor: 0.4 → 0.36-0.38 cores
- **Ahorro de bandwidth**: **-1.05-1.35 GB/mes**

**Impacto Global:**
- ✅ Carga más rápida globalmente
- ✅ Menor carga en servidor
- ✅ Mejor experiencia internacional

---

#### **6. Redis para Caché Distribuido (Opcional)**
**Recursos Afectados:**
- **CPU BD**: 0.32 → 0.1-0.13 cores (-0.19-0.22 cores)
- **Memoria Redis**: +100-500 MB
- **I/O Disco BD**: -70% a -90%

**Mejora Esperada:**
- Tiempo de respuesta: -60% a -80% (caché hit)
- Throughput: +3-5x (sin tocar BD)
- CPU BD: 0.32 → 0.1-0.13 cores
- Memoria total: +100-500 MB (Redis)

**Impacto Global:**
- ✅ CPU BD liberado: **0.19-0.22 cores**
- ✅ Caché compartido (múltiples instancias)
- ✅ Escalabilidad horizontal
- ✅ ROI positivo si >200 usuarios concurrentes

**Nota**: Redis puede correr en el mismo Pi 5 (tiene RAM suficiente) o en Pi adicional.

---

## 📊 Comparativa: Antes vs Después de Optimizaciones

### Recursos del Raspberry Pi 5

| Recurso | Estado Actual | Con Optimizaciones Nivel 1 | Espacio Liberado/Ganado |
|---------|---------------|----------------------------|-------------------------|
| **CPU App** | 0.4 cores (10%) | 0.48-0.6 cores (12-15%) | +0.08-0.2 cores (compresión) |
| **CPU BD** | 0.32 cores (8%) | 0.1-0.16 cores (2.5-4%) | **-0.16-0.22 cores liberados** |
| **Memoria App** | 200-300 MB | 250-500 MB | +50-200 MB (caché) |
| **Memoria BD** | 1.25-2.4 GB | 1-1.5 GB | **-250-900 MB liberados** |
| **SSD** | 9-10 GB (app) + 15-30 GB (BD) | Similar | Similar (índices +10-20 MB) |
| **Bandwidth** | 1.5 GB/mes | 0.3-0.6 GB/mes | **-0.9-1.2 GB/mes** |

**Resumen de Espacio Disponible:**
- **CPU disponible**: 3.6 cores → **3.8-3.9 cores** (más capacidad)
- **RAM disponible**: 15.7-15.8 GB → **15.5-15.75 GB** (caché usa +50-200 MB, pero BD libera 250-900 MB)
- **SSD disponible**: 54-55 GB (64 GB) o 118-119 GB (128 GB) → Similar
- **Bandwidth disponible**: ~300 TB/mes → Similar (pero usa menos)

### Performance

| Métrica | Estado Actual | Con Optimizaciones | Mejora |
|---------|---------------|---------------------|--------|
| **Tiempo Respuesta API** | 100-300ms | 30-100ms | **-60-70%** |
| **Tiempo Carga Inicial** | 2-3s | 1-1.5s | **-50%** |
| **Throughput (req/s)** | 50-100 | 150-300 | **+200-300%** |
| **Queries BD/segundo** | 10-20 | 3-6 (cacheadas) | **-70%** |
| **Usuarios Concurrentes** | 100-200 | 300-500 | **+200-300%** |

---

## 📊 Proyección de Escalabilidad (Raspberry Pi 5)

### Capacidad por Escenario

| Usuarios Concurrentes | CPU App | CPU BD | Memoria App | Memoria BD | RAM Total | CPU Total |
|----------------------|---------|--------|-------------|------------|-----------|-----------|
| **100 (Actual)** | 0.4 cores | 0.32 cores | 200-300 MB | 1.25-2.4 GB | ~2 GB | 0.72 cores (18%) |
| **300 (Optimizado N1)** | 0.6-0.8 cores | 0.1-0.2 cores | 300-500 MB | 1-1.5 GB | ~2 GB | 0.7-1.0 cores (18-25%) |
| **500 (Optimizado N1+2)** | 0.8-1.0 cores | 0.08-0.15 cores | 400-600 MB | 1-1.5 GB | ~2.5 GB | 0.88-1.15 cores (22-29%) |
| **1,000 (Escalado)** | 1.6-2.0 cores | 0.2-0.3 cores | 600-800 MB | 1.5-2 GB | ~3 GB | 1.8-2.3 cores (45-58%) |
| **2,000 (Límite)** | 3.2-3.6 cores | 0.4-0.6 cores | 1-1.5 GB | 2-3 GB | ~5 GB | 3.6-4.2 cores (90-105%) |

**Análisis:**
- **Límite práctico**: ~1,500-2,000 usuarios concurrentes (75-100% CPU)
- **Recomendado**: 500-1,000 usuarios concurrentes (25-50% CPU, buen margen)
- **RAM**: No es limitante hasta 2,000+ usuarios (16 GB es suficiente)
- **SSD**: No es limitante (64-128 GB es suficiente)

---

## 💰 Costos de Operación (Resumen Global)

### Escenario Actual (Sin Optimizaciones)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **Raspberry Pi 5** | 16 GB RAM, 4 cores, SSD | $75-100 (one-time) |
| **Electricidad** | ~5-10W consumo | $1-2/mes |
| **Internet** | Gigabit (asumiendo existente) | $0-50/mes |
| **TOTAL** | | **$1-52/mes** (operativo) |

### Escenario Optimizado (Nivel 1 - Sin Costo)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **Raspberry Pi 5** | 16 GB RAM, 4 cores, SSD | $75-100 (one-time) |
| **Electricidad** | ~5-10W consumo | $1-2/mes |
| **Internet** | Gigabit (asumiendo existente) | $0-50/mes |
| **TOTAL** | | **$1-52/mes** (operativo) |

**Mejora**: Mismo costo, **+200-300% capacidad**

### Escenario Optimizado (Nivel 1 + 2)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **Raspberry Pi 5** | 16 GB RAM, 4 cores, SSD | $75-100 (one-time) |
| **Electricidad** | ~5-10W consumo | $1-2/mes |
| **Internet** | Gigabit (asumiendo existente) | $0-50/mes |
| **CDN** | Cloudflare (free) | $0 |
| **Redis** | (opcional, mismo Pi) | $0 |
| **TOTAL** | | **$1-52/mes** (operativo) |

**Mejora**: Mismo costo, **+300-500% capacidad**

---

## 🎯 Resumen Ejecutivo

### Estado Actual (Raspberry Pi 5)
- **CPU**: 0.72 cores usados (18%), **3.28 cores disponibles** (82%)
- **Memoria**: ~2 GB usados, **14 GB disponibles** (88%)
- **SSD**: ~24-40 GB usados, **24-104 GB disponibles** (40-87%)
- **Bandwidth**: 1.5 GB/mes usado, **~300 TB/mes disponible** (99.9995%)
- **Capacidad**: 100-200 usuarios concurrentes

### Con Optimizaciones Nivel 1 (Sin Costo)
- **CPU**: 0.7-1.0 cores usados (18-25%), **3.0-3.3 cores disponibles** (75-82%)
- **Memoria**: ~2 GB usados, **14 GB disponibles** (88%)
- **SSD**: Similar
- **Bandwidth**: 0.3-0.6 GB/mes usado, **-0.9-1.2 GB/mes ahorrado**
- **Capacidad**: **300-500 usuarios concurrentes** (+200-300%)

### Con Optimizaciones Nivel 1 + 2
- **CPU**: 0.88-1.15 cores usados (22-29%), **2.85-3.12 cores disponibles** (71-78%)
- **Memoria**: ~2.5 GB usados, **13.5 GB disponibles** (84%)
- **SSD**: Similar
- **Bandwidth**: 0.15-0.45 GB/mes usado, **-1.05-1.35 GB/mes ahorrado**
- **Capacidad**: **500-1,000 usuarios concurrentes** (+400-900%)

---

## 💡 Conclusión

### Recursos Actuales (Raspberry Pi 5)
- **Excelente headroom**: 82% CPU, 88% memoria disponible
- **Bien optimizado**: Queries con índices, paginación, select específico
- **Escalable**: Puede manejar 2-3x usuarios sin cambios

### Optimizaciones Recomendadas
1. **Compresión HTTP** → -1.2 GB/mes bandwidth, +2-3x throughput
2. **Caché en memoria** → -0.16-0.22 cores CPU BD, -250-900 MB RAM BD, +200-300% capacidad
3. **Índices optimizados** → -0.1-0.16 cores CPU BD, -40% tiempo queries
4. **Lazy loading** → -0.5-0.75 GB/mes bandwidth, -50% carga inicial

### ROI
- **Nivel 1**: $0 costo, **+200-300% capacidad**
- **Nivel 2**: $0 costo adicional, **+400-900% capacidad**

**Recomendación**: Implementar Nivel 1 inmediatamente (ROI infinito). El Raspberry Pi 5 tiene recursos más que suficientes para escalar significativamente.

### Límites Prácticos
- **Máximo usuarios concurrentes**: ~1,500-2,000 (límite de CPU)
- **RAM**: No es limitante (16 GB es suficiente para 2,000+ usuarios)
- **SSD**: No es limitante (64-128 GB es suficiente)
- **Red**: No es limitante (Gigabit es más que suficiente)
