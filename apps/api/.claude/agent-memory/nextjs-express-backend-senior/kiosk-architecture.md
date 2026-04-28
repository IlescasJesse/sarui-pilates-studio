---
name: Kiosk Module Complete Architecture
description: End-to-end design and implementation of the public check-in kiosk for clients
type: project
---

## Overview

El módulo Kiosk es un sistema de check-in público para que clientes de Sarui Studio registren su asistencia usando QR o PIN de 4 dígitos desde una tablet en recepción. No requiere autenticación JWT.

## Backend Architecture

### Endpoint Specification
- **Route**: `POST /api/v1/kiosk/checkin`
- **Auth**: Public (no JWT required)
- **Rate Limit**: 20 req/min per IP
- **Request Body**: Zod-validated union type
  - `{ qrCode: string }` OR
  - `{ pin: "1234" }` (exactly 4 digits)

### Controller Flow (`kiosk.controller.ts`)
1. Validate input with Zod schema
2. Extract IP from headers
3. Call `checkIn(input, ip)`
4. Return `ApiSuccess(res, result)` with wrapper `{ success: true, data: T }`

### Service Logic (`kiosk.service.ts`)
1. **Find Client**
   - QR: Direct lookup via `qrCode` index
   - PIN: Fetch all non-deleted clients, compare PIN with bcrypt (linear scan needed due to async comparison)
   
2. **Validate Client**
   - Check `deletedAt` is null
   - Log to MongoDB on failure
   
3. **Find Reservation**
   - Status CONFIRMED
   - Class within ±15 min window (CHECKIN_WINDOW_MINUTES)
   - Class active and not cancelled
   - Order by startAt ASC (get earliest/closest class)
   
4. **Calculate Attendance Status**
   - ON_TIME: Check-in within first 10 min of class start (ON_TIME_WINDOW_MINUTES)
   - LATE: Check-in after 10 min
   
5. **Update Database** (atomic operations)
   - Create Attendance record with status
   - Update Reservation: status = ATTENDED, checkedInAt = now
   - Decrement Membership.sessionsRemaining, increment sessionsUsed
   - If sessionsRemaining <= 0, set status = EXHAUSTED
   
6. **Audit Logging**
   - Create AttendanceLog in MongoDB with success/denial reason
   - Include IP address

### Response Structure

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "cliente": {
      "nombre": "Juan Pérez",
      "clase": "FLOW MAT",
      "sesionesRestantes": 5
    },
    "status": "ON_TIME",
    "message": "Check-in exitoso — a tiempo!"
  }
}
```

**Errors**:
- 404 CLIENT_NOT_FOUND: Invalid QR/PIN or client deleted
- 404 RESERVATION_NOT_FOUND: No active reservation in time window
- 429 RATE_LIMIT_EXCEEDED: Too many attempts

## Frontend Architecture

### Page Structure
- **URL**: `/kiosk` (public route, no navbar/sidebar)
- **Layout**: Fullscreen dark (#254F40), centered content
- **Responsive**: Works on tablets and mobile

### State Management (React)
```typescript
mode: "idle" | "qr" | "pin"
successData: CheckInSuccess | null
autoResetTimer: NodeJS.Timeout | null
```

### Screen States

1. **Idle (Welcome)**: Logo, two large buttons (QR/PIN), footer
2. **QR Scanner**: Camera viewfinder with animation, real-time QR decoding
3. **PIN Pad**: 3x4 numeric keypad, PIN dots display, auto-submit at 4 digits
4. **Success**: Client name, class name, attendance status (ON_TIME/LATE), sessions remaining, 3s auto-reset
5. **Error**: Error message in scanner/pad, 2-2.5s reset to scanning/idle

### Component Details

**QRScanner.tsx**
- Uses `jsQR` library for client-side decoding (no backend processing)
- MediaDevices.getUserMedia with environment camera (tablet rear)
- Canvas-based frame capture and QR detection
- Handles camera permission errors gracefully
- Passes decoded data to `/kiosk/checkin` endpoint
- Supports retry on error (404, 429)

**PINPad.tsx**
- Physical numpad layout (0-9 + delete)
- Input visualization with dots (security)
- Auto-submit when 4 digits entered
- Delete key clears last digit and resets error state
- Disables buttons during processing

**Page.tsx**
- Manages navigation between modes
- Handles success data display and 3s countdown
- Cleanup of timers on unmount
- Passes `onSuccess` callback to children

## API Client Integration

Frontend axios client (`api-client.ts`) returns `res.data` which contains:
```json
{ success: boolean, data: T, error?: { code, message } }
```

So accessing the payload requires: `res.data.data`

This is handled in both QRScanner and PINPad when parsing the response.

## Data Flow Diagram

```
CLIENT INTERACTION:
  |
  +-- QR Scanner --> Camera --> jsQR decoding
  |                             |
  +-- PIN Pad -----> 4 digits --+
                                |
                    POST /kiosk/checkin
                                |
                    Backend: Find Client
                                |
                    Find Reservation (±15 min)
                                |
                    Check Status (ON_TIME/LATE)
                                |
        +-----------+-----------+
        |           |           |
     Create      Update      Decrement
   Attendance  Reservation  Sessions
        |           |           |
        +-----+-----+-----+-----+
              |
        Response + Logging
              |
        Frontend: Success Screen
              |
         3s countdown
              |
         Reset to Welcome
```

## Database Schema Relations

- **Client** 1..* **Reservation** (one client has many reservations)
- **Client** 1..* **Attendance** (track who attended)
- **Reservation** 1..1 **Attendance** (each reservation can have max 1 attendance record)
- **Reservation** --* **Class** (reservation is for a specific class)
- **Reservation** --* **Membership** (optional, null for walk-ins)
- **Membership** 1..* **Reservation** (one membership covers multiple classes)

## Security Considerations

- ✅ PIN stored hashed with bcrypt (SALT_ROUNDS=12)
- ✅ QR as UUID unique per client
- ✅ Rate limiting to prevent brute force (20/min per IP)
- ✅ No JWT required (endpoint is public)
- ✅ All audit logs include IP and result
- ✅ Zod validation on request
- ✅ No sensitive data exposed in error messages

## Performance Notes

- Linear PIN lookup is O(n) worst case. Acceptable for MVP with <500 clients.
- Future optimization: Store hash of PIN in indexed column, or use Redis for PIN -> clientId mapping
- QR lookup is O(1) via index
- Reservation query uses indexed fields (clientId, status, class.startAt)

## Testing Checklist

- [x] QR scan with valid code → success, data displayed
- [x] PIN entry with valid PIN → success, data displayed
- [x] Invalid QR/PIN → 404, error message shown
- [x] No reservation in time window → 404, error shown
- [x] Rate limit (21 requests in 60s) → 429, error shown
- [x] Auto-reset to welcome after 3s success
- [x] Membership sessions decremented correctly
- [x] Attendance record created with correct status
- [x] MongoDB audit log entries
- [x] ON_TIME vs LATE determination correct

## Known Limitations & Future Work

1. **PIN Lookup Performance**: Linear scan of all clients (can be indexed/cached)
2. **No Recheck-out**: Only check-in supported, no check-out flow
3. **No SMS/Email**: Success notifications not sent to client
4. **No Staff Dashboard**: Real-time check-in view for receptionist not implemented
5. **No Payment Validation**: Doesn't check if membership is paid (assumes pre-booking)
6. **Fixed Windows**: 15-min check-in and 10-min on-time windows are hardcoded
