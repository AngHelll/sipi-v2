# Capturas lado a lado — Capa 4-UX (rol alumno)

**Última actualización:** 2026-07-07

Checklist para cerrar el criterio de aceptación de [ROADMAP.md](ROADMAP.md) § Capa 4. Contrato de paridad: repo `sipi-mobile-android` → `contexto/DISENO-PARIDAD.md`.

## Preparación

1. Mismo alumno de prueba en iOS y Android (mismos datos de `english-status`).
2. Modo claro; fuente del sistema en tamaño estándar.
3. Guardar capturas en `docs/images/paridad-ux/`.
4. Scripts: `./scripts/capture-android-paridad.sh` (automático) · `./scripts/capture-ios-paridad.sh <slug>` (manual por pantalla).

## Pantallas obligatorias (3 tabs)

| # | Pantalla | iOS | Android | Notas |
|---|----------|-----|---------|-------|
| 1 | Inicio (Dashboard) | ✓ | ✓ | `01-inicio-*.png` — sin sección Calificaciones SIS |
| 2 | Mi Inglés | pendiente | pendiente | `02-ingles-*.png`; iOS extra scroll: `02-ingles-ios-cursos.png` |
| 3 | Perfil | ✓ | ✓ | Datos académicos + sesión + logout |

**Obsoleto (2026-07-07):** tab y capturas `02-calificaciones-*` — Calificaciones SIS fuera de alcance (paridad web 2026-06-24).

## Archivos en `docs/images/paridad-ux/`

| Pantalla | iOS | Android |
|----------|-----|---------|
| Inicio | `01-inicio-ios.png` | `01-inicio-android.png` |
| Mi Inglés (arriba) | `02-ingles-ios.png` | `02-ingles-android.png` |
| Mi Inglés (cursos) | `02-ingles-ios-cursos.png` | — |
| Perfil | `03-perfil-ios.png` | `03-perfil-android.png` |
| Solicitar examen (sheet/dialog) | — | — | N/A alumno prueba (requisito cumplido); repetir con alumno sin CTA |
| Solicitar curso (sheet/dialog) | — | — | Idem |

## Criterios visuales (pass/fail)

- [x] Espaciado `md` (12px) entre cards/secciones
- [x] Radio de card 12px
- [x] Sin UUID/código técnico como título — títulos legibles en Mi Inglés (2026-07-07)
- [x] Enums en español — `humanizeEnum` en tipo de ingreso; rol oculto en Perfil alumno
- [x] Un solo CTA primario en Mi Inglés (estado cumplido: sin CTA duplicado)
- [ ] **3 tabs**: Inicio · Mi Inglés · Perfil (homologación código ✓ 2026-07-07; regenerar capturas)
- [x] Logout solo en Perfil
- [ ] Inicio sin listado ni CTA de Calificaciones SIS

## Web (referencia Stitch W4 — no bloqueante para paridad móvil)

| Pantalla | Ruta web | Uso como referencia D5 |
|----------|----------|-------------------------|
| Dashboard alumno | `/dashboard` (STUDENT) | Hero + grid 8+4 + gauge inglés |
| Estado de inglés | `/student/english/status` | Bloques Mi Inglés |
| Perfil | — (móvil nativo) | Sin cambio D5 |

Tras D5, las capturas móviles deben **sentirse** del mismo instituto que el dashboard web; no hace falta pixel-perfect.
