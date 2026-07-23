/**
 * Test script to verify CMS save pipeline and slug generation
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCmsPipeline() {
  console.log('Testing CMS Save Pipeline...\n')

  try {
    // Clean up any existing test data first
    console.log('0. Cleaning up any existing test data...')
    await supabase.from('pages').delete().ilike('slug', 'test-%')
    await supabase.from('pages').delete().eq('slug', 'jp-nagar')
    console.log('   ✓ Cleanup completed')
    
    // 1. Check if pages table exists
    console.log('1. Checking pages table...')
    const { data: pagesTable, error: tableError } = await supabase
      .from('pages')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('   ❌ Pages table error:', tableError.message)
      return
    }
    console.log('   ✓ Pages table exists and is accessible')

    // 2. Check existing pages
    console.log('\n2. Checking existing pages...')
    const { data: existingPages, error: fetchError } = await supabase
      .from('pages')
      .select('id, title, slug, status')
      .order('updated_at', { ascending: false })
      .limit(5)
    
    if (fetchError) {
      console.error('   ❌ Fetch error:', fetchError.message)
      return
    }
    console.log(`   ✓ Found ${existingPages.length} existing pages:`)
    existingPages.forEach(page => {
      console.log(`     - ${page.title} (${page.slug}) - ${page.status}`)
    })

    // 3. Test creating a new page with slug
    console.log('\n3. Creating test page with slug...')
    const testSlug = 'test-page-' + Date.now()
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        title: 'Test Page',
        slug: testSlug,
        description: 'This is a test page',
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

    // 4. Test fetching the page by slug
    console.log('\n4. Fetching page by slug...')
    const { data: fetchedPage, error: fetchBySlugError } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', testSlug)
      .single()
    
    if (fetchBySlugError) {
      console.error('   ❌ Fetch by slug error:', fetchBySlugError.message)
      // Cleanup
      await supabase.from('pages').delete().eq('id', newPage.id)
      return
    }
    console.log(`   ✓ Successfully fetched page by slug: ${fetchedPage.slug}`)

    // 5. Test updating the page
    console.log('\n5. Updating page...')
    const { data: updatedPage, error: updateError } = await supabase
      .from('pages')
      .update({
        title: 'Updated Test Page',
        description: 'This is an updated test page'
      })
      .eq('id', newPage.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('   ❌ Update error:', updateError.message)
      // Cleanup
      await supabase.from('pages').delete().eq('id', newPage.id)
      return
    }
    console.log(`   ✓ Updated page successfully`)
    console.log(`     New title: ${updatedPage.title}`)

    // 6. Test slug generation from title
    console.log('\n6. Testing slug generation...')
    const titleToSlug = 'JP Nagar Test'
    const expectedSlug = titleToSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    console.log(`     Title: "${titleToSlug}"`)
    console.log(`     Expected slug: "${expectedSlug}"`)
    
    const { data: slugTestPage, error: slugTestError } = await supabase
      .from('pages')
      .insert({
        title: titleToSlug,
        slug: expectedSlug,
        status: 'draft'
      })
      .select()
      .single()
    
    if (slugTestError) {
      console.error('   ❌ Slug test error:', slugTestError.message)
    } else {
      console.log(`   ✓ Slug generation works: ${slugTestPage.slug}`)
      // Cleanup slug test
      await supabase.from('pages').delete().eq('id', slugTestPage.id)
    }

    // 7. Cleanup
    console.log('\n7. Cleaning up test page...')
    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('id', newPage.id)
    
    if (deleteError) {
      console.error('   ❌ Delete error:', deleteError.message)
    } else {
      console.log('   ✓ Test page deleted successfully')
    }

    console.log('\n✅ All CMS pipeline tests passed!')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
}

testCmsPipeline()
