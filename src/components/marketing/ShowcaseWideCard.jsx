import { useMemo } from 'react'

const badgeStyles = 'rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600'

function pickBadges(text = '') {
  const lower = text.toLowerCase()
  const badges = []
  const add = (label) => {
    if (!badges.includes(label)) badges.push(label)
  }
  if (lower.includes('google') || lower.includes('ga4') || lower.includes('gtm') || lower.includes('search')) {
    add('Google')
  }
  if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram')) {
    add('Meta')
  }
  if (lower.includes('linkedin')) {
    add('LinkedIn')
  }
  if (lower.includes('seo') || lower.includes('geo') || lower.includes('aeo')) {
    add('SEO')
  }
  if (lower.includes('ai') || lower.includes('chatgpt') || lower.includes('gemini')) {
    add('AI')
  }
  if (lower.includes('shopify')) {
    add('Shopify')
  }
  if (lower.includes('amazon')) {
    add('Amazon')
  }
  return badges.slice(0, 4)
}

function MockupPreview({ title, lines = [], badges = [] }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#f4f7f8] via-[#e6eef0] to-[#dfe7ea]">
      <div className="absolute -top-10 right-[-15%] h-44 w-72 rotate-[18deg] rounded-[28px] bg-white/50" />
      <div className="absolute -bottom-10 left-[-20%] h-40 w-64 rotate-[-14deg] rounded-[28px] bg-white/50" />

      <div className="absolute left-[10%] top-[18%] h-[72%] w-[58%] -rotate-[6deg] rounded-[14px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]" />

      <div className="relative z-10 h-[82%] w-[68%] rounded-[18px] border-[6px] border-[#111827] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.24)]">
        <div className="h-full w-full px-4 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Preview</p>
          <h4 className="mt-3 text-sm font-bold text-slate-900">{title}</h4>
          <div className="mt-3 space-y-2">
            {lines.map((line) => (
              <div key={line} className="h-2 rounded-full bg-slate-200" style={{ width: line }} />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2 w-4/5 rounded-full bg-slate-100" />
            <div className="h-2 w-11/12 rounded-full bg-slate-100" />
          </div>
          {badges.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span key={badge} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-[12%] left-[8%] h-2 w-36 rotate-[-28deg] rounded-full bg-[#a7b1b7]" />
      <div className="absolute bottom-[10%] left-[10%] h-3 w-16 rotate-[-28deg] rounded-full bg-[#1f2937]" />
    </div>
  )
}

export default function ShowcaseWideCard({
  label,
  title,
  problem,
  learn,
  duration,
  solutions = [],
  keywords,
  result,
  skills = [],
  type = 'project',
}) {
  const badgeSource = useMemo(
    () => [title, problem, learn, keywords, result, solutions.join(' '), skills.join(' ')].filter(Boolean).join(' '),
    [title, problem, learn, keywords, result, solutions, skills]
  )
  const badges = useMemo(() => pickBadges(badgeSource), [badgeSource])

  return (
    <article className="mx-auto flex min-h-[360px] w-full min-w-[980px] max-w-[1100px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-[#f7f7f5] shadow-[0_12px_30px_rgba(15,23,42,0.14)] md:flex-row">
      <div className="flex h-[45%] w-full items-center justify-center md:h-full md:w-[45%]">
        <MockupPreview title={title} lines={['85%', '76%', '64%', '58%']} badges={badges} />
      </div>

      <div className="flex w-full flex-1 flex-col justify-center px-8 py-7 md:w-[55%]">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">{label}</p>
        <h3 className="mt-2 text-[22px] font-semibold text-slate-900">{title}</h3>
        {duration ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{duration}</p>
        ) : null}

        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          {problem ? (
            <p>
              <span className="font-semibold text-slate-900">The Problem:</span> {problem}
            </p>
          ) : null}
          {learn ? (
            <p>
              <span className="font-semibold text-slate-900">What You Learn:</span> {learn}
            </p>
          ) : null}
          {keywords ? (
            <p>
              <span className="font-semibold text-slate-900">SEO Keywords:</span> {keywords}
            </p>
          ) : null}
          {result ? (
            <p>
              <span className="font-semibold text-slate-900">The Result:</span> {result}
            </p>
          ) : null}
        </div>

        {type === 'project' ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Strategic Solutions</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {solutions.map((solution) => (
                <div key={solution} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {solution}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {type === 'case-study' ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className={badgeStyles}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
