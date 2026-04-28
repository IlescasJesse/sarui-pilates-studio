export type CheckInMethod = 'QR' | 'PIN' | 'MANUAL'

export interface CheckInRequest {
  qrCode?: string
  pin?: string
}

export interface CheckInResponse {
  success: boolean
  client?: {
    firstName: string
    lastName: string
    sessionsRemaining: number
  }
  class?: {
    title: string
    type: string
    startAt: string
    instructor: string
  }
  message: string
  checkedInAt: string
}
