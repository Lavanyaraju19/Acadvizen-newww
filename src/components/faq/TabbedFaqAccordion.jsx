import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function TabbedFaqAccordion({
  title = 'FAQ',
  intro = '',
  tabs = [],
  items = [],
  panelClassName = '',
  tabActiveClassName = 'border-[#ff6d2d] bg-white text-[#ff6d2d]',
  tabInactiveClassName = 'border-cyan-100/20 bg-transparent text-slate-100',
  cardClassName = 'rounded-[1.7rem] border border-white/10 bg-[#102039] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]',
  answerClassName = 'mt-4 text-lg leading-9 text-slate-200',
}) {
  const [activeTab, setActiveTab] = useState(tabs[0] || null)
  const [openQuestion, setOpenQuestion] = useState(null)

  const filteredItems = useMemo(() => {
    if (!activeTab) return items
    return items.filter((item) => item.category === activeTab)
  }, [activeTab, items])

  const firstQuestion = filteredItems[0]?.question || null
  const activeQuestion = openQuestion && filteredItems.some((item) => item.question === openQuestion) ? openQuestion : firstQuestion

  return (
    <div className={panelClassName}>
      <div className="max-w-4xl">
        <h2 className="text-4xl font-bold text-slate-50">{title}</h2>
        {intro ? <p className="mt-4 text-base leading-8 text-slate-300">{intro}</p> : null}
      </div>

      {tabs.length ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setOpenQuestion(null)
              }}
              className={`rounded-full border px-6 py-3 text-lg font-semibold transition ${
                activeTab === tab ? tabActiveClassName : tabInactiveClassName
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {filteredItems.map((item) => {
          const isOpen = activeQuestion === item.question
          return (
            <div key={item.question} className={cardClassName}>
              <button
                type="button"
                onClick={() => setOpenQuestion(isOpen ? null : item.question)}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <h3 className="text-2xl font-bold leading-tight text-slate-50">{item.question}</h3>
                <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen ? <p className={answerClassName}>{item.answer}</p> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TabbedFaqAccordion
