/**
 * Test Admin Layout Component for Import Errors
 */

const http = require('http')

async function testAdminLayout() {
  console.log('Testing Admin Layout Component...\n')
  
  try {
    // Test admin login page (which uses AdminLayoutClient)
    const loginPage = await new Promise((resolve) => {
      http.get('http://localhost:3001/admin-login', (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data })
        })
      }).on('error', (error) => {
        resolve({ statusCode: 0, error: error.message })
      })
    })
    
    if (loginPage.statusCode === 200) {
      console.log('✅ Admin login page loads successfully')
    } else {
      console.log(`❌ Admin login page failed: ${loginPage.statusCode}`)
      if (loginPage.error) console.log(`   Error: ${loginPage.error}`)
    }
    
    // Test admin dashboard (which uses AdminLayoutClient)
    const dashboardPage = await new Promise((resolve) => {
      http.get('http://localhost:3001/admin', (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data })
        })
      }).on('error', (error) => {
        resolve({ statusCode: 0, error: error.message })
      })
    })
    
    if (dashboardPage.statusCode === 200 || dashboardPage.statusCode === 307) {
      console.log('✅ Admin dashboard responds correctly')
    } else {
      console.log(`❌ Admin dashboard failed: ${dashboardPage.statusCode}`)
      if (dashboardPage.error) console.log(`   Error: ${dashboardPage.error}`)
    }
    
    // Check for React errors in the response
    if (dashboardPage.data && dashboardPage.data.includes('Element type is invalid')) {
      console.log('❌ React component error detected in response')
      console.log('   The AdminLayoutClient component still has import issues')
    } else if (dashboardPage.data) {
      console.log('✅ No React component errors detected')
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }
}

testAdminLayout()
