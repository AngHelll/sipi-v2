# Probar Optimizaciones y Migraciones Localmente

## ✅ Ambiente Verificado

Los servidores están corriendo:
- ✅ **Backend**: http://localhost:3001
- ✅ **Frontend**: http://localhost:5173

---

## 🔍 Paso 1: Verificar Estado de Migraciones

```bash
cd backend
npx prisma migrate status
```

**Resultado esperado**:
- Si todo está bien: "Database schema is up to date!"
- Si hay migraciones pendientes: Prisma las mostrará

---

## 🚀 Paso 2: Aplicar Migraciones Pendientes

Si hay migraciones pendientes (especialmente la nueva de índices):

```bash
cd backend

# Aplicar migraciones pendientes
npx prisma migrate dev

# O si prefieres solo aplicar sin crear nuevas
npx prisma migrate deploy
```

Esto aplicará:
- ✅ `20260123000000_add_optimization_indexes` - Índices de optimización

---

## ✅ Paso 3: Verificar Índices en Base de Datos

```bash
# Conectar a MySQL
mysql -u root sipi_db

# Ver índices de enrollments
SHOW INDEXES FROM enrollments WHERE Key_name LIKE '%deletedAt%';

# Ver índices de students
SHOW INDEXES FROM students WHERE Key_name LIKE '%deletedAt%';
```

**Índices esperados**:
- `enrollments_studentId_deletedAt_idx`
- `enrollments_estatus_deletedAt_idx`
- `students_estatus_deletedAt_idx`
- `students_carrera_estatus_deletedAt_idx`

---

## 🧪 Paso 4: Probar Optimizaciones

### 1. Compresión HTTP

```bash
# Probar endpoint con compresión
curl -H "Accept-Encoding: gzip" -v http://localhost:3001/api/students 2>&1 | grep -i "content-encoding"

# Debería mostrar: content-encoding: gzip
```

### 2. Caché en Memoria

```bash
# Primera request (cache miss - más lenta)
time curl http://localhost:3001/api/students

# Segunda request (cache hit - más rápida)
time curl http://localhost:3001/api/students
```

La segunda debería ser más rápida (50-70% reducción de tiempo).

### 3. Lazy Loading Frontend

1. Abrir navegador: http://localhost:5173
2. Abrir DevTools → Network tab
3. Navegar a diferentes rutas (dashboard, estudiantes, etc.)
4. Verificar que se cargan chunks separados bajo demanda

---

## 📊 Paso 5: Verificar Performance

### Backend - Ver Logs

```bash
# Ver logs del backend
tail -f backend.log

# Buscar tiempos de respuesta
# Deberías ver tiempos más rápidos en requests repetidos (caché)
```

### Frontend - Ver Network Tab

1. Abrir http://localhost:5173
2. DevTools → Network
3. Recargar página
4. Verificar:
   - Bundle inicial más pequeño (lazy loading)
   - Respuestas comprimidas (gzip)
   - Chunks cargados bajo demanda

---

## 🔧 Troubleshooting

### Error: Migración ya aplicada

Si la migración de índices ya está aplicada:

```bash
# Marcar como resuelta
npx prisma migrate resolve --applied 20260123000000_add_optimization_indexes
```

### Error: Índice ya existe

Si el índice ya existe en la BD:

```bash
# La migración usa IF NOT EXISTS, debería ser segura
# Pero si falla, puedes ejecutar manualmente:
mysql -u root sipi_db << EOF
CREATE INDEX IF NOT EXISTS enrollments_studentId_deletedAt_idx ON enrollments(studentId, deletedAt);
CREATE INDEX IF NOT EXISTS enrollments_estatus_deletedAt_idx ON enrollments(estatus, deletedAt);
CREATE INDEX IF NOT EXISTS students_estatus_deletedAt_idx ON students(estatus, deletedAt);
CREATE INDEX IF NOT EXISTS students_carrera_estatus_deletedAt_idx ON students(carrera, estatus, deletedAt);
EOF
```

### Error: Caché no funciona

Verificar que el código está actualizado:

```bash
# Rebuild backend
cd backend
npm run build
npm run dev
```

---

## 📋 Checklist de Pruebas

- [ ] Migraciones aplicadas: `npx prisma migrate status`
- [ ] Índices creados en BD
- [ ] Compresión HTTP funcionando (header `content-encoding: gzip`)
- [ ] Caché funcionando (segunda request más rápida)
- [ ] Lazy loading funcionando (chunks separados en Network tab)
- [ ] Frontend carga correctamente
- [ ] Backend responde correctamente

---

## 🎯 Próximos Pasos

Una vez verificado localmente:

1. ✅ Hacer commit de cambios
2. ✅ Push a repositorio
3. ✅ Aplicar en producción siguiendo `docs/MIGRACIONES-LIMPIEZA.md`

---

**Última actualización**: 2026-01-23
