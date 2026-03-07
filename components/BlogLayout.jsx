import Image from 'next/image'
import Link from 'next/link'
import CareerGrowthBubbles from './CareerGrowthBubbles'

export default function BlogLayout({
  blog,
  toc = [],
  contentSections = [],
  relatedBlogs = [],
}) {
  const companyLogos = ['/logos/google.png', '/logos/amazon.png', '/logos/tcs.png', '/logos/infosys.png', '/logos/adobe.png', '/logos/ibm.png']

  return (
    <article className="min-h-screen">
      <section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{blog.title}</h1>
          {blog.excerpt && <p className="mt-4 text-slate-300 max-w-4xl">{blog.excerpt}</p>}
          <div className="mt-6 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
            <div className="relative h-[240px] sm:h-[340px] md:h-[420px] w-full">
              <Image
                src={blog.featured_image || '/blog-images/image1.jpg'}
                alt={blog.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-base font-semibold text-slate-100">Table of Contents</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-slate-300 hover:text-teal-200 transition-colors">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-10">
            {contentSections.map((section, idx) => (
              <section key={`${section.id}-${idx}`} id={section.id} className="scroll-mt-24 space-y-4">
                {section.heading && <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">{section.heading}</h2>}
                {section.paragraphs.map((paragraph, pIdx) => (
                  <p key={`${section.id}-p-${pIdx}`} className="text-lg leading-relaxed text-slate-300">
                    {paragraph}
                  </p>
                ))}
                {section.image && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
                    <div className="relative h-[230px] sm:h-[320px] w-full">
                      <Image
                        src={section.image.src}
                        alt={section.image.alt || section.heading || 'Blog image'}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 900px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </section>
            ))}

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-semibold text-slate-50">Digital Marketing Skills</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-slate-300">
                {['SEO', 'Social Media Marketing', 'Content Marketing', 'Paid Advertising'].map((skill) => (
                  <li key={skill} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>

            <CareerGrowthBubbles />

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">
                Start Your Digital Marketing Career with Acadvizen
              </h2>
              <p className="mt-4 text-slate-300">
                ACADVIZEN stands as the best digital marketing training institute in Bangalore, delivering practical,
                career-driven education. As a top-rated digital marketing institute in Bangalore, we combine live
                projects, expert mentorship, and real-time tools.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-xl bg-teal-300 px-5 py-2 text-sm font-semibold text-slate-950">
                  Enroll Now
                </Link>
                <Link href="/courses" className="rounded-xl border border-white/20 px-5 py-2 text-sm font-semibold text-slate-100">
                  Download Course Details
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">Acadvizen Placement</h2>
              <p className="mt-3 text-slate-300">
                Placement help candidates stand out, get noticed by top recruiters, and unlock real career opportunities.
              </p>
              <h3 className="mt-6 text-xl font-semibold text-slate-100">Student Success Stories</h3>
              <p className="mt-2 text-slate-300">
                Our students come from different backgrounds — graduates, working professionals, career switchers, and entrepreneurs.
              </p>
              <h3 className="mt-6 text-xl font-semibold text-slate-100">Placement Support at Acadvizen</h3>
              <p className="mt-2 text-slate-300">
                Our placement cell ensures students are industry-ready through resume building, mock interviews, portfolio development, and recruiter connections.
              </p>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {companyLogos.map((logo) => (
                  <div key={logo} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="relative h-9 w-full">
                      <Image src={logo} alt="Company logo" fill sizes="120px" className="object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">Related Blogs</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {relatedBlogs.map((item) => (
                  <article key={item.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image
                        src={item.featured_image || item.image || '/blog-images/image1.jpg'}
                        alt={item.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-50">{item.title}</h3>
                      <Link href={`/blog/${item.slug}`} className="mt-3 inline-flex text-sm font-semibold text-teal-300">
                        Read more
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </article>
  )
}
