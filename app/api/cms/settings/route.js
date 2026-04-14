import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

const DEFAULT_SETTINGS_ID = 'default'

export async function GET() {
  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', DEFAULT_SETTINGS_ID)
    .maybeSingle()

  if (error) return jsonError(`Database query failed: ${error.message}`, 200)
  return jsonOk(data || { id: DEFAULT_SETTINGS_ID, social_links: {}, design_tokens: {}, ui_copy: {} })
}

export async function PUT(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const payload = {
    id: DEFAULT_SETTINGS_ID,
    company_name: body.company_name || null,
    logo: body.logo || null,
    favicon: body.favicon || null,
    contact_email: body.contact_email || null,
    phone_number: body.phone_number || null,
    address: body.address || null,
    social_links: body.social_links && typeof body.social_links === 'object' ? body.social_links : {},
    footer_content: body.footer_content || null,
    announcement_bar: body.announcement_bar || null,
    default_seo_title: body.default_seo_title || null,
    default_seo_description: body.default_seo_description || null,
    default_og_image: body.default_og_image || null,
    design_tokens: body.design_tokens && typeof body.design_tokens === 'object' ? body.design_tokens : {},
    ui_copy: body.ui_copy && typeof body.ui_copy === 'object' ? body.ui_copy : {},
  }

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save site settings: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}
