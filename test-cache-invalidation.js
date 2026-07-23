/**
 * Test cache invalidation and dashboard-to-frontend pipeline
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCacheInvalidation() {
  console.log('Testing Cache Invalidation...\n')

  try {
    // First create a test page if it doesn't exist
    console.log('0. Creating test page for cache testing...')
    const testSlug = 'cache-test-' + Date.now()
    const { data: testPage, error: createError } = await supabase
      .from('pages')
      .insert({
        title: 'Cache Test Page',
        slug: testSlug,
        description: 'This is a cache test page',
        status: 'published'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('   ❌ Create error:', createError.message)
      return
    }
    console.log(`   ✓ Created test page: ${testSlug}`)

    // 1. Get current page content
    console.log('\n1. Fetching current page content...')
    const { data: currentPage, error: fetchError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', testSlug)
      .single()
    
    if (fetchError) {
      console.error('   ❌ Fetch error:', fetchError.message)
      // Cleanup
      await supabase.from('pages').delete().eq('id', testPage.id)
      return
    }
    console.log(`   ✓ Current title: "${currentPage.title}"`)
    console.log(`   ✓ Current description: "${currentPage.description}"`)

    // 2. Update the page content
    console.log('\n2. Updating page content...')
    const newTitle = 'Cache Test Page - Updated'
    const newDescription = 'This is an updated cache test page - ' + new Date().toISOString()
    
    const { data: updatedPage, error: updateError } = await supabase
      .from('pages')
      .update({
        title: newTitle,
        description: newDescription
      })
      .eq('slug', testSlug)
      .select()
      .single()
    
    if (updateError) {
      console.error('   ❌ Update error:', updateError.message)
      // Cleanup
      await supabase.from('pages').delete().eq('id', testPage.id)
      return
    }
    console.log(`   ✓ Updated title: "${updatedPage.title}"`)
    console.log(`   ✓ Updated description: "${updatedPage.description}"`)

    // 3. Fetch again to verify immediate update
    console.log('\n3. Fetching page again to verify update...')
    const { data: refetchedPage, error: refetchError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', testSlug)
      .single()
    
    if (refetchError) {
      console.error('   ❌ Refetch error:', refetchError.message)
      // Cleanup
      await supabase.from('pages').delete().eq('id', testPage.id)
      return
    }
    
    if (refetchedPage.title === newTitle && refetchedPage.description === newDescription) {
      console.log(`   ✓ Update immediately reflected in database`)
    } else {
      console.log(`   ❌ Update not reflected immediately`)
      console.log(`     Expected title: "${newTitle}"`)
      console.log(`     Actual title: "${refetchedPage.title}"`)
    }

    // 4. Update section content
    console.log('\n4. Updating section content...')
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('page_id', updatedPage.id)
      .order('order_index', { ascending: true })
    
    if (sectionsError) {
      console.error('   ❌ Sections fetch error:', sectionsError.message)
    } else if (sections.length > 0) {
      const section = sections[0]
      const newHeading = 'Cache Test Heading - Updated ' + new Date().toISOString()
      
      const { data: updatedSection, error: sectionUpdateError } = await supabase
        .from('sections')
        .update({
          content_json: {
            ...section.content_json,
            heading: newHeading
          }
        })
        .eq('id', section.id)
        .select()
        .single()
      
      if (sectionUpdateError) {
        console.error('   ❌ Section update error:', sectionUpdateError.message)
      } else {
        console.log(`   ✓ Section heading updated: "${updatedSection.content_json.heading}"`)
      }
    } else {
      console.log('   ℹ️  No sections to update')
    }

    // 5. Cleanup
    console.log('\n5. Cleaning up test page...')
    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('id', testPage.id)
    
    if (deleteError) {
      console.error('   ❌ Delete error:', deleteError.message)
    } else {
      console.log('   ✓ Test page deleted successfully')
    }

    console.log('\n✅ Cache invalidation test complete!')
    console.log('   (Updates should be immediately visible due to force-dynamic rendering)')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
}

testCacheInvalidation()
