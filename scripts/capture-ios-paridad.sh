#!/usr/bin/env bash
# Capturas iOS — Capa 4-UX (rol alumno, 3 tabs)
# Uso: navega manualmente a cada pantalla en el Simulador y ejecuta:
#   ./scripts/capture-ios-paridad.sh 01-inicio
#   ./scripts/capture-ios-paridad.sh 02-ingles
#   ./scripts/capture-ios-paridad.sh 02-ingles-cursos
#   ./scripts/capture-ios-paridad.sh 03-perfil

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/images/paridad-ux"
SLUG="${1:?Usage: $0 <slug>  e.g. 01-inicio}"

mkdir -p "$OUT"
FILE="$OUT/${SLUG}-ios.png"

if ! xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
  echo "No hay simulador iOS booted. Abre Simulator y la app SIPI MVP."
  exit 1
fi

xcrun simctl io booted screenshot "$FILE"
echo "Guardado: $FILE"
