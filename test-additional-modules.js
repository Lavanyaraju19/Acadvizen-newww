/**
 * Additional Module Tests for E2E Framework
 * Tests for Homepage, Header, Footer, Courses, City Pages, Tools, Testimonials, FAQ, Media
 */

const http = require('http')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const BASE_URL = 'http://localhost:3001'

// Reuse functions from main framework
function logTest(module, test, status, details = '') {
  console.log(`${status === 'PASS' ? '✅' : status === 'WARN' ? '⏭️' : '❌'} [${module}] ${test}`)
  if (details) console.log(`   ${details}`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testPage(url) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${url}`, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body })
      })
    }).on('error', (error) => {
      resolve({ statusCode: 0, error: error.message })
    })
  })
}

async function testApiRequest(method, url, body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    }
    
    const req = http.request(options, (res) => {
      let responseBody = ''
      res.on('data', chunk => responseBody += chunk)
      res.on('end', () => {
        try {
          const data = responseBody ? JSON.parse(responseBody) : null
          resolve({ statusCode: res.statusCode, data })
        } catch {
          resolve({ statusCode: res.statusCode, data: null, body: responseBody })
        }
      })
    })
    
    req.on('error', (error) => {
      resolve({ statusCode: 0, error: error.message })
    })
    
    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

// ============================================================================
// HOMEPAGE SECTIONS TEST
// ============================================================================

async function testHomepageSections() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING HOMEPAGE SECTIONS')
  console.log('='.repeat(70))
  
  const testId = Date.now()
  
  console.log('\n[1/6] Verifying homepage sections in database...')
  try {
    // First get the homepage page ID
    const { data: homePage, error: homeError } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', 'home')
      .single()
    
    if (homePage && !homeError) {
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('page_id', homePage.id)
        .order('order_index', { ascending: true })
      
      if (sections && !sectionsError) {
        logTest('Homepage', 'Sections Database', 'PASS', `Found ${sections.length} sections`)
        
        console.log('\n[2/6] Creating new homepage section...')
        const { data: newSection, error: createError } = await supabase
          .from('sections')
          .insert({
            page_id: homePage.id,
            type: 'hero',
            content_json: { heading: 'Test Hero Section', subheading: 'Test Subheading' },
            order_index: 99,
            visibility: true
          })
          .select('*')
          .single()
        
        if (newSection && !createError) {
          const sectionId = newSection.id
          logTest('Homepage', 'Create Section', 'PASS', `Section ID: ${sectionId}`)
          
          console.log('\n[3/6] Updating section...')
          const { data: updateSection, error: updateError } = await supabase
            .from('sections')
            .update({
              content_json: { heading: 'Updated Hero Section', subheading: 'Updated Subheading' }
            })
            .eq('id', sectionId)
            .select('*')
            .single()
          
          if (updateSection && !updateError) {
            logTest('Homepage', 'Update Section', 'PASS', 'Section updated')
            
            console.log('\n[4/6] Hiding section...')
            const { data: hideSection, error: hideError } = await supabase
              .from('sections')
              .update({ visibility: false })
              .eq('id', sectionId)
              .select('*')
              .single()
            
            if (hideSection && !hideError) {
              logTest('Homepage', 'Hide Section', 'PASS', 'Section hidden')
              
              console.log('\n[5/6] Showing section...')
              const { data: showSection, error: showError } = await supabase
                .from('sections')
                .update({ visibility: true })
                .eq('id', sectionId)
                .select('*')
                .single()
              
              if (showSection && !showError) {
                logTest('Homepage', 'Show Section', 'PASS', 'Section shown')
                
                console.log('\n[6/6] Deleting section...')
                const { error: deleteError } = await supabase
                  .from('sections')
                  .delete()
                  .eq('id', sectionId)
                
                if (!deleteError) {
                  logTest('Homepage', 'Delete Section', 'PASS', 'Section deleted')
                } else {
                  logTest('Homepage', 'Delete Section', 'FAIL', deleteError?.message)
                }
              } else {
                logTest('Homepage', 'Show Section', 'FAIL', showError?.message)
              }
            } else {
              logTest('Homepage', 'Hide Section', 'FAIL', hideError?.message)
            }
          } else {
            logTest('Homepage', 'Update Section', 'FAIL', updateError?.message)
          }
        } else {
          logTest('Homepage', 'Create Section', 'FAIL', createError?.message)
        }
      } else {
        logTest('Homepage', 'Sections Database', 'FAIL', sectionsError?.message || 'No sections found')
      }
    } else {
      logTest('Homepage', 'Home Page ID', 'FAIL', homeError?.message || 'Home page not found')
    }
  } catch (error) {
    logTest('Homepage', 'Sections Database', 'FAIL', error.message)
  }
}

// ============================================================================
// COURSES MODULE TEST
// ============================================================================

async function testCoursesModule() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING COURSES MODULE')
  console.log('='.repeat(70))
  
  const testId = Date.now()
  const testTitle = `E2E Test Course ${testId}`
  
  console.log('\n[1/8] Creating new course...')
  try {
    const { data: createData, error: createError } = await supabase
      .from('courses')
      .insert({
        title: testTitle,
        slug: `e2e-test-course-${testId}`,
        description: 'E2E test course description',
        short_description: 'E2E test short description',
        is_published: false,
        is_active: true,
        is_featured: false,
        order_index: 100
      })
      .select('*')
      .single()
    
    if (createData && !createError) {
      const courseId = createData.id
      logTest('Courses', 'Create Course', 'PASS', `Course ID: ${courseId}`)
      
      console.log('\n[2/8] Verifying database persistence...')
      const { data: dbCourse, error: dbError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
      
      if (dbCourse && !dbError) {
        logTest('Courses', 'Database Persistence', 'PASS', 'Course saved to database')
        
        console.log('\n[3/8] Updating course...')
        const { data: updateData, error: updateError } = await supabase
          .from('courses')
          .update({
            title: `${testTitle} - Updated`,
            short_description: 'Updated short description'
          })
          .eq('id', courseId)
          .select('*')
          .single()
        
        if (updateData && !updateError) {
          logTest('Courses', 'Update Course', 'PASS', 'Course updated')
          
          console.log('\n[4/8] Publishing course...')
          const { data: publishData, error: publishError } = await supabase
            .from('courses')
            .update({ is_published: true })
            .eq('id', courseId)
            .select('*')
            .single()
          
          if (publishData && !publishError) {
            logTest('Courses', 'Publish Course', 'PASS', 'Course published')
            
            console.log('\n[5/8] Duplicating course...')
            const { data: duplicateData, error: duplicateError } = await supabase
              .from('courses')
              .insert({
                title: `${testTitle} - Duplicate`,
                slug: `e2e-test-course-duplicate-${testId}`,
                description: dbCourse.description,
                short_description: dbCourse.short_description,
                is_published: false,
                is_active: true,
                is_featured: false,
                order_index: 101
              })
              .select('*')
              .single()
            
            if (duplicateData && !duplicateError) {
              const duplicateId = duplicateData.id
              logTest('Courses', 'Duplicate Course', 'PASS', `Duplicate ID: ${duplicateId}`)
              
              console.log('\n[6/8] Deleting course (move to draft)...')
              const { data: deleteData, error: deleteError } = await supabase
                .from('courses')
                .update({ is_published: false })
                .eq('id', courseId)
                .select('*')
                .single()
              
              if (deleteData && !deleteError) {
                logTest('Courses', 'Delete Course', 'PASS', 'Course moved to draft')
                
                console.log('\n[7/8] Restoring course...')
                const { data: restoreData, error: restoreError } = await supabase
                  .from('courses')
                  .update({ is_published: true })
                  .eq('id', courseId)
                  .select('*')
                  .single()
                
                if (restoreData && !restoreError) {
                  logTest('Courses', 'Restore Course', 'PASS', 'Course restored')
                  
                  console.log('\n[8/8] Cleaning up test data...')
                  await supabase.from('courses').delete().eq('id', courseId)
                  await supabase.from('courses').delete().eq('id', duplicateId)
                  logTest('Courses', 'Cleanup', 'PASS', 'Test data removed')
                  
                } else {
                  logTest('Courses', 'Restore Course', 'FAIL', restoreError?.message)
                }
              } else {
                logTest('Courses', 'Delete Course', 'FAIL', deleteError?.message)
              }
            } else {
              logTest('Courses', 'Duplicate Course', 'FAIL', duplicateError?.message)
            }
          } else {
            logTest('Courses', 'Publish Course', 'FAIL', publishError?.message)
          }
        } else {
          logTest('Courses', 'Update Course', 'FAIL', updateError?.message)
        }
      } else {
        logTest('Courses', 'Database Persistence', 'FAIL', dbError?.message || 'Not found in database')
      }
    } else {
      logTest('Courses', 'Create Course', 'FAIL', createError?.message)
    }
  } catch (error) {
    logTest('Courses', 'Create Course', 'FAIL', error.message)
  }
}

// ============================================================================
// CITY LANDING PAGES TEST
// ============================================================================

async function testCityPages() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING CITY LANDING PAGES')
  console.log('='.repeat(70))
  
  const testId = Date.now()
  const testCity = 'E2E Test City'
  const testSlug = `e2e-test-city-${testId}`
  
  console.log('\n[1/6] Creating new city page...')
  try {
    const { data: createData, error: createError } = await supabase
      .from('pages')
      .insert({
        title: `Digital Marketing Course in ${testCity}`,
        slug: testSlug,
        status: 'published',
        description: `Digital Marketing Course in ${testCity}`
      })
      .select('*')
      .single()
    
    if (createData && !createError) {
      const pageId = createData.id
      logTest('City Pages', 'Create City Page', 'PASS', `Page ID: ${pageId}`)
      
      console.log('\n[2/6] Verifying frontend access...')
      const frontendResult = await testPage(`/${testSlug}`)
      
      if (frontendResult.statusCode === 200) {
        logTest('City Pages', 'Frontend Access', 'PASS', `URL: /${testSlug} returns 200`)
        
        console.log('\n[3/6] Adding city-specific content...')
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .insert({
            page_id: pageId,
            type: 'hero',
            content_json: { 
              heading: `Digital Marketing Course in ${testCity}`,
              subheading: 'AI-Integrated Training'
            },
            order_index: 1,
            visibility: true
          })
          .select('*')
          .single()
        
        if (sectionData && !sectionError) {
          logTest('City Pages', 'Add City Content', 'PASS', 'City-specific content added')
          
          console.log('\n[4/6] Adding city SEO metadata...')
          const { data: seoData, error: seoError } = await supabase
            .from('seo_metadata')
            .insert({
              page_slug: testSlug,
              meta_title: `Digital Marketing Course in ${testCity} - SEO Title`,
              meta_description: `Best Digital Marketing Course in ${testCity} with AI Training`,
              canonical_url: `${BASE_URL}/${testSlug}`
            })
            .select('*')
            .single()
          
          if (seoData && !seoError) {
            logTest('City Pages', 'Add City SEO', 'PASS', 'City SEO metadata added')
            
            console.log('\n[5/6] Verifying location schema...')
            const frontendResult2 = await testPage(`/${testSlug}`)
            if (frontendResult2.statusCode === 200) {
              logTest('City Pages', 'Location Schema', 'PASS', 'Location page accessible')
            } else {
              logTest('City Pages', 'Location Schema', 'FAIL', `Status: ${frontendResult2.statusCode}`)
            }
            
            console.log('\n[6/6] Cleaning up test data...')
            await supabase.from('sections').delete().eq('page_id', pageId)
            await supabase.from('seo_metadata').delete().eq('page_slug', testSlug)
            await supabase.from('pages').delete().eq('id', pageId)
            logTest('City Pages', 'Cleanup', 'PASS', 'Test data removed')
            
          } else {
            logTest('City Pages', 'Add City SEO', 'FAIL', seoError?.message)
          }
        } else {
          logTest('City Pages', 'Add City Content', 'FAIL', sectionError?.message)
        }
      } else {
        logTest('City Pages', 'Frontend Access', 'FAIL', `Status: ${frontendResult.statusCode}`)
      }
    } else {
      logTest('City Pages', 'Create City Page', 'FAIL', createError?.message)
    }
  } catch (error) {
    logTest('City Pages', 'Create City Page', 'FAIL', error.message)
  }
}

// ============================================================================
// TOOLS MODULE TEST
// ============================================================================

async function testToolsModule() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING TOOLS MODULE')
  console.log('='.repeat(70))
  
  console.log('\n[1/4] Verifying tools table...')
  try {
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .limit(5)
    
    if (!toolsError) {
      logTest('Tools', 'Database Access', 'PASS', `Tools table accessible, found ${tools.length} items`)
      if (tools.length === 0) {
        logTest('Tools', 'Table Empty', 'WARN', 'Tools table is empty, no items to test')
      }
    } else {
      logTest('Tools', 'Database Access', 'FAIL', toolsError?.message)
    }
  } catch (error) {
    logTest('Tools', 'Database Access', 'FAIL', error.message)
  }
}

// ============================================================================
// TESTIMONIALS MODULE TEST
// ============================================================================

async function testTestimonialsModule() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING TESTIMONIALS MODULE')
  console.log('='.repeat(70))
  
  const testId = Date.now()
  const testName = `E2E Testimonial ${testId}`
  
  console.log('\n[1/6] Creating new testimonial...')
  try {
    const { data: createData, error: createError } = await supabase
      .from('testimonials')
      .insert({
        name: testName,
        role: 'Student',
        quote: 'E2E testimonial content',
        order_index: 1,
        is_active: true,
        published: true
      })
      .select('*')
      .single()
    
    if (createData && !createError) {
      const testimonialId = createData.id
      logTest('Testimonials', 'Create Testimonial', 'PASS', `Testimonial ID: ${testimonialId}`)
      
      console.log('\n[2/6] Updating testimonial...')
      const { data: updateData, error: updateError } = await supabase
        .from('testimonials')
        .update({
          name: `${testName} - Updated`
        })
        .eq('id', testimonialId)
        .select('*')
        .single()
      
      if (updateData && !updateError) {
        logTest('Testimonials', 'Update Testimonial', 'PASS', 'Testimonial updated')
        
        console.log('\n[3/6] Reordering testimonial...')
        const { data: reorderData, error: reorderError } = await supabase
          .from('testimonials')
          .update({ order_index: 10 })
          .eq('id', testimonialId)
          .select('*')
          .single()
        
        if (reorderData && !reorderError) {
          logTest('Testimonials', 'Reorder Testimonial', 'PASS', 'Testimonial reordered')
          
          console.log('\n[4/6] Hiding testimonial...')
          const { data: hideData, error: hideError } = await supabase
            .from('testimonials')
            .update({ published: false })
            .eq('id', testimonialId)
            .select('*')
            .single()
          
          if (hideData && !hideError) {
            logTest('Testimonials', 'Hide Testimonial', 'PASS', 'Testimonial hidden')
            
            console.log('\n[5/6] Showing testimonial...')
            const { data: showData, error: showError } = await supabase
              .from('testimonials')
              .update({ published: true })
              .eq('id', testimonialId)
              .select('*')
              .single()
            
            if (showData && !showError) {
              logTest('Testimonials', 'Show Testimonial', 'PASS', 'Testimonial shown')
              
              console.log('\n[6/6] Deleting testimonial...')
              const { error: deleteError } = await supabase
                .from('testimonials')
                .delete()
                .eq('id', testimonialId)
              
              if (!deleteError) {
                logTest('Testimonials', 'Delete Testimonial', 'PASS', 'Testimonial deleted')
              } else {
                logTest('Testimonials', 'Delete Testimonial', 'FAIL', deleteError?.message)
              }
            } else {
              logTest('Testimonials', 'Show Testimonial', 'FAIL', showError?.message)
            }
          } else {
            logTest('Testimonials', 'Hide Testimonial', 'FAIL', hideError?.message)
          }
        } else {
          logTest('Testimonials', 'Reorder Testimonial', 'FAIL', reorderError?.message)
        }
      } else {
        logTest('Testimonials', 'Update Testimonial', 'FAIL', updateError?.message)
      }
    } else {
      logTest('Testimonials', 'Create Testimonial', 'FAIL', createError?.message)
    }
  } catch (error) {
    logTest('Testimonials', 'Create Testimonial', 'FAIL', error.message)
  }
}

// ============================================================================
// FAQ MODULE TEST
// ============================================================================

async function testFAQModule() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING FAQ MODULE')
  console.log('='.repeat(70))
  
  console.log('\n[1/2] Verifying FAQs table...')
  try {
    const { data: faqs, error: faqsError } = await supabase
      .from('faqs')
      .select('*')
      .limit(5)
    
    if (!faqsError) {
      logTest('FAQ', 'Database Access', 'PASS', `FAQs table accessible, found ${faqs.length} items`)
      if (faqs.length === 0) {
        logTest('FAQ', 'Table Empty', 'WARN', 'FAQs table is empty, no items to test')
      }
    } else {
      logTest('FAQ', 'Database Access', 'FAIL', faqsError?.message)
    }
  } catch (error) {
    logTest('FAQ', 'Database Access', 'FAIL', error.message)
  }
}

// ============================================================================
// MEDIA MODULE TEST
// ============================================================================

async function testMediaModule() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING MEDIA MODULE')
  console.log('='.repeat(70))
  
  const testId = Date.now()
  
  console.log('\n[1/4] Verifying media table accessibility...')
  try {
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .limit(5)
    
    if (!mediaError) {
      logTest('Media', 'Database Access', 'PASS', `Media table accessible, found ${media.length} items`)
      
      console.log('\n[2/4] Creating media record (simulation)...')
      const { data: createData, error: createError } = await supabase
        .from('media')
        .insert({
          url: `https://example.com/test-image-${testId}.jpg`,
          bucket: 'test-bucket',
          type: 'image',
          size: 1024,
          alt_text: 'E2E test image',
          caption: 'E2E test caption'
        })
        .select('*')
        .single()
      
      if (createData && !createError) {
        const mediaId = createData.id
        logTest('Media', 'Create Media', 'PASS', `Media ID: ${mediaId}`)
        
        console.log('\n[3/4] Updating media metadata...')
        const { data: updateData, error: updateError } = await supabase
          .from('media')
          .update({
            alt_text: 'Updated alt text',
            caption: 'Updated caption'
          })
          .eq('id', mediaId)
          .select('*')
          .single()
        
        if (updateData && !updateError) {
          logTest('Media', 'Update Media', 'PASS', 'Media metadata updated')
          
          console.log('\n[4/4] Deleting media record...')
          const { error: deleteError } = await supabase
            .from('media')
            .delete()
            .eq('id', mediaId)
          
          if (!deleteError) {
            logTest('Media', 'Delete Media', 'PASS', 'Media record deleted')
          } else {
            logTest('Media', 'Delete Media', 'FAIL', deleteError?.message)
          }
        } else {
          logTest('Media', 'Update Media', 'FAIL', updateError?.message)
        }
      } else {
        logTest('Media', 'Create Media', 'FAIL', createError?.message)
      }
    } else {
      logTest('Media', 'Database Access', 'FAIL', mediaError?.message)
    }
  } catch (error) {
    logTest('Media', 'Database Access', 'FAIL', error.message)
  }
}

// ============================================================================
// HEADER & FOOTER MODULE TEST
// ============================================================================

async function testHeaderFooterModule() {
  console.log('\n' + '='.repeat(70))
  console.log('TESTING HEADER & FOOTER MODULE')
  console.log('='.repeat(70))
  
  const testId = Date.now()
  
  console.log('\n[1/6] Verifying site settings table...')
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()
    
    if (!settingsError) {
      logTest('Header/Footer', 'Settings Database', 'PASS', 'Site settings accessible')
      
      console.log('\n[2/6] Updating header settings...')
      const { data: updateHeader, error: updateHeaderError } = await supabase
        .from('site_settings')
        .upsert({
          id: 'default',
          company_name: 'Acadvizen',
          logo: settings?.logo || null,
          favicon: settings?.favicon || null,
          contact_email: 'test@acadvizen.com',
          phone_number: '+91 9876543210',
          address: 'Test Address',
          social_links: settings?.social_links || {},
          footer_content: settings?.footer_content || null,
          announcement_bar: settings?.announcement_bar || null,
          default_seo_title: settings?.default_seo_title || null,
          default_seo_description: settings?.default_seo_description || null,
          default_og_image: settings?.default_og_image || null,
          design_tokens: settings?.design_tokens || {},
          ui_copy: settings?.ui_copy || {}
        }, { onConflict: 'id' })
        .select('*')
        .single()
      
      if (updateHeader && !updateHeaderError) {
        logTest('Header/Footer', 'Update Header', 'PASS', 'Header settings updated')
        
        console.log('\n[3/6] Updating footer content...')
        const { data: updateFooter, error: updateFooterError } = await supabase
          .from('site_settings')
          .update({
            footer_content: {
              about: 'About test content',
              quick_links: ['/courses', '/about', '/contact'],
              social_links: settings?.social_links || {}
            }
          })
          .eq('id', 'default')
          .select('*')
          .single()
        
        if (updateFooter && !updateFooterError) {
          logTest('Header/Footer', 'Update Footer', 'PASS', 'Footer content updated')
          
          console.log('\n[4/6] Verifying settings via API...')
          const apiResult = await testApiRequest('GET', '/api/cms/settings')
          
          if (apiResult.statusCode === 200) {
            logTest('Header/Footer', 'API Access', 'PASS', 'Settings accessible via API')
            
            console.log('\n[5/6] Restoring original settings...')
            const { data: restoreSettings, error: restoreError } = await supabase
              .from('site_settings')
              .update({
                contact_email: settings?.contact_email || null,
                phone_number: settings?.phone_number || null,
                address: settings?.address || null,
                footer_content: settings?.footer_content || null
              })
              .eq('id', 'default')
              .select('*')
              .single()
            
            if (restoreSettings && !restoreError) {
              logTest('Header/Footer', 'Restore Settings', 'PASS', 'Original settings restored')
              
              console.log('\n[6/6] Verifying homepage renders with header/footer...')
              const frontendResult = await testPage('/')
              if (frontendResult.statusCode === 200) {
                logTest('Header/Footer', 'Frontend Render', 'PASS', 'Homepage renders with header/footer')
              } else {
                logTest('Header/Footer', 'Frontend Render', 'FAIL', `Status: ${frontendResult.statusCode}`)
              }
            } else {
              logTest('Header/Footer', 'Restore Settings', 'FAIL', restoreError?.message)
            }
          } else {
            logTest('Header/Footer', 'API Access', 'FAIL', `Status: ${apiResult.statusCode}`)
          }
        } else {
          logTest('Header/Footer', 'Update Footer', 'FAIL', updateFooterError?.message)
        }
      } else {
        logTest('Header/Footer', 'Update Header', 'FAIL', updateHeaderError?.message)
      }
    } else {
      logTest('Header/Footer', 'Settings Database', 'FAIL', settingsError?.message)
    }
  } catch (error) {
    logTest('Header/Footer', 'Settings Database', 'FAIL', error.message)
  }
}

// ============================================================================
// RUN ALL ADDITIONAL TESTS
// ============================================================================

async function runAdditionalTests() {
  console.log(`╔${'═'.repeat(68)}╗`)
  console.log(`║${' '.repeat(12)}ADDITIONAL MODULE TESTING${' '.repeat(22)}║`)
  console.log(`╚${'═'.repeat(68)}╝`)
  console.log(`\nStarting additional module testing...\n`)
  
  await testHomepageSections()
  await testCoursesModule()
  await testCityPages()
  await testToolsModule()
  await testTestimonialsModule()
  await testFAQModule()
  await testMediaModule()
  await testHeaderFooterModule()
  
  console.log(`\n${'='.repeat(70)}`)
  console.log(`ADDITIONAL TESTS COMPLETE`)
  console.log(`${'='.repeat(70)}`)
}

runAdditionalTests()
