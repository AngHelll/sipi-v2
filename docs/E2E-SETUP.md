# R5 — Guía de sesión E2E alumno

**Última actualización:** 2026-09-01  
Checklist detallado: [CHECKLIST-E2E-ALUMNO.md](CHECKLIST-E2E-ALUMNO.md) · Copia idéntica en repos móviles.

---

## Objetivo

Validar en **dispositivo real** (iOS + Android) el journey STUDENT de inglés post-D5k, con la misma cuenta y el backend de RaspyLab.

---

## 1. Backend y red

| Item | Valor |
|------|-------|
| **URL pública** | `https://sipi.ak-solutions.app` |
| **Health** | `curl -sf https://sipi.ak-solutions.app/health` |
| **API base** | `https://sipi.ak-solutions.app/api` |

Verificar antes de abrir la app:

```bash
curl -sf https://sipi.ak-solutions.app/health
# {"status":"ok",...}
```

En apps móviles, la URL de API debe apuntar a producción (o staging si existe). Revisar config en:

- `sipi-mobile-ios` — variables / `Config.xcconfig` / scheme
- `sipi-mobile-android` — `local.properties` o env de build

---

## 2. Cuenta de alumno de prueba

### Obtener credenciales en la Pi

```bash
ssh raspylab 'cd ~/raspylab/production/sipi/app/backend && npx ts-node scripts/get-student-with-english.ts'
```

Muestra username, email y journey de inglés si existe un alumno con `promedioIngles` o actividades.

### Crear alumno de prueba (si hace falta)

En la Pi (con `.env` y MySQL activos):

```bash
ssh raspylab 'cd ~/raspylab/production/sipi/app/backend && npx ts-node scripts/create-test-student.ts'
```

Credenciales por defecto del script:

| Campo | Valor típico |
|-------|----------------|
| Username | `student` |
| Password | `password123` |

Para alumno **con journey inglés completo** (examen, placement, curso), usar scripts de seed existentes o datos ya cargados en prod — consultar admin web.

### Listar usuarios de prueba

```bash
ssh raspylab 'cd ~/raspylab/production/sipi/app/backend && npx ts-node scripts/get-test-users.ts'
```

---

## 3. Preparación en dispositivos

1. **Misma cuenta** en iOS y Android.
2. **Modo claro**, fuente estándar del sistema.
3. Desinstalar/reinstalar app si hay caché de sesión vieja.
4. Red: Wi‑Fi estable; tener modo avión a mano para pruebas de error.

---

## 4. Orden sugerido de la pasada

1. **Auth** — login, logout, sesión expirada (si se puede simular).
2. **Tab Inicio** — hero, progreso inglés, pendientes, pull-to-refresh.
3. **Tab Mi Inglés** — siguiente paso, historial, solicitar/cancelar (si el alumno lo permite).
4. **Tab Perfil** — datos y logout.
5. **Red/errores** — modo avión, mensajes sin UUID crudo.
6. **Paridad** — comparar con capturas en `docs/images/paridad-ux/`.

Marcar ítems en:

- [CHECKLIST-E2E-ALUMNO.md](CHECKLIST-E2E-ALUMNO.md) (este repo)
- `sipi-mobile-ios/contexto/CHECKLIST-E2E-ALUMNO.md`
- `sipi-mobile-android/contexto/CHECKLIST-E2E-ALUMNO.md`

---

## 5. Evidencia

Al completar cada bloque, opcional:

- Screenshot en dispositivo → `docs/images/paridad-ux/e2e-YYYY-MM-DD-{ios|android}-{tab}.png`
- Actualizar tabla de estado en [CHECKLIST-E2E-ALUMNO.md](CHECKLIST-E2E-ALUMNO.md)

---

## 6. Si algo falla

| Síntoma | Revisar |
|---------|---------|
| Login 401 | Credenciales; usuario activo en BD |
| API unreachable | URL en app móvil; VPN/Tailscale si usas LAN |
| Datos inglés vacíos | Alumno sin actividades en `academic-activities` |
| 502/503 público | `ssh raspylab 'systemctl status sipi'` + health local |

Logs backend:

```bash
ssh raspylab 'journalctl -u sipi -n 50 --no-pager'
```

---

## 7. Cierre R5

R5 se considera **cerrado** cuando:

- [ ] Checklist iOS 100 % marcado
- [ ] Checklist Android 100 % marcado
- [ ] Paridad iOS ↔ Android verificada
- [ ] Sin regresiones bloqueantes reportadas

Actualizar `docs/ROADMAP.md` y roadmaps móviles al cerrar.
