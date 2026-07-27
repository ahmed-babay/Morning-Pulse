interface Envelope<T> {
  data: T
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    ...(signal ? { signal } : {}),
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string }
    } | null
    throw new Error(payload?.error?.message ?? 'This update is unavailable')
  }
  return ((await response.json()) as Envelope<T>).data
}
