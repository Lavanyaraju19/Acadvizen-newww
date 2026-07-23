/**
 * Fix JSX syntax errors in admin page.jsx files
 * Changes <ComponentName()> to <ComponentName />
 */

const fs = require('fs')
const path = require('path')

const ADMIN_DIR = path.join(__dirname, 'app/admin')

function fixJsxSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Fix JSX syntax: <ComponentName()> to <ComponentName />
    const fixedContent = content.replace(/<([A-Z][a-zA-Z]*)\(\)\s*\/>/g, '<$1 />')
    
    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf8')
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`)
      return true
    }
    
    return false
  } catch (error) {
    console.log(`❌ Error: ${filePath} - ${error.message}`)
    return false
  }
}

function walkDirectory(dir, callback) {
  try {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        walkDirectory(filePath, callback)
      } else if (file === 'page.jsx') {
        callback(filePath)
      }
    })
  } catch (error) {
    console.log(`❌ Error reading directory ${dir}: ${error.message}`)
  }
}

function fixAllAdminPages() {
  console.log('Fixing JSX syntax in admin page.jsx files...')
  console.log('='.repeat(60))
  
  let fixedCount = 0
  let errorCount = 0
  
  walkDirectory(ADMIN_DIR, (filePath) => {
    try {
      const result = fixJsxSyntax(filePath)
      if (result) {
        fixedCount++
      }
    } catch (error) {
      errorCount++
      console.log(`❌ Error processing ${filePath}: ${error.message}`)
    }
  })
  
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

fixAllAdminPages()
