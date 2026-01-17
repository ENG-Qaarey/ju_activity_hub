# JU Activity Hub Backend

This folder contains the NestJS + Prisma API that powers the JU Activity Hub dashboard. Use this README as a single reference for installing dependencies, configuring the environment, running the server, and maintaining the database.

## Stack Overview
- **Runtime:** Node.js 20+ (tested with npm)
- **Framework:** NestJS 11
- **Database:** PostgreSQL via Prisma ORM (`@prisma/client` + `@prisma/adapter-pg`)
- **Authentication:** JWT bearer tokens issued by `AuthService`
- **Other deps:** Clerk backend SDK, bcrypt, nodemailer, Google OAuth client

## Prerequisites
1. Node.js 20+ and npm
2. PostgreSQL instance (local or hosted). Prisma Data Platform URL is documented in `DATABASE_CONNECTION.md`.
3. (Optional) ts-node installed globally for running scripts faster.

## Environment Variables
Copy `.env.example` to `.env`, then update the values:

```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"
PORT=3001
FRONTEND_URLS="http://localhost:8080"
JWT_SECRET="dev-secret-change-me"
CLERK_SECRET_KEY=sk_your_key
CLERK_WEBHOOK_SECRET=whsec_your_secret
```

> See `DATABASE_CONNECTION.md`, `FIX_DATABASE_URL.md`, and `SETUP_DATABASE.md` for official connection strings and troubleshooting tips. Summaries of each doc are included below for quick reference.

### Database Docs Overview
- **DATABASE_CONNECTION.md** – Lists the managed Prisma Data Platform URL (host `db.prisma.io`), shows exactly how to drop it into `.env`, and walks through connection testing plus admin creation. Use this when you need the cloud connection string.
- **FIX_DATABASE_URL.md** – Troubleshoots common local Postgres mistakes (placeholder creds, missing password, wrong port, special characters) and explains how to encode credentials properly. Use this if authentication fails or Prisma Studio cannot log in.
- **SETUP_DATABASE.md** – End-to-end onboarding for the remote database: set `.env`, test connectivity, run migrations, seed the admin, and verify via Prisma Studio. Follow this when spinning up a fresh environment.

## Install Dependencies
```bash
cd backend
npm install
```

## Core Commands
| Purpose | Command |
| --- | --- |
| Start dev server (watch mode) | `npm run start:dev` |
| Start production build | `npm run start:prod` (after `npm run build`) |
| Compile TypeScript | `npm run build` |
| Run unit tests | `npm test` |
| Run e2e tests | `npm run test:e2e` |
| Lint + fix | `npm run lint` |
| Format sources | `npm run format` |

## Database Workflow
1. **Verify DATABASE_URL:** ensure `backend/.env` points to a reachable PostgreSQL database (local or `db.prisma.io`).
2. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```
3. **Seed data:**
   ```bash
   npm run seed
   ```
4. **Reset & reseed:** (drops data defined in `prisma/seed.ts`)
   ```bash
   npm run reset-db
   ```
5. **Inspect DB:**
   ```bash
   npx prisma studio
   # or add a package script `"prisma:studio": "prisma studio"`
   ```
6. **Connectivity test:**
   ```bash
   npm run test-db-connection
   ```

### Prisma Command Reference
Run these from `backend/` with the correct `.env` loaded:

| Action | Command | Notes |
| --- | --- | --- |
| Generate client | `npx prisma generate` | Re-run after editing `schema.prisma` if no migration is needed |
| Create migration | `npx prisma migrate dev --name <change>` | Updates DB + commits SQL under `prisma/migrations` |
| Apply migrations (prod) | `npx prisma migrate deploy` | Runs pending migrations without prompting |
| Push schema (no migration) | `npx prisma db push` | Directly syncs schema; avoid on prod unless you know the impact |
| Inspect existing DB | `npx prisma db pull` | Reverse-engineers schema into `schema.prisma` |
| Open Prisma Studio | `npx prisma studio` | Web UI for browsing/editing tables |
| Format schema | `npx prisma format` | Ensures canonical formatting of `schema.prisma` |

## Admin Utilities
| Action | Command |
| --- | --- |
| Check if admin exists | `npm run check-admin` |
| Initial admin setup | `npm run setup-admin` |
| Complete admin workflow | `npm run setup-admin-complete` |
| Create Clerk user (see ADMIN_SETUP.md) | `npm run create-clerk-user` |

## Auth API Quick Reference
- `POST /api/auth/register` – create user + hashed password
- `POST /api/auth/login` – returns `{ token, user }`; token must be sent as `Authorization: Bearer <token>` to any protected route
- `GET /api/auth/me` – requires JWT, returns the hydrated user from Prisma

See `src/auth`, `src/authz`, and `src/users` for implementation details. `JwtAuthGuard` enforces bearer tokens and validates password versioning.

## Directory Highlights
- `prisma/schema.prisma` – models, enums, relations (keep in sync with migrations)
- `src/prisma/prisma.service.ts` – Prisma client with `PrismaPg` adapter
- `src/activities`, `src/applications`, etc. – resource modules
- `src/scripts` – helper scripts (`test-db-connection.ts`, etc.)

## Troubleshooting
- **`EAI_AGAIN` / `DatabaseNotReachable`:** host unreachable; check VPN/firewall, or switch to local Postgres (`DATABASE_FIX.md`).
- **`Missing Authorization Bearer token`:** attach the JWT from `/api/auth/login` to protected endpoints.
- **Auth failures after password change:** tokens embed `passwordVersion`; re-login to get a fresh token.

For deeper context read `ADMIN_SETUP.md`, `SETUP_DATABASE.md`, and `WEBHOOK_SETUP.md` in this folder.
