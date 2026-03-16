'use client'

function fieldKey(label = '') {
  return String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function InputField({ label, value, onChange, placeholder = '', type = 'text', className = '' }) {
  const inputKey = fieldKey(label)
  return (
    <label htmlFor={inputKey} className={`text-xs text-slate-400 ${className}`}>
      {label}
      <input
        id={inputKey}
        name={inputKey}
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange, placeholder = '', rows = 4, className = '' }) {
  const inputKey = fieldKey(label)
  return (
    <label htmlFor={inputKey} className={`text-xs text-slate-400 ${className}`}>
      {label}
      <textarea
        id={inputKey}
        name={inputKey}
        rows={rows}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
      />
    </label>
  )
}

function SectionItemShell({ title, subtitle, onMoveUp, onMoveDown, onDelete, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          {subtitle ? <div className="text-xs text-slate-400">{subtitle}</div> : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
          >
            Up
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
          >
            Down
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  )
}

export default function PrecisionSectionFields({ sectionForm, setSectionForm }) {
  const updateField = (field, value) => {
    setSectionForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateArrayItem = (field, index, patch) => {
    setSectionForm((prev) => ({
      ...prev,
      [field]: (prev[field] || []).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }))
  }

  const removeArrayItem = (field, index) => {
    setSectionForm((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const moveArrayItem = (field, index, direction) => {
    setSectionForm((prev) => {
      const list = [...(prev[field] || [])]
      const nextIndex = direction === 'up' ? index - 1 : index + 1
      if (nextIndex < 0 || nextIndex >= list.length) return prev
      ;[list[index], list[nextIndex]] = [list[nextIndex], list[index]]
      return { ...prev, [field]: list }
    })
  }

  const addArrayItem = (field, item) => {
    setSectionForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), item],
    }))
  }

  const renderHeroEditors = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">Hero badges</div>
            <div className="text-xs text-slate-400">Edit the small pill labels shown above the hero content.</div>
          </div>
          <button
            type="button"
            onClick={() => addArrayItem('badges', { label: '' })}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
          >
            Add badge
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {(sectionForm.badges || []).length === 0 ? (
            <div className="text-xs text-slate-500">No badges yet.</div>
          ) : (
            (sectionForm.badges || []).map((badge, index) => (
              <SectionItemShell
                key={`badge-${index}`}
                title={`Badge ${index + 1}`}
                onMoveUp={() => moveArrayItem('badges', index, 'up')}
                onMoveDown={() => moveArrayItem('badges', index, 'down')}
                onDelete={() => removeArrayItem('badges', index)}
              >
                <InputField
                  label="Badge Text"
                  value={badge.label}
                  onChange={(value) => updateArrayItem('badges', index, { label: value })}
                  className="md:col-span-2"
                />
              </SectionItemShell>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">Hero buttons</div>
            <div className="text-xs text-slate-400">Edit CTA text and links exactly as shown on the website.</div>
          </div>
          <button
            type="button"
            onClick={() => addArrayItem('buttons', { label: '', href: '', target: '_self' })}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
          >
            Add button
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {(sectionForm.buttons || []).length === 0 ? (
            <div className="text-xs text-slate-500">No buttons yet.</div>
          ) : (
            (sectionForm.buttons || []).map((button, index) => (
              <SectionItemShell
                key={`button-${index}`}
                title={`Button ${index + 1}`}
                onMoveUp={() => moveArrayItem('buttons', index, 'up')}
                onMoveDown={() => moveArrayItem('buttons', index, 'down')}
                onDelete={() => removeArrayItem('buttons', index)}
              >
                <InputField
                  label="Button Text"
                  value={button.label}
                  onChange={(value) => updateArrayItem('buttons', index, { label: value })}
                />
                <InputField
                  label="Button URL"
                  value={button.href}
                  onChange={(value) => updateArrayItem('buttons', index, { href: value })}
                />
                <InputField
                  label="Target"
                  value={button.target}
                  onChange={(value) => updateArrayItem('buttons', index, { target: value || '_self' })}
                  className="md:col-span-2"
                />
              </SectionItemShell>
            ))
          )}
        </div>
      </div>
    </div>
  )

  const renderStatsEditors = () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Stats / counters</div>
          <div className="text-xs text-slate-400">Edit each visible growth number or learner metric separately.</div>
        </div>
        <button
          type="button"
          onClick={() => addArrayItem('statItems', { label: '', value: '' })}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
        >
          Add stat
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {(sectionForm.statItems || []).length === 0 ? (
          <div className="text-xs text-slate-500">No stats yet.</div>
        ) : (
          (sectionForm.statItems || []).map((item, index) => (
            <SectionItemShell
              key={`stat-${index}`}
              title={`Stat ${index + 1}`}
              onMoveUp={() => moveArrayItem('statItems', index, 'up')}
              onMoveDown={() => moveArrayItem('statItems', index, 'down')}
              onDelete={() => removeArrayItem('statItems', index)}
            >
              <InputField
                label="Label"
                value={item.label}
                onChange={(value) => updateArrayItem('statItems', index, { label: value })}
              />
              <InputField
                label="Value"
                value={item.value}
                onChange={(value) => updateArrayItem('statItems', index, { value: value })}
              />
            </SectionItemShell>
          ))
        )}
      </div>
    </div>
  )

  const renderCardEditors = (fieldName, title, subtitle) => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          <div className="text-xs text-slate-400">{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={() =>
            addArrayItem(fieldName, {
              title: '',
              text: '',
              listText: '',
              imageSrc: '',
              imageAlt: '',
              buttonLabel: '',
              buttonHref: '',
            })
          }
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
        >
          Add item
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {(sectionForm[fieldName] || []).length === 0 ? (
          <div className="text-xs text-slate-500">No items yet.</div>
        ) : (
          (sectionForm[fieldName] || []).map((card, index) => (
            <SectionItemShell
              key={`${fieldName}-${index}`}
              title={`${title.slice(0, -1)} ${index + 1}`}
              subtitle={card.title || ''}
              onMoveUp={() => moveArrayItem(fieldName, index, 'up')}
              onMoveDown={() => moveArrayItem(fieldName, index, 'down')}
              onDelete={() => removeArrayItem(fieldName, index)}
            >
              <InputField
                label="Title"
                value={card.title}
                onChange={(value) => updateArrayItem(fieldName, index, { title: value })}
              />
              <TextAreaField
                label="Description"
                value={card.text}
                onChange={(value) => updateArrayItem(fieldName, index, { text: value })}
                rows={3}
              />
              <TextAreaField
                label="Bullet Items"
                value={card.listText}
                onChange={(value) => updateArrayItem(fieldName, index, { listText: value })}
                placeholder="One bullet per line"
                rows={4}
              />
              <InputField
                label="Image URL"
                value={card.imageSrc}
                onChange={(value) => updateArrayItem(fieldName, index, { imageSrc: value })}
              />
              <InputField
                label="Image Alt"
                value={card.imageAlt}
                onChange={(value) => updateArrayItem(fieldName, index, { imageAlt: value })}
              />
              <InputField
                label="Button Text"
                value={card.buttonLabel}
                onChange={(value) => updateArrayItem(fieldName, index, { buttonLabel: value })}
              />
              <InputField
                label="Button URL"
                value={card.buttonHref}
                onChange={(value) => updateArrayItem(fieldName, index, { buttonHref: value })}
              />
            </SectionItemShell>
          ))
        )}
      </div>
    </div>
  )

  const renderFaqEditors = () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">FAQ items</div>
          <div className="text-xs text-slate-400">Edit exact questions and answers one by one.</div>
        </div>
        <button
          type="button"
          onClick={() => addArrayItem('faqItems', { question: '', answer: '' })}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
        >
          Add FAQ
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {(sectionForm.faqItems || []).length === 0 ? (
          <div className="text-xs text-slate-500">No FAQs yet.</div>
        ) : (
          (sectionForm.faqItems || []).map((item, index) => (
            <SectionItemShell
              key={`faq-${index}`}
              title={`FAQ ${index + 1}`}
              subtitle={item.question || ''}
              onMoveUp={() => moveArrayItem('faqItems', index, 'up')}
              onMoveDown={() => moveArrayItem('faqItems', index, 'down')}
              onDelete={() => removeArrayItem('faqItems', index)}
            >
              <InputField
                label="Question"
                value={item.question}
                onChange={(value) => updateArrayItem('faqItems', index, { question: value })}
                className="md:col-span-2"
              />
              <TextAreaField
                label="Answer"
                value={item.answer}
                onChange={(value) => updateArrayItem('faqItems', index, { answer: value })}
                rows={4}
                className="md:col-span-2"
              />
            </SectionItemShell>
          ))
        )}
      </div>
    </div>
  )

  const renderTestimonialEditors = () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Testimonials</div>
          <div className="text-xs text-slate-400">Edit reviewer name, role, and quote separately.</div>
        </div>
        <button
          type="button"
          onClick={() => addArrayItem('testimonialItems', { name: '', role: '', quote: '' })}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
        >
          Add testimonial
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {(sectionForm.testimonialItems || []).length === 0 ? (
          <div className="text-xs text-slate-500">No testimonials yet.</div>
        ) : (
          (sectionForm.testimonialItems || []).map((item, index) => (
            <SectionItemShell
              key={`testimonial-${index}`}
              title={`Testimonial ${index + 1}`}
              subtitle={item.name || ''}
              onMoveUp={() => moveArrayItem('testimonialItems', index, 'up')}
              onMoveDown={() => moveArrayItem('testimonialItems', index, 'down')}
              onDelete={() => removeArrayItem('testimonialItems', index)}
            >
              <InputField
                label="Name"
                value={item.name}
                onChange={(value) => updateArrayItem('testimonialItems', index, { name: value })}
              />
              <InputField
                label="Role / Company"
                value={item.role}
                onChange={(value) => updateArrayItem('testimonialItems', index, { role: value })}
              />
              <TextAreaField
                label="Quote"
                value={item.quote}
                onChange={(value) => updateArrayItem('testimonialItems', index, { quote: value })}
                rows={4}
                className="md:col-span-2"
              />
            </SectionItemShell>
          ))
        )}
      </div>
    </div>
  )

  const renderGalleryEditors = () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Gallery images</div>
          <div className="text-xs text-slate-400">Manage each image, alt text, and caption separately.</div>
        </div>
        <button
          type="button"
          onClick={() => addArrayItem('galleryItems', { src: '', alt: '', caption: '' })}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
        >
          Add image
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {(sectionForm.galleryItems || []).length === 0 ? (
          <div className="text-xs text-slate-500">No gallery images yet.</div>
        ) : (
          (sectionForm.galleryItems || []).map((item, index) => (
            <SectionItemShell
              key={`gallery-${index}`}
              title={`Image ${index + 1}`}
              subtitle={item.alt || item.src || ''}
              onMoveUp={() => moveArrayItem('galleryItems', index, 'up')}
              onMoveDown={() => moveArrayItem('galleryItems', index, 'down')}
              onDelete={() => removeArrayItem('galleryItems', index)}
            >
              <InputField
                label="Image URL"
                value={item.src}
                onChange={(value) => updateArrayItem('galleryItems', index, { src: value })}
                className="md:col-span-2"
              />
              <InputField
                label="Alt Text"
                value={item.alt}
                onChange={(value) => updateArrayItem('galleryItems', index, { alt: value })}
              />
              <InputField
                label="Caption"
                value={item.caption}
                onChange={(value) => updateArrayItem('galleryItems', index, { caption: value })}
              />
            </SectionItemShell>
          ))
        )}
      </div>
    </div>
  )

  const renderLeadFormEditors = () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <div className="text-sm font-semibold text-slate-100">Form labels and messages</div>
        <div className="text-xs text-slate-400">Make each field label and success state editable without code.</div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InputField label="Name Label" value={sectionForm.nameLabel} onChange={(value) => updateField('nameLabel', value)} />
        <InputField label="Email Label" value={sectionForm.emailLabel} onChange={(value) => updateField('emailLabel', value)} />
        <InputField label="Phone Label" value={sectionForm.phoneLabel} onChange={(value) => updateField('phoneLabel', value)} />
        <InputField label="Message Label" value={sectionForm.messageLabel} onChange={(value) => updateField('messageLabel', value)} />
        <InputField label="Submit Button" value={sectionForm.submitLabel} onChange={(value) => updateField('submitLabel', value)} />
        <InputField label="Submitting Label" value={sectionForm.submittingLabel} onChange={(value) => updateField('submittingLabel', value)} />
        <TextAreaField
          label="Success Message"
          value={sectionForm.successMessage}
          onChange={(value) => updateField('successMessage', value)}
          rows={3}
        />
        <TextAreaField
          label="Validation Message"
          value={sectionForm.validationMessage}
          onChange={(value) => updateField('validationMessage', value)}
          rows={3}
        />
        <TextAreaField
          label="Error Message"
          value={sectionForm.errorMessage}
          onChange={(value) => updateField('errorMessage', value)}
          rows={3}
        />
        <InputField label="Lead Source" value={sectionForm.leadSource} onChange={(value) => updateField('leadSource', value)} />
        <InputField label="Form Type" value={sectionForm.leadFormType} onChange={(value) => updateField('leadFormType', value)} />
        <InputField label="Page Slug" value={sectionForm.pageSlug} onChange={(value) => updateField('pageSlug', value)} />
      </div>
    </div>
  )

  switch (sectionForm.type) {
    case 'hero':
      return renderHeroEditors()
    case 'stats_section':
      return renderStatsEditors()
    case 'feature_cards':
      return renderCardEditors('cards', 'Cards', 'Edit each course card, trust block, or step individually.')
    case 'three_column_layout':
      return renderCardEditors('columns', 'Columns', 'Edit each column separately, including labels and button links.')
    case 'faq':
      return renderFaqEditors()
    case 'testimonial':
      return renderTestimonialEditors()
    case 'gallery':
      return renderGalleryEditors()
    case 'lead_form':
      return renderLeadFormEditors()
    default:
      return null
  }
}
