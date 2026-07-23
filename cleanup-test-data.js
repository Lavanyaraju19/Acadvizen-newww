/**
 * Cleanup test data from database
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupTestData() {
  console.log('Cleaning up test data...\n')
  
  try {
    // Clean up test pages with various patterns
    const patterns = ['test-%', 'jp-nagar-test-%', 'cache-test-%']
    
    for (const pattern of patterns) {
      const { data: testPages } = await supabase
        .from('pages')
        .select('id, slug')
        .ilike('slug', pattern)
      
      if (testPages && testPages.length > 0) {
        console.log(`Found ${testPages.length} test pages matching "${pattern}"`)
        const { error: deleteError } = await supabase
          .from('pages')
          .delete()
          .ilike('slug', pattern)
        
        if (deleteError) {
          console.log(`❌ Error deleting test pages (${pattern}): ${deleteError.message}`)
        } else {
          console.log(`✅ Deleted ${testPages.length} test pages (${pattern})`)
        }
      }
    }
    
    // Clean up specific jp-nagar test page
    const { data: jpNagarPage } = await supabase
      .from('pages')
      .select('id, slug')
      .eq('slug', 'jp-nagar')
      .single()
    
    if (jpNagarPage) {
      console.log('Found jp-nagar test page')
      const { error: deleteError } = await supabase
        .from('pages')
        .delete()
        .eq('slug', 'jp-nagar')
      
      if (deleteError) {
        console.log(`❌ Error deleting jp-nagar page: ${deleteError.message}`)
      } else {
        console.log('✅ Deleted jp-nagar test page')
      }
    } else {
      console.log('No jp-nagar test page found')
    }
    
    // Clean up test blogs
    const { data: testBlogs } = await supabase
      .from('blogs')
      .select('id, slug')
      .ilike('slug', 'test-%')
    
    if (testBlogs && testBlogs.length > 0) {
      console.log(`Found ${testBlogs.length} test blogs`)
      const { error: deleteError } = await supabase
        .from('blogs')
        .delete()
        .ilike('slug', 'test-%')
      
      if (deleteError) {
        console.log(`❌ Error deleting test blogs: ${deleteError.message}`)
      } else {
        console.log(`✅ Deleted ${testBlogs.length} test blogs`)
      }
    } else {
      console.log('No test blogs found')
    }
    
    // Clean up test menus
    const { data: testMenus } = await supabase
      .from('menus')
      .select('id, title')
      .ilike('title', 'test-%')
    
    if (testMenus && testMenus.length > 0) {
      console.log(`Found ${testMenus.length} test menus`)
      const { error: deleteError } = await supabase
        .from('menus')
        .delete()
        .ilike('title', 'test-%')
      
      if (deleteError) {
        console.log(`❌ Error deleting test menus: ${deleteError.message}`)
      } else {
        console.log(`✅ Deleted ${testMenus.length} test menus`)
      }
    } else {
      console.log('No test menus found')
    }
    
    // Clean up test media
    const { data: testMedia } = await supabase
      .from('media')
      .select('id, url')
      .ilike('url', '%test-%')
    
    if (testMedia && testMedia.length > 0) {
      console.log(`Found ${testMedia.length} test media items`)
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .ilike('url', '%test-%')
      
      if (deleteError) {
        console.log(`❌ Error deleting test media: ${deleteError.message}`)
      } else {
        console.log(`✅ Deleted ${testMedia.length} test media items`)
      }
    } else {
      console.log('No test media found')
    }
    
    console.log('\n✅ Test data cleanup completed!')
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message)
  }
}

cleanupTestData()
