/**
 * Manually fix specific admin page.jsx files with JSX syntax errors
 */

const fs = require('fs')
const path = require('path')

const FILES_TO_FIX = [
  'app/admin/pages/page.jsx',
  'app/admin/blogs/page.jsx',
  'app/admin/blog-taxonomy/page.jsx',
  'app/admin/courses/page.jsx',
  'app/admin/tools/page.jsx',
  'app/admin/companies/page.jsx',
  'app/admin/internships/page.jsx',
  'app/admin/testimonials/page.jsx',
  'app/admin/forms/page.jsx',
  'app/admin/popups/page.jsx',
  'app/admin/banners/page.jsx',
  'app/admin/media/page.jsx',
  'app/admin/users/page.jsx',
  'app/admin/trust/page.jsx',
  'app/admin/landing-seo/page.jsx',
  'app/admin/leads/page.jsx',
  'app/admin/lms/page.jsx',
  'app/admin/seo/page.jsx',
]

function fixJsxSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Fix JSX syntax: <ComponentName()> to <ComponentName />
    const fixedContent = content.replace(/<([A-Z][a-zA-Z]*)\(\)\s*$/gm, '<$1 />')
    
    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf8')
      console.log(`✅ Fixed: ${filePath}`)
      return true
    }
    
    return false
  } catch (error) {
    console.log(`❌ Error: ${filePath} - ${error.message}`)
    return false
  }
}

function fixFiles() {
  console.log('Fixing admin page.jsx files with JSX syntax errors...')
  console.log('='.repeat(60))
  
  let fixedCount = 0
  let errorCount = 0
  
  for (const filePath of FILES_TO_FIX) {
    try {
      const result = fixJsxSyntax(filePath)
      if (result) {
        fixedCount++
      }
    } catch (error) {
      errorCount++
      console.log(`❌ Error processing ${filePath}: ${error.message}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`Fixed: ${fixedCount} files`)
  console.log(`Errors: ${errorCount} files`)
  console.log('='.repeat(60))
  
  if (fixedCount > 0) {
    console.log('\n✅ JSX syntax fixed successfully!')
  } else {
    console.log('\nℹ️  No files needed fixing or all were already correct.')
  }
}

fixFiles()
