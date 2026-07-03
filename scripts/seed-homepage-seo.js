// scripts/seed-homepage-seo.js
// Seed homepage SEO metadata into Supabase

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  try {
    const homepageSeoData = {
      page_slug: 'home',
      meta_title: 'Digital Marketing Course in Bangalore with AI Training | Acadvizen',
      meta_description: 'Join Acadvizen\'s Digital Marketing Course in Bangalore with AI Training. Learn SEO, Google Ads, Meta Ads, AI Automation, Website Development, Content Marketing, Analytics, and more through live projects, internships, and placement assistance.',
      canonical_url: 'https://acadvizen.com',
      og_title: 'Digital Marketing Course in Bangalore with AI Training | Acadvizen',
      og_description: 'Join Acadvizen\'s Digital Marketing Course in Bangalore with AI Training. Learn SEO, Google Ads, Meta Ads, AI Automation, Website Development, Content Marketing, Analytics, and more through live projects, internships, and placement assistance.',
      twitter_title: 'Digital Marketing Course in Bangalore with AI Training | Acadvizen',
      twitter_description: 'Join Acadvizen\'s Digital Marketing Course in Bangalore with AI Training. Learn SEO, Google Ads, Meta Ads, AI Automation, Website Development, Content Marketing, Analytics, and more through live projects, internships, and placement assistance.',
      noindex: false,
    }

    const { data, error } = await supabase
      .from('seo_metadata')
      .upsert(homepageSeoData, { onConflict: 'page_slug' })
      .select()
      .single()

    if (error) {
      console.error('Failed to seed homepage SEO:', error)
      process.exit(1)
    }

    console.log('Homepage SEO metadata seeded successfully:', data)
  } catch (err) {
    console.error('Failed to seed homepage SEO:', err?.message || err)
    process.exit(1)
  }
}

main()
