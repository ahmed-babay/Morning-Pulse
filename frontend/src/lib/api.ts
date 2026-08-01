interface Envelope<T> {
  data: T
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export class ApiClientError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
  }
}

async function parseError(response: Response): Promise<never> {
  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string; code?: string }
  } | null
  throw new ApiClientError(
    payload?.error?.message ?? 'This update is unavailable',
    payload?.error?.code ?? 'unknown_error',
  )
}

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    ...(signal ? { signal } : {}),
  })
  if (!response.ok) return parseError(response)
  return ((await response.json()) as Envelope<T>).data
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  })
  if (!response.ok) return parseError(response)
  return ((await response.json()) as Envelope<T>).data
}
