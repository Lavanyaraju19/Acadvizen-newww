import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

function isTableNotFoundError(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('relation') || msg.includes('42p01') || msg.includes('could not find the table') || msg.includes('schema cache')
}

const defaultHeaderSettings = {
  logo_url: null,
  logo_alt: 'Acadvizen',
  logo_link: '/',
  announcement_enabled: false,
  announcement_text: 'Starting batch from April 6th | Limited Seats Available | Admission Open Now',
  announcement_link: null,
  announcement_bg_color: '#10b981',
  announcement_text_color: '#ffffff',
  nav_items: [],
  primary_cta_enabled: true,
  primary_cta_text: 'Get Started',
  primary_cta_link: '/courses',
  primary_cta_bg_color: '#14b8a6',
  primary_cta_text_color: '#ffffff',
  secondary_cta_enabled: false,
  secondary_cta_text: 'Login',
  secondary_cta_link: '/login',
  secondary_cta_bg_color: 'transparent',
  secondary_cta_text_color: '#ffffff',
  secondary_cta_border_color: '#ffffff',
  show_phone: false,
  phone_number: null,
  phone_link: null,
  show_email: false,
  email_address: null,
  email_link: null,
  show_social: false,
  social_items: [],
  sticky_header: false,
  transparent_header: false,
  header_bg_color: '#050b12',
  header_text_color: '#ffffff',
  header_border_color: 'rgba(255,255,255,0.1)',
  mobile_menu_style: 'drawer',
}

export async function GET(request) {
  const { supabase, response } = await getSupabaseClientOrResponse(request)
  if (response) return response

  try {
    const { data, error } = await supabase
      .from('header_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      if (isTableNotFoundError(error)) {
        return jsonOk(defaultHeaderSettings)
      }
      return jsonError(`Failed to fetch header settings: ${error.message}`, 500)
    }

    return jsonOk(data || defaultHeaderSettings)
  } catch (err) {
    return jsonOk(defaultHeaderSettings)
  }
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  const payload = {
    logo_url: body.logo_url || body.logo || null,
    logo_alt: String(body.logo_alt || 'Acadvizen').trim(),
    logo_link: body.logo_link || '/',
    announcement_enabled: body.announcement_enabled !== undefined ? Boolean(body.announcement_enabled) : false,
    announcement_text: body.announcement_text || null,
    announcement_link: body.announcement_link || null,
    announcement_bg_color: body.announcement_bg_color || '#10b981',
    announcement_text_color: body.announcement_text_color || '#ffffff',
    nav_items: Array.isArray(body.nav_items) ? body.nav_items : (Array.isArray(body.navigation_links) ? body.navigation_links : []),
    primary_cta_enabled: body.primary_cta_enabled !== undefined ? Boolean(body.primary_cta_enabled) : (body.show_cta !== false),
    primary_cta_text: body.primary_cta_text || body.cta_text || 'Get Started',
    primary_cta_link: body.primary_cta_link || body.cta_link || '/courses',
    primary_cta_bg_color: body.primary_cta_bg_color || '#14b8a6',
    primary_cta_text_color: body.primary_cta_text_color || '#ffffff',
    secondary_cta_enabled: body.secondary_cta_enabled !== undefined ? Boolean(body.secondary_cta_enabled) : false,
    secondary_cta_text: body.secondary_cta_text || 'Login',
    secondary_cta_link: body.secondary_cta_link || '/login',
    secondary_cta_bg_color: body.secondary_cta_bg_color || 'transparent',
    secondary_cta_text_color: body.secondary_cta_text_color || '#ffffff',
    secondary_cta_border_color: body.secondary_cta_border_color || '#ffffff',
    show_phone: body.show_phone !== undefined ? Boolean(body.show_phone) : false,
    phone_number: body.phone_number || body.phone || null,
    phone_link: body.phone_link || null,
    show_email: body.show_email !== undefined ? Boolean(body.show_email) : false,
    email_address: body.email_address || body.email || null,
    email_link: body.email_link || null,
    show_social: body.show_social !== undefined ? Boolean(body.show_social) : false,
    social_items: Array.isArray(body.social_items) ? body.social_items : [],
    sticky_header: body.sticky_header !== undefined ? Boolean(body.sticky_header) : false,
    transparent_header: body.transparent_header !== undefined ? Boolean(body.transparent_header) : false,
    header_bg_color: body.header_bg_color || '#050b12',
    header_text_color: body.header_text_color || '#ffffff',
    header_border_color: body.header_border_color || 'rgba(255,255,255,0.1)',
    mobile_menu_style: body.mobile_menu_style || 'drawer',
  }

  let result
  try {
    const { data: existing } = await supabase
      .from('header_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('header_settings')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) return jsonError(`Failed to update header settings: ${error.message}`, 500)
      result = data
    } else {
      const { data, error } = await supabase
        .from('header_settings')
        .insert(payload)
        .select('*')
        .single()

      if (error) return jsonError(`Failed to create header settings: ${error.message}`, 500)
      result = data
    }
  } catch (err) {
    return jsonError(`Failed to save header settings: ${err.message}`, 500)
  }

  revalidateAllCmsPages()
  return jsonOk(result)
}
