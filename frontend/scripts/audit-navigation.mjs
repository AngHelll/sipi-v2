#!/usr/bin/env node
// Auditoría estática de navegación / control de acceso por rol.
//
// Cruza la configuración del menú (src/lib/navigation.ts) con las rutas
// declaradas en src/App.tsx para detectar incongruencias que NO atrapa el
// typecheck ni el linter, por ejemplo:
//
//   1. Entradas de menú que apuntan a una ruta inexistente (link roto).
//   2. Entradas de menú visibles para un rol cuya ruta lo rechazaría
//      (el usuario ve el botón, hace clic y lo rebota al dashboard).
//      Esta es exactamente la clase de bug de GroupsListPage (P0).
//   3. Rutas "huérfanas": páginas protegidas sin entrada de menú ni forma
//      evidente de alcanzarse (solo informativo).
//
// Uso:  node scripts/audit-navigation.mjs
// Sale con código 1 si hay hallazgos de severidad ERROR (apto para CI).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src');

const NAV_FILE = resolve(SRC, 'lib', 'navigation.ts');
const APP_FILE = resolve(SRC, 'App.tsx');

const ALL_ROLES = ['STUDENT', 'TEACHER', 'ADMIN'];

// Rutas que se alcanzan por redirección/lógica interna (no por menú).
// Evita falsos positivos de "ruta huérfana".
const REACHABLE_WITHOUT_NAV = [
  /^\/dashboard\/(student|teacher|admin)$/, // DashboardRedirect según rol
];

/** Extrae las entradas del menú: { label, path, roles[] }. */
function parseNavItems(text) {
  const items = [];
  const re = /\{\s*label:\s*'([^']+)',\s*path:\s*'([^']+)',\s*roles:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, label, path, rolesRaw] = m;
    const roles = [...rolesRaw.matchAll(/UserRole\.(\w+)/g)].map((r) => r[1]);
    items.push({ label, path, roles });
  }
  return items;
}

/**
 * Extrae las rutas de App.tsx: { path, kind, roles[], redirectTo }.
 * kind: 'protected' | 'authenticated' | 'public' | 'redirect'
 */
function parseRoutes(text) {
  const routes = [];
  // Cada chunk arranca en "<Route " y va hasta el siguiente "<Route ".
  const chunks = text.split(/<Route\b/).slice(1);
  for (const chunk of chunks) {
    const pathMatch = chunk.match(/path=["']([^"']+)["']/);
    if (!pathMatch) continue;
    const path = pathMatch[1];

    const navigateMatch = chunk.match(/<Navigate\s+to=["']([^"']+)["']/);
    const hasProtected = /<ProtectedRoute\b/.test(chunk);
    const allowedMatch = chunk.match(/allowedRoles=\{\[([^\]]*)\]\}/);

    if (navigateMatch && !hasProtected) {
      routes.push({ path, kind: 'redirect', roles: [], redirectTo: navigateMatch[1] });
    } else if (hasProtected && allowedMatch) {
      const roles = [...allowedMatch[1].matchAll(/UserRole\.(\w+)/g)].map((r) => r[1]);
      routes.push({ path, kind: 'protected', roles });
    } else if (hasProtected) {
      routes.push({ path, kind: 'authenticated', roles: ALL_ROLES });
    } else {
      routes.push({ path, kind: 'public', roles: ALL_ROLES });
    }
  }
  return routes;
}

/** Resuelve una ruta siguiendo redirecciones (máx. 5 saltos). */
function resolveRoute(path, routeByPath, hops = 0) {
  const route = routeByPath.get(path);
  if (!route) return null;
  if (route.kind === 'redirect' && hops < 5) {
    return resolveRoute(route.redirectTo, routeByPath, hops + 1);
  }
  return route;
}

function main() {
  const navItems = parseNavItems(readFileSync(NAV_FILE, 'utf8'));
  const routes = parseRoutes(readFileSync(APP_FILE, 'utf8'));
  const routeByPath = new Map(routes.map((r) => [r.path, r]));

  const findings = [];
  const add = (severity, message) => findings.push({ severity, message });

  // 1 + 2: cada entrada de menú debe tener ruta y permitir a sus roles.
  for (const item of navItems) {
    const resolved = resolveRoute(item.path, routeByPath);
    if (!resolved) {
      add('ERROR', `Menú "${item.label}" → ${item.path}: no existe una ruta que la atienda (link roto).`);
      continue;
    }
    if (resolved.kind === 'protected') {
      const blocked = item.roles.filter((role) => !resolved.roles.includes(role));
      if (blocked.length > 0) {
        add(
          'ERROR',
          `Menú "${item.label}" → ${item.path}: visible para [${blocked.join(', ')}] ` +
            `pero la ruta solo permite [${resolved.roles.join(', ')}]. Esos roles serían rebotados.`
        );
      }
    }
  }

  // 3: rutas protegidas sin entrada de menú (informativo).
  const navPaths = new Set(navItems.map((i) => i.path));
  const redirectTargets = new Set(
    routes.filter((r) => r.kind === 'redirect').map((r) => r.redirectTo)
  );
  for (const route of routes) {
    if (route.kind !== 'protected' && route.kind !== 'authenticated') continue;
    if (route.path.includes(':')) continue; // detalle/edición: se alcanza desde su lista
    if (/\/(new|edit|process-result)$/.test(route.path)) continue;
    if (navPaths.has(route.path)) continue;
    if (redirectTargets.has(route.path)) continue;
    if (REACHABLE_WITHOUT_NAV.some((re) => re.test(route.path))) continue;
    add('INFO', `Ruta "${route.path}" (${route.kind}) no tiene entrada de menú; verifica que sea alcanzable.`);
  }

  // Reporte
  const errors = findings.filter((f) => f.severity === 'ERROR');
  const infos = findings.filter((f) => f.severity === 'INFO');

  console.log('🔎 Auditoría de navegación / roles\n');
  console.log(`   Entradas de menú: ${navItems.length}`);
  console.log(`   Rutas declaradas: ${routes.length}\n`);

  if (errors.length === 0 && infos.length === 0) {
    console.log('✅ Sin incongruencias.');
    process.exit(0);
  }

  for (const f of errors) console.log(`  ❌ ERROR  ${f.message}`);
  for (const f of infos) console.log(`  ℹ️  INFO   ${f.message}`);

  console.log(`\n   ${errors.length} error(es), ${infos.length} aviso(s).`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
