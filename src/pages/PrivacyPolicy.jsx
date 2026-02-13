import { motion } from 'framer-motion'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <Section className="pt-12 md:pt-16 pb-10 md:pb-14">
        <Container className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(0,191,255,0.45)]" />
              Legal
            </div>
            <h1 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
              Privacy Policy
            </h1>
          </motion.div>
        </Container>
      </Section>

      <Section className="pb-12 md:pb-16">
        <Container className="max-w-4xl">
          <Surface
            className="p-6 md:p-10"
            motionProps={{
              initial: { opacity: 0, y: 12 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: '-80px' },
              transition: { duration: 0.45 },
            }}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">WHO WE ARE</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">We are Digital Marketing Academy in Bangalore.</p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">COMMENTS</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              When visitors leave comments on the site we collect the data shown in the comments form, and also the
              visitorâs IP address and browser user agent string to help spam detection.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              An anonymized string created from your email address (also called a hash) may be provided to the
              Gravatar service to see if you are using it.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              The Gravatar service privacy policy is available here: https://automattic.com/privacy/.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              After approval of your comment, your profile picture is visible to the public in the context of your
              comment.
            </p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">MEDIA</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you upload images to the website, you should avoid uploading images with embedded location data (EXIF
              GPS) included.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Visitors to the website can download and extract any location data from images on the website.
            </p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">COOKIES</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you leave a comment on our site you may opt-in to saving your name, email address and website in
              cookies.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              These are for your convenience so that you do not have to fill in your details again when you leave
              another comment.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">These cookies will last for one year.</p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              This cookie contains no personal data and is discarded when you close your browser.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              When you log in, we will also set up several cookies to save your login information and your screen
              display choices.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Login cookies last for two days, and screen options cookies last for a year.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you select "Remember Me", your login will persist for two weeks.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you log out of your account, the login cookies will be removed.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you edit or publish an article, an additional cookie will be saved in your browser.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              This cookie includes no personal data and simply indicates the post ID of the article you just edited.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">It expires after 1 day.</p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">
              EMBEDDED CONTENT FROM OTHER WEBSITES
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Articles on this site may include embedded content (e.g. videos, images, articles, etc.).
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Embedded content from other websites behaves in the exact same way as if the visitor has visited the
              other website.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              These websites may collect data about you, use cookies, embed additional third-party tracking,
              and monitor your interaction with that embedded content, including tracking your interaction
              with the embedded content if you have an account and are logged in to that website.
            </p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">
              WHO WE SHARE YOUR DATA WITH
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you request a password reset, your IP address will be included in the reset email.
            </p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">
              HOW LONG WE RETAIN YOUR DATA
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you leave a comment, the comment and its metadata are retained indefinitely.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              This is so we can recognize and approve any follow-up comments automatically instead of holding them in a
              moderation queue.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              For users that register on our website (if any), we also store the personal information they provide in
              their user profile.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              All users can see, edit, or delete their personal information at any time (except they cannot change
              their username).
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Website administrators can also see and edit that information.
            </p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">
              WHAT RIGHTS YOU HAVE OVER YOUR DATA
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              If you have an account on this site, or have left comments,
              you can request to receive an exported file of the personal data we hold about you,
              including any data you have provided to us.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              You can also request that we erase any personal data we hold about you.
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">
              This does not include any data we are obliged to keep for administrative, legal, or security purposes.
            </p>

            <h2 className="mt-8 text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">
              WHERE YOUR DATA IS SENT
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Visitor comments may be checked through an automated spam detection service.
            </p>
          </Surface>
        </Container>
      </Section>
    </div>
  )
}
