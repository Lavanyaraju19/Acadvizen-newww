/**
 * Comprehensive CMS Test Suite
 * Tests all critical aspects of the CMS system
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const TESTS = [
  {
    name: 'CMS Pipeline Tests',
    script: 'test-cms-pipeline.js',
    description: 'Test database save pipeline and slug generation'
  },
  {
    name: 'Routing Tests',
    script: 'test-routing.js',
    description: 'Test dynamic routing and page accessibility'
  },
  {
    name: 'Cache Invalidation Tests',
    script: 'test-cache-invalidation.js',
    description: 'Test automatic cache invalidation'
  },
  {
    name: 'CMS Modules CRUD Tests',
    script: 'test-all-cms-modules.js',
    description: 'Test all CMS modules CRUD operations'
  },
  {
    name: 'API Endpoint Tests',
    script: 'test-api-endpoints-corrected.js',
    description: 'Test all API endpoints'
  }
]

function runTest(test) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Running: ${test.name}`)
  console.log(`Description: ${test.description}`)
  console.log(`${'='.repeat(60)}`)
  
  try {
    const result = execSync(`node ${test.script}`, { 
      encoding: 'utf8',
      stdio: 'inherit',
      timeout: 30000 
    })
    return { success: true, output: result }
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr 
    }
  }
}

function generateReport(results) {
  const reportPath = path.join(__dirname, 'TEST_REPORT.md')
  
  let report = `# CMS Test Report\n\n`
  report += `**Generated:** ${new Date().toISOString()}\n\n`
  report += `## Test Summary\n\n`
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const total = results.length
  
  report += `- **Total Tests:** ${total}\n`
  report += `- **Passed:** ${passed}\n`
  report += `- **Failed:** ${failed}\n`
  report += `- **Success Rate:** ${((passed / total) * 100).toFixed(1)}%\n\n`
  
  report += `## Detailed Results\n\n`
  
  results.forEach((result, index) => {
    const test = TESTS[index]
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    
    report += `### ${status} - ${test.name}\n\n`
    report += `**Description:** ${test.description}\n\n`
    
    if (result.success) {
      report += `The test completed successfully.\n\n`
    } else {
      report += `**Error:** ${result.error}\n\n`
      if (result.output) {
        report += `**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n\n`
      }
    }
  })
  
  report += `## Recommendations\n\n`
  
  if (failed === 0) {
    report += `All tests passed! The CMS system is functioning correctly.\n\n`
  } else {
    report += `Some tests failed. Please review the errors above and fix the issues.\n\n`
    report += `### Priority Fixes\n\n`
    
    results.forEach((result, index) => {
      if (!result.success) {
        const test = TESTS[index]
        report += `1. **${test.name}** - ${test.description}\n`
      }
    })
  }
  
  fs.writeFileSync(reportPath, report, 'utf8')
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Test report generated: ${reportPath}`)
  console.log(`${'='.repeat(60)}`)
}

function runComprehensiveTests() {
  console.log(`╔${'═'.repeat(58)}╗`)
  console.log(`║${' '.repeat(15)}CMS COMPREHENSIVE TEST SUITE${' '.repeat(21)}║`)
  console.log(`╚${'═'.repeat(58)}╝`)
  console.log(`\nStarting comprehensive CMS tests...\n`)
  
  const results = []
  
  for (const test of TESTS) {
    const result = runTest(test)
    results.push(result)
    
    // Add a small delay between tests
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    delay(1000)
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`FINAL SUMMARY`)
  console.log(`${'='.repeat(60)}`)
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  results.forEach((result, index) => {
    const test = TESTS[index]
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${test.name}`)
  })
  
  console.log(`${'='.repeat(60)}`)
  console.log(`Total: ${results.length} tests`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`${'='.repeat(60)}`)
  
  // Generate detailed report
  generateReport(results)
  
  if (failed === 0) {
    console.log(`\n🎉 All tests passed! The CMS system is production-ready.`)
    process.exit(0)
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`)
    process.exit(1)
  }
}

// Run the comprehensive test suite
runComprehensiveTests()
