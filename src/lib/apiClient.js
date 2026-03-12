export async function fetchJson(path, options = {}) {
  const res = await fetch(path, {
    cache: 'no-store',
    ...options,
  })

  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    return {
      data: null,
      error: payload?.error || res.statusText || 'Request failed',
      status: res.status,
    }
  }

  return {
    data: payload?.data ?? payload,
    error: payload?.error || null,
    status: res.status,
  }
}

export async function fetchPublicData(endpoint, params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const qs = searchParams.toString()
  const url = qs ? `/api/${endpoint}?${qs}` : `/api/${endpoint}`
  return fetchJson(url)
}
