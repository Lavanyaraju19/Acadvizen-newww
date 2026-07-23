/**
 * Test routing for new CMS pages
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRouting() {
  console.log('Testing CMS Page Routing...\n')

  try {
    // 1. Create a test page
    console.log('1. Creating test page with slug "jp-nagar"...')
    const testSlug = 'jp-nagar-test-' + Date.now()
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        title: 'JP Nagar',
        slug: testSlug,
        description: 'This is a test page for JP Nagar',
        status: 'published'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('   ❌ Create error:', createError.message)
      return
    }
    console.log(`   ✓ Created page with slug: ${newPage.slug}`)
    console.log(`     ID: ${newPage.id}`)
    console.log(`     Title: ${newPage.title}`)
    console.log(`     Status: ${newPage.status}`)

    // 2. Test that the page is accessible via API
    console.log('\n2. Testing API access to page...')
    const { data: apiPage, error: apiError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', testSlug)
      .eq('status', 'published')
      .single()
    
    if (apiError) {
      console.error('   ❌ API access error:', apiError.message)
    } else {
      console.log(`   ✓ Page accessible via API: ${apiPage.slug}`)
    }

    // 3. Test with sections
    console.log('\n3. Adding test section to page...')
    const { data: newSection, error: sectionError } = await supabase
      .from('sections')
      .insert({
        page_id: newPage.id,
        type: 'hero',
        order_index: 0,
        content_json: {
          heading: 'Welcome to JP Nagar',
          subheading: 'Digital Marketing Course',
          text: 'Learn digital marketing in JP Nagar'
        },
        visibility: true
      })
      .select()
      .single()
    
    if (sectionError) {
      console.error('   ❌ Section creation error:', sectionError.message)
    } else {
      console.log(`   ✓ Section created with ID: ${newSection.id}`)
    }

    // 4. Test fetching page with sections
    console.log('\n4. Testing page fetch with sections...')
    const { data: pageWithSections, error: fetchError } = await supabase
      .from('pages')
      .select('*, sections(*)')
      .eq('slug', testSlug)
      .eq('status', 'published')
      .single()
    
    if (fetchError) {
      console.error('   ❌ Fetch with sections error:', fetchError.message)
    } else {
      console.log(`   ✓ Page fetched with ${pageWithSections.sections.length} section(s)`)
    }

    console.log('\n5. Test page should now be accessible at:')
    console.log(`   http://localhost:3001/${testSlug}`)
    console.log('\n6. Keeping the page for manual verification (will be cleaned up by test suite)')

    console.log('\n✅ Routing test setup complete!')
    console.log(`\nTo cleanup manually, run:`)
    console.log(`DELETE FROM pages WHERE slug = '${testSlug}';`)

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
}

testRouting()
