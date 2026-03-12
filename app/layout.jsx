import './globals.css'
import Script from 'next/script'
import Providers from './providers'
import { siteConfig } from './lib/seo'
import { blogs as localBlogs } from '../data/blogs'
import { checkEnv } from '../lib/checkEnv'

checkEnv()

export const metadata = {
  metadataBase: new URL('https://acadvizen.com'),
  title: {
    default: 'Acadvizen',
    template: '%s | Acadvizen',
  },
  description: 'Acadvizen helps students discover universities, courses, and career guidance.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Acadvizen',
    description: 'Education and career guidance platform',
    url: 'https://acadvizen.com',
    siteName: 'Acadvizen',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acadvizen',
    description: 'Education guidance platform',
  },
  alternates: {
    canonical: 'https://acadvizen.com',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Acadvizen',
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}/logo.png`,
    sameAs: [
      'https://www.instagram.com/acadvizen/',
      'https://www.linkedin.com/company/acadvizen-digital-marketing-institute/?viewAsMember=true',
      'https://www.youtube.com/@Acadvizen',
      'https://www.facebook.com/profile.php?id=61586987972331',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'admissions',
      telephone: '+91-7411314848',
      email: 'ceo@acadvizen.com',
    },
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Acadvizen Digital Marketing Institute',
    image: `${siteConfig.siteUrl}/logo.png`,
    url: siteConfig.siteUrl,
    telephone: '+91-7411314848',
    email: 'ceo@acadvizen.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No 647-35/29 5th Block, Jayanagar',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      postalCode: '560078',
      addressCountry: 'IN',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Acadvizen',
    url: siteConfig.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.siteUrl}/blog?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Digital Marketing Courses',
    itemListElement: [
      {
        '@type': 'Course',
        name: 'Basic Digital Marketing Course',
        provider: {
          '@type': 'Organization',
          name: 'Acadvizen',
        },
      },
      {
        '@type': 'Course',
        name: 'Advanced Digital Marketing Course',
        provider: {
          '@type': 'Organization',
          name: 'Acadvizen',
        },
      },
      {
        '@type': 'Course',
        name: 'Master Digital Marketing Course',
        provider: {
          '@type': 'Organization',
          name: 'Acadvizen',
        },
      },
    ],
  }

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Acadvizen Blog',
    url: `${siteConfig.siteUrl}/blog`,
    blogPost: localBlogs.slice(0, 6).map((blog) => ({
      '@type': 'BlogPosting',
      headline: blog.title,
      description: blog.excerpt,
      image: `${siteConfig.siteUrl}${blog.image}`,
      url: `${siteConfig.siteUrl}/blog/${blog.slug}`,
      datePublished: blog.created_at,
      author: {
        '@type': 'Organization',
        name: 'Acadvizen',
      },
    })),
  }

  return (
    <html lang="en">
      <body>
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T6Q5DK5C');`}
        </Script>
        <Script
          id="ga-loader"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script id="ga-script" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <Script id="meta-pixel" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '701671662939654');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T6Q5DK5C"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          id="schema-localbusiness"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          id="schema-courses"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
        />
        <script
          id="schema-blog"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
