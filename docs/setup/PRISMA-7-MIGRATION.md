# Migración Prisma 6 → 7

**Branch:** `chore/prisma-7-upgrade`  
**Estado:** listo para merge tras validar en Pi staging/prod.

---

## Qué cambió

| Área | Antes (v6) | Después (v7) |
|------|------------|--------------|
| Generator | `prisma-client-js` en `node_modules` | `prisma-client` → `src/generated/prisma` |
| Config CLI | `schema.prisma` + `url` en schema | `prisma.config.ts` + schema sin `url` |
| Runtime | `new PrismaClient()` | `new PrismaClient({ adapter })` |
| MySQL driver | Rust engine interno | `@prisma/adapter-mariadb` + `mariadb` |
| Imports | `@prisma/client` | `@/db/client` o `createPrismaClient()` |
| Build | `tsc` | `prisma generate && tsc` |
| Generated | en `node_modules` | `backend/src/generated/` (gitignored) |

---

## Archivos clave

- `backend/prisma.config.ts` — URL y migraciones para CLI
- `backend/prisma/schema.prisma` — generator + models (sin `datasource.url`)
- `backend/src/config/create-prisma-client.ts` — factory con adapter
- `backend/src/db/client.ts` — re-export tipos/enums para la app
- **Imports:** rutas relativas a `db/client` (no `@/` — tsc no resuelve paths en runtime CJS)
- `backend/jest.setup.ts` — `DATABASE_URL` dummy para tests

---

## Comandos locales

```bash
cd backend
npm ci
npm run prisma:generate   # regenera src/generated/prisma
npm run build
npm test
npx prisma migrate deploy  # prod/staging
npx prisma studio
```

---

## Deploy (Pi / Drone)

El pipeline ya ejecuta `npx prisma generate` antes del build en deploy SSH.  
Tras merge a `main`, un push a Gitea dispara rebuild automático.

**Validación post-merge en Pi:**

```bash
ssh raspylab 'node -v && curl -sf http://127.0.0.1:3001/health'
ssh raspylab 'cd ~/raspylab/production/sipi/app && git log -1 --oneline'
```

---

## Rollback

Si Prisma 7 falla en prod:

```bash
git revert <commit-prisma-7>
git push gitea main
# Drone redeploy → vuelve a Prisma 6
```

No hay migración SQL nueva — rollback es solo de código/npm.

---

## Override `mariadb`

Tras Prisma 7, forzar `mariadb@^3.5.3` (adapter `@prisma/adapter-mariadb` arrastraba 3.4.x con advisories). Verificar en cada upgrade de Prisma.

## Override `deepmerge-ts`

Revisar tras merge si `npm audit` sigue limpio sin override en `package.json`.

---

## Referencias

- [Upgrade Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [NODE-STACK.md](NODE-STACK.md)
