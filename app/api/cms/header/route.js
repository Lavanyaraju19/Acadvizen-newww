import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { supabase, response } = getSupabaseClientOrResponse(request)
  if (response) return response

  const { data, error } = await supabase
    .from('header_settings')
    .select('*')
    .maybeSingle()

  if (error) {
    return jsonError(`Failed to fetch header settings: ${error.message}`, 500)
  }

  // If no data exists, return default values using actual DB column names
  if (!data) {
    return jsonOk({
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
    })
  }

  return jsonOk(data)
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  // Use actual DB column names from header_settings schema
  // See migration 20260722_header_builder.sql for the full schema
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

  // Check if header settings exist
  const { data: existing } = await supabase
    .from('header_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  let result
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('header_settings')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return jsonError(`Failed to update header settings: ${error.message}`, 500)
    result = data
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('header_settings')
      .insert(payload)
      .select('*')
      .single()

    if (error) return jsonError(`Failed to create header settings: ${error.message}`, 500)
    result = data
  }

  revalidateAllCmsPages()
  return jsonOk(result)
}
