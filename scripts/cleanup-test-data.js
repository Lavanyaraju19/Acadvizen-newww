/**
 * Cleanup test data from Supabase database
 * 
 * This script deletes test data from menus, pages, and blogs tables
 * based on specific patterns and keywords.
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase connection details
const supabaseUrl = 'https://hhfccftkfryesjirauwf.supabase.co'
const supabaseServiceKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test patterns to match
const TITLE_PATTERNS = [
  'E2E Test',
  'Demo Menu',
  'Test Menu',
  'Debug Menu'
]

// Valid page slugs that should NOT be deleted
const VALID_PAGE_SLUGS = [
  'home',
  'about',
  'contact',
  'courses',
  'blog',
  'tools',
  'placement',
  'achievements',
  'projects',
  'soft-skills',
  'hire-from-us'
]

// Timestamp pattern (13+ digit numbers)
const TIMESTAMP_PATTERN = /\d{13,}/

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...\n')
  console.log(`📡 Connected to: ${supabaseUrl}\n`)

  let totalDeleted = {
    menus: 0,
    pages: 0,
    blogs: 0
  }

  try {
    // ==================== CLEANUP MENUS ====================
    console.log('📋 Cleaning up MENUS table...')
    
    // Try both 'menus' and 'menu_items' table names
    const menuTableNames = ['menus', 'menu_items']
    let menuTableUsed = null
    
    for (const tableName of menuTableNames) {
      const { data: tableData, error: tableError } = await supabase
        .from(tableName)
        .select('id, title')
        .limit(1)
      
      if (!tableError) {
        menuTableUsed = tableName
        console.log(`✅ Found table: ${tableName}`)
        break
      }
    }
    
    if (menuTableUsed) {
      // Fetch all menu items to check for test patterns
      const { data: allMenus, error: menusError } = await supabase
        .from(menuTableUsed)
        .select('id, title')
      
      if (menusError) {
        console.log(`❌ Error fetching menus: ${menusError.message}`)
      } else if (allMenus && allMenus.length > 0) {
        console.log(`📊 Total menus found: ${allMenus.length}`)
        
        const menusToDelete = []
        
        for (const menu of allMenus) {
          const title = menu.title || ''
          let isTestData = false
          
          // Check for title patterns
          for (const pattern of TITLE_PATTERNS) {
            if (title.toLowerCase().includes(pattern.toLowerCase())) {
              isTestData = true
              break
            }
          }
          
          // Check for timestamp pattern
          if (TIMESTAMP_PATTERN.test(title)) {
            isTestData = true
          }
          
          if (isTestData) {
            menusToDelete.push(menu)
            console.log(`  🗑️  Marked for deletion: "${title}" (ID: ${menu.id})`)
          }
        }
        
        if (menusToDelete.length > 0) {
          const idsToDelete = menusToDelete.map(m => m.id)
          const { error: deleteError } = await supabase
            .from(menuTableUsed)
            .delete()
            .in('id', idsToDelete)
          
          if (deleteError) {
            console.log(`❌ Error deleting menus: ${deleteError.message}`)
          } else {
            console.log(`✅ Deleted ${menusToDelete.length} menu items`)
            totalDeleted.menus = menusToDelete.length
          }
        } else {
          console.log('✅ No test menu items found')
        }
      } else {
        console.log('✅ No menu items found in table')
      }
    } else {
      console.log('⚠️  No valid menu table found (tried: menus, menu_items)')
    }
    
    console.log('')

    // ==================== CLEANUP PAGES ====================
    console.log('📄 Cleaning up PAGES table...')
    
    const { data: allPages, error: pagesError } = await supabase
      .from('pages')
      .select('id, title, slug')
    
    if (pagesError) {
      console.log(`❌ Error fetching pages: ${pagesError.message}`)
    } else if (allPages && allPages.length > 0) {
      console.log(`📊 Total pages found: ${allPages.length}`)
      
      const pagesToDelete = []
      
      for (const page of allPages) {
        const title = page.title || ''
        const slug = page.slug || ''
        let isTestData = false
        
        // Skip if it's a valid page slug
        if (VALID_PAGE_SLUGS.includes(slug.toLowerCase())) {
          continue
        }
        
        // Check title patterns
        for (const pattern of TITLE_PATTERNS) {
          if (title.toLowerCase().includes(pattern.toLowerCase()) || 
              slug.toLowerCase().includes(pattern.toLowerCase())) {
            isTestData = true
            break
          }
        }
        
        // Check for timestamp pattern in title or slug
        if (TIMESTAMP_PATTERN.test(title) || TIMESTAMP_PATTERN.test(slug)) {
          isTestData = true
        }
        
        // Check for very short slugs (likely test data) - but skip valid ones
        if (slug.length <= 2 && !VALID_PAGE_SLUGS.includes(slug.toLowerCase())) {
          isTestData = true
        }
        
        // Check for invalid data (empty or very short titles) - but skip valid pages
        if (title.length <= 8 && !VALID_PAGE_SLUGS.includes(slug.toLowerCase())) {
          isTestData = true
        }
        
        if (isTestData) {
          pagesToDelete.push(page)
          console.log(`  🗑️  Marked for deletion: "${title}" (slug: ${slug}, ID: ${page.id})`)
        }
      }
      
      if (pagesToDelete.length > 0) {
        const idsToDelete = pagesToDelete.map(p => p.id)
        const { error: deleteError } = await supabase
          .from('pages')
          .delete()
          .in('id', idsToDelete)
        
        if (deleteError) {
          console.log(`❌ Error deleting pages: ${deleteError.message}`)
        } else {
          console.log(`✅ Deleted ${pagesToDelete.length} pages`)
          totalDeleted.pages = pagesToDelete.length
        }
      } else {
        console.log('✅ No test pages found')
      }
    } else {
      console.log('✅ No pages found in table')
    }
    
    console.log('')

    // ==================== CLEANUP BLOGS ====================
    console.log('📝 Cleaning up BLOGS table...')
    
    const { data: allBlogs, error: blogsError } = await supabase
      .from('blogs')
      .select('id, title, slug')
    
    if (blogsError) {
      console.log(`❌ Error fetching blogs: ${blogsError.message}`)
    } else if (allBlogs && allBlogs.length > 0) {
      console.log(`📊 Total blogs found: ${allBlogs.length}`)
      
      const blogsToDelete = []
      
      for (const blog of allBlogs) {
        const title = blog.title || ''
        const slug = blog.slug || ''
        let isTestData = false
        
        // Check title patterns
        for (const pattern of TITLE_PATTERNS) {
          if (title.toLowerCase().includes(pattern.toLowerCase()) || 
              slug.toLowerCase().includes(pattern.toLowerCase())) {
            isTestData = true
            break
          }
        }
        
        // Check for timestamp pattern in title or slug
        if (TIMESTAMP_PATTERN.test(title) || TIMESTAMP_PATTERN.test(slug)) {
          isTestData = true
        }
        
        if (isTestData) {
          blogsToDelete.push(blog)
          console.log(`  🗑️  Marked for deletion: "${title}" (slug: ${slug}, ID: ${blog.id})`)
        }
      }
      
      if (blogsToDelete.length > 0) {
        const idsToDelete = blogsToDelete.map(b => b.id)
        const { error: deleteError } = await supabase
          .from('blogs')
          .delete()
          .in('id', idsToDelete)
        
        if (deleteError) {
          console.log(`❌ Error deleting blogs: ${deleteError.message}`)
        } else {
          console.log(`✅ Deleted ${blogsToDelete.length} blogs`)
          totalDeleted.blogs = blogsToDelete.length
        }
      } else {
        console.log('✅ No test blogs found')
      }
    } else {
      console.log('✅ No blogs found in table')
    }
    
    console.log('')

    // ==================== SUMMARY ====================
    console.log('═══════════════════════════════════════════════════')
    console.log('📊 CLEANUP SUMMARY')
    console.log('═══════════════════════════════════════════════════')
    console.log(`📋 Menu items deleted: ${totalDeleted.menus}`)
    console.log(`📄 Pages deleted: ${totalDeleted.pages}`)
    console.log(`📝 Blogs deleted: ${totalDeleted.blogs}`)
    console.log(`───────────────────────────────────────────────────`)
    console.log(`🎯 Total records deleted: ${totalDeleted.menus + totalDeleted.pages + totalDeleted.blogs}`)
    console.log('═══════════════════════════════════════════════════')
    console.log('\n✅ Test data cleanup completed!\n')
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupTestData()
