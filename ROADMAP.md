# Roadmap

## Current Version: v0.4 — Portal & Tienda

### Phase: Portal → Tienda Refactor
**Goal**: Rename /portal to /tienda, update all routing, fix redirects
**Status**: ✓ complete
**Priority**: high
- Rename all /portal pages to /tienda
- Update next.config.ts with redirects
- Fix all internal links to point to new routes
- Update PreciosSection CTA to login redirects
- Create /tienda/paquetes redirect to /tienda/membresia

### Phase: Email Integration
**Goal**: Transactional emails for account setup and password reset
**Status**: ✓ complete
**Priority**: high
- Integrate Resend API (setup + reset templates)
- Create forgot/reset password flow (olvide-contrasena, restablecer-contrasena)
- Create setup password flow (crear-contrasena with zod + eye toggle)
- Hardened password endpoints with explicit findUnique + deleted check

### Phase: Session & Auth Management
**Goal**: Secure client sessions with JWT, rate limiting, sanitization
**Status**: ✓ complete
**Priority**: high
- Create auth-client.ts utility (JWT decode, session validation)
- Reactive auth state (custom events + storage listener)
- 24h JWT expiry, portalAuthClient with token interceptor
- Global rate limiting (100 req/min API, 20 req/min portal)
- Input sanitization middleware (strip HTML, trim, control chars)
- Zod .trim() on all 84 string schemas
- Secure headers (CSP, HSTS, COEP/COOP, CORS restricted)

### Phase: Landing Page Polish
**Goal**: Professional landing page with real data and gallery
**Status**: ✓ complete
**Priority**: medium
- ClasesSection with real API data (was hardcoded)
- GaleriaSection with staggered grid + lightbox + keyboard nav
- HeroSection restored to original dark-green with orbs, single CTA
- Unified CTA buttons (all → /tienda/login?redirect=...)
- Logo replaced with clean text SARUI (removed glow/bg artifacts)

### Phase: Payment Flow Stabilization
**Goal**: Fix MercadoPago package purchase (502 error)
**Status**: in-progress
**Priority**: critical
- Fix notification_url conditional (only HTTPS in prod)
- Fix auto_return / back_urls conditional (MP prod rejects HTTP localhost)
- Add clear error handling with MP error logging
- Missing: switch to TEST credentials for local dev

### Phase: Store UI
**Goal**: Professional tienda/membresia page
**Status**: ✓ complete
**Priority**: medium
- 3-column grid grouped by actividad with tinted backgrounds
- Cards with stagger entrance animation (cardIn keyframe)
- Badges for sesión única (amber with star) vs X sesiones
- Harmonious outline buttons with cart icon on hover
- Active membership banner with gradient

### Phase: Production Readiness
**Goal**: Environment config and deploy documentation
**Status**: ✓ complete
**Priority**: medium
- Add RESEND_API_KEY / RESEND_FROM_EMAIL to .env.production
- Fix trailing slashes in production URLs
- Remove dead NEXTAUTH config
- Add email setup instructions to DEPLOY.md

### Backlog
**Priority**: medium
- Pagination on GET /portal/clases
- Portal cancellation endpoint with 5-hour policy
- Exhausted membership status automation
- Testing infrastructure (Vitest)
- Dashboard contable (deferred)
