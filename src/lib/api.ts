import { getStoredAuth } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = getStoredAuth()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
