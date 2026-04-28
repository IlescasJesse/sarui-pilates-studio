export type PackageCategory = 'REFORMER' | 'MAT' | 'MIX'

export type ClassSubtype = 'REFORMER' | 'MAT'

export interface Package {
  id: string
  name: string
  category: PackageCategory
  classSubtype?: ClassSubtype   // null/undefined para MIX
  sessions: number
  /** Decimal serializado como string para JSON (evita pérdida de precisión) */
  price: string
  validityDays: number
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}
