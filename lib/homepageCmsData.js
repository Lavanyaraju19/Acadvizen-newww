/**
 * Hybrid CMS Data Fetching Layer for Homepage
 * 
 * This file fetches CMS data for all homepage sections
 * while preserving the exact UI of the existing components.
 * 
 * Components use this data to replace hardcoded values.
 */

import { getServerSupabaseClient } from './supabaseServer'

const supabase = getServerSupabaseClient()

/**
 * Fetch hero section data
 */
export async function fetchHeroData() {
  try {
    const { data, error } = await supabase
      .from('homepage_hero')
      .select('*')
      .single()

    if (error) {
      // Return default values if table doesn't exist or no data
      return {
        heading: 'Master AI-Powered Digital Marketing Course',
        subheading: 'Build Your Own Learning Path with Guidance from Global Industry Experts',
        video_url: null,
        video_title: null,
        video_autoplay: false,
        background_image: null,
        mobile_background_image: null,
        cta_text: 'Enroll Now',
        cta_link: '/courses',
        secondary_cta_text: null,
        secondary_cta_link: null,
        badge_text: '100% Job Guaranteed*',
        badge_color: '#10b981',
        show_hero: true,
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching hero data:', error)
    return null
  }
}

/**
 * Fetch course highlights data
 */
export async function fetchCourseHighlightsData() {
  try {
    const { data, error } = await supabase
      .from('homepage_course_highlights')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching course highlights:', error)
    return []
  }
}

/**
 * Fetch course modules data
 */
export async function fetchCourseModulesData() {
  try {
    const { data, error } = await supabase
      .from('homepage_course_modules')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching course modules:', error)
    return []
  }
}

/**
 * Fetch curriculum data
 */
export async function fetchCurriculumData() {
  try {
    const { data, error } = await supabase
      .from('homepage_curriculum')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching curriculum:', error)
    return []
  }
}

/**
 * Fetch projects data
 */
export async function fetchProjectsData() {
  try {
    const { data, error } = await supabase
      .from('homepage_projects')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

/**
 * Fetch partners data
 */
export async function fetchPartnersData() {
  try {
    const { data, error } = await supabase
      .from('homepage_partners')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching partners:', error)
    return []
  }
}

/**
 * Fetch placements data
 */
export async function fetchPlacementsData() {
  try {
    const { data, error } = await supabase
      .from('homepage_placements')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching placements:', error)
    return []
  }
}

/**
 * Fetch testimonials data
 */
export async function fetchTestimonialsData() {
  try {
    const { data, error } = await supabase
      .from('homepage_testimonials')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return []
  }
}

/**
 * Fetch FAQ data
 */
export async function fetchFaqData() {
  try {
    const { data, error } = await supabase
      .from('homepage_faq')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching FAQ:', error)
    return []
  }
}

/**
 * Fetch tools data
 */
export async function fetchToolsData() {
  try {
    const { data, error } = await supabase
      .from('homepage_tools')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching tools:', error)
    return []
  }
}

/**
 * Fetch CTA data
 */
export async function fetchCtaData() {
  try {
    const { data, error } = await supabase
      .from('homepage_cta')
      .select('*')
      .single()

    if (error) {
      return {
        title: 'Ready to Start Your Journey?',
        description: 'Join thousands of students who have transformed their careers with our AI-powered digital marketing course.',
        button_text: 'Enroll Now',
        button_link: '/courses',
        background_color: '#14b8a6',
        text_color: '#ffffff',
        is_active: true,
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching CTA:', error)
    return null
  }
}

/**
 * Fetch header settings
 */
export async function fetchHeaderSettings() {
  try {
    const { data, error } = await supabase
      .from('header_settings')
      .select('*')
      .single()

    if (error) {
      return {
        logo_url: null,
        logo_alt: 'Acadvizen',
        logo_link: '/',
        announcement_enabled: false,
        announcement_text: null,
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
        secondary_cta_text: null,
        secondary_cta_link: null,
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching header settings:', error)
    return null
  }
}

/**
 * Fetch footer settings
 */
export async function fetchFooterSettings() {
  try {
    const { data, error } = await supabase
      .from('footer_settings')
      .select('*')
      .single()

    if (error) {
      return {
        columns: [],
        copyright_text: '© 2026 ACADVIZEN. ALL RIGHTS RESERVED.',
        social_links: [],
        contact_info: [],
        show_newsletter: false,
        newsletter_title: null,
        newsletter_placeholder: null,
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching footer settings:', error)
    return null
  }
}

/**
 * Fetch all homepage data at once
 * This is useful for the HomePage component to get all data in parallel
 */
export async function fetchAllHomepageData() {
  const [
    hero,
    courseHighlights,
    courseModules,
    curriculum,
    projects,
    partners,
    placements,
    testimonials,
    faq,
    tools,
    cta,
    header,
    footer,
  ] = await Promise.all([
    fetchHeroData(),
    fetchCourseHighlightsData(),
    fetchCourseModulesData(),
    fetchCurriculumData(),
    fetchProjectsData(),
    fetchPartnersData(),
    fetchPlacementsData(),
    fetchTestimonialsData(),
    fetchFaqData(),
    fetchToolsData(),
    fetchCtaData(),
    fetchHeaderSettings(),
    fetchFooterSettings(),
  ])

  return {
    hero,
    courseHighlights,
    courseModules,
    curriculum,
    projects,
    partners,
    placements,
    testimonials,
    faq,
    tools,
    cta,
    header,
    footer,
  }
}
