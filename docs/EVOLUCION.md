# SIPI — Evolución (log de decisiones)

**Última actualización:** 2026-07-07

Registro cronológico de hipótesis, experimentos y decisiones sobre **producto, proceso y design system**. Máximo **1 entrada/semana** salvo experimento activo.

**Plantilla:**

```markdown
### E-YYYYMMDD-NN — Título

- **Capa:** 0 | 1 | 2 | 3 | 4 | DS | proceso
- **Superficie:** web | iOS | Android | todas
- **Nivel DS:** DS-0 … DS-4 (si aplica)
- **Reversibilidad:** alta | media | baja
- **Problema:** …
- **Hipótesis:** si X, entonces Y
- **Evidencia previa:** observada | principio | opinión | ninguna
- **Experimento:** …
- **Señal de éxito:** …
- **Outcome:** validada | rechazada | pendiente | ley | provisional | descartada
- **Acción:** …
```

---

## Entradas

### E-20260707-01 — Capas 0→4 reducen features fuera de alcance

- **Capa:** proceso
- **Superficie:** todas
- **Reversibilidad:** baja (ya consolidado)
- **Problema:** expansión del SIS distrae del producto inglés.
- **Hipótesis:** workflow producto-primero + capas evitan implementar sin justificación de PRODUCTO.md.
- **Evidencia previa:** observada — web capa 3 cerrada; inglés canónico en `academic-activities`; legacy 410.
- **Outcome:** **ley** — ver [ROADMAP.md](ROADMAP.md), [PRODUCTO.md](PRODUCTO.md).
- **Acción:** mantener; no reabrir sin entrada capa 0.

### E-20260707-02 — Inglés solo en academic-activities

- **Capa:** 2
- **Superficie:** todas
- **Reversibilidad:** baja
- **Problema:** deuda RB-038 en `enrollments` generaba dos verdades.
- **Evidencia previa:** observada — migración V2 y rutas 410.
- **Outcome:** **ley** — `.cursor/rules/producto-primero.mdc`.
- **Acción:** ninguna.

### E-20260707-03 — Marco SIPI Evolución (este archivo)

- **Capa:** proceso
- **Reversibilidad:** alta
- **Problema:** metodologías genéricas no capturan construcción con IA ni contexto SIPI.
- **Hipótesis:** un log único + leyes en docs existentes aporta más que un directorio `research/` paralelo.
- **Evidencia previa:** opinión fundamentada; Android D0–D3 salió de contrato doc sin `tokens.yaml`.
- **Experimento:** usar este log 4 semanas; revisar meta-ratio (entradas vs PRs producto).
- **Señal de éxito:** ≥1 hipótesis cerrada con outcome; meta-ratio ≤ 1:3.
- **Outcome:** **pendiente**
- **Acción:** Fase 0 implementada (DESIGN-SYSTEM, EVOLUCION, README).

### E-DS-20260707-01 — DS dos capas (semántico + plataforma)

- **Capa:** DS
- **Superficie:** todas
- **Nivel DS:** DS-2
- **Reversibilidad:** media
- **Problema:** web, iOS y Android divergían sin modelo claro de qué unificar.
- **Hipótesis:** paridad estricta solo iOS↔Android alumno; web comparte semántica, no layout.
- **Evidencia previa:** observada — `DISENO-PARIDAD.md` móvil; web MD3 + `gray-*` legacy.
- **Outcome:** **validada** — iOS + Android Capa 4 D0–D5k (2026-07-07); capturas en `docs/images/paridad-ux/`.

### E-DS-20260707-02 — Contrato doc antes que tokens.yaml

- **Outcome:** **provisional** — iOS D0–D3 alineado sin `tokens.yaml` (2026-07-07).

### E-DS-20260707-03 — Prohibir gray-* en diffs de components/ui

- **Capa:** DS
- **Superficie:** web
- **Nivel DS:** DS-1 → DS-2
- **Reversibilidad:** alta
- **Hipótesis:** tokens MD3 en el catálogo UI reducen drift cuando IA genera componentes.
- **Evidencia previa:** ninguna en SIPI aún.
- **Experimento:** migrar `frontend/src/components/ui/*`; no nuevos `gray-*` en paths tocados.
- **Señal de éxito:** 0 archivos con `gray-*` en `components/ui/`; tsc en verde.
- **Outcome:** **validada** (catálogo `components/ui/`, 2026-07-07); páginas legacy pendientes incremental.

### E-DS-20260707-04 — StudentScrollScreen unifica D4 iOS

- **Capa:** DS
- **Superficie:** iOS
- **Outcome:** **validada** — Inicio, Calificaciones, Grupos, detalles usan mismo layout; build OK 2026-07-07.

### E-20260707-05 — D5k: examen activo no se duplica en historial móvil

- **Capa:** 0 | 4
- **Superficie:** iOS | Android
- **Nivel DS:** DS-3 (estructura de vistas)
- **Reversibilidad:** alta
- **Problema:** con `pendingExam` + `diagnosticExams[]`, el mismo examen aparecía en **Examen pendiente** y **Mis exámenes** (redundancia UX).
- **Hipótesis:** separar card operativa del historial filtrando por `id` mejora claridad sin cambiar API.
- **Evidencia previa:** observada en capturas paridad alumno 2026-07-07.
- **Outcome:** **validada** — regla en [PRODUCTO.md](PRODUCTO.md) § alumno móvil; `EnglishJourney.historicalDiagnosticExams` iOS + Android; contrato §4.3.
- **Acción:** web alineada — `historicalDiagnosticExams` en `frontend/src/lib/englishJourney.ts` + `EnglishStatusPage` (2026-07-07).
