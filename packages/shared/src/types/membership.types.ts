export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED' | 'SUSPENDED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'

export interface Membership {
  id: string
  clientId: string
  packageId: string
  status: MembershipStatus

  totalSessions: number
  sessionsUsed: number
  sessionsRemaining: number
  repositionUsed: boolean
  repositionSession?: string  // ISO date string

  startDate: string           // ISO date string
  expiresAt: string           // ISO date string

  /** Decimal serializado como string */
  pricePaid: string
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod

  notes?: string
  createdAt: string
  updatedAt: string
}
