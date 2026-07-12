import axios, { AxiosError } from 'axios'

// Same-origin: Nginx serves the SPA at / and proxies /api -> NestJS :3000.
// In dev, Vite proxy (see vite.config.ts) forwards /api to the deployed box.
export const api = axios.create({ baseURL: '/api' })

const TOKEN_KEY = 'transitops.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && getToken()) {
      // token expired/invalid — clear and bounce to login
      setToken(null)
      if (!location.pathname.startsWith('/login')) location.assign('/login')
    }
    return Promise.reject(error)
  },
)

/** Extract a human-readable message from an axios error (API returns { message }). */
export function apiError(err: unknown): string {
  const e = err as AxiosError<{ message?: string | string[]; error?: string }>
  const data = e.response?.data
  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message
  }
  if (e.message) return e.message
  return 'Something went wrong'
}

// ---- Domain types (mirror Prisma models) ----
export type Role =
  | 'FLEET_MANAGER'
  | 'DRIVER'
  | 'SAFETY_OFFICER'
  | 'FINANCIAL_ANALYST'

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface Vehicle {
  id: string
  regNo: string
  name: string
  type: string
  maxLoadKg: number
  odometer: number
  acquisitionCost: number
  status: VehicleStatus
  createdAt: string
}

export interface Driver {
  id: string
  name: string
  licenseNo: string
  licenseCategory: string
  licenseExpiry: string
  contact?: string | null
  safetyScore: number
  status: DriverStatus
}

export interface Trip {
  id: string
  source: string
  destination: string
  cargoWeight: number
  plannedDistance: number
  status: TripStatus
  createdAt: string
  vehicle?: { id: string; regNo: string; name: string; status: string }
  driver?: { id: string; name: string; licenseNo: string; status: string }
}

export interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface Kpis {
  fleetUtilizationPct: number
  fuelEfficiency: number
  operationalCost: number
  fuelCost: number
  maintenanceCost: number
  totalRevenue: number
  fleetRoi: number
  counts: {
    vehicles: { total: number; byStatus: Record<string, number> }
    drivers: { byStatus: Record<string, number> }
    trips: { byStatus: Record<string, number> }
  }
  alerts: {
    expiredLicenses: number
    expiringLicenses: number
    openMaintenance: number
  }
}

// ---- Endpoint helpers ----
export const AuthApi = {
  login: (email: string, password: string) =>
    api
      .post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      })
      .then((r) => r.data),
  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),
}

export const VehiclesApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<Paginated<Vehicle>>('/vehicles', { params }).then((r) => r.data),
}

export const DriversApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<Paginated<Driver>>('/drivers', { params }).then((r) => r.data),
}

export const TripsApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<Paginated<Trip>>('/trips', { params }).then((r) => r.data),
  create: (body: {
    source: string
    destination: string
    vehicleId: string
    driverId: string
    cargoWeight: number
    plannedDistance: number
  }) => api.post<Trip>('/trips', body).then((r) => r.data),
  dispatch: (id: string) =>
    api.post<Trip>(`/trips/${id}/dispatch`).then((r) => r.data),
  complete: (id: string, body: { finalOdometer: number; fuelConsumed: number; revenue?: number }) =>
    api.post<Trip>(`/trips/${id}/complete`, body).then((r) => r.data),
  cancel: (id: string) => api.post<Trip>(`/trips/${id}/cancel`).then((r) => r.data),
}

export const AnalyticsApi = {
  kpis: () => api.get<Kpis>('/analytics/kpis').then((r) => r.data),
}
