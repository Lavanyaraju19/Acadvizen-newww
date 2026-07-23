import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const format = searchParams.get('format') || 'json'

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  try {
    let data = []
    let table = ''

    switch (type) {
      case 'pages':
        table = 'pages'
        break
      case 'cities':
        table = 'city_pages'
        break
      case 'blogs':
        table = 'blogs'
        break
      case 'courses':
        table = 'courses'
        break
      case 'forms':
        table = 'forms'
        break
      case 'menus':
        table = 'menus'
        break
      case 'leads':
        table = 'leads'
        break
      case 'users':
        table = 'profiles'
        break
      case 'settings':
        const { data: settings } = await supabase.from('global_settings').select('*').single()
        return jsonOk({ data: settings, count: 1 })
      default:
        return jsonError('Invalid type', 400)
    }

    const { data: items } = await supabase.from(table).select('*')
    data = items || []

    if (format === 'csv') {
      if (data.length === 0) {
        return jsonOk({ csv: '', count: 0 })
      }
      const headers = Object.keys(data[0])
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n')
      return jsonOk({ csv, count: data.length })
    }

    return jsonOk({ data, count: data.length })
  } catch (error) {
    return jsonError(`Export failed: ${error.message}`, 200)
  }
}