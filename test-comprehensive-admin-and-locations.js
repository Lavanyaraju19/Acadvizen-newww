/**
 * Comprehensive Test: Admin Dashboard + Location-Based Landing Pages
 */

const http = require('http')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const BASE_URL = 'http://localhost:3001'

// Admin dashboard routes to test
const ADMIN_ROUTES = [
  '/admin',
  '/admin/homepage',
  '/admin/header',
  '/admin/footer',
  '/admin/menus',
  '/admin/redirects',
  '/admin/sitemap',
  '/admin/robots',
  '/admin/import-export',
  '/admin/sections',
  '/admin/templates',
  '/admin/pages',
  '/admin/blogs',
  '/admin/blog-taxonomy',
  '/admin/courses',
  '/admin/tools',
  '/admin/companies',
  '/admin/internships',
  '/admin/testimonials',
  '/admin/forms',
  '/admin/popups',
  '/admin/banners',
  '/admin/cities',
  '/admin/media',
  '/admin/users',
  '/admin/trust',
  '/admin/landing-seo',
  '/admin/leads',
  '/admin/lms',
  '/admin/seo',
  '/admin/settings',
]

// Location-based landing pages to test
const LOCATION_PAGES = [
  '/',
  '/digital-marketing-courses-in-india',
  '/digital-marketing-courses-in-bangalore',
  '/digital-marketing-courses-in-jayanagar',
  '/digital-marketing-courses-in-jp-nagar',
  '/digital-marketing-courses-in-koramangala',
  '/digital-marketing-courses-in-mysore',
  '/digital-marketing-courses-in-indiranagar',
  '/digital-marketing-courses-in-mg-road',
  '/digital-marketing-courses-in-rajajinagar',
  '/digital-marketing-courses-in-rr-nagar',
  '/digital-marketing-courses-in-hsr-layout',
  '/digital-marketing-courses-in-whitefield',
  '/digital-marketing-courses-in-marathahalli',
]

// Alternative URL patterns
const ALTERNATIVE_URLS = [
  '/digital-marketing-course-in-bangalore',
  '/digital-marketing-course-in-jayanagar',
  '/digital-marketing-course-in-jp-nagar',
  '/digital-marketing-course-in-koramangala',
  '/digital-marketing-course-in-mysore',
  '/digital-marketing-course-in-indiranagar',
  '/digital-marketing-course-in-mg-road',
  '/digital-marketing-course-in-rajajinagar',
  '/digital-marketing-course-in-rr-nagar',
  '/digital-marketing-course-in-hsr-layout',
  '/digital-marketing-course-in-whitefield',
  '/digital-marketing-course-in-marathahalli',
]

const TEST_RESULTS = []

function logResult(category, url, status, statusCode, notes = '') {
  const result = {
    category,
    url,
    status,
    statusCode,
    notes,
    timestamp: new Date().toISOString()
  }
  TEST_RESULTS.push(result)
  
  const statusEmoji = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌'
  console.log(`${statusEmoji} ${category}: ${url}`)
  console.log(`   Status: ${status} (${statusCode})`)
  if (notes) console.log(`   Notes: ${notes}`)
}

async function testUrl(url, category) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    http.get(`${BASE_URL}${url}`, (res) => {
      const duration = Date.now() - startTime
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        // Check for React errors
        const hasReactError = data.includes('Element type is invalid') || 
                           data.includes('React error') ||
                           data.includes('Unhandled Runtime Error')
        
        if (hasReactError) {
          logResult(category, url, 'FAIL', res.statusCode, 'React component error detected')
          resolve({ success: false, statusCode: res.statusCode, duration, hasReactError })
        } else if (res.statusCode < 500) {
          logResult(category, url, 'PASS', res.statusCode, `Loaded in ${duration}ms`)
          resolve({ success: true, statusCode: res.statusCode, duration })
        } else {
          logResult(category, url, 'FAIL', res.statusCode, `Server error in ${duration}ms`)
          resolve({ success: false, statusCode: res.statusCode, duration })
        }
      })
    }).on('error', (error) => {
      logResult(category, url, 'FAIL', 0, `Connection error: ${error.message}`)
      resolve({ success: false, statusCode: 0, error: error.message })
    })
  })
}

async function testAdminDashboard() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING ADMIN DASHBOARD ROUTES')
  console.log('='.repeat(60))
  
  for (const route of ADMIN_ROUTES) {
    await testUrl(route, 'Admin Dashboard')
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

async function testLocationPages() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING LOCATION-BASED LANDING PAGES')
  console.log('='.repeat(60))
  
  for (const page of LOCATION_PAGES) {
    await testUrl(page, 'Location Page')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

async function testAlternativeUrls() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING ALTERNATIVE URL PATTERNS')
  console.log('='.repeat(60))
  
  for (const url of ALTERNATIVE_URLS) {
    await testUrl(url, 'Alternative URL')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

async function testDatabasePages() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING DATABASE PAGES TABLE')
  console.log('='.repeat(60))
  
  try {
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, slug, status')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.log('❌ Database query failed:', error.message)
      return
    }
    
    console.log(`✅ Found ${pages.length} pages in database`)
    
    // Test a few published pages
    const publishedPages = pages.filter(p => p.status === 'published').slice(0, 5)
    
    for (const page of publishedPages) {
      const url = page.slug === 'home' ? '/' : `/${page.slug}`
      await testUrl(url, 'Database Page')
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message)
  }
}

async function testCityPages() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING CITY PAGES (city_pages TABLE)')
  console.log('='.repeat(60))
  
  try {
    const { data: cityPages, error } = await supabase
      .from('city_pages')
      .select('id, city_name, slug, is_active')
      .order('priority', { ascending: true })
      .limit(10)
    
    if (error) {
      console.log('⏭️  city_pages table may not exist or is not accessible')
      return
    }
    
    console.log(`✅ Found ${cityPages.length} city pages in database`)
    
    for (const cityPage of cityPages) {
      if (cityPage.is_active) {
        await testUrl(`/${cityPage.slug}`, 'City Page')
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
  } catch (error) {
    console.log('⏭️  City pages test skipped:', error.message)
  }
}

async function testCoreAPIs() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING CORE CMS API ENDPOINTS')
  console.log('='.repeat(60))
  
  const API_ENDPOINTS = [
    '/api/cms/pages',
    '/api/cms/blogs',
    '/api/cms/menus',
    '/api/cms/site',
    '/api/cms/seo',
    '/api/cms/sections',
    '/api/cms/cities',
  ]
  
  for (const endpoint of API_ENDPOINTS) {
    await testUrl(endpoint, 'API Endpoint')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('COMPREHENSIVE TEST REPORT')
  console.log('='.repeat(60))
  
  const reportPath = 'COMPREHENSIVE_TEST_REPORT.md'
  
  // Group results by category
  const groupedResults = {}
  TEST_RESULTS.forEach(result => {
    if (!groupedResults[result.category]) {
      groupedResults[result.category] = []
    }
    groupedResults[result.category].push(result)
  })
  
  let report = `# Comprehensive Admin & Location Pages Test Report\n\n`
  report += `**Generated:** ${new Date().toISOString()}\n\n`
  
  report += `## Summary\n\n`
  
  const total = TEST_RESULTS.length
  const passed = TEST_RESULTS.filter(r => r.status === 'PASS').length
  const failed = TEST_RESULTS.filter(r => r.status === 'FAIL').length
  const skipped = TEST_RESULTS.filter(r => r.status === 'SKIP').length
  
  report += `- **Total Tests:** ${total}\n`
  report += `- **Passed:** ${passed}\n`
  report += `- **Failed:** ${failed}\n`
  report += `- **Skipped:** ${skipped}\n`
  report += `- **Success Rate:** ${((passed / (total - skipped)) * 100).toFixed(1)}%\n\n`
  
  // Admin Dashboard Results
  report += `## Admin Dashboard Routes\n\n`
  const adminResults = groupedResults['Admin Dashboard'] || []
  report += `Total: ${adminResults.length} | Passed: ${adminResults.filter(r => r.status === 'PASS').length} | Failed: ${adminResults.filter(r => r.status === 'FAIL').length}\n\n`
  
  adminResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌'
    report += `${status} ${result.url} (${result.statusCode})\n`
    if (result.notes) report += `   - ${result.notes}\n`
  })
  
  // Location Pages Results
  report += `\n## Location-Based Landing Pages\n\n`
  const locationResults = groupedResults['Location Page'] || []
  report += `Total: ${locationResults.length} | Passed: ${locationResults.filter(r => r.status === 'PASS').length} | Failed: ${locationResults.filter(r => r.status === 'FAIL').length}\n\n`
  
  locationResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌'
    report += `${status} ${result.url} (${result.statusCode})\n`
    if (result.notes) report += `   - ${result.notes}\n`
  })
  
  // Alternative URLs Results
  report += `\n## Alternative URL Patterns\n\n`
  const altResults = groupedResults['Alternative URL'] || []
  report += `Total: ${altResults.length} | Passed: ${altResults.filter(r => r.status === 'PASS').length} | Failed: ${altResults.filter(r => r.status === 'FAIL').length}\n\n`
  
  altResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌'
    report += `${status} ${result.url} (${result.statusCode})\n`
    if (result.notes) report += `   - ${result.notes}\n`
  })
  
  // Failed URLs Summary
  const failedResults = TEST_RESULTS.filter(r => r.status === 'FAIL')
  if (failedResults.length > 0) {
    report += `\n## Failed URLs Summary\n\n`
    failedResults.forEach(result => {
      report += `❌ ${result.category}: ${result.url}\n`
      report += `   Status: ${result.statusCode}\n`
      report += `   Notes: ${result.notes}\n\n`
    })
  }
  
  report += `\n## Recommendations\n\n`
  
  if (failed === 0) {
    report += `All tested routes and pages are working correctly!\n\n`
  } else {
    report += `${failed} route(s) failed. Review the failed URLs above and create the necessary pages or fix routing issues.\n\n`
  }
  
  require('fs').writeFileSync(reportPath, report, 'utf8')
  console.log(`\n📄 Report generated: ${reportPath}`)
  console.log('='.repeat(60))
}

async function runComprehensiveTest() {
  console.log(`╔${'═'.repeat(58)}╗`)
  console.log(`║${' '.repeat(10)}COMPREHENSIVE ADMIN & LOCATION TEST${' '.repeat(12)}║`)
  console.log(`╚${'═'.repeat(58)}╝`)
  console.log(`\nStarting comprehensive test...\n`)
  
  await testAdminDashboard()
  await testLocationPages()
  await testAlternativeUrls()
  await testDatabasePages()
  await testCityPages()
  await testCoreAPIs()
  
  await generateReport()
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`FINAL STATUS`)
  console.log(`${'='.repeat(60)}`)
  
  const passed = TEST_RESULTS.filter(r => r.status === 'PASS').length
  const failed = TEST_RESULTS.filter(r => r.status === 'FAIL').length
  const skipped = TEST_RESULTS.filter(r => r.status === 'SKIP').length
  
  console.log(`Total: ${TEST_RESULTS.length} tests`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`${'='.repeat(60)}`)
  
  if (failed === 0) {
    console.log(`\n🎉 All tests passed!`)
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. See the report for details.`)
  }
}

runComprehensiveTest()
