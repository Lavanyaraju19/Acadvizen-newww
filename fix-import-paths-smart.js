/**
 * Smart fix for _utils import paths based on directory depth
 */

const fs = require('fs')
const path = require('path')

const API_CMS_DIR = path.join(__dirname, 'app', 'api', 'cms')

function calculateRelativePath(filePath) {
  const relativeToCms = path.relative(API_CMS_DIR, filePath)
  const depth = relativeToCms.split(path.sep).length - 1
  
  // _utils.js is in app/api/cms/_utils.js
  // So from app/api/cms/route.js (depth 0): ./_utils
  // From app/api/cms/blogs/route.js (depth 1): ../_utils
  // From app/api/cms/blogs/[id]/route.js (depth 2): ../../_utils
  
  if (depth === 0) {
    return './_utils' // Direct child of cms/
  } else if (depth === 1) {
    return '../_utils' // One level deep
  } else if (depth === 2) {
    return '../../_utils' // Two levels deep
  } else {
    return '../_utils' // Default fallback
  }
}

function fixImportPath(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Check if file has _utils import
    if (!content.includes('_utils')) {
      return false
    }
    
    const correctPath = calculateRelativePath(filePath)
    
    // Replace any _utils import with the correct path
    const patterns = [
      /from\s+['"][^'"]*_utils['"]/g,
      /from\s+['"][^'"]*\/_utils['"]/g,
    ]
    
    let modified = false
    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        content = content.replace(pattern, `from '${correctPath}'`)
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)} -> ${correctPath}`)
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
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        callback(filePath)
      }
    })
  } catch (error) {
    console.log(`❌ Error reading directory ${dir}: ${error.message}`)
  }
}

function fixAllImports() {
  console.log('Smart fixing of _utils import paths in API routes...')
  console.log('=' .repeat(50))
  
  let fixedCount = 0
  let errorCount = 0
  let skippedCount = 0
  
  walkDirectory(API_CMS_DIR, (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content.includes('_utils')) {
        const result = fixImportPath(filePath)
        if (result) {
          fixedCount++
        } else {
          skippedCount++
        }
      }
    } catch (error) {
      errorCount++
      console.log(`❌ Error processing ${filePath}: ${error.message}`)
    }
  })
  
  console.log('\n' + '=' .repeat(50))
  console.log(`Fixed: ${fixedCount} files`)
  console.log(`Skipped: ${skippedCount} files (already correct)`)
  console.log(`Errors: ${errorCount} files`)
  console.log('=' .repeat(50))
  
  if (fixedCount > 0) {
    console.log('\n✅ Import paths fixed successfully!')
  } else {
    console.log('\nℹ️  No files needed fixing or all were already correct.')
  }
}

fixAllImports()
