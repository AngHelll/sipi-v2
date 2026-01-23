# Análisis de Recursos del Servidor - SIPI Modern

## 📊 Escenario Base

**Suposiciones de carga:**
- 100 usuarios concurrentes activos
- 1,000 usuarios totales registrados
- 5,000 estudiantes, 200 maestros, 500 materias, 1,000 grupos
- 10,000 inscripciones históricas
- Horas pico: 8 horas/día, 20 días/mes

---

## 🖥️ Recursos del Servidor - Estado Actual

### Servidor de Aplicación (Node.js + Express)

#### **CPU (Procesamiento)**
| Estado | Uso CPU | Descripción |
|--------|---------|-------------|
| **Idle** | 1-2% | Solo Express escuchando en puerto |
| **Carga Normal** | 5-15% | 100 usuarios activos, requests típicos |
| **Carga Pico** | 20-30% | Picos de tráfico, exports simultáneos |
| **Promedio** | **~10%** | Uso promedio durante horas activas |

**Análisis:**
- Servidor típico: 2-4 vCPUs
- Uso efectivo: 0.4 vCPUs (10% de 4 vCPUs)
- Headroom disponible: 90% (muy buena capacidad)

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
- Necesario mínimo: 512 MB
- Recomendado: 2 GB (margen de seguridad 4x)
- Headroom disponible: 70-85% (excelente)

#### **I/O Disco**
| Operación | Frecuencia | Tamaño | Impacto |
|-----------|------------|--------|---------|
| **Logs** | Constante | 100-500 MB/mes | Bajo |
| **Código** | Inicial | 50 MB (compilado) | Bajo |
| **Frontend Build** | Inicial | 5-10 MB | Bajo |
| **Total** | - | **~200 MB - 1 GB** | Mínimo |

---

### Base de Datos (MySQL + Prisma)

#### **CPU (Procesamiento)**
| Tipo de Query | Uso CPU | Frecuencia | Impacto |
|---------------|---------|-----------|---------|
| **Queries Simples** | 2-5% | Alta (80% del tráfico) | Bajo |
| **Queries con JOINs** | 5-10% | Media (15% del tráfico) | Medio |
| **Queries Complejas** | 10-20% | Baja (5% del tráfico) | Alto |
| **Exports (Excel)** | 15-25% | Muy baja (0.1%) | Muy Alto |
| **Promedio** | **~8%** | - | - |

**Análisis:**
- 788 queries Prisma en código (findMany, findUnique, includes)
- Queries complejas: ~50-100 con múltiples JOINs
- Headroom disponible: 92% (excelente)

#### **Memoria (RAM)**
| Componente | Memoria |
|------------|---------|
| **MySQL Base** | 200-300 MB |
| **Buffer Pool (Caché)** | 500 MB - 1 GB |
| **Conexiones (máx 100)** | 500 MB - 1 GB |
| **Índices en memoria** | 50-100 MB |
| **TOTAL** | **1.25 - 2.4 GB** |

**Análisis:**
- Necesario: 1-2 GB
- Recomendado: 2-4 GB (buffer pool optimizado)
- Headroom disponible: 20-40% (bueno)

#### **I/O Disco**
| Operación | Volumen | Frecuencia | Impacto |
|-----------|---------|-----------|---------|
| **Datos** | 150-300 MB | Estático | Bajo |
| **Índices** | 50-100 MB | Estático | Bajo |
| **Logs Binarios** | 100-200 MB/mes | Constante | Bajo |
| **Backups** | 500 MB - 1 GB | Diario | Bajo |
| **Queries (I/O)** | Variable | Alta | Medio-Alto |

**Análisis:**
- Total almacenamiento: ~1-2 GB
- I/O de queries: Principal cuello de botella potencial
- Headroom disponible: 95%+ (excelente)

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
- Bandwidth necesario: ~1.5 GB/mes
- Típicamente incluido: 1-10 TB/mes en VPS
- Headroom disponible: 99.9%+ (excelente)

---

## 📈 Análisis de Operaciones Costosas

### Operaciones de Alto Consumo

#### **1. Exportaciones a Excel**
- **CPU**: 500-1000ms por export
- **Memoria**: 50-100 MB temporal
- **I/O Disco**: Lectura de datos (50-500 MB)
- **Frecuencia**: 50-100/mes
- **Impacto Global**: Bajo (infrecuente)

#### **2. Queries con Múltiples JOINs**
- **CPU**: 50-200ms por query
- **Memoria**: 5-20 MB por query
- **I/O Disco**: Múltiples lecturas de índices
- **Frecuencia**: ~500-1000/día
- **Impacto Global**: Medio (frecuente pero optimizado)

#### **3. Búsquedas Globales**
- **CPU**: 50-200ms (4 queries paralelas)
- **Memoria**: 10-30 MB
- **I/O Disco**: 4 queries simultáneas
- **Frecuencia**: ~500-1000/día
- **Impacto Global**: Medio (paralelizado)

#### **4. Dashboard Admin (Agregaciones)**
- **CPU**: 100-300ms (5-10 queries)
- **Memoria**: 20-50 MB
- **I/O Disco**: Múltiples COUNT y agregaciones
- **Frecuencia**: ~100-200/día
- **Impacto Global**: Medio (candidato para caché)

---

## 🚀 Mejoras Esperadas por Optimización

### Nivel 1: Optimizaciones Sin Costo (ROI: ⭐⭐⭐⭐⭐)

#### **1. Compresión HTTP (gzip/brotli)**
**Recursos Afectados:**
- **Bandwidth**: -60% a -80%
- **CPU**: +2-5% (compresión es barata)
- **Memoria**: +10-20 MB (buffers de compresión)

**Mejora Esperada:**
- Tiempo de respuesta: -30% a -50%
- Throughput: +2-3x requests/segundo
- Bandwidth: 1.5 GB → 0.3-0.6 GB/mes

**Impacto Global:**
- ✅ Menor carga en red
- ✅ Mejor UX (respuestas más rápidas)
- ✅ Escalabilidad: +50-100% usuarios sin aumentar bandwidth

---

#### **2. Caché en Memoria (Node.js Map/LRU)**
**Recursos Afectados:**
- **CPU BD**: -50% a -70%
- **I/O Disco BD**: -60% a -80%
- **Memoria App**: +50-200 MB (caché)
- **Memoria BD**: -20% a -30% (menos buffer pool necesario)

**Mejora Esperada:**
- Tiempo de respuesta: -50% a -70% (queries cacheadas)
- Throughput BD: +2-3x queries/segundo
- CPU BD: 8% → 2-4%

**Impacto Global:**
- ✅ Menor carga en BD
- ✅ Respuestas instantáneas (caché hit)
- ✅ Escalabilidad: +100-200% usuarios sin aumentar BD

**Candidatos para Caché:**
- Dashboard stats (5 min TTL)
- Listados frecuentes (2 min TTL)
- Búsquedas populares (1 min TTL)

---

#### **3. Optimización de Índices Prisma**
**Recursos Afectados:**
- **CPU BD**: -30% a -50%
- **I/O Disco BD**: -40% a -60%
- **Memoria BD**: +50-100 MB (índices adicionales)

**Mejora Esperada:**
- Tiempo de queries: -30% a -50%
- Throughput BD: +1.5-2x queries/segundo
- CPU BD: 8% → 4-6%

**Impacto Global:**
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

---

#### **4. Lazy Loading Frontend (Code Splitting)**
**Recursos Afectados:**
- **Bandwidth inicial**: -30% a -50%
- **Memoria Cliente**: -20% a -30%
- **CPU Cliente**: -10% a -20% (parsing inicial)

**Mejora Esperada:**
- Tiempo de carga inicial: -30% a -50%
- Bundle inicial: 2-3 MB → 1-1.5 MB
- First Contentful Paint: -40% a -60%

**Impacto Global:**
- ✅ Mejor UX (carga más rápida)
- ✅ Menor bandwidth inicial
- ✅ Mejor performance en dispositivos lentos

---

### Nivel 2: Mejoras con Bajo Costo (ROI: ⭐⭐⭐⭐)

#### **5. CDN para Assets Estáticos (Cloudflare Free)**
**Recursos Afectados:**
- **Bandwidth Servidor**: -70% a -90%
- **CPU Servidor**: -5% a -10% (menos requests estáticos)
- **Latencia**: -50% a -70% (edge locations)

**Mejora Esperada:**
- Tiempo de carga assets: -50% a -70%
- Bandwidth servidor: 1.5 GB → 0.15-0.45 GB/mes
- CPU servidor: 10% → 9-9.5%

**Impacto Global:**
- ✅ Carga más rápida globalmente
- ✅ Menor carga en servidor
- ✅ Mejor experiencia internacional

---

#### **6. Redis para Caché Distribuido ($5-15/mes)**
**Recursos Afectados:**
- **CPU BD**: -60% a -80% (queries cacheadas)
- **Memoria Redis**: +100-500 MB
- **I/O Disco BD**: -70% a -90%

**Mejora Esperada:**
- Tiempo de respuesta: -60% a -80% (caché hit)
- Throughput: +3-5x (sin tocar BD)
- CPU BD: 8% → 1.5-3%

**Impacto Global:**
- ✅ Caché compartido (múltiples instancias)
- ✅ Escalabilidad horizontal
- ✅ ROI positivo si >200 usuarios concurrentes

---

## 📊 Comparativa: Antes vs Después de Optimizaciones

### Recursos del Servidor

| Recurso | Estado Actual | Con Optimizaciones Nivel 1 | Mejora |
|---------|---------------|----------------------------|--------|
| **CPU App** | 10% promedio | 8-9% promedio | **-10-20%** |
| **CPU BD** | 8% promedio | 2-4% promedio | **-50-75%** |
| **Memoria App** | 200-300 MB | 250-400 MB | +50-100 MB (caché) |
| **Memoria BD** | 1.5-2 GB | 1-1.5 GB | **-25-33%** |
| **I/O Disco BD** | 100% | 20-40% | **-60-80%** |
| **Bandwidth** | 1.5 GB/mes | 0.3-0.6 GB/mes | **-60-80%** |

### Performance

| Métrica | Estado Actual | Con Optimizaciones | Mejora |
|---------|---------------|---------------------|--------|
| **Tiempo Respuesta API** | 100-300ms | 30-100ms | **-60-70%** |
| **Tiempo Carga Inicial** | 2-3s | 1-1.5s | **-50%** |
| **Throughput (req/s)** | 50-100 | 150-300 | **+200-300%** |
| **Queries BD/segundo** | 10-20 | 3-6 (cacheadas) | **-70%** |
| **Usuarios Concurrentes** | 100-200 | 300-500 | **+200-300%** |

---

## 💰 Costos de Operación (Resumen Global)

### Escenario Actual (Sin Optimizaciones)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **Servidor VPS** | 2 vCPU, 2GB RAM, 40GB SSD | $10-20 |
| **Base de Datos** | MySQL (incluido) | $0-15 |
| **Bandwidth** | 1.5 GB/mes | $0 |
| **TOTAL** | | **$10-35/mes** |

### Escenario Optimizado (Nivel 1 - Sin Costo)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **Servidor VPS** | 2 vCPU, 2GB RAM, 40GB SSD | $10-20 |
| **Base de Datos** | MySQL (incluido) | $0-15 |
| **Bandwidth** | 0.3-0.6 GB/mes | $0 |
| **TOTAL** | | **$10-35/mes** |

**Mejora**: Mismo costo, **+200-300% capacidad**

### Escenario Optimizado (Nivel 1 + 2)

| Componente | Especificación | Costo Mensual |
|------------|----------------|---------------|
| **Servidor VPS** | 2 vCPU, 2GB RAM, 40GB SSD | $10-20 |
| **Base de Datos** | MySQL (incluido) | $0-15 |
| **CDN** | Cloudflare (free) | $0 |
| **Redis** | (opcional) | $5-15 |
| **TOTAL** | | **$15-50/mes** |

**Mejora**: +$5-15/mes, **+300-500% capacidad**

---

## 📊 Proyección de Escalabilidad

### Capacidad por Escenario

| Usuarios Concurrentes | CPU App | CPU BD | Memoria App | Memoria BD | Costo/Mes |
|----------------------|---------|--------|-------------|------------|-----------|
| **100 (Actual)** | 10% | 8% | 200-300 MB | 1.5-2 GB | **$10-35** |
| **300 (Optimizado N1)** | 15-20% | 3-5% | 300-400 MB | 1-1.5 GB | **$10-35** |
| **500 (Optimizado N1+2)** | 20-25% | 2-4% | 400-500 MB | 1-1.5 GB | **$15-50** |
| **1,000 (Escalado)** | 40-50% | 5-8% | 600-800 MB | 2-3 GB | **$30-80** |
| **2,000 (Enterprise)** | 80-100% | 10-15% | 1-1.5 GB | 4-6 GB | **$150-300** |

---

## 🎯 Resumen Ejecutivo

### Estado Actual
- **CPU**: 10% app, 8% BD (excelente headroom)
- **Memoria**: 200-300 MB app, 1.5-2 GB BD (buen margen)
- **Bandwidth**: 1.5 GB/mes (mínimo)
- **Costo**: **$10-35/mes**
- **Capacidad**: 100-200 usuarios concurrentes

### Con Optimizaciones Nivel 1 (Sin Costo)
- **CPU**: 8-9% app, 2-4% BD (**-50-75% BD**)
- **Memoria**: 250-400 MB app, 1-1.5 GB BD (**-25-33% BD**)
- **Bandwidth**: 0.3-0.6 GB/mes (**-60-80%**)
- **Costo**: **$10-35/mes** (igual)
- **Capacidad**: **300-500 usuarios concurrentes** (+200-300%)

### Con Optimizaciones Nivel 1 + 2 (+$5-15/mes)
- **CPU**: 7-8% app, 1.5-3% BD
- **Memoria**: 300-500 MB app, 1-1.5 GB BD
- **Bandwidth**: 0.15-0.3 GB/mes
- **Costo**: **$15-50/mes** (+$5-15)
- **Capacidad**: **500-1,000 usuarios concurrentes** (+400-900%)

---

## 💡 Conclusión

### Recursos Actuales
- **Excelente headroom**: 90% CPU, 70-85% memoria disponible
- **Bien optimizado**: Queries con índices, paginación, select específico
- **Escalable**: Puede manejar 2-3x usuarios sin cambios

### Optimizaciones Recomendadas
1. **Compresión HTTP** → -60% bandwidth, +2-3x throughput
2. **Caché en memoria** → -70% queries BD, +200-300% capacidad
3. **Índices optimizados** → -40% tiempo queries
4. **Lazy loading** → -50% carga inicial

### ROI
- **Nivel 1**: $0 costo, **+200-300% capacidad**
- **Nivel 2**: +$5-15/mes, **+400-900% capacidad**

**Recomendación**: Implementar Nivel 1 inmediatamente (ROI infinito).
