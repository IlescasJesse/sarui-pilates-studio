export type ReservationOrigin = 'MEMBERSHIP' | 'WALK_IN'

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'ATTENDED' | 'LATE'

export interface Reservation {
  id: string
  clientId: string
  classId: string
  membershipId?: string       // null si es walk-in / sesión suelta

  origin: ReservationOrigin
  status: ReservationStatus

  cancelledAt?: string        // ISO datetime string
  cancelReason?: string
  /** true = cancelado a tiempo (>= 5 h antes), no descuenta sesión */
  cancelledOnTime?: boolean

  checkedInAt?: string        // ISO datetime string

  notes?: string
  createdAt: string
  updatedAt: string
}
