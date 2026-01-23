# Análisis de Costos: Timeout de Inactividad

## 📊 Escenario Base

**Suposiciones:**
- 100 usuarios concurrentes activos
- Sesión promedio: 2 horas
- Timeout de inactividad: 30 minutos
- Advertencia: 5 minutos antes del timeout

---

## 🔵 Opción A: Frontend Only (Detección en Cliente)

### Recursos Consumidos

#### **CPU del Servidor**
- ✅ **0% adicional** - Todo el procesamiento es en el cliente
- Solo procesa requests normales del usuario
- No hay overhead de tracking

#### **Memoria del Servidor**
- ✅ **0 MB adicional** - No almacena estado de sesión
- Solo mantiene JWT en cookie (ya existente)
- Sin estructuras de datos adicionales

#### **Red/Bandwidth**
- ✅ **0 bytes adicionales** - No hay requests de heartbeat
- Solo tráfico normal de la aplicación
- Sin overhead de comunicación

#### **Base de Datos**
- ✅ **0 queries adicionales** - No hay tracking de actividad
- No requiere tablas nuevas
- Sin escrituras periódicas

#### **CPU del Cliente (Browser)**
- ⚠️ **Mínimo** - Event listeners nativos (muy eficientes)
- ~0.1% CPU cuando está activo
- 0% cuando está inactivo (no hay polling)

#### **Memoria del Cliente**
- ⚠️ **~1-2 KB** - Solo timers y event listeners
- Despreciable en contexto moderno

### Cálculo de Costos (100 usuarios)

| Recurso | Consumo | Costo Mensual Estimado |
|---------|---------|----------------------|
| CPU Servidor | 0% adicional | **$0** |
| Memoria Servidor | 0 MB adicional | **$0** |
| Bandwidth | 0 bytes adicionales | **$0** |
| Base de Datos | 0 queries adicionales | **$0** |
| **TOTAL** | | **$0** |

### Ventajas
- ✅ **Cero costo de servidor**
- ✅ **Escalable infinitamente** (sin límite de usuarios)
- ✅ **No afecta rate limiting** existente
- ✅ **Mejor UX** (puede mostrar warnings en tiempo real)
- ✅ **Funciona offline** (detecta inactividad sin conexión)

### Desventajas
- ⚠️ **No puede detectar inactividad si el usuario cierra la pestaña** (pero JWT expira en 7 días)
- ⚠️ **Depende del cliente** (pero es seguro porque el JWT expira en backend)

---

## 🔴 Opción B: Frontend + Backend (Heartbeat + Tracking)

### Recursos Consumidos

#### **CPU del Servidor**
- ❌ **Alto** - Procesa heartbeat cada 1-5 minutos por usuario
- 100 usuarios × 12 heartbeats/hora = **1,200 requests/hora**
- Cada request: verificación JWT + actualización BD = ~5-10ms
- **Overhead: ~6-12 segundos CPU/hora** (0.17-0.33% CPU constante)

#### **Memoria del Servidor**
- ❌ **Moderado** - Almacena última actividad por usuario
- Opción 1 (Memoria): ~100 usuarios × 100 bytes = **10 KB** (mínimo)
- Opción 2 (BD): Requiere tabla `user_sessions` con índices

#### **Red/Bandwidth**
- ❌ **Alto** - Heartbeat cada 1-5 minutos
- 100 usuarios × 12 heartbeats/hora × 24 horas = **28,800 requests/día**
- Cada request: ~200 bytes (headers + body)
- **Total: ~5.76 MB/día** (172 MB/mes por 100 usuarios)
- Con 1,000 usuarios: **1.72 GB/mes**

#### **Base de Datos**
- ❌ **Alto** - UPDATE o INSERT cada heartbeat
- 100 usuarios × 12 heartbeats/hora = **1,200 queries/hora**
- **28,800 queries/día** (864,000 queries/mes)
- Requiere tabla `user_sessions` con índice en `userId`
- Impacto en I/O de disco

#### **CPU del Cliente**
- ⚠️ **Mínimo** - Solo hace request cada 1-5 minutos
- Similar a Opción A

### Cálculo de Costos (100 usuarios)

| Recurso | Consumo | Costo Mensual Estimado |
|---------|---------|----------------------|
| CPU Servidor | 0.2-0.3% constante | **$2-5** |
| Memoria Servidor | 10 KB + BD | **$1-2** |
| Bandwidth | 172 MB/mes | **$0.50-1** |
| Base de Datos | 864K queries/mes | **$5-10** |
| I/O Disco | Alto (escrituras constantes) | **$2-3** |
| **TOTAL** | | **$10-21/mes** |

### Con 1,000 usuarios:
- **$100-210/mes** adicionales
- **8.64M queries/mes** en BD
- **1.72 GB/mes** de bandwidth

### Ventajas
- ✅ **Tracking preciso** (sabe exactamente cuándo fue la última actividad)
- ✅ **Puede invalidar sesiones desde el servidor**
- ✅ **Útil para analytics** (tiempo de sesión real)

### Desventajas
- ❌ **Alto costo de recursos** (CPU, BD, bandwidth)
- ❌ **Afecta rate limiting** (28,800 requests/día adicionales)
- ❌ **No escala bien** (costo crece linealmente con usuarios)
- ❌ **Más complejo** (requiere tabla BD, migraciones, etc.)
- ❌ **Latencia adicional** (requests de heartbeat)

---

## 📈 Comparación de Escalabilidad

### Opción A (Frontend Only)
```
Usuarios    | Costo Adicional
------------|----------------
100         | $0
1,000       | $0
10,000      | $0
100,000     | $0
```
✅ **Escalabilidad infinita** - Cero costo adicional

### Opción B (Backend Tracking)
```
Usuarios    | Requests/día  | Queries/mes  | Costo/mes
------------|---------------|--------------|----------
100         | 28,800        | 864K         | $10-21
1,000       | 288,000       | 8.64M        | $100-210
10,000      | 2,880,000     | 86.4M        | $1,000-2,100
100,000     | 28,800,000    | 864M         | $10,000-21,000
```
❌ **Costo crece linealmente** - No escala bien

---

## 🎯 Recomendación Final

### **Opción A (Frontend Only) es la MEJOR opción**

**Razones:**
1. ✅ **Cero costo de servidor** - No consume recursos adicionales
2. ✅ **Escalabilidad perfecta** - Funciona igual con 10 o 10,000 usuarios
3. ✅ **Mejor UX** - Puede mostrar warnings en tiempo real sin latencia
4. ✅ **Más simple** - Menos código, menos bugs, menos mantenimiento
5. ✅ **No afecta rate limiting** - No genera requests adicionales
6. ✅ **Seguridad suficiente** - JWT expira en 7 días (backup de seguridad)

### **Cuándo usar Opción B:**
- Solo si necesitas **analytics detallados** de tiempo de sesión
- Solo si necesitas **invalidar sesiones desde el servidor** en tiempo real
- Solo si tienes **presupuesto ilimitado** y **infraestructura robusta**

---

## 💡 Implementación Recomendada

### Frontend Only con JWT como Backup

1. **Frontend**: Timeout de inactividad de 30 minutos
   - Detecta mouse, keyboard, scroll, touch
   - Muestra warning a los 25 minutos
   - Cierra sesión automáticamente a los 30 minutos

2. **Backend**: JWT expiration de 7 días (ya implementado)
   - Backup de seguridad si el frontend falla
   - Protege contra sesiones abandonadas

3. **Resultado**:
   - ✅ Seguridad: Sesiones inactivas se cierran en 30 min
   - ✅ UX: Usuario es advertido antes del cierre
   - ✅ Costo: $0 adicional
   - ✅ Escalabilidad: Infinita

---

## 📊 Resumen Ejecutivo

| Métrica | Opción A (Frontend) | Opción B (Backend) |
|---------|-------------------|-------------------|
| **Costo Mensual (100 users)** | **$0** | **$10-21** |
| **Costo Mensual (1,000 users)** | **$0** | **$100-210** |
| **CPU Servidor** | 0% | 0.2-0.3% |
| **Queries BD/mes** | 0 | 864K |
| **Bandwidth/mes** | 0 MB | 172 MB |
| **Escalabilidad** | ✅ Perfecta | ❌ Limitada |
| **Complejidad** | ✅ Baja | ❌ Alta |
| **Rate Limiting** | ✅ No afecta | ❌ Afecta |

**Conclusión: Opción A es 10-100x más eficiente en recursos y escalabilidad.**
