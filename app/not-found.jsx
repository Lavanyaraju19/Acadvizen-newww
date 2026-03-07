import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Page not found</h1>
        <p className="mt-2 text-slate-300">The page you requested does not exist.</p>
        <Link href="/" className="mt-5 inline-flex text-teal-300 hover:text-teal-200">
          Return home
        </Link>
      </div>
    </div>
  )
}
