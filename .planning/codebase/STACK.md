# Technology Stack

**Analysis Date:** 2026-05-05

## Languages

**Primary:**
- TypeScript 5.4.x (API) / 5.5.x (Web) - All application code in both `apps/api` and `apps/web`

**Secondary:**
- None — pure TypeScript monorepo

## Runtime

**Environment:**
- Node.js (no explicit version pinned; no `.nvmrc` or `.python-version` detected)

**Package Manager:**
- npm workspaces
- Root workspace: `sarui-studio` with `apps/*` and `packages/*` members
- Lockfile: present (`package-lock.json` inferred from npm workspaces)

## Frameworks

**Backend (`apps/api`):**
- Express 4.19.x — REST API server, mounted at `/api/v1`
- Prisma 5.14.x — ORM for MySQL; schema at `apps/api/prisma/schema.prisma`
- Mongoose 8.4.x — ODM for MongoDB; models at `apps/api/src/models/`

**Frontend (`apps/web`):**
- Next.js 16.2.x — App Router, SSR/CSR hybrid; entry at `apps/web/src/app/`
- React 18.3.x — UI rendering
- Tailwind CSS 3.4.x — Utility-first styling
- MUI (Material UI) 9.x + Emotion — Secondary component library used alongside Radix/shadcn
- Framer Motion 12.x — Animations

**Build/Dev:**
- ts-node-dev 2.x — API hot-reload in development
- Next.js Turbopack — Web dev server (configured in `apps/web/next.config.ts`)
- concurrently 8.2.x — Runs both apps in parallel via root `npm run dev`

## Key Dependencies

**Authentication:**
- `jsonwebtoken` 9.x — JWT signing/verification; dual-token architecture (access + refresh)
- `bcryptjs` 2.4.x — Password hashing

**Validation:**
- `zod` 3.23.x — Schema validation used in both API (`apps/api/src/config/env.ts`, validators) and Web (forms)

**API Client (Web):**
- `axios` 1.7.x — HTTP client; configured at `apps/web/src/lib/api-client.ts`
  - Bearer token injected from `localStorage` key `sarui_token`
  - 401 global handler clears storage and redirects to `/login`
  - Base URL: `NEXT_PUBLIC_API_URL` env var, default `http://localhost:4000/api/v1`

**Payments:**
- `mercadopago` 2.12.x (API SDK) — Server-side preference creation and payment retrieval
- `@mercadopago/sdk-react` 1.0.7 (Web SDK) — Client-side payment UI component

**Data Fetching (Web):**
- `@tanstack/react-query` 5.56.x — Server state management and caching
- `zustand` 4.5.x — Client-side UI state; store at `apps/web/src/store/uiStore.ts`

**QR Code:**
- `qrcode` 1.5.x — QR generation (API)
- `react-qr-code` 2.0.x — QR display (Web)
- `jsqr` 1.4.x — QR scanning (Web kiosk)

**UI Components:**
- `@radix-ui/*` — Accessible primitives (dialog, dropdown, label, separator, slot, toast, tooltip)
- `lucide-react` 0.436.x — Icon set
- `class-variance-authority` + `clsx` + `tailwind-merge` — shadcn/ui variant utilities

**Calendar:**
- `@fullcalendar/react` + `@fullcalendar/core` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid` + `@fullcalendar/interaction` 6.1.x — Schedule views

**Date Utilities:**
- `date-fns` 3.6.x — Date manipulation
- `dayjs` 1.11.x — Alternative date utility (used with MUI date pickers)
- `@mui/x-date-pickers` 9.x — Date picker components backed by dayjs

**Forms:**
- `react-hook-form` 7.53.x + `@hookform/resolvers` 3.9.x — Form state and Zod integration

**Notifications:**
- `sonner` 2.x — Toast notifications

**Security (API):**
- `helmet` 7.1.x — HTTP security headers
- `cors` 2.8.x — CORS (currently `origin: true`, credentials allowed)
- `express-rate-limit` 7.3.x — Rate limiting middleware
- `morgan` 1.10.x — HTTP request logging

**Other API Utilities:**
- `uuid` 10.x — UUID generation (QR codes for clients)
- `dotenv` 16.4.x — Environment variable loading

## Configuration

**Environment (API):**
- Loaded via `dotenv` and validated with Zod at `apps/api/src/config/env.ts`
- Required vars: `DATABASE_URL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`
- Optional in dev, required in production: `MP_WEBHOOK_SECRET`
- Defaults: `PORT=4000`, `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`, `FRONTEND_URL=http://localhost:3000`, `API_URL=http://localhost:4000`

**Environment (Web):**
- `NEXT_PUBLIC_API_URL` — API base URL for browser-side requests
- `API_BASE_URL` — API proxy target for Next.js rewrites (server-side)

**Build (API):**
- `apps/api/tsconfig.json` — TypeScript config; outputs to `dist/`

**Build (Web):**
- `apps/web/tsconfig.json` — strict mode, path alias `@/*` → `./src/*`, target ES2017
- `apps/web/next.config.ts` — Turbopack root at monorepo root; rewrites `/api/:path*` to API server

## Platform Requirements

**Development:**
- Run both apps: `npm run dev` from monorepo root (uses concurrently)
- Run API only: `npm run dev:api`
- Run Web only: `npm run dev:web`
- Migrate DB: `npm run migrate`
- Seed DB: `npm run seed`

**Production:**
- API entry: `node dist/server.js` (after `tsc` build)
- Web entry: `next start` (after `next build`)
- API listens on `localhost` only — requires reverse proxy for external access
- `MP_WEBHOOK_SECRET` is mandatory; startup is blocked by Zod validation if missing

---

*Stack analysis: 2026-05-05*
