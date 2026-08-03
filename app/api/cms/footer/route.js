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

const defaultFooterSettings = {
  logo_url: null,
  logo_alt: 'Acadvizen',
  column1_title: 'Quick Links',
  column1_links: [
    { label: 'Home', link: '/', active: true },
    { label: 'About Us', link: '/about', active: true },
    { label: 'Courses', link: '/courses', active: true },
    { label: 'Blogs', link: '/blogs', active: true },
    { label: 'Contact', link: '/contact', active: true },
  ],
  column2_title: 'Courses',
  column2_links: [
    { label: 'Digital Marketing', link: '/courses/digital-marketing', active: true },
    { label: 'SEO Training', link: '/courses/seo', active: true },
    { label: 'Social Media', link: '/courses/social-media', active: true },
    { label: 'Google Ads', link: '/courses/google-ads', active: true },
  ],
  column3_title: 'Company',
  column3_links: [
    { label: 'About Us', link: '/about', active: true },
    { label: 'Careers', link: '/careers', active: true },
    { label: 'Partners', link: '/partners', active: true },
    { label: 'Blog', link: '/blogs', active: true },
  ],
  column4_title: 'Contact',
  column4_links: [
    { label: 'Phone', link: 'tel:+919876543210', active: true },
    { label: 'Email', link: 'mailto:info@acadvizen.com', active: true },
    { label: 'Location', link: '/contact', active: true },
  ],
  show_contact: true,
  contact_phone: '+91 7411314848',
  contact_email: 'ceo@acadvizen.com',
  contact_address: 'No 647-35/29 5th Block, Jayanagar\nBangalore, Karnataka 560078',
  show_social: true,
  social_items: [
    { platform: 'linkedin', url: 'https://linkedin.com', active: true },
    { platform: 'instagram', url: 'https://instagram.com', active: true },
    { platform: 'facebook', url: 'https://facebook.com', active: true },
    { platform: 'youtube', url: 'https://youtube.com', active: true },
  ],
  show_newsletter: false,
  newsletter_title: 'Subscribe to our newsletter',
  newsletter_placeholder: 'Enter your email',
  copyright_text: '\u00a9 2024 Acadvizen. All rights reserved.',
  show_legal: true,
  privacy_policy_link: '/privacy',
  terms_link: '/terms',
  cookie_policy_link: '/cookies',
  footer_bg_color: '#050b12',
  footer_text_color: '#ffffff',
  footer_link_color: '#94a3b8',
  footer_border_color: 'rgba(255,255,255,0.1)',
}

export async function GET(request) {
  const { supabase, response } = await getSupabaseClientOrResponse(request)
  if (response) return response

  try {
    const { data, error } = await supabase
      .from('footer_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      if (isTableNotFoundError(error)) {
        return jsonOk(defaultFooterSettings)
      }
      return jsonError(`Failed to fetch footer settings: ${error.message}`, 500)
    }

    return jsonOk(data || defaultFooterSettings)
  } catch (err) {
    return jsonOk(defaultFooterSettings)
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
    column1_title: body.column1_title || 'Quick Links',
    column1_links: Array.isArray(body.column1_links) ? body.column1_links : [],
    column2_title: body.column2_title || 'Courses',
    column2_links: Array.isArray(body.column2_links) ? body.column2_links : [],
    column3_title: body.column3_title || 'Company',
    column3_links: Array.isArray(body.column3_links) ? body.column3_links : [],
    column4_title: body.column4_title || 'Contact',
    column4_links: Array.isArray(body.column4_links) ? body.column4_links : [],
    show_contact: body.show_contact !== undefined ? Boolean(body.show_contact) : true,
    contact_phone: body.contact_phone || body.phone || null,
    contact_email: body.contact_email || body.email || null,
    contact_address: body.contact_address || body.address || null,
    show_social: body.show_social !== undefined ? Boolean(body.show_social) : true,
    social_items: Array.isArray(body.social_items) ? body.social_items : (Array.isArray(body.social_links) ? body.social_links : []),
    show_newsletter: body.show_newsletter !== undefined ? Boolean(body.show_newsletter) : false,
    newsletter_title: body.newsletter_title || 'Subscribe to our newsletter',
    newsletter_placeholder: body.newsletter_placeholder || 'Enter your email',
    copyright_text: body.copyright_text || null,
    show_legal: body.show_legal !== undefined ? Boolean(body.show_legal) : true,
    privacy_policy_link: body.privacy_policy_link || '/privacy',
    terms_link: body.terms_link || '/terms',
    cookie_policy_link: body.cookie_policy_link || '/cookies',
    footer_bg_color: body.footer_bg_color || '#050b12',
    footer_text_color: body.footer_text_color || '#ffffff',
    footer_link_color: body.footer_link_color || '#94a3b8',
    footer_border_color: body.footer_border_color || 'rgba(255,255,255,0.1)',
  }

  try {
    const { data: existing } = await supabase
      .from('footer_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('footer_settings')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) return jsonError(`Failed to update footer settings: ${error.message}`, 500)
      result = data
    } else {
      const { data, error } = await supabase
        .from('footer_settings')
        .insert(payload)
        .select('*')
        .single()

      if (error) return jsonError(`Failed to create footer settings: ${error.message}`, 500)
      result = data
    }

    revalidateAllCmsPages()
    return jsonOk(result)
  } catch (err) {
    return jsonError(`Failed to save footer settings: ${err.message}`, 500)
  }
}
