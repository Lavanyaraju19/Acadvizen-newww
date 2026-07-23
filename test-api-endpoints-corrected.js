/**
 * Comprehensive API endpoint audit for CMS (corrected)
 */

const http = require('http')

const API_ENDPOINTS = [
  // CMS Core Endpoints
  { method: 'GET', path: '/api/cms/pages', description: 'List all pages' },
  { method: 'GET', path: '/api/cms/pages?slug=home', description: 'Get page by slug' },
  { method: 'GET', path: '/api/cms/blogs', description: 'List all blogs' },
  { method: 'GET', path: '/api/cms/menus', description: 'Get all menus' },
  { method: 'GET', path: '/api/cms/site', description: 'Get site settings' },
  { method: 'GET', path: '/api/cms/seo', description: 'Get SEO metadata' },
  { method: 'GET', path: '/api/cms/sections', description: 'Get sections' },
  { method: 'GET', path: '/api/cms/redirects', description: 'Get redirects' },
  { method: 'GET', path: '/api/cms/cities', description: 'Get cities' },
  { method: 'GET', path: '/api/cms/reusable_blocks', description: 'Get reusable blocks' },
  { method: 'GET', path: '/api/cms/page_templates', description: 'Get page templates' },
  { method: 'GET', path: '/api/cms/health', description: 'Health check' },
  { method: 'GET', path: '/api/cms/sitemap', description: 'Sitemap' },
  { method: 'GET', path: '/api/cms/robots', description: 'Robots.txt' },
  
  // Legacy API Endpoints
  { method: 'GET', path: '/api/courses', description: 'Get courses (legacy)' },
  { method: 'GET', path: '/api/testimonials', description: 'Get testimonials (legacy)' },
  { method: 'GET', path: '/api/tools-extended', description: 'Get tools (legacy)' },
  { method: 'GET', path: '/api/locations', description: 'Get locations (legacy)' },
  { method: 'GET', path: '/api/blog-posts', description: 'Get blog posts (legacy)' },
  { method: 'GET', path: '/api/home-sections', description: 'Get home sections (legacy)' },
  { method: 'GET', path: '/api/public-config', description: 'Get public config (legacy)' },
]

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }

    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            success: res.statusCode < 400,
            statusCode: res.statusCode,
            data: jsonData,
            error: null
          })
        } catch (e) {
          resolve({
            success: res.statusCode < 400,
            statusCode: res.statusCode,
            data: null,
            error: 'Invalid JSON response'
          })
        }
      })
    })

    req.on('error', (error) => {
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: error.message
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: 'Request timeout'
      })
    })

    req.end()
  })
}

async function auditApiEndpoints() {
  console.log('Auditing CMS API Endpoints...')
  console.log('=' .repeat(50))
  console.log('Testing endpoints at http://localhost:3001')
  console.log('=' .repeat(50))

  const results = []
  
  for (const endpoint of API_ENDPOINTS) {
    console.log(`\nTesting: ${endpoint.method} ${endpoint.path}`)
    console.log(`Description: ${endpoint.description}`)
    
    const result = await testEndpoint(endpoint)
    results.push({ endpoint, ...result })
    
    if (result.success) {
      console.log(`✅ Status: ${result.statusCode}`)
      if (result.data && result.data.success !== undefined) {
        console.log(`   API Success: ${result.data.success}`)
        if (result.data.data) {
          const itemCount = Array.isArray(result.data.data) ? result.data.data.length : 1
          console.log(`   Items: ${itemCount}`)
        }
      }
    } else {
      console.log(`❌ Status: ${result.statusCode}`)
      console.log(`   Error: ${result.error}`)
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log('\nSUMMARY:')
  console.log('=' .repeat(50))
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${result.endpoint.method} ${result.endpoint.path}`)
    if (!result.success) {
      console.log(`       Error: ${result.error}`)
    }
  })
  
  console.log('\n' + '=' .repeat(50))
  console.log(`Total: ${results.length} endpoints`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log('=' .repeat(50))

  if (failed > 0) {
    console.log('\n❌ Some endpoints failed. Please review the errors above.')
  } else {
    console.log('\n✅ All API endpoints are working correctly!')
  }
}

auditApiEndpoints()
