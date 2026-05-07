# Testing Patterns

**Analysis Date:** 2026-05-05

## Test Framework

**Runner:** None detected

No test framework is configured in this codebase. Neither `jest.config.*` nor `vitest.config.*` files exist in `apps/api/` or `apps/web/`. Neither `apps/api/package.json` nor `apps/web/package.json` contain a `test` script. No `*.test.*` or `*.spec.*` files exist anywhere in the repo.

**Run Commands:**
```bash
# No test commands configured
npm run lint    # Only quality gate available (apps/web only)
```

## Current State

**Zero test coverage.** The codebase has no automated tests of any kind:
- No unit tests
- No integration tests
- No E2E tests
- No test utilities, fixtures, or factories

## Recommended Test Setup

Given the stack (Express API + Next.js frontend + Prisma + TanStack Query), these are the natural choices for each layer:

### API — Vitest + Supertest

```bash
# Install in apps/api
npm install -D vitest supertest @types/supertest
```

**`apps/api/vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { globals: true, environment: 'node' }
});
```

**Route integration test pattern:**
```typescript
// apps/api/src/routes/__tests__/clientes.routes.test.ts
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';

describe('GET /api/v1/clientes', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/clientes');
    expect(res.status).toBe(401);
  });
});
```

### Frontend — Vitest + React Testing Library

```bash
# Install in apps/web
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

**Hook test pattern:**
```typescript
// apps/web/src/hooks/__tests__/useClientes.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClientes } from '../useClientes';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

it('fetches clientes', async () => {
  const { result } = renderHook(() => useClientes(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

## What to Prioritize First

Given the complexity of business logic in this codebase, the highest-value tests to write first are:

**1. API route integration tests** — Most business logic lives in route handlers. Key files to cover:
- `apps/api/src/routes/portal.routes.ts` — reservation + payment flows with race-condition logic
- `apps/api/src/routes/clientes.routes.ts` — CRUD + soft delete
- `apps/api/src/routes/membresias.routes.ts` — session accounting

**2. Zod schema validation tests** — Schemas are defined inline in route files; extract and unit-test them:
- `clienteSchema` in `apps/api/src/routes/clientes.routes.ts`
- `reservaSchema`, `reservaProvSchema` in `apps/api/src/routes/portal.routes.ts`

**3. Utility unit tests:**
- `apps/api/src/utils/response.ts` — `ApiSuccess`, `ApiError` shape
- `apps/api/src/utils/jwt.ts` — token sign/verify

## Mocking

**What to mock in API tests:**
- `prisma` client — use `jest-mock-extended` or `vitest-mock-extended`
- External services: `apps/api/src/services/mercadopago.service.ts`

**What NOT to mock:**
- Zod validation logic — test it with real input
- `apps/api/src/utils/response.ts` — it is pure, test it directly

**Prisma mock pattern:**
```typescript
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

vi.mock('../../config/database', () => ({ prisma: mockDeep<PrismaClient>() }));
```

## Test File Location Convention (recommended)

Co-locate tests with source files in `__tests__/` subdirectories:

```
apps/api/src/routes/__tests__/clientes.routes.test.ts
apps/api/src/routes/__tests__/portal.routes.test.ts
apps/api/src/utils/__tests__/response.test.ts
apps/web/src/hooks/__tests__/useClientes.test.ts
apps/web/src/components/__tests__/ClientesTable.test.tsx
```

## Coverage

**Current:** 0%
**Enforced minimum:** None
**Recommended minimum for business-critical paths:**
- Route handlers: 80%
- Utility functions: 100%
- Zod schemas: 100%

## E2E Tests

**Framework:** Not configured.

Playwright would be the natural fit given Next.js. Not required immediately but beneficial for the portal booking + payment flow (`apps/web/src/app/portal/`).

---

*Testing analysis: 2026-05-05*
