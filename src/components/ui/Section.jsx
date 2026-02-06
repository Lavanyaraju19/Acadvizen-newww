export function Section({ children, className = '' }) {
  return <section className={`relative py-16 md:py-24 ${className}`}>{children}</section>
}

export function Container({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}
