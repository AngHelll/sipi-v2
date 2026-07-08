# Capturas lado a lado — Capa 4-UX (rol alumno)

**Última actualización:** 2026-07-07 (D5g–D5j; capturas regeneradas)

Checklist para cerrar el criterio de aceptación de [ROADMAP.md](ROADMAP.md) § Capa 4. Contrato de paridad: repo `sipi-mobile-android` → `contexto/DISENO-PARIDAD.md`.

## Preparación

1. Mismo alumno de prueba en iOS y Android (mismos datos de `english-status`). Referencia actual: **Angel** · matrícula **899899**.
2. Modo claro; fuente del sistema en tamaño estándar.
3. Guardar capturas en `docs/images/paridad-ux/`.
4. Scripts:
   - Android (automático, 3 tabs): `./scripts/capture-android-paridad.sh [device-id]`
   - Android Mi Inglés (scroll cursos): incluido al final del script o manual con swipe + `adb exec-out screencap`.
   - iOS (automático, 3 tabs + scroll cursos): `./scripts/capture-ios-paridad.sh --all` (requiere sesión en simulador; usa `-ParidadTab` DEBUG)
   - iOS (manual por pantalla): iniciar sesión en Simulador → `./scripts/capture-ios-paridad.sh <slug>`.

## Pantallas obligatorias (3 tabs)

| # | Pantalla | iOS | Android | Notas |
|---|----------|-----|---------|-------|
| 1 | Inicio (Dashboard) | ✓ | ✓ | `01-inicio-*.png` — hero D5c, sin Calificaciones SIS |
| 2 | Mi Inglés | ✓ | ✓ | `02-ingles-*.png`; scroll cursos: `02-ingles-*-cursos.png` (Android ✓; iOS opcional) |
| 3 | Perfil | ✓ | ✓ | Datos académicos + sesión + logout |

**Obsoleto (2026-07-07):** tab y capturas `02-calificaciones-*` — eliminadas.

## Archivos en `docs/images/paridad-ux/`

| Pantalla | iOS | Android |
|----------|-----|---------|
| Inicio | `01-inicio-ios.png` ✓ | `01-inicio-android.png` ✓ |
| Mi Inglés (arriba) | `02-ingles-ios.png` ✓ | `02-ingles-android.png` ✓ |
| Mi Inglés (cursos) | `02-ingles-ios-cursos.png` ✓ | `02-ingles-android-cursos.png` ✓ |
| Perfil | `03-perfil-ios.png` ✓ | `03-perfil-android.png` ✓ |
| Solicitar examen (sheet/dialog) | — | — | N/A alumno prueba (requisito cumplido) |
| Solicitar curso (sheet/dialog) | — | — | Idem |

## iOS — captura automática (2026-07-07)

Tras iniciar sesión una vez en el Simulador:

```bash
./scripts/capture-ios-paridad.sh --all
```

Genera las 4 capturas con `-ParidadTab` / `-ParidadScroll` (solo DEBUG). Manual por pantalla:

```bash
./scripts/capture-ios-paridad.sh 01-inicio
./scripts/capture-ios-paridad.sh 02-ingles
./scripts/capture-ios-paridad.sh 02-ingles-cursos   # tras scroll a exámenes/cursos
./scripts/capture-ios-paridad.sh 03-perfil
```

## Criterios visuales (pass/fail)

- [x] Espaciado `md` (12px) entre cards/secciones
- [x] Radio de card 12px; hero Inicio 24px (D5c)
- [x] Sin UUID/código técnico como título — títulos legibles en Mi Inglés
- [x] Enums en español — `humanizeEnum` en tipo de ingreso; rol oculto en Perfil alumno
- [x] Un solo CTA primario en Mi Inglés (estado cumplido: sin CTA duplicado)
- [x] **3 tabs**: Inicio · Mi Inglés · Perfil (iOS + Android ✓ 2026-07-07)
- [x] Logout solo en Perfil
- [x] Inicio sin listado ni CTA de Calificaciones SIS

## Web (referencia Stitch W4 — no bloqueante para paridad móvil)

| Pantalla | Ruta web | Uso como referencia D5 |
|----------|----------|-------------------------|
| Dashboard alumno | `/dashboard` (STUDENT) | Hero + grid 8+4 + gauge inglés |
| Estado de inglés | `/student/english/status` | Hub Mi Inglés; banner `pendingExam` + listas sin duplicar activo (D5k) |
| Perfil | — (móvil nativo) | Sin cambio D5 |

Tras D5, las capturas móviles deben **sentirse** del mismo instituto que el dashboard web; no hace falta pixel-perfect.

## Backlog homologación (D5g — 2026-07-07)

Auditoría visual alumno 899899. Detalle en `sipi-mobile-android/contexto/DISENO-PARIDAD.md` § D5g.

| Check | iOS | Android |
|-------|-----|---------|
| Icono tab Mi Inglés | globe | globe (`Public`) ✓ |
| Hero metadatos (iconos vs `Label · valor`) | labels ✓ | labels ✓ |
| Promedio inglés con `%` | ✓ | ✓ |
| Último diagnóstico en avance | ✓ | ✓ |
| CTAs Inicio sin pendientes (≤2 rutas) | ✓ | ✓ |
| Curso historial sin `Nivel X` duplicado | ✓ | ✓ |
