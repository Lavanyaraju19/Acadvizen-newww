/**
 * Debug script to check page content and sections
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPage() {
  console.log('Debugging JP Nagar page...\n')

  try {
    // 1. Get the page
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', 'jp-nagar')
      .single()
    
    if (pageError) {
      console.error('Page error:', pageError.message)
      return
    }
    
    console.log('Page data:')
    console.log(JSON.stringify(page, null, 2))

    // 2. Get sections
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('page_id', page.id)
      .order('order_index', { ascending: true })
    
    if (sectionsError) {
      console.error('Sections error:', sectionsError.message)
      return
    }
    
    console.log('\nSections data:')
    console.log(JSON.stringify(sections, null, 2))

    // 3. Check if sections are properly formatted
    console.log('\nSection analysis:')
    sections.forEach((section, index) => {
      console.log(`Section ${index + 1}:`)
      console.log(`  Type: ${section.type}`)
      console.log(`  Visibility: ${section.visibility}`)
      console.log(`  Order: ${section.order_index}`)
      console.log(`  Content keys: ${Object.keys(section.content_json || {}).join(', ')}`)
      console.log(`  Style keys: ${Object.keys(section.style_json || {}).join(', ')}`)
    })

  } catch (error) {
    console.error('Debug failed:', error.message)
  }
}

debugPage()
