import { useAuthStore } from '../store/auth'
import type { EmotionType } from '../types/emotion'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? `Request failed: ${res.status}`,
      res.status
    )
  }

  if (res.headers.get('content-type')?.includes('text/csv')) {
    return (await res.text()) as unknown as T
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// --- Auth ---
export function registerAccount(email: string, password: string) {
  return request<{ token: string; user: { id: string; email: string } }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export function loginAccount(email: string, password: string) {
  return request<{ token: string; user: { id: string; email: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

// --- Logs ---
export interface CreateLogInput {
  client_id: string // see offline-db.ts -- used for de-dupe if a queued log is retried
  emotion_type: EmotionType
  trigger_tags: string[]
  notes?: string | null
}

export function createLog(input: CreateLogInput) {
  const { client_id: _client_id, ...body } = input
  return request('/api/logs', { method: 'POST', body: JSON.stringify(body) })
}

export function fetchLogs(params: { start_date?: string; end_date?: string } = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString()
  return request<{ logs: unknown[] }>(`/api/logs${qs ? `?${qs}` : ''}`)
}

export function exportLogsCsv(startDate: string, endDate: string): Promise<string> {
  return request<string>(`/api/logs/export?start_date=${startDate}&end_date=${endDate}`)
}

// --- User ---
export function updateOneSignalPlayerId(playerId: string) {
  return request('/api/user/onesignal-player-id', {
    method: 'PATCH',
    body: JSON.stringify({ player_id: playerId })
  })
}
