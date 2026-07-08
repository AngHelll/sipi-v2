#!/usr/bin/env bash
# Capturas Android — Capa 4-UX (rol alumno, 3 tabs). Requiere emulador/dispositivo con app SIPI abierta.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/images/paridad-ux"
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
DEV="${1:-emulator-5554}"

mkdir -p "$OUT"

capture() { "$ADB" -s "$DEV" exec-out screencap -p > "$OUT/$1"; echo "✓ $1"; }

# 3 tabs: Inicio (0) · Mi Inglés (1) · Perfil (2)
tap_tab() {
  local i=$1
  local x=$(( (i * 2 + 1) * 1080 / 6 ))
  "$ADB" -s "$DEV" shell input tap "$x" 2280
  sleep 1.5
}

tap_tab 0 && capture "01-inicio-android.png"
tap_tab 1 && capture "02-ingles-android.png"
tap_tab 2 && capture "03-perfil-android.png"

# Mi Inglés — scroll a exámenes/cursos (paridad `02-ingles-ios-cursos`)
tap_tab 1
sleep 1
"$ADB" -s "$DEV" shell input swipe 540 1800 540 600 400
sleep 1
capture "02-ingles-android-cursos.png"

echo "Listo. iOS: login manual en Simulador + ./scripts/capture-ios-paridad.sh <slug>"
