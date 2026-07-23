/**
 * Fix all JSX syntax errors in the project
 * Changes <ComponentName()> to <ComponentName />
 */

const fs = require('fs')
const path = require('path')

function fixJsxSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Fix JSX syntax: <ComponentName()> to <ComponentName />
    const fixedContent = content.replace(/<([A-Z][a-zA-Z]*)\(\)\s*$/gm, '<$1 />')
    
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
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        callback(filePath)
      }
    })
  } catch (error) {
    console.log(`❌ Error reading directory ${dir}: ${error.message}`)
  }
}

function fixAllJsxSyntax() {
  console.log('Fixing JSX syntax in all .jsx and .js files...')
  console.log('='.repeat(60))
  
  let fixedCount = 0
  let errorCount = 0
  
  walkDirectory('.', (filePath) => {
    try {
      const result = fixJsxSyntaxInFile(filePath)
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

fixAllJsxSyntax()
