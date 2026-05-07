# Roadmap

## Current Version: v0.2

### Phase: Stabilize Payment Flow
**Goal**: Ensure MercadoPago payment integration works reliably end-to-end
**Status**: pending
**Priority**: critical
- Add MERCADO_PAGO to PaymentMethod enum
- Fix webhook signature validation bypass
- Deduplicate membership activation logic
- Create Ingreso records on payment confirmation

### Phase: Fix Portal Bugs
**Goal**: Resolve known bugs in client portal
**Status**: pending
**Priority**: high
- Fix verificar-pago returning hardcoded CONFIRMED status
- Add portal cancellation endpoint with 5-hour policy
- Fix MEMBERSHIP_STATUS never set to EXHAUSTED in portal flow
- Remove QR code from buscar-cliente response

### Phase: Portal Security Hardening
**Goal**: Secure public-facing endpoints
**Status**: pending
**Priority**: high
- Add rate limiting to public portal endpoints
- Generate random PINs instead of default 0000
- Add force-change-PIN flow on first login
- Move tokens to httpOnly cookies for admin dashboard

### Phase: Performance Optimization
**Goal**: Improve page load and query performance
**Status**: pending
**Priority**: medium
- Add pagination to GET /portal/clases
- Extract CalendarioClases.tsx into sub-components
- Optimize spotsBooked stale snapshot computation
- Remove unused MongoDB connection if not needed

### Phase: Testing Infrastructure
**Goal**: Add test coverage for critical flows
**Status**: pending
**Priority**: medium
- Set up test runner (Vitest or Jest)
- Test webhook signature validation
- Test atomic spot booking pattern
- Test membership activation flow
- Test session counter consistency

### Phase: Email Notifications
**Goal**: Implement transactional email system
**Status**: pending
**Priority**: medium
- Integrate email service (Resend, SendGrid, or similar)
- Send tempPassword on account approval
- Send booking confirmations
- Send payment failure notifications
- Send cancellation confirmations
