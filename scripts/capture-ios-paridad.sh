#!/usr/bin/env bash
# Capturas iOS — Capa 4-UX (rol alumno, 3 tabs)
#
# Manual (pantalla actual):
#   ./scripts/capture-ios-paridad.sh 01-inicio
#
# Automático (DEBUG -ParidadTab / -ParidadScroll; requiere sesión persistida):
#   ./scripts/capture-ios-paridad.sh --all

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/images/paridad-ux"
BUNDLE="com.sipi.mep"
DERIVED="$ROOT/../sipi-mobile-ios/build/DerivedData"
APP="$DERIVED/Build/Products/Debug-iphonesimulator/SipiMVP.app"

mkdir -p "$OUT"

booted_sim() {
  if ! xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
    echo "No hay simulador iOS booted. Abre Simulator y la app SIPI MVP."
    exit 1
  fi
}

screenshot() {
  local slug="$1"
  local file="$OUT/${slug}-ios.png"
  xcrun simctl io booted screenshot "$file"
  echo "✓ ${slug}-ios.png"
}

build_app() {
  echo "Compilando SipiMVP (Debug, simulador)…"
  xcodebuild \
    -project "$ROOT/../sipi-mobile-ios/SipiMVP.xcodeproj" \
    -scheme SipiMVP \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$DERIVED" \
    -quiet \
    build
}

install_app() {
  build_app
  xcrun simctl install booted "$APP"
}

launch_capture() {
  local tab="$1"
  local scroll="${2:-}"
  local slug="$3"

  xcrun simctl terminate booted "$BUNDLE" 2>/dev/null || true
  sleep 0.4
  if [[ -n "$scroll" ]]; then
    xcrun simctl launch booted "$BUNDLE" -ParidadTab "$tab" -ParidadScroll "$scroll" >/dev/null
    sleep 4
  else
    xcrun simctl launch booted "$BUNDLE" -ParidadTab "$tab" >/dev/null
    sleep 2.5
  fi
  screenshot "$slug"
}

if [[ "${1:-}" == "--all" ]]; then
  booted_sim
  install_app
  launch_capture "home" "" "01-inicio"
  launch_capture "english" "" "02-ingles"
  launch_capture "english" "cursos" "02-ingles-cursos"
  launch_capture "profile" "" "03-perfil"
  echo "Listo. Android: ./scripts/capture-android-paridad.sh"
  exit 0
fi

SLUG="${1:?Usage: $0 <slug> | --all  e.g. 01-inicio}"
booted_sim
screenshot "$SLUG"
