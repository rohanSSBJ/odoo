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
  finalOdometer?: number | null
  fuelConsumed?: number | null
  revenue?: number | null
  vehicle?: { id: string; regNo: string; name: string; status: string }
  driver?: { id: string; name: string; licenseNo: string; status: string }
}

export interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface MaintenanceLog {
  id: string
  vehicleId: string
  type: string
  cost: number
  notes?: string | null
  isOpen: boolean
  openedAt: string
  closedAt?: string | null
  vehicle?: { id: string; regNo: string; name: string; status: string }
}

export interface FuelLog {
  id: string
  vehicleId: string
  tripId?: string | null
  liters: number
  cost: number
  date: string
  vehicle?: { id: string; regNo: string; name: string }
}

export interface Expense {
  id: string
  vehicleId: string
  category: string
  amount: number
  date: string
  vehicle?: { id: string; regNo: string; name: string }
}

export interface CostRollup {
  vehicleId: string | null
  fuelCost: number
  expenseCost: number
  maintenanceCost: number
  operationalCost: number
  totalCost: number
}

export interface VehicleReportRow {
  regNo: string
  name: string
  type: string
  status: string
  odometer: number
  acquisitionCost: number
  fuelCost: number
  maintenanceCost: number
  revenue: number
  roi: number
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
  create: (body: Partial<Vehicle>) =>
    api.post<Vehicle>('/vehicles', body).then((r) => r.data),
  update: (id: string, body: Partial<Vehicle>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/vehicles/${id}`).then((r) => r.data),
}

export const DriversApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<Paginated<Driver>>('/drivers', { params }).then((r) => r.data),
  create: (body: Partial<Driver>) =>
    api.post<Driver>('/drivers', body).then((r) => r.data),
  update: (id: string, body: Partial<Driver>) =>
    api.patch<Driver>(`/drivers/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/drivers/${id}`).then((r) => r.data),
}

export const MaintenanceApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<Paginated<MaintenanceLog>>('/maintenance', { params }).then((r) => r.data),
  open: (body: { vehicleId: string; type: string; cost?: number; notes?: string }) =>
    api.post<MaintenanceLog>('/maintenance', body).then((r) => r.data),
  close: (id: string, body: { cost?: number; notes?: string } = {}) =>
    api.post<MaintenanceLog>(`/maintenance/${id}/close`, body).then((r) => r.data),
}

export const FuelExpensesApi = {
  listFuel: (params: Record<string, unknown> = {}) =>
    api.get<Paginated<FuelLog>>('/fuel-logs', { params }).then((r) => r.data),
  createFuel: (body: { vehicleId: string; liters: number; cost: number; tripId?: string }) =>
    api.post<FuelLog>('/fuel-logs', body).then((r) => r.data),
  listExpenses: (params: Record<string, unknown> = {}) =>
    api.get<Paginated<Expense>>('/expenses', { params }).then((r) => r.data),
  createExpense: (body: { vehicleId: string; category: string; amount: number }) =>
    api.post<Expense>('/expenses', body).then((r) => r.data),
  rollup: (vehicleId?: string) =>
    api
      .get<CostRollup>('/expenses/rollup', { params: vehicleId ? { vehicleId } : {} })
      .then((r) => r.data),
}

export const AnalyticsApi = {
  kpis: () => api.get<Kpis>('/analytics/kpis').then((r) => r.data),
  report: () =>
    api.get<VehicleReportRow[]>('/analytics/reports', { params: { format: 'json' } }).then((r) => r.data),
  downloadCsv: () =>
    api.get('/analytics/reports', { params: { format: 'csv' }, responseType: 'blob' }).then((r) => r.data as Blob),
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
