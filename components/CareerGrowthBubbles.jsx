export default function CareerGrowthBubbles() {
  const bubbles = [
    { region: 'North America', growth: '+10%', size: 'h-24 w-24' },
    { region: 'Europe', growth: '+10%', size: 'h-20 w-20' },
    { region: 'Asia', growth: '+13%', size: 'h-28 w-28' },
    { region: 'South America', growth: '+15%', size: 'h-24 w-24' },
    { region: 'Africa', growth: '+9%', size: 'h-20 w-20' },
    { region: 'Australia', growth: '+8%', size: 'h-20 w-20' },
  ]

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">Career Opportunities Across the World</h2>
      <p className="mt-3 text-slate-300">
        Digital Marketing opens doors to career opportunities across the world.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bubbles.map((item, idx) => (
          <div
            key={item.region}
            className={`mx-auto ${item.size} rounded-full border border-white/15 bg-gradient-to-br from-emerald-400/25 via-sky-400/20 to-indigo-400/25 shadow-[0_12px_30px_rgba(14,116,144,0.25)] flex flex-col items-center justify-center text-center animate-[float_4s_ease-in-out_infinite]`}
            style={{ animationDelay: `${idx * 0.2}s` }}
          >
            <div className="text-lg font-bold text-slate-100">{item.growth}</div>
            <div className="mt-1 text-xs text-slate-200 px-2">{item.region}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
