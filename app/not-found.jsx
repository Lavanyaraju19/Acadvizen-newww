import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_45%),linear-gradient(180deg,#0b2740_0%,#07162b_55%,#050b1c_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Page not found</h1>
        <p className="mt-4 max-w-lg text-base text-slate-200 sm:text-lg">The page you requested does not exist.</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full border border-teal-300/30 bg-teal-300/10 px-5 py-2.5 text-sm font-semibold text-teal-200 transition hover:bg-teal-300/20 hover:text-teal-100"
        >
          Return home
        </Link>
      </div>
    </div>
  )
}
