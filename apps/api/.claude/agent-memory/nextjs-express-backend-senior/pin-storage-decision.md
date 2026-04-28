---
name: PIN Storage and Comparison Implementation
description: Decision to use bcrypt for PIN storage and sync comparison pattern
type: project
---

## Decision: PIN Hashing with Bcrypt

**Status**: Implemented with async comparison pattern

**Why:** PIN data is security-sensitive. Even though it's only 4 digits, it should not be stored in plaintext.

**How to apply:** 
- PIN always hashed via bcrypt when stored (SALT_ROUNDS=12)
- Database seed uses `bcrypt.hash('1234', 10)` for test clients
- During check-in, compare plaintext PIN against all hashed PINs

## Implementation Details

### Storage
- Model: `Client.pin` (String)
- Example seed value: `await bcrypt.hash('1234', 10)` → `$2a$10$...` hash string
- No unique constraint (multiple clients could have same PIN temporarily)

### Comparison Pattern (Sync Lookup Problem)

**Challenge**: Prisma queries are sync, but `bcrypt.compare()` is async. Can't use `.where()` directly.

**Solution**: Fetch all non-deleted clients, iterate and compare in-memory.

```typescript
// In kiosk.service.ts
const clients = await prisma.client.findMany({
  where: { deletedAt: null },
});

for (const c of clients) {
  try {
    const isMatch = await comparePassword(payload.pin, c.pin);
    if (isMatch) {
      client = c;
      break;
    }
  } catch {
    // Invalid hash format, skip
    continue;
  }
}
```

**Pros:**
- Secure: PIN never stored plaintext
- Simple: Uses standard bcrypt utility
- Safe: No SQL injection risk

**Cons:**
- O(n) lookup instead of O(1)
- Acceptable for MVP (< 500 clients)

## Future Optimizations

1. **Index-based Lookup** (Recommended for scale)
   - Create custom PIN hash function that's deterministic
   - Store hash in indexed column `pinHash VARCHAR(255) UNIQUE`
   - Query: `findUnique({ where: { pinHash: hashPin(userInput) } })`
   - Trade-off: PIN becomes comparable across different hash algorithms

2. **Redis Cache**
   - Cache `PIN -> clientId` mapping in Redis
   - Set TTL to match PIN validity period
   - Faster O(1) lookup without DB round trip

3. **Two-Factor PIN**
   - Combine PIN with birthDate or phone for additional validation
   - Reduces effectiveness of brute force attempts

## Security Notes

- **Bcrypt Salt Rounds**: 12 (current standard, ~1s per hash on modern hardware)
- **Brute Force Protection**: Achieved through rate limiting (20 req/min per IP)
- **Invalid Hash Format**: Caught in try-catch and client skipped (graceful degradation)

## Related Code

- Utility: `apps/api/src/utils/bcrypt.ts` (hashPassword, comparePassword)
- Service: `apps/api/src/services/kiosk.service.ts` (PIN lookup logic, lines 34-56)
- Seed: `apps/api/src/database/seed.ts` (test client PIN hashing)
