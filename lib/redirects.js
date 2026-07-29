function getErrorMessage(error) {
  return String(error?.message || error || '').toLowerCase()
}

function isMissingColumnError(error, columnName) {
  const message = getErrorMessage(error)
  return message.includes('column') && message.includes(String(columnName || '').toLowerCase()) && message.includes('does not exist')
}

function normalizePath(value = '') {
  const nextValue = String(value || '').trim()
  if (!nextValue) return ''
  if (/^https?:\/\//i.test(nextValue)) return nextValue
  return nextValue.startsWith('/') ? nextValue : `/${nextValue}`
}

export function normalizeRedirectRecord(record = {}) {
  const fromPath = normalizePath(record.from_path || record.old_url || '')
  const toPath = normalizePath(record.to_path || record.new_url || '')
  const statusCode = Number(record.status_code || record.redirect_type || 301) || 301

  return {
    ...record,
    from_path: fromPath,
    to_path: toPath,
    status_code: statusCode,
    old_url: fromPath,
    new_url: toPath,
    redirect_type: statusCode,
  }
}

async function queryRedirectsBySchema(supabase, schema, { pathname = '', search = '', limit = 100 } = {}) {
  const fromColumn = schema === 'legacy' ? 'old_url' : 'from_path'
  const toColumn = schema === 'legacy' ? 'new_url' : 'to_path'

  let query = supabase
    .from('redirects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (pathname) {
    query = query.eq(fromColumn, pathname).eq('is_active', true)
    return query.maybeSingle()
  }

  if (search) {
    query = query.or(`${fromColumn}.ilike.%${search}%,${toColumn}.ilike.%${search}%`)
  }

  return query
}

export async function fetchRedirectByPathRecord(supabase, pathname) {
  const normalizedPath = normalizePath(pathname)
  if (!normalizedPath) return null

  const currentResult = await queryRedirectsBySchema(supabase, 'current', { pathname: normalizedPath })
  if (!currentResult.error) {
    return currentResult.data ? normalizeRedirectRecord(currentResult.data) : null
  }

  if (!isMissingColumnError(currentResult.error, 'from_path')) {
    throw currentResult.error
  }

  const legacyResult = await queryRedirectsBySchema(supabase, 'legacy', { pathname: normalizedPath })
  if (legacyResult.error) throw legacyResult.error
  return legacyResult.data ? normalizeRedirectRecord(legacyResult.data) : null
}

export async function listRedirectRecords(supabase, { search = '', limit = 100 } = {}) {
  const currentResult = await queryRedirectsBySchema(supabase, 'current', { search, limit })
  if (!currentResult.error) {
    return Array.isArray(currentResult.data) ? currentResult.data.map(normalizeRedirectRecord) : []
  }

  if (!isMissingColumnError(currentResult.error, 'from_path')) {
    throw currentResult.error
  }

  const legacyResult = await queryRedirectsBySchema(supabase, 'legacy', { search, limit })
  if (legacyResult.error) throw legacyResult.error
  return Array.isArray(legacyResult.data) ? legacyResult.data.map(normalizeRedirectRecord) : []
}

async function findExistingRedirect(supabase, schema, fromPath, excludeId = '') {
  const fromColumn = schema === 'legacy' ? 'old_url' : 'from_path'
  let query = supabase.from('redirects').select('id').eq(fromColumn, fromPath).limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  return query.maybeSingle()
}

async function persistRedirect(supabase, schema, values, { id = '' } = {}) {
  const fromPath = normalizePath(values.from_path || values.old_url || '')
  const toPath = normalizePath(values.to_path || values.new_url || '')
  const statusCode = Number(values.status_code || values.redirect_type || 301) || 301
  const isActive = values.is_active !== false

  const payload = schema === 'legacy'
    ? {
        old_url: fromPath,
        new_url: toPath,
        redirect_type: statusCode,
        is_active: isActive,
      }
    : {
        from_path: fromPath,
        to_path: toPath,
        status_code: statusCode,
        is_active: isActive,
      }

  const existingResult = await findExistingRedirect(supabase, schema, fromPath, id)
  if (existingResult.error) throw existingResult.error
  if (existingResult.data) {
    const duplicateError = new Error('A redirect for this old URL already exists')
    duplicateError.status = 400
    throw duplicateError
  }

  if (fromPath === toPath) {
    const loopError = new Error('Cannot redirect to the same URL')
    loopError.status = 400
    throw loopError
  }

  if (toPath.startsWith('/')) {
    const destinationRedirect = await fetchRedirectByPathRecord(supabase, toPath).catch(() => null)
    if (destinationRedirect?.id && destinationRedirect.id !== id) {
      const normalizedDestinationTarget = normalizePath(destinationRedirect.to_path)
      const error = new Error(
        normalizedDestinationTarget === fromPath
          ? 'Redirect loop detected.'
          : 'Redirect chains are not allowed. Point this redirect directly to the final destination.'
      )
      error.status = 400
      throw error
    }
  }

  const query = id
    ? supabase.from('redirects').update(payload).eq('id', id).select('*').single()
    : supabase.from('redirects').insert(payload).select('*').single()

  const { data, error } = await query
  if (error) throw error
  return normalizeRedirectRecord(data)
}

export async function saveRedirectRecord(supabase, values, options = {}) {
  try {
    return await persistRedirect(supabase, 'current', values, options)
  } catch (error) {
    if (!isMissingColumnError(error, 'from_path') && !isMissingColumnError(error, 'status_code')) {
      throw error
    }
  }

  return persistRedirect(supabase, 'legacy', values, options)
}

export async function deleteRedirectRecord(supabase, id) {
  const { error } = await supabase.from('redirects').delete().eq('id', id)
  if (error) throw error
  return { id, deleted: true }
}

export async function createSlugRedirectRecord(supabase, { fromPath, toPath, statusCode = 301 }) {
  const normalizedFromPath = normalizePath(fromPath)
  const normalizedToPath = normalizePath(toPath)
  if (!normalizedFromPath || !normalizedToPath || normalizedFromPath === normalizedToPath) {
    return null
  }

  const existing = await fetchRedirectByPathRecord(supabase, normalizedFromPath).catch(() => null)
  if (existing?.id) {
    return saveRedirectRecord(supabase, {
      from_path: normalizedFromPath,
      to_path: normalizedToPath,
      status_code: statusCode,
      is_active: true,
    }, { id: existing.id })
  }

  return saveRedirectRecord(supabase, {
    from_path: normalizedFromPath,
    to_path: normalizedToPath,
    status_code: statusCode,
    is_active: true,
  })
}
