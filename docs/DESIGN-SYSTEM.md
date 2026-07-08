# SIPI — Design System

**Última actualización:** 2026-07-07

SIPI opera en **tres superficies**: web (admin/maestro), iOS (alumno + roles), Android (alumno + roles). No buscamos paridad pixel-perfect entre web y móvil; sí **semántica compartida** y **paridad estricta iOS ↔ Android** en el rol alumno (Capa 4-UX).

Evolución del marco de decisión: [EVOLUCION.md](EVOLUCION.md). Cola de trabajo: [ROADMAP.md](ROADMAP.md) § Capa 4-UX.

---

## Modelo de dos capas

| Capa | Qué define | Paridad |
|------|------------|---------|
| **DS-Semántico** | Significado de colores de estado, labels en español, formateadores, nombres de componentes, higiene de datos (sin UUIDs) | Web + iOS + Android |
| **DS-Plataforma** | Espaciado, tipografía, densidad, navegación | Por superficie |

```mermaid
flowchart TB
  SEM[DS-Semántico]
  W[Web — Tailwind MD3]
  I[iOS — DesignTokens.swift]
  A[Android — DesignTokens.kt]

  SEM --> W
  SEM --> I
  SEM --> A
  I <-. paridad estricta alumno .-> A
```

---

## Madurez (DS-0 … DS-4)

| Nivel | Estado SIPI (2026-07-07) |
|-------|--------------------------|
| DS-0 Ad-hoc (`gray-*` inline) | Web **✓** (W3–W4 2026-07-07); móvil alumno en tokens D0–D4 |
| DS-1 Tokens por plataforma | Web `tailwind.config.js`; Android ✓; iOS ✓ |
| DS-2 Contrato semántico documentado | Este doc + [DISENO-PARIDAD.md](../../sipi-mobile-android/contexto/DISENO-PARIDAD.md) — iOS D0–D3 (2026-07-07) |
| DS-3 Fuente única (`tokens.yaml`) | No — solo si DS-2 falla en práctica |
| DS-4 Verificación automática | No — capturas manuales iOS/Android por ahora |

---

## DS-Semántico (compartido)

### Colores de estado

| Rol | Significado | Web (Tailwind) | Móvil |
|-----|-------------|----------------|-------|
| `success` | Cumple / aprobado / OK | `primary` + `primary-fixed` | `SipiColor.primary` → `#001917` (D5) |
| `pending` | Pago / lista de espera | `tertiary-fixed` + `tertiary-fixed-dim` | `SipiColor.pending` → gold `#ffdea9` / `#e9c07b` (D5) |
| `error` | Error / reprobado | `error`, `error-container` | `SipiColor.error` → `#ba1a1a` (D5) |
| `textSecondary` | Metadatos, hints | `on-surface-variant`, `outline` | `onSurfaceVariant` / `#414847` (D5) |

### Componentes con nombre canónico

Misma **responsabilidad** en cada plataforma; implementación nativa.

| Componente | Web | iOS | Android |
|------------|-----|-----|---------|
| `KeyValueRow` | — (admin usa tablas) | `KeyValueRow` | `Components.kt` |
| `SectionCard` | `Card` + `CardHeader` | `SectionCard` | `SectionCard` |
| `EmptyState` | `EmptyState` | `EmptyState` | `StateViews` |
| `LoadingState` / `ErrorState` | `Loader`, `ErrorDisplay` | inline → unificar | `StateViews` |
| `Badge` | `Badge` | badges SwiftUI | `SipiColors` + chips |

### Higiene de presentación

- No mostrar UUID, `codigo` técnico ni enum crudo (`STUDENT`, `PENDIENTE_PAGO`) al usuario final.
- Dato faltante: `—` (no cadena vacía ni `null`).
- Formateadores: fecha `dd/MM/yyyy`, dinero `$350`, calificación `80` / `78.5` (sin `.0` innecesario).

### Labels en español

Fuente móvil: `Labels.kt` / `DomainLabels` (iOS). Web: mapeos en vistas de inglés y badges.

---

## DS-Plataforma — Web

**Fuente de tokens:** `frontend/tailwind.config.js` (paleta Material Design 3).

**Tipografía:** Manrope (`font-sans`, `font-headline`, `font-body`).

**Componentes base:** `frontend/src/components/ui/` — catálogo web implícito.

**Presentación web canónica:** `frontend/src/lib/designSystem.ts` (`ds.*`) — botones, cards, semántica, admin.

**Presentación alumno inglés:** re-exportada desde `designSystem.ts` vía `studentEnglishPresentation.ts` (compatibilidad).

**Alertas inglés compartidas:** `frontend/src/lib/englishAlerts.ts` — misma derivación que móvil §4.2.1.

### Reglas (leyes DS web)

1. En archivos **modificados**, no introducir clases `gray-*`, `blue-*`, `red-*` sueltas; usar tokens MD3 o `ds.*`.
2. `components/ui/*` debe usar solo tokens semánticos (referencia para IA y humanos).
3. Web admin puede ser más densa que móvil; migrar con `ds.admin.*` al tocar cada pantalla.
4. Ejecutar `npm run audit:ds` antes de cerrar un lote de migración admin.

### Preparación rediseño web (checklist)

| Fase | Qué | Estado |
|------|-----|--------|
| **W0 — Fundación** | `designSystem.ts`, `englishAlerts.ts`, `components/ui/*` en MD3, token `rounded-card` | ✓ 2026-07-07 |
| **W1 — Rol alumno** | Dashboard + 3 páginas inglés en `ds.*` | ✓ 2026-07-07 |
| **W2 — Rol maestro** | Vista única grupo en semántica DS | ✓ 2026-07-07 |
| **W3 — Admin** | Migrar `pages/admin/*` de `gray-*` → `ds.admin.*` (lote por módulo) | ✓ 2026-07-07 — inglés, SIS listas/detalle, formularios (Student, Enrollment, Group, Teacher, Subject, ExamPeriod) |
| **W4 — Rediseño** | Layout/navegación/densidad global (Stitch Academic Prestige) | ✓ 2026-07-07 — W4a shell, W4b dashboard alumno, W4c dashboards admin/maestro + errores |

**Auditoría:** `cd frontend && npm run audit:ds` — lista archivos con clases legacy.

### Espaciado web (convención Tailwind)

Usar escala Tailwind estándar (`p-4`, `gap-6`). No hay enum `Spacing.md` en web; la escala nombrada es exclusiva del par móvil.

---

## DS-Plataforma — Móvil (rol alumno)

**Contrato ejecutable:** [`sipi-mobile-android/contexto/DISENO-PARIDAD.md`](../../sipi-mobile-android/contexto/DISENO-PARIDAD.md)

**Implementación:**

- iOS: `SipiMVP/Core/DesignTokens.swift`
- Android: `app/.../core/ui/DesignTokens.kt`

### Espaciado canónico (idéntico iOS ↔ Android)

| Token | Valor |
|-------|-------|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |

### Forma

- Radio de card: **12** (`Shape.cardCornerRadius` / `shapes.medium`).

### Layout alumno (D4)

| Componente | Uso |
|------------|-----|
| `StudentScrollScreen` | Scroll + padding `md` + fondo grouped |
| `ListItemCard` | Fila de lista (inscripciones, grupos) |
| `StudentSecondaryButton` | Acción secundaria ancho completo |
| `LoadMoreFooter` | Paginación fuera de `List` |

Implementación: `sipi-mobile-ios/SipiMVP/Core/StudentLayout.swift` · `sipi-mobile-android/.../core/ui/StudentLayout.kt`.

### D5 — Paleta Academic Prestige (Stitch ↔ web W4)

**Objetivo:** acercar el **look institucional** de iOS y Android al rediseño web (W4), manteniendo paridad estricta **iOS ↔ Android** y **sin tocar** lógica, API ni flujos.

**Fuente de verdad de hex:** `frontend/tailwind.config.js` (copia de Stitch `DESIGN.md`). No duplicar valores sueltos en Swift/Kotlin — copiar desde ese archivo o desde la tabla siguiente en el mismo PR.

| Token MD3 | Hex | Uso móvil alumno |
|-----------|-----|------------------|
| `primary` | `#001917` | Tab activo, títulos marca, botón primario |
| `primary-container` | `#042f2c` | Hero Inicio (fondo), headers de sección oscuros |
| `on-primary` | `#ffffff` | Texto sobre hero |
| `primary-fixed` | `#c2ebe5` | Fondos suaves éxito / chips “Al día” |
| `tertiary-fixed` | `#ffdea9` | Logros, progreso completado, CTA destacado |
| `tertiary-fixed-dim` | `#e9c07b` | Barras de progreso, borde acento card |
| `surface` | `#f7f9fb` | Fondo pantalla |
| `surface-container-low` | `#f2f4f6` | Filas checklist / grouped background |
| `on-surface` | `#191c1e` | Texto principal |
| `on-surface-variant` | `#414847` | Meta, subtítulos |
| `outline-variant` | `#c0c8c6` | Divisores |
| `error` / `error-container` | `#ba1a1a` / `#ffdad6` | Rechazo, urgente |

**Alcance por lote (solo presentación):**

| Lote | Qué | Archivos típicos |
|------|-----|------------------|
| **D5a — Tokens** | Enum/struct `SipiColor` MD3 idéntico iOS + Android; deprecar hex sueltos D0 | ✓ 2026-07-07 |
| **D5b — Chrome** | Tab bar, navigation bar tint, botones primarios/secundarios | Theme / `MaterialTheme`, SwiftUI `.tint` |
| **D5c — Inicio** | Hero perfil (como web W4b): nombre, matrícula, carrera — **mismos campos** que hoy | Vista tab Inicio iOS + Android |
| **D5d — Mi Inglés** | Gauge/barra progreso gold; chips pendiente/pago; `NextStepCard` con acento | Pantallas inglés existentes |
| **D5e — Capturas** | Regenerar [CAPTURAS-PARIDAD-UX.md](CAPTURAS-PARIDAD-UX.md) post-paleta | `docs/images/paridad-ux/` |

**Fuera de alcance D5:** Manrope embebida (opcional D5f), admin/teacher móvil (web-first), unificar layout web sidebar con tab bar nativo.

**Criterio de done:** iOS y Android compilan; capturas 3 tabs actualizadas; `englishAlerts` / textos **sin cambios**; diff solo tokens + vistas.

### Anti-patrones
- Un solo bundle visual web = móvil.
- React Native / Compose Multiplatform para unificar apps.
- `tokens.yaml` + codegen hasta demostrar dolor de sincronización.
- Storybook completo antes de estabilizar `components/ui/`.
- Figma como fuente de verdad obligatoria.

---

## Referencias

| Documento | Uso |
|-----------|-----|
| [ROADMAP.md](ROADMAP.md) | Cola D0–D5 y estado por capa |
| [DISENO-PARIDAD.md](../../sipi-mobile-android/contexto/DISENO-PARIDAD.md) | Detalle móvil alumno |
| [CAPTURAS-PARIDAD-UX.md](CAPTURAS-PARIDAD-UX.md) | Checklist capturas lado a lado |
| [EVOLUCION.md](EVOLUCION.md) | Hipótesis y experimentos DS |
| `sipi-mobile-ios/contexto/ROADMAP.md` | Estado iOS Capa 4-UX |
| `sipi-mobile-android/contexto/ROADMAP.md` | Estado Android Capa 4-UX |
