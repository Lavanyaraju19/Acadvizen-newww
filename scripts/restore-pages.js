/**
 * Restore legitimate pages that were accidentally deleted
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hhfccftkfryesjirauwf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZmNjZnRrZnJ5ZXNqaXJhdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0NTYwMiwiZXhwIjoyMDg1NTIxNjAyfQ.FQtYdnz-hdF68TDFZ9FnVvUFZiAZr7nHrjZO0Ij7ytE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Pages to restore
const pagesToRestore = [
  {
    title: 'Blog',
    slug: 'blog',
    description: 'Read our latest digital marketing insights, tips, and industry updates.',
    seo_title: 'Digital Marketing Blog - Acadvizen',
    seo_description: 'Stay updated with the latest digital marketing trends, tips, and insights from industry experts.',
    status: 'published'
  },
  {
    title: 'About',
    slug: 'about',
    description: 'Learn about Acadvizen - Bangalore\'s premier digital marketing training institute.',
    seo_title: 'About Acadvizen - Digital Marketing Institute in Bangalore',
    seo_description: 'Discover Acadvizen\'s mission, vision, and commitment to providing world-class digital marketing education.',
    status: 'published'
  },
  {
    title: 'Contact',
    slug: 'contact',
    description: 'Get in touch with Acadvizen for course inquiries and career guidance.',
    seo_title: 'Contact Acadvizen - Digital Marketing Course in Bangalore',
    seo_description: 'Reach out to Acadvizen for digital marketing course inquiries, career guidance, and placement support.',
    status: 'published'
  },
  {
    title: 'Courses',
    slug: 'courses',
    description: 'Explore our comprehensive digital marketing courses with AI training.',
    seo_title: 'Digital Marketing Courses in Bangalore - Acadvizen',
    seo_description: 'Browse our range of digital marketing courses including SEO, Google Ads, Meta Ads, and AI-powered marketing.',
    status: 'published'
  },
  {
    title: 'Tools',
    slug: 'tools',
    description: 'Discover the 120+ marketing tools you will master in our courses.',
    seo_title: 'Digital Marketing Tools - Acadvizen',
    seo_description: 'Learn to use industry-leading marketing tools including Ahrefs, SEMrush, Google Ads, ChatGPT, and more.',
    status: 'published'
  }
]

async function restorePages() {
  console.log('🔄 Restoring legitimate pages...\n')

  let restored = 0

  for (const page of pagesToRestore) {
    console.log(`📄 Restoring: ${page.title} (slug: ${page.slug})`)
    
    const { data, error } = await supabase
      .from('pages')
      .insert(page)
      .select('*')
      .single()

    if (error) {
      // If duplicate, try to find and reactivate it
      if (error.code === '23505') {
        console.log(`  ⚠️  Page already exists, skipping...`)
      } else {
        console.error(`  ❌ Error: ${error.message}`)
      }
    } else {
      console.log(`  ✅ Restored successfully`)
      restored++
    }
  }

  console.log(`\n✅ Restored ${restored} pages successfully\n`)
}

restorePages()