/**
 * Fix incorrect import paths for _utils in API routes
 */

const fs = require('fs')
const path = require('path')

const API_CMS_DIR = path.join(__dirname, 'app', 'api', 'cms')

function fixImportPath(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Replace incorrect import paths
    const patterns = [
      { from: /from\s+['"]\.\.\/\.\.\/_utils['"]/g, to: "from '../_utils'" },
      { from: /from\s+['"]\.\.\/\.\.\/\.\.\/_utils['"]/g, to: "from '../_utils'" },
      { from: /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/_utils['"]/g, to: "from '../_utils'" },
    ]
    
    let modified = false
    patterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to)
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed: ${filePath}`)
      return true
    }
    
    return false
  } catch (error) {
    console.log(`❌ Error: ${filePath} - ${error.message}`)
    return false
  }
}

function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, callback)
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      callback(filePath)
    }
  })
}

function fixAllImports() {
  console.log('Fixing import paths for _utils in API routes...')
  console.log('=' .repeat(50))
  
  let fixedCount = 0
  let errorCount = 0
  
  walkDirectory(API_CMS_DIR, (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content.includes('_utils')) {
        const result = fixImportPath(filePath)
        if (result) {
          fixedCount++
        }
      }
    } catch (error) {
      errorCount++
      console.log(`❌ Error processing ${filePath}: ${error.message}`)
    }
  })
  
  console.log('\n' + '=' .repeat(50))
  console.log(`Fixed: ${fixedCount} files`)
  console.log(`Errors: ${errorCount} files`)
  console.log('=' .repeat(50))
  
  if (fixedCount > 0) {
    console.log('\n✅ Import paths fixed successfully!')
  } else {
    console.log('\nℹ️  No files needed fixing.')
  }
}

fixAllImports()
