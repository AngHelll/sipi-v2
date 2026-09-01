# Node.js y stack toolchain — SIPI

**Última actualización:** 2026-09-01  
**Verificado en producción (Pi):** Node **22.23.2**, commit `63d9572`

Documentación de versiones del stack, requisitos por entorno y procedimiento para actualizar Node en RaspyLab.

---

## Versiones canónicas (2026-09-01)

| Componente | Versión | Notas |
|------------|---------|-------|
| **Node.js** | **22 LTS** (mín. 20.19 / 22.12+) | `.nvmrc` → `22`; Drone → `node:22-alpine` |
| **Vite** | 8.x | Requiere Node ≥20.19 o ≥22.12 |
| **React** | 19.2.x | |
| **react-router** | 8.3.1 | Alias npm en `react-router-dom` |
| **TypeScript** | 5.9 | Backend + frontend |
| **Prisma** | 6.19 | **Sin** salto a v7 (pospuesto) |
| **Express** | 5.x | |
| **npm audit** | 0 high/critical | Overrides: `uuid`, `deepmerge-ts` — ver [SECURITY.md](../../SECURITY.md) |

**Pospuesto (próxima ventana):** Prisma 7, TypeScript 7 backend, ESLint 10.

Estrategia y estado en [ROADMAP.md](../ROADMAP.md) § Stack toolchain.

---

## Requisitos por entorno

| Entorno | Node | Fuente de verdad |
|---------|------|------------------|
| Desarrollo (Mac) | 22 LTS recomendado | `.nvmrc` + `nvm use` |
| CI (Drone runner) | 22-alpine | `.drone.yml` |
| Producción (Pi) | 22.x (NodeSource) | `/usr/bin/node` — ver abajo |
| Mínimo absoluto | 20.19+ | Vite 8 |

---

## Desarrollo local (Mac)

```bash
cd ~/workspace/repos/sipi-v2
nvm install    # lee .nvmrc (22)
nvm use
node -v        # v22.x.x

cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..

# Smoke test
cd backend && npm test && npm run build
cd ../frontend && npm run build
```

Node 24+ en Mac funciona para desarrollo, pero **CI y Pi usan 22 LTS** — preferir paridad.

Scripts de verificación: `./check-prerequisites.sh`, `./setup-env.sh`.

---

## Producción — Raspberry Pi (RaspyLab)

### Contexto

- SIPI **no** corre en Docker; el servicio `sipi.service` ejecuta `/usr/bin/node dist/server.js`.
- El **deploy recompila en la Pi** (`npm ci`, `vite build`), no solo copia artefactos del runner.
- Node en Pi se instaló vía **NodeSource** (paquete `nodejs`, no nvm).
- SSH: `ssh raspylab` (LAN `192.168.100.35`) o `ssh raspylab-vpn` (Tailscale).
- App path: `~/raspylab/production/sipi/app`
- Runbook general: [raspylab-docs deploy-cicd](https://github.com/AngHelll/raspylab-docs) § sipi.

### Verificar versión actual

```bash
ssh raspylab 'node -v && npm -v && which node'
ssh raspylab 'curl -sf http://127.0.0.1:3001/health'
ssh raspylab 'curl -sf https://sipi.ak-solutions.app/health'
```

### Actualizar Node.js (NodeSource 22.x)

Procedimiento aplicado el **2026-09-01** (20.20.2 → 22.23.2):

```bash
ssh raspylab 'set -e
echo "Node antes: $(node -v)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node después: $(node -v)"
'
```

**Notas:**

- Requiere `sudo` en la Pi (usuario `ajjimenezr`).
- Sustituye el paquete `nodejs` de NodeSource; el binario sigue en `/usr/bin/node` (compatible con `sipi.service`).
- Tras cambiar major de Node, **recompilar** la app (paso siguiente).

### Rebuild manual post-upgrade Node

Ejecutar cuando cambie Node en la Pi o cuando se quiera forzar rebuild sin esperar Drone:

```bash
ssh raspylab 'set -euo pipefail
cd ~/raspylab/production/sipi/app
git fetch origin main
git reset --hard origin/main
git log -1 --oneline

cd backend
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm ci --omit=dev

cd ../frontend
npm ci
npx vite build

cd ../backend
rm -rf public/* public/.* 2>/dev/null || true
cp -r ../frontend/dist/* public/

sudo systemctl restart sipi
sleep 5
sudo systemctl is-active sipi
curl -sf http://127.0.0.1:3001/health
echo ""
node -v
'
```

### Deploy automático (Drone)

Push a Gitea `main` dispara el pipeline (`.drone.yml`):

1. **clone-and-build** — `node:22-alpine`, `npm ci` + build en runner (validación).
2. **deploy** — SSH al Pi: mismo flujo git + npm + prisma + build + restart.

Monitoreo: `http://drone.raspylab.local` → repo `ajjimenezr/sipi`.

Consultar último build en la Pi:

```bash
ssh raspylab 'docker cp drone-server:/data/database.sqlite /tmp/d.db && python3 -c "
import sqlite3
c=sqlite3.connect(\"/tmp/d.db\")
for r in c.execute(\"\"\"SELECT build_number, build_status FROM builds
WHERE build_repo_id=(SELECT repo_id FROM repos WHERE repo_slug=?)
ORDER BY build_number DESC LIMIT 3\"\"\", (\"ajjimenezr/sipi\",)):
    print(r)
"'
```

### Troubleshooting

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `vite build` falla en deploy | Node &lt; 20.19 en Pi | Upgrade NodeSource 22.x + rebuild manual |
| `Could not resolve host` en git pull | `origin` mal configurado en Pi | Ver [README § CI/CD](../../README.md#cicd-y-lockfiles-gitea--drone) |
| Servicio no arranca | Build incompleto o `.env` | `journalctl -u sipi -n 50` |
| Health OK local, público falla | Traefik / Cloudflare | Fuera de alcance SIPI — ver raspylab-docs |

---

## Historial de cambios stack

| Fecha | Cambio |
|-------|--------|
| 2026-09-01 | Node 22 LTS (Mac `.nvmrc`, Drone, Pi NodeSource 22.23.2); Vite 8; react-router 8.3.1 |
| 2026-09-01 | Audit limpio; overrides `deepmerge-ts`, lockfiles refresh |
| 2026-07 | Hardening seguridad P0–P2; react-router 8.3.0 |
