export type ClassType = 'FLOW' | 'POWER' | 'MOBILITY' | 'MAT'

export type ClassSubtype = 'REFORMER' | 'MAT'

export interface Class {
  id: string
  instructorId: string
  type: ClassType
  subtype: ClassSubtype
  title?: string

  startAt: string   // ISO datetime string
  endAt: string     // ISO datetime string
  capacity: number
  spotsBooked: number

  location?: string
  notes?: string
  isActive: boolean
  isCancelled: boolean
  cancelReason?: string

  createdAt: string
  updatedAt: string
}

/** Evento con la forma que espera FullCalendar */
export interface CalendarEvent {
  id: string
  title: string
  start: string     // ISO datetime — startAt de la clase
  end: string       // ISO datetime — endAt de la clase
  extendedProps: {
    type: ClassType
    subtype: ClassSubtype
    instructorId: string
    instructorName: string
    capacity: number
    spotsBooked: number
    spotsAvailable: number
    isCancelled: boolean
  }
}
