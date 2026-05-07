# Sarui Studio

## Overview
Sarui Studio is a monorepo-based fitness studio management platform for managing classes, clients, instructors, memberships, payments, and reservations. It provides both an admin dashboard for staff and a public client portal for booking and payments.

## Architecture
- **Monorepo**: npm workspaces
- **Backend**: Express + TypeScript + Prisma (MySQL) + Mongoose (MongoDB)
- **Frontend**: Next.js 15 App Router + React + TypeScript + Tailwind
- **Payments**: MercadoPago SDK integration
- **Auth**: JWT Bearer tokens (access 15m, refresh 7d)

## Key Domains
- Client management (clientes)
- Class scheduling (clases)
- Reservations (reservaciones)
- Memberships (membresias)
- Packages (paquetes)
- Instructors (instructores)
- Accounting (contabilidad)
- Kiosk check-in
- Public portal with booking and payment flows

## Tech Stack
- Node.js, TypeScript 5.4+
- Express 4.19, Next.js 15
- Prisma 5.14 (MySQL), Mongoose 8.4 (MongoDB)
- TanStack Query 5.56, Zustand 4.5
- MercadoPago 2.12
- Zod 3.23, JWT 9.x

## Dev Commands
- `npm run dev` — Run both apps
- `npm run dev:api` — Run API only (port 4000)
- `npm run dev:web` — Run Web only (port 3000)
- `npm run migrate` — Run Prisma migrations
- `npm run seed` — Seed database

## Project Context
- Brand colors: `#254F40` (dark green), `#F6FFB5` (accent), `#FDFFEC` (light)
- Spanish domain names in code and UI
- API responses use `{ success: true/false, data/error }` envelope
- Files should stay under 500 lines
- No test framework currently set up
- MongoDB connection exists but unused for domain logic
- Portal and dashboard are separate UX contexts with no shared auth state
