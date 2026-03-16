'use client'

function text(value = '') {
  return String(value ?? '')
}

function updateArray(setSectionForm, key, next) {
  setSectionForm((prev) => ({ ...prev, [key]: next }))
}

function addArrayItem(setSectionForm, key, item) {
  setSectionForm((prev) => ({ ...prev, [key]: [...(Array.isArray(prev[key]) ? prev[key] : []), item] }))
}

function patchArrayItem(setSectionForm, key, index, patch) {
  setSectionForm((prev) => ({
    ...prev,
    [key]: (Array.isArray(prev[key]) ? prev[key] : []).map((entry, itemIndex) =>
      itemIndex === index ? { ...entry, ...patch } : entry
    ),
  }))
}

function removeArrayItem(setSectionForm, key, index) {
  setSectionForm((prev) => ({
    ...prev,
    [key]: (Array.isArray(prev[key]) ? prev[key] : []).filter((_, itemIndex) => itemIndex !== index),
  }))
}

function moveArrayItem(setSectionForm, key, index, direction) {
  setSectionForm((prev) => {
    const items = Array.isArray(prev[key]) ? prev[key].slice() : []
    const target = index + direction
    if (target < 0 || target >= items.length) return prev
    ;[items[index], items[target]] = [items[target], items[index]]
    return { ...prev, [key]: items }
  })
}

function ArrayRowActions({ onUp, onDown, onDelete }) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onUp} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200">
        Up
      </button>
      <button type="button" onClick={onDown} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200">
        Down
      </button>
      <button type="button" onClick={onDelete} className="rounded border border-rose-400/30 px-2 py-1 text-xs text-rose-200">
        Delete
      </button>
    </div>
  )
}

export default function PageSectionPrecisionFields({ sectionForm, setSectionForm }) {
  const type = sectionForm.type

  if (type === 'hero') {
    const badges = Array.isArray(sectionForm.badges) ? sectionForm.badges : []
    const buttons = Array.isArray(sectionForm.buttons) ? sectionForm.buttons : []
    return (
      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hero Precision Fields</p>
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-200">Badges</p>
              <button
                type="button"
                onClick={() => addArrayItem(setSectionForm, 'badges', { label: '' })}
                className="rounded border border-white/10 px-3 py-1 text-xs text-slate-200"
              >
                Add Badge
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {badges.map((badge, index) => (
                <div key={`badge-${index}`} className="rounded-lg border border-white/10 p-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                      value={text(badge?.label)}
                      onChange={(event) => patchArrayItem(setSectionForm, 'badges', index, { label: event.target.value })}
                      placeholder="Badge text"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                    <ArrayRowActions
                      onUp={() => moveArrayItem(setSectionForm, 'badges', index, -1)}
                      onDown={() => moveArrayItem(setSectionForm, 'badges', index, 1)}
                      onDelete={() => removeArrayItem(setSectionForm, 'badges', index)}
                    />
                  </div>
                </div>
              ))}
              {!badges.length ? <p className="text-xs text-slate-500">No badges yet.</p> : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-200">Buttons</p>
              <button
                type="button"
                onClick={() => addArrayItem(setSectionForm, 'buttons', { label: '', href: '', target: '_self', variant: 'primary' })}
                className="rounded border border-white/10 px-3 py-1 text-xs text-slate-200"
              >
                Add Button
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {buttons.map((button, index) => (
                <div key={`hero-button-${index}`} className="rounded-lg border border-white/10 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={text(button?.label)}
                      onChange={(event) => patchArrayItem(setSectionForm, 'buttons', index, { label: event.target.value })}
                      placeholder="Button text"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                    <input
                      value={text(button?.href)}
                      onChange={(event) => patchArrayItem(setSectionForm, 'buttons', index, { href: event.target.value })}
                      placeholder="Button URL"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                    <select
                      value={text(button?.target || '_self')}
                      onChange={(event) => patchArrayItem(setSectionForm, 'buttons', index, { target: event.target.value })}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="_self" className="bg-[#07101b]">Same Tab</option>
                      <option value="_blank" className="bg-[#07101b]">New Tab</option>
                    </select>
                    <select
                      value={text(button?.variant || 'primary')}
                      onChange={(event) => patchArrayItem(setSectionForm, 'buttons', index, { variant: event.target.value })}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="primary" className="bg-[#07101b]">Primary</option>
                      <option value="secondary" className="bg-[#07101b]">Secondary</option>
                    </select>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <ArrayRowActions
                      onUp={() => moveArrayItem(setSectionForm, 'buttons', index, -1)}
                      onDown={() => moveArrayItem(setSectionForm, 'buttons', index, 1)}
                      onDelete={() => removeArrayItem(setSectionForm, 'buttons', index)}
                    />
                  </div>
                </div>
              ))}
              {!buttons.length ? <p className="text-xs text-slate-500">No hero buttons yet.</p> : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'feature_cards') {
    const cards = Array.isArray(sectionForm.cards) ? sectionForm.cards : []
    return (
      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cards</p>
          <button
            type="button"
            onClick={() => addArrayItem(setSectionForm, 'cards', { title: '', text: '', listText: '', buttonLabel: '', buttonHref: '' })}
            className="rounded border border-white/10 px-3 py-1 text-xs text-slate-200"
          >
            Add Card
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {cards.map((card, index) => (
            <div key={`card-${index}`} className="rounded-lg border border-white/10 p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={text(card?.title)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'cards', index, { title: event.target.value })}
                  placeholder="Card title"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={text(card?.text)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'cards', index, { text: event.target.value })}
                  placeholder="Card subtitle / paragraph"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
                <textarea
                  rows={4}
                  value={text(card?.listText)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'cards', index, { listText: event.target.value })}
                  placeholder="One line per bullet"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                />
                <input
                  value={text(card?.buttonLabel)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'cards', index, { buttonLabel: event.target.value })}
                  placeholder="Button text"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={text(card?.buttonHref)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'cards', index, { buttonHref: event.target.value })}
                  placeholder="Button URL"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <ArrayRowActions
                  onUp={() => moveArrayItem(setSectionForm, 'cards', index, -1)}
                  onDown={() => moveArrayItem(setSectionForm, 'cards', index, 1)}
                  onDelete={() => removeArrayItem(setSectionForm, 'cards', index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'faq' || type === 'testimonial' || type === 'gallery' || type === 'stats_section') {
    const key =
      type === 'faq'
        ? 'faqItems'
        : type === 'testimonial'
          ? 'testimonialItems'
          : type === 'gallery'
            ? 'galleryItems'
            : 'statsItems'
    const items = Array.isArray(sectionForm[key]) ? sectionForm[key] : []
    const addDefaults =
      type === 'faq'
        ? { question: '', answer: '' }
        : type === 'testimonial'
          ? { name: '', role: '', quote: '' }
          : type === 'gallery'
            ? { src: '', alt: '' }
            : { label: '', value: '' }

    return (
      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {type === 'faq' ? 'FAQ Items' : type === 'testimonial' ? 'Testimonials' : type === 'gallery' ? 'Gallery Images' : 'Stats'}
          </p>
          <button
            type="button"
            onClick={() => addArrayItem(setSectionForm, key, addDefaults)}
            className="rounded border border-white/10 px-3 py-1 text-xs text-slate-200"
          >
            Add Item
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={`${key}-${index}`} className="rounded-lg border border-white/10 p-3">
              <div className="grid gap-3 md:grid-cols-2">
                {type === 'faq' ? (
                  <>
                    <input
                      value={text(item?.question)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { question: event.target.value })}
                      placeholder="Question"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                    />
                    <textarea
                      rows={4}
                      value={text(item?.answer)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { answer: event.target.value })}
                      placeholder="Answer"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                    />
                  </>
                ) : null}
                {type === 'testimonial' ? (
                  <>
                    <input
                      value={text(item?.name)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { name: event.target.value })}
                      placeholder="Name"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                    <input
                      value={text(item?.role)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { role: event.target.value })}
                      placeholder="Role / Company"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                    <textarea
                      rows={4}
                      value={text(item?.quote)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { quote: event.target.value })}
                      placeholder="Review text"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                    />
                  </>
                ) : null}
                {type === 'gallery' ? (
                  <>
                    <input
                      value={text(item?.src)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { src: event.target.value })}
                      placeholder="Image URL"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                    />
                    <input
                      value={text(item?.alt)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { alt: event.target.value })}
                      placeholder="Alt text"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                    />
                  </>
                ) : null}
                {type === 'stats_section' ? (
                  <>
                    <input
                      value={text(item?.label)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { label: event.target.value })}
                      placeholder="Label"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                    <input
                      value={text(item?.value)}
                      onChange={(event) => patchArrayItem(setSectionForm, key, index, { value: event.target.value })}
                      placeholder="Value"
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                    />
                  </>
                ) : null}
              </div>
              <div className="mt-3 flex justify-end">
                <ArrayRowActions
                  onUp={() => moveArrayItem(setSectionForm, key, index, -1)}
                  onDown={() => moveArrayItem(setSectionForm, key, index, 1)}
                  onDelete={() => removeArrayItem(setSectionForm, key, index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'three_column_layout') {
    const columns = Array.isArray(sectionForm.columnItems) ? sectionForm.columnItems : []
    return (
      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Columns</p>
          <button
            type="button"
            onClick={() => addArrayItem(setSectionForm, 'columnItems', { heading: '', text: '', listText: '', buttonLabel: '', buttonHref: '' })}
            className="rounded border border-white/10 px-3 py-1 text-xs text-slate-200"
          >
            Add Column
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {columns.map((column, index) => (
            <div key={`column-${index}`} className="rounded-lg border border-white/10 p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={text(column?.heading)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'columnItems', index, { heading: event.target.value })}
                  placeholder="Column heading"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={text(column?.text)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'columnItems', index, { text: event.target.value })}
                  placeholder="Column paragraph"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
                <textarea
                  rows={3}
                  value={text(column?.listText)}
                  onChange={(event) => patchArrayItem(setSectionForm, 'columnItems', index, { listText: event.target.value })}
                  placeholder="One line per bullet"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <ArrayRowActions
                  onUp={() => moveArrayItem(setSectionForm, 'columnItems', index, -1)}
                  onDown={() => moveArrayItem(setSectionForm, 'columnItems', index, 1)}
                  onDelete={() => removeArrayItem(setSectionForm, 'columnItems', index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'two_column_layout') {
    return (
      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Two Column Content</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs font-semibold text-slate-300">Left Column</p>
            <div className="mt-3 space-y-3">
              <input value={text(sectionForm.leftHeading)} onChange={(event) => setSectionForm((prev) => ({ ...prev, leftHeading: event.target.value }))} placeholder="Heading" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              <textarea rows={4} value={text(sectionForm.leftText)} onChange={(event) => setSectionForm((prev) => ({ ...prev, leftText: event.target.value }))} placeholder="Paragraph" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              <textarea rows={4} value={text(sectionForm.leftListText)} onChange={(event) => setSectionForm((prev) => ({ ...prev, leftListText: event.target.value }))} placeholder="One line per bullet" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs font-semibold text-slate-300">Right Column</p>
            <div className="mt-3 space-y-3">
              <input value={text(sectionForm.rightHeading)} onChange={(event) => setSectionForm((prev) => ({ ...prev, rightHeading: event.target.value }))} placeholder="Heading" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              <textarea rows={4} value={text(sectionForm.rightText)} onChange={(event) => setSectionForm((prev) => ({ ...prev, rightText: event.target.value }))} placeholder="Paragraph" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              <textarea rows={4} value={text(sectionForm.rightListText)} onChange={(event) => setSectionForm((prev) => ({ ...prev, rightListText: event.target.value }))} placeholder="One line per bullet" className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'lead_form') {
    return (
      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Form Labels and Messages</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={text(sectionForm.nameLabel)} onChange={(event) => setSectionForm((prev) => ({ ...prev, nameLabel: event.target.value }))} placeholder="Name field label" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          <input value={text(sectionForm.emailLabel)} onChange={(event) => setSectionForm((prev) => ({ ...prev, emailLabel: event.target.value }))} placeholder="Email field label" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          <input value={text(sectionForm.phoneLabel)} onChange={(event) => setSectionForm((prev) => ({ ...prev, phoneLabel: event.target.value }))} placeholder="Phone field label" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          <input value={text(sectionForm.messageLabel)} onChange={(event) => setSectionForm((prev) => ({ ...prev, messageLabel: event.target.value }))} placeholder="Message field label" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          <input value={text(sectionForm.submitLabel)} onChange={(event) => setSectionForm((prev) => ({ ...prev, submitLabel: event.target.value }))} placeholder="Submit button text" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          <input value={text(sectionForm.errorMessage)} onChange={(event) => setSectionForm((prev) => ({ ...prev, errorMessage: event.target.value }))} placeholder="Error message" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          <textarea rows={3} value={text(sectionForm.validationMessage)} onChange={(event) => setSectionForm((prev) => ({ ...prev, validationMessage: event.target.value }))} placeholder="Validation message" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2" />
          <textarea rows={3} value={text(sectionForm.successMessage)} onChange={(event) => setSectionForm((prev) => ({ ...prev, successMessage: event.target.value }))} placeholder="Success message" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 md:col-span-2" />
        </div>
      </div>
    )
  }

  return null
}
