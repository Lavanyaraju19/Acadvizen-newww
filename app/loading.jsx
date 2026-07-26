export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-teal-300/70" />
        <p className="mt-4 text-sm text-slate-300">Loading...</p>
      </div>
    </div>
  )
}

