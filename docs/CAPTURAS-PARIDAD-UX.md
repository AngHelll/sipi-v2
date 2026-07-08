# Capturas lado a lado — Capa 4-UX (rol alumno)

**Última actualización:** 2026-07-07 (D5c–D5e)

Checklist para cerrar el criterio de aceptación de [ROADMAP.md](ROADMAP.md) § Capa 4. Contrato de paridad: repo `sipi-mobile-android` → `contexto/DISENO-PARIDAD.md`.

## Preparación

1. Mismo alumno de prueba en iOS y Android (mismos datos de `english-status`). Referencia actual: **Angel** · matrícula **899899**.
2. Modo claro; fuente del sistema en tamaño estándar.
3. Guardar capturas en `docs/images/paridad-ux/`.
4. Scripts:
   - Android (automático, 3 tabs): `./scripts/capture-android-paridad.sh [device-id]`
   - Android Mi Inglés (scroll cursos): incluido al final del script o manual con swipe + `adb exec-out screencap`.
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
| Mi Inglés (cursos) | `02-ingles-ios-cursos.png` *(opcional)* | `02-ingles-android-cursos.png` ✓ |
| Perfil | `03-perfil-ios.png` ✓ | `03-perfil-android.png` ✓ |
| Solicitar examen (sheet/dialog) | — | — | N/A alumno prueba (requisito cumplido) |
| Solicitar curso (sheet/dialog) | — | — | Idem |

## iOS — pasos manuales (D5e pendiente)

1. Instalar build reciente en Simulador (`xcodebuild` + `simctl install`).
2. Iniciar sesión (usuario **Angel** u otro alumno con mismos datos que Android).
3. Ejecutar por pantalla:
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
| Estado de inglés | `/student/english/status` | Bloques Mi Inglés |
| Perfil | — (móvil nativo) | Sin cambio D5 |

Tras D5, las capturas móviles deben **sentirse** del mismo instituto que el dashboard web; no hace falta pixel-perfect.
