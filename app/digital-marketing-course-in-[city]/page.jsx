import { notFound } from 'next/navigation'
import { supabase } from '../../src/lib/supabaseClient'
import { buildMetadata } from '../lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { city } = params
  
  try {
    const { data: cityPage } = await supabase
      .from('city_pages')
      .select('*')
      .eq('slug', city)
      .eq('is_active', true)
      .single()

    if (!cityPage) {
      return buildMetadata({
        title: 'Course Not Found',
        description: 'The requested course page is not available.',
        path: `/digital-marketing-course-in-${city}`,
      })
    }

    return buildMetadata({
      title: cityPage.seo_title || cityPage.hero_title || `Digital Marketing Course in ${cityPage.city_name}`,
      description: cityPage.seo_description || cityPage.hero_description || `Learn digital marketing in ${cityPage.city_name}`,
      path: `/digital-marketing-course-in-${city}`,
      ogImage: cityPage.og_image_url || cityPage.hero_image_url,
    })
  } catch (error) {
    return buildMetadata({
      title: 'Digital Marketing Course',
      description: 'Learn digital marketing with expert training',
      path: `/digital-marketing-course-in-${city}`,
    })
  }
}

export default async function DigitalMarketingCoursePage({ params }) {
  const { city } = params

  const { data: cityPage } = await supabase
    .from('city_pages')
    .select('*')
    .eq('slug', city)
    .eq('is_active', true)
    .single()

  if (!cityPage) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            {cityPage.hero_title || `Digital Marketing Course in ${cityPage.city_name}`}
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            {cityPage.hero_subtitle || cityPage.hero_description}
          </p>
          {cityPage.hero_image_url && (
            <img
              src={cityPage.hero_image_url}
              alt={cityPage.city_name}
              className="w-full max-w-3xl rounded-lg shadow-xl"
              loading="lazy"
            />
          )}
        </div>
      </section>

      {/* About Section */}
      {cityPage.about_title && (
        <section className="py-16 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              {cityPage.about_title}
            </h2>
            <p className="text-lg text-slate-700 whitespace-pre-line">
              {cityPage.about_description}
            </p>
            {cityPage.about_image_url && (
              <img
                src={cityPage.about_image_url}
                alt={cityPage.about_title}
                className="mt-8 w-full max-w-2xl rounded-lg shadow-lg"
              />
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      {cityPage.features && cityPage.features.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Course Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cityPage.features.map((feature, index) => (
                <div key={index} className="p-6 border border-slate-200 rounded-lg">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {cityPage.stats && cityPage.stats.length > 0 && (
        <section className="py-16 px-4 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {cityPage.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {cityPage.testimonials && cityPage.testimonials.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Student Testimonials</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {cityPage.testimonials.map((testimonial, index) => (
                <div key={index} className="p-6 border border-slate-200 rounded-lg">
                  <p className="text-slate-700 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="font-semibold text-slate-900">
                    {testimonial.name}
                    {testimonial.role && <span className="text-slate-600"> - {testimonial.role}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {cityPage.faqs && cityPage.faqs.length > 0 && (
        <section className="py-16 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {cityPage.faqs.map((faq, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {(cityPage.contact_phone || cityPage.contact_email || cityPage.contact_address) && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Contact Us</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {cityPage.contact_phone && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Phone</h3>
                  <p className="text-slate-700">{cityPage.contact_phone}</p>
                </div>
              )}
              {cityPage.contact_email && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Email</h3>
                  <p className="text-slate-700">{cityPage.contact_email}</p>
                </div>
              )}
              {cityPage.contact_address && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Address</h3>
                  <p className="text-slate-700">{cityPage.contact_address}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}