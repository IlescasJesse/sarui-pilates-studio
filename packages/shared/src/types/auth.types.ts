export type Role = 'ADMIN' | 'INSTRUCTOR' | 'RECEPCIONISTA' | 'CLIENT'

export interface JWTPayload {
  id: string
  email: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: Role
  }
}
