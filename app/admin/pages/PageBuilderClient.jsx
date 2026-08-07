'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DynamicSectionRenderer from '../../../components/sections/DynamicSectionRenderer'
import VersionHistory from '../../../components/admin/VersionHistory'
import { Surface } from '../../../src/components/ui/Surface'
import PrecisionSectionFields from './PrecisionSectionFields'
import { LIVE_SYNC_TARGETS } from '../../../lib/livePageTargets'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { saveAutosave, loadAutosave, clearAutosave, useAutosave } from '../../../lib/autosave'
import { generateSlug, generateSlugLive } from '../../../lib/slugUtils'

const SECTION_TYPES = [
  'hero',
  'text_block',
  'image_block',
  'video_block',
  'two_column_layout',
  'three_column_layout',
  'testimonial',
  'faq',
  'gallery',
  'cta_banner',
  'stats_section',
  'feature_cards',
  'pricing',
  'team',
  'map',
  'custom_rich_text',
  'testimonials_feed',
  'placement_feed',
  'recruiters_feed',
  'instructors_feed',
  'certifications_feed',
  'success_stories_feed',
  'metrics_counters',
  'trust_badges_feed',
  'community_events_feed',
  'cta_block_ref',
  'courses_feed',
  'tools_feed',
  'company_logos_feed',
  'lead_form',
  'form_embed',
  'location_explorer',
  'interactive_learner_map',
]

const EMPTY_PAGE_FORM = {
  id: '',
  title: '',
  slug: '',
  description: '',
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  status: 'draft',
  scheduled_publish_at: '',
  scheduled_unpublish_at: '',
}

// <input type="datetime-local"> works in "YYYY-MM-DDTHH:mm" local-time strings, not ISO -
// these convert at the form/API boundary so pageForm state can stay a plain string the
// input understands directly.
function isoToDatetimeLocal(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function datetimeLocalToIso(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const EMPTY_SECTION_FORM = {
  id: '',
  type: 'hero',
  isVisible: true,
  heading: '',
  subheading: '',
  text: '',
  listText: '',
  imageSrc: '',
  imageAlt: '',
  videoUrl: '',
  buttonLabel: '',
  buttonHref: '',
  buttonTarget: '_self',
  buttons: [],
  badges: [],
  cards: [],
  columns: [],
  faqItems: [],
  testimonialItems: [],
  galleryItems: [],
  statItems: [],
  planItems: [],
  teamMembers: [],
  embedUrl: '',
  address: '',
  html: '',
  padding: 'md',
  alignment: 'left',
  mobileHidden: false,
  desktopHidden: false,
  rawJson: '',
  feedLimit: '',
  ctaKey: '',
  leadSource: '',
  leadFormType: '',
  pageSlug: '',
  nameLabel: '',
  emailLabel: '',
  phoneLabel: '',
  messageLabel: '',
  submitLabel: '',
  submittingLabel: '',
  successMessage: '',
  errorMessage: '',
  validationMessage: '',
  formId: '',
  bgColor: '',
  textColor: '',
  headingSize: 'md',
  textSize: 'md',
  fontFamily: 'poppins',
  buttonBg: '',
  buttonText: '',
  imageWidth: '',
  imageHeight: '',
  imageRadius: '',
  imageFit: 'cover',
  layoutVariant: 'default',
  columnsCount: 3,
  maxWidth: '',
  insertAfterIndex: undefined,
}

function toSlug(value = '') {
  return generateSlug(value)
}

function toSlugLive(value = '') {
  return generateSlugLive(value)
}

function parseLines(value = '') {
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function buildButton(button = {}) {
  if (!button?.label && !button?.href) return null
  return {
    label: button.label || 'Learn more',
    href: button.href || '#',
    target: button.target || '_self',
  }
}

function normalizeButtons(content = {}) {
  if (safeArray(content.buttons).length) {
    return content.buttons.map((item) => ({
      label: item?.label || '',
      href: item?.href || '',
      target: item?.target || '_self',
    }))
  }
  if (content.button?.label || content.button?.href) {
    return [{ label: content.button?.label || '', href: content.button?.href || '', target: content.button?.target || '_self' }]
  }
  return []
}

function normalizeCardItems(items = []) {
  return safeArray(items).map((item) => ({
    title: item?.title || '',
    text: item?.text || item?.desc || '',
    listText: safeArray(item?.list).join('\n'),
    imageSrc: item?.src || '',
    imageAlt: item?.alt || '',
    buttonLabel: item?.button?.label || '',
    buttonHref: item?.button?.href || '',
  }))
}

function buildCardItems(items = []) {
  return safeArray(items)
    .map((item) => ({
      title: item?.title || undefined,
      text: item?.text || undefined,
      list: parseLines(item?.listText || ''),
      src: item?.imageSrc || undefined,
      alt: item?.imageAlt || undefined,
      button: buildButton({ label: item?.buttonLabel, href: item?.buttonHref }),
    }))
    .map((item) =>
      Object.fromEntries(
        Object.entries(item).filter(([key, value]) => {
          if (value === undefined || value === null) return false
          if (Array.isArray(value) && value.length === 0) return false
          if (typeof value === 'string' && value.trim() === '') return false
          if (key === 'button' && !value) return false
          return true
        })
      )
    )
    .filter((item) => Object.keys(item).length > 0)
}

function formFromContent(content = {}) {
  return {
    heading: content.heading || '',
    subheading: content.subheading || '',
    text: content.text || '',
    listText: safeArray(content.list).join('\n'),
    imageSrc: content.src || '',
    imageAlt: content.alt || '',
    videoUrl: content.embed_url || content.url || '',
    buttonLabel: content.button?.label || '',
    buttonHref: content.button?.href || '',
    buttonTarget: content.button?.target || '_self',
    buttons: normalizeButtons(content),
    badges: safeArray(content.badges).map((item) => ({ label: item?.label || '' })),
    cards: normalizeCardItems(content.cards),
    columns: normalizeCardItems(content.columns),
    faqItems: safeArray(content.items).map((item) => ({ question: item?.question || '', answer: item?.answer || '' })),
    testimonialItems: safeArray(content.items).map((item) => ({ name: item?.name || '', role: item?.role || '', quote: item?.quote || '' })),
    galleryItems: safeArray(content.items).map((item) => ({ src: item?.src || '', alt: item?.alt || '', caption: item?.caption || '' })),
    statItems: safeArray(content.stats).map((item) => ({ label: item?.label || '', value: item?.value || '' })),
    planItems: safeArray(content.plans).map((item) => ({
      name: item?.name || '',
      price: item?.price || '',
      period: item?.period || '',
      description: item?.description || '',
      badge: item?.badge || '',
      highlighted: Boolean(item?.highlighted),
      featuresText: safeArray(item?.features).join('\n'),
      buttonLabel: item?.button?.label || '',
      buttonHref: item?.button?.href || '',
    })),
    teamMembers: safeArray(content.members).map((item) => ({
      name: item?.name || '',
      role: item?.role || '',
      bio: item?.bio || '',
      photo: item?.photo || '',
    })),
    embedUrl: content.embed_url || '',
    address: content.address || '',
    html: content.html || '',
    padding: content.padding || 'md',
    alignment: content.alignment || 'left',
    mobileHidden: Boolean(content.mobile_hidden),
    desktopHidden: Boolean(content.desktop_hidden),
    feedLimit: content.limit || '',
    ctaKey: content.cta_key || content.key || '',
    leadSource: content.source || '',
    leadFormType: content.form_type || '',
    pageSlug: content.page_slug || '',
    nameLabel: content.name_label || '',
    emailLabel: content.email_label || '',
    phoneLabel: content.phone_label || '',
    messageLabel: content.message_label || '',
    submitLabel: content.submit_label || '',
    submittingLabel: content.submitting_label || '',
    successMessage: content.success_message || '',
    errorMessage: content.error_message || '',
    validationMessage: content.validation_message || '',
    formId: content.form_id || '',
    rawJson: JSON.stringify(content, null, 2),
  }
}

function formFromStyle(style = {}) {
  return {
    bgColor: style.background_color || style.section_background || '',
    textColor: style.text_color || '',
    headingSize: style.heading_size || 'md',
    textSize: style.text_size || 'md',
    fontFamily: style.font_family || 'poppins',
    buttonBg: style.button_background || '',
    buttonText: style.button_text_color || '',
    imageWidth: style.image_width || '',
    imageHeight: style.image_height || '',
    imageRadius: style.image_radius || '',
    imageFit: style.image_fit || 'cover',
    layoutVariant: style.layout_variant || 'default',
    columnsCount: style.columns || 3,
    maxWidth: style.max_width || '',
  }
}

function createEmptySectionForm(type = 'hero') {
  return { ...EMPTY_SECTION_FORM, type }
}

function TextAreaField({ label, value, onChange, rows = 4, className = '' }) {
  const inputKey = `pagebuilder-${toSlug(label) || 'field'}`
  return (
    <label htmlFor={inputKey} className={`text-xs text-slate-400 ${className}`}>
      {label}
      <textarea
        id={inputKey}
        name={inputKey}
        rows={rows}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
      />
    </label>
  )
}

function contentFromForm(form) {
  const payload = {
    heading: form.heading || undefined,
    subheading: form.subheading || undefined,
    text: form.text || undefined,
    list: parseLines(form.listText),
    src: form.imageSrc || undefined,
    alt: form.imageAlt || undefined,
    embed_url: form.videoUrl || undefined,
    padding: form.padding || 'md',
    alignment: form.alignment || 'left',
    mobile_hidden: Boolean(form.mobileHidden),
    desktop_hidden: Boolean(form.desktopHidden),
    limit: Number(form.feedLimit) || undefined,
    cta_key: form.ctaKey || undefined,
    source: form.leadSource || undefined,
    form_type: form.leadFormType || undefined,
    page_slug: form.pageSlug || undefined,
  }

  if (form.buttonLabel || form.buttonHref) {
    payload.button = {
      label: form.buttonLabel || 'Learn more',
      href: form.buttonHref || '#',
      target: form.buttonTarget || '_self',
    }
  }

  if (form.type === 'hero') {
    const buttons = safeArray(form.buttons).map((item) => buildButton(item)).filter(Boolean)
    payload.badges = safeArray(form.badges).filter((item) => item?.label).map((item) => ({ label: item.label }))
    payload.buttons = buttons
    if (buttons[0]) payload.button = buttons[0]
  }
  if (form.type === 'feature_cards') payload.cards = buildCardItems(form.cards)
  if (form.type === 'three_column_layout') payload.columns = buildCardItems(form.columns)
  if (form.type === 'stats_section') {
    payload.stats = safeArray(form.statItems)
      .filter((item) => item?.label || item?.value)
      .map((item) => ({ label: item.label || '', value: item.value || '' }))
  }
  if (form.type === 'faq') {
    payload.items = safeArray(form.faqItems)
      .filter((item) => item?.question || item?.answer)
      .map((item) => ({ question: item.question || '', answer: item.answer || '' }))
  }
  if (form.type === 'testimonial') {
    payload.items = safeArray(form.testimonialItems)
      .filter((item) => item?.name || item?.role || item?.quote)
      .map((item) => ({ name: item.name || '', role: item.role || '', quote: item.quote || '' }))
  }
  if (form.type === 'gallery') {
    payload.items = safeArray(form.galleryItems)
      .filter((item) => item?.src)
      .map((item) => ({ src: item.src || '', alt: item.alt || '', caption: item.caption || '' }))
  }
  if (form.type === 'pricing') {
    payload.plans = safeArray(form.planItems)
      .filter((item) => item?.name)
      .map((item) => ({
        name: item.name || '',
        price: item.price || '',
        period: item.period || '',
        description: item.description || '',
        badge: item.badge || '',
        highlighted: Boolean(item.highlighted),
        features: parseLines(item.featuresText),
        ...(item.buttonLabel || item.buttonHref ? { button: { label: item.buttonLabel || 'Get Started', href: item.buttonHref || '#' } } : {}),
      }))
  }
  if (form.type === 'team') {
    payload.members = safeArray(form.teamMembers)
      .filter((item) => item?.name)
      .map((item) => ({ name: item.name || '', role: item.role || '', bio: item.bio || '', photo: item.photo || '' }))
  }
  if (form.type === 'map') {
    payload.embed_url = form.embedUrl || undefined
    payload.address = form.address || undefined
  }
  if (form.type === 'custom_rich_text') {
    payload.html = form.html || undefined
  }
  if (form.type === 'lead_form') {
    payload.name_label = form.nameLabel || undefined
    payload.email_label = form.emailLabel || undefined
    payload.phone_label = form.phoneLabel || undefined
    payload.message_label = form.messageLabel || undefined
    payload.submit_label = form.submitLabel || undefined
    payload.submitting_label = form.submittingLabel || undefined
    payload.success_message = form.successMessage || undefined
    payload.error_message = form.errorMessage || undefined
    payload.validation_message = form.validationMessage || undefined
  } else if (form.type === 'form_embed') {
    payload.form_id = form.formId || undefined
    payload.heading = form.heading || undefined
  } else if (form.type === 'location_explorer') {
    payload.group_id = form.groupId || undefined
    payload.cta_label = form.cta_label || undefined
    payload.cta_url = form.cta_url || undefined
  } else if (form.type === 'interactive_learner_map') {
    payload.description = form.description || undefined
    payload.height = Number(form.height) || undefined
    payload.initialZoom = Number(form.initialZoom) || undefined
    payload.mapStyle = form.mapStyle || undefined
    payload.showSearch = form.showSearch !== false
    payload.showGrowth = form.showGrowth !== false
    payload.ctaLabel = form.ctaLabel || undefined
    payload.ctaUrl = form.ctaUrl || undefined
  } else if (form.successMessage) {
    payload.success_message = form.successMessage
  }

  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (value === undefined || value === null) return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'string' && value.trim() === '') return false
      if (key === 'button' && !value?.label && !value?.href) return false
      return true
    })
  )

  if (form.rawJson?.trim()) {
    try {
      const raw = JSON.parse(form.rawJson)
      return { ...(raw || {}), ...cleaned }
    } catch {
      return cleaned
    }
  }
  return cleaned
}

function styleFromForm(form) {
  const payload = {
    background_color: form.bgColor || undefined,
    text_color: form.textColor || undefined,
    heading_size: form.headingSize || undefined,
    text_size: form.textSize || undefined,
    font_family: form.fontFamily || undefined,
    button_background: form.buttonBg || undefined,
    button_text_color: form.buttonText || undefined,
    image_width: form.imageWidth || undefined,
    image_height: form.imageHeight || undefined,
    image_radius: form.imageRadius || undefined,
    image_fit: form.imageFit || undefined,
    layout_variant: form.layoutVariant || undefined,
    columns: Number(form.columnsCount) || undefined,
    max_width: form.maxWidth || undefined,
    padding: form.padding || undefined,
    alignment: form.alignment || undefined,
  }
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function pagePreviewHref(slug = '') {
  if (!slug) return '#'
  return slug === 'home' ? '/' : `/${slug}`
}

function describeSection(section) {
  const content = section?.content_json || {}
  return content.heading || content.title || content.subheading || content.text?.slice?.(0, 60) || 'No content yet'
}

function hasDraftContent(form) {
  return Object.keys(contentFromForm(form)).length > 0
}

function fieldAttrs(name) {
  return {
    id: name,
    name,
  }
}

// Drag handle + row for one section in the list, backed by @dnd-kit/sortable instead of the
// native HTML5 draggable API (no visual drop indicator, no touch support, easy to drop on the
// wrong target). All mutating actions are passed in as callbacks so this stays a pure
// presentation component.
function SortableSectionRow({ section, index, isLast, isSelected, onEdit, onMoveUp, onMoveDown, onDuplicate, onCopy, onToggleVisibility, onDelete, onInsertAfter }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`rounded-xl border p-3 transition-all ${isSelected ? 'border-teal-300/50 bg-teal-300/10' : 'border-white/10 bg-white/[0.02]'} ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 touch-none"
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
            </svg>
          </button>
          <button
            type="button"
            data-testid={`page-section-edit-${section.id}`}
            onClick={() => onEdit(section)}
            className="flex-1 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100 capitalize">
                {section.type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500">#{index + 1}</span>
              {section.visibility === false && (
                <span className="text-xs text-slate-500">(hidden)</span>
              )}
            </div>
            <div className="text-xs text-slate-400 truncate">{describeSection(section)}</div>
          </button>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onMoveUp(index)} disabled={index === 0} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30" title="Move Up">
              ↑
            </button>
            <button type="button" onClick={() => onMoveDown(index)} disabled={isLast} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30" title="Move Down">
              ↓
            </button>
            <button type="button" onClick={() => onDuplicate(section.id)} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Duplicate">
              📋
            </button>
            <button type="button" onClick={() => onCopy(section)} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Copy (paste on any page)">
              ⧉
            </button>
            <button type="button" onClick={() => onToggleVisibility(section)} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title={section.visibility ? 'Hide' : 'Show'}>
              {section.visibility ? '👁️' : '👁️‍🗨️'}
            </button>
            <button type="button" onClick={() => onDelete(section.id)} className="p-1.5 rounded-lg border border-rose-400/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Insert Section Between */}
      <div className="flex justify-center -mt-1">
        <button
          type="button"
          onClick={() => onInsertAfter(index)}
          className="text-xs text-teal-400 hover:text-teal-300 px-2 py-1"
          title="Insert section after"
        >
          + Insert after
        </button>
      </div>
    </div>
  )
}

// DataFeedSection (and any other component registered against these types in
// DynamicSectionRenderer) is a server-only async component that queries Supabase directly with
// server credentials. It renders correctly on the real public page (a genuine Server Component
// tree), but this admin editor is a Client Component - trying to render an async server component
// synchronously here doesn't await it correctly and, worse, its Supabase client falls back to
// browser-exposed env vars and fires malformed direct-to-PostgREST requests. Rather than showing
// live data here, the editor previews these sections with a static placeholder and points the
// admin at the real public page for an accurate preview.
const LIVE_DATA_ONLY_SECTION_TYPES = new Set([
  'testimonials_feed', 'placement_feed', 'recruiters_feed', 'instructors_feed',
  'certifications_feed', 'success_stories_feed', 'metrics_counters', 'trust_badges_feed',
  'community_events_feed', 'cta_block_ref', 'courses_feed', 'tools_feed', 'company_logos_feed',
  'location_explorer', 'interactive_learner_map',
])

function PreviewSafeSection({ section }) {
  if (LIVE_DATA_ONLY_SECTION_TYPES.has(String(section?.type || '').toLowerCase())) {
    return (
      <div className="mx-4 my-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-xs text-slate-400">
        <span className="font-semibold text-slate-300">{section.type.replace(/_/g, ' ')}</span> pulls live data on the
        published page - publish or visit the live URL to see real content here.
      </div>
    )
  }
  return <DynamicSectionRenderer section={section} />
}

export default function PageBuilderClient() {
  const searchParams = useSearchParams()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [bootstrapped, setBootstrapped] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState('')
  const [pageForm, setPageForm] = useState(EMPTY_PAGE_FORM)
  const [sectionForm, setSectionForm] = useState(createEmptySectionForm())
  const [previewMode, setPreviewMode] = useState(false)
  const [reorderHistory, setReorderHistory] = useState([])
  const [reorderPointer, setReorderPointer] = useState(-1)
  const [sectionClipboard, setSectionClipboard] = useState(null)
  // KeyboardSensor makes section reordering operable without a mouse (Space to pick up, Arrow
  // keys to move, Space to drop, Escape to cancel) - a pointer-only DndContext fails WCAG 2.1.1
  // for any drag-and-drop interaction with no keyboard equivalent.
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const pageDetailsFormRef = useRef(null)

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId])
  const sections = useMemo(
    () => safeArray(selectedPage?.sections).slice().sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0)),
    [selectedPage]
  )
  const selectedSection = useMemo(() => sections.find((section) => section.id === sectionForm.id) || null, [sections, sectionForm.id])
  const matchedTemplate = useMemo(
    () => LIVE_SYNC_TARGETS.find((template) => template.slug === (pageForm.slug || selectedPage?.slug)),
    [pageForm.slug, selectedPage?.slug]
  )

  // Autosave page data
  useAutosave('page', selectedPageId, { pageForm, sectionForm }, [pageForm, sectionForm, selectedPageId])

  const previewSections = useMemo(() => {
    const draft = {
      id: sectionForm.id || '__draft__',
      type: sectionForm.type,
      order_index: selectedSection?.order_index ?? sections.length,
      visibility: sectionForm.isVisible !== false,
      content_json: contentFromForm(sectionForm),
      style_json: styleFromForm(sectionForm),
    }
    if (!selectedPage) return hasDraftContent(sectionForm) ? [draft] : []
    if (!hasDraftContent(sectionForm) && !sectionForm.id) return sections
    if (sectionForm.id) return sections.map((section) => (section.id === sectionForm.id ? draft : section))
    return [...sections, draft]
  }, [sectionForm, selectedPage, selectedSection?.order_index, sections])

  async function loadPages(nextSelectedId) {
    setLoading(true)
    try {
      const payload = await adminApiFetch('/api/cms/pages?include_drafts=1&include_sections=1', { cache: 'no-store' })
      const nextPages = Array.isArray(payload.data) ? payload.data : []
      setPages(nextPages)
      const selectedId = nextSelectedId || selectedPageId || nextPages[0]?.id || ''
      setSelectedPageId(selectedId)
      if (selectedId) {
        const page = nextPages.find((item) => item.id === selectedId)
        if (page) {
          setPageForm({
            id: page.id,
            title: page.title || '',
            slug: page.slug || '',
            description: page.description || '',
            seo_title: page.seo_title || '',
            seo_description: page.seo_description || '',
            canonical_url: page.canonical_url || '',
            status: page.status || 'draft',
            scheduled_publish_at: isoToDatetimeLocal(page.scheduled_publish_at),
            scheduled_unpublish_at: isoToDatetimeLocal(page.scheduled_unpublish_at),
          })
        }
      } else {
        setPageForm(EMPTY_PAGE_FORM)
      }
      return nextPages
    } catch (error) {
      setStatus(error?.message || 'Unable to load pages.')
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function bootstrap() {
      setBootstrapped(false)
      setStatus('')
      try {
        const pages = await loadPages(searchParams.get('page') || undefined)
        setBootstrapped(true)
        
        // Check for autosaved drafts
        if (selectedPageId) {
          const autosave = loadAutosave('page', selectedPageId)
          if (autosave && autosave.data?.pageForm) {
            setStatus('📝 Recovered unsaved changes from ' + new Date(autosave.savedAt).toLocaleTimeString())
            setFormFromAutosave(autosave.data)
          }
        }
        
        if (pages.length) {
          setStatus('Loaded existing CMS pages.')
          return
        }

        setStatus('No CMS pages found yet. Importing the current website structure once...')
        await adminApiFetch('/api/cms/import-live-pages', {
          method: 'POST',
          body: {
            replace_sections: true,
            slugs: LIVE_SYNC_TARGETS.map((target) => target.slug),
          },
        })
        await loadPages()
        setStatus('Imported the current website structure into the CMS.')
      } catch (error) {
        await loadPages()
        setBootstrapped(true)
        setStatus(error?.message || 'Loaded CMS pages, but automatic sync could not be completed.')
      }
    }

    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('acadvizen_section_clipboard')
      if (raw) setSectionClipboard(JSON.parse(raw))
    } catch { /* private-browsing storage denial is non-fatal */ }
  }, [])

  // Reorder history is scoped to whichever page is open - a stack of section ids from one
  // page is meaningless once a different page (different ids) is selected.
  useEffect(() => {
    setReorderHistory([])
    setReorderPointer(-1)
  }, [selectedPageId])

  useEffect(() => {
    function onKeyDown(event) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) redoReorder()
      else undoReorder()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorderHistory, reorderPointer, sections])

  function setFormFromAutosave(autosaveData) {
    if (autosaveData?.pageForm) {
      setPageForm(autosaveData.pageForm)
    }
    if (autosaveData?.sectionForm) {
      setSectionForm(autosaveData.sectionForm)
    }
  }

  function syncPageForm(page) {
    if (!page) return
    setPageForm({
      id: page.id,
      title: page.title || '',
      slug: page.slug || '',
      description: page.description || '',
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      canonical_url: page.canonical_url || '',
      status: page.status || 'draft',
      scheduled_publish_at: isoToDatetimeLocal(page.scheduled_publish_at),
      scheduled_unpublish_at: isoToDatetimeLocal(page.scheduled_unpublish_at),
    })
  }

  function beginCreatePage() {
    setSelectedPageId('')
    setPageForm(EMPTY_PAGE_FORM)
    setSectionForm(createEmptySectionForm())
    setLiveUrl('')
  }

  function beginEditSection(section) {
    setSectionForm({
      ...createEmptySectionForm(section.type || 'hero'),
      id: section.id,
      type: section.type || 'hero',
      isVisible: section.visibility !== false,
      ...formFromContent(section.content_json || {}),
      ...formFromStyle(section.style_json || {}),
    })
  }

  function resetSectionForm(type = sectionForm.type || 'hero') {
    setSectionForm(createEmptySectionForm(type))
  }

  async function persistPage(nextForm, successMessage) {
    const json = await adminApiFetch('/api/cms/pages', {
      method: 'POST',
      body: {
        ...nextForm,
        slug: toSlug(nextForm.slug?.trim() || nextForm.title),
        scheduled_publish_at: datetimeLocalToIso(nextForm.scheduled_publish_at),
        scheduled_unpublish_at: datetimeLocalToIso(nextForm.scheduled_unpublish_at),
      },
    })
    await loadPages(json.data?.id)
    clearAutosave('page', json.data?.id)
    const finalLiveUrl = json.publication?.canonical_public_url || json.data?.canonical_public_url || ''
    setLiveUrl(finalLiveUrl)
    setStatus(finalLiveUrl ? `${successMessage} Live URL: ${finalLiveUrl}` : successMessage)
    return json.data
  }

  function getCurrentPageForm(nextStatus = pageForm.status) {
    const form = pageDetailsFormRef.current
    if (!form) return { ...pageForm, status: nextStatus }

    return {
      ...pageForm,
      title: form.elements.page_title?.value || pageForm.title,
      slug: form.elements.page_slug?.value || pageForm.slug,
      description: form.elements['pagebuilder-page-description']?.value || pageForm.description,
      seo_title: form.elements.page_seo_title?.value || pageForm.seo_title,
      seo_description: form.elements['pagebuilder-seo-description']?.value || pageForm.seo_description,
      canonical_url: form.elements.page_canonical_url?.value || pageForm.canonical_url,
      status: nextStatus || form.elements.page_status?.value || pageForm.status,
      scheduled_publish_at: form.elements.page_scheduled_publish_at?.value ?? pageForm.scheduled_publish_at,
      scheduled_unpublish_at: form.elements.page_scheduled_unpublish_at?.value ?? pageForm.scheduled_unpublish_at,
    }
  }

  async function handleSavePage(event) {
    event.preventDefault()
    const currentPageForm = getCurrentPageForm()
    if (!currentPageForm.title.trim()) {
      setStatus('Page title is required.')
      return
    }
    setSaving(true)
    setStatus('')
    try {
      await persistPage(currentPageForm, currentPageForm.status === 'published' ? 'Page published.' : 'Page saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save page.')
    } finally {
      setSaving(false)
    }
  }

  async function savePageWithStatus(nextStatus) {
    const nextForm = getCurrentPageForm(nextStatus)
    if (!nextForm.title.trim()) {
      setStatus('Page title is required.')
      return
    }
    setPageForm(nextForm)
    setSaving(true)
    setStatus('')
    try {
      await persistPage(nextForm, nextStatus === 'published' ? 'Page published.' : 'Draft saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save page.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePage() {
    if (!pageForm.id) return
    if (!window.confirm('Delete this page and all its sections?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/pages/${pageForm.id}`, { method: 'DELETE' })
      beginCreatePage()
      await loadPages('')
      setStatus('Page deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete page.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicatePage() {
    if (!pageForm.id) return
    setSaving(true)
    setStatus('')
    try {
      const newItem = await adminApiFetch('/api/cms/duplicate', {
        method: 'POST',
        body: { type: 'page', id: pageForm.id },
      })
      if (newItem.data) {
        // ?page= is read on mount (see searchParams.get('page') above) to auto-select this
        // page - a previous ?pageId= here was never actually read anywhere, so duplicating a
        // page silently dropped the admin back on whatever page was already selected.
        window.location.href = `/admin/pages?page=${newItem.data.id}`
      }
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate page.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSection(event) {
    event.preventDefault()
    if (!selectedPageId) {
      setStatus('Create or select a page first.')
      return
    }
    setSaving(true)
    setStatus('')
    try {
      let orderIndex
      if (sectionForm.insertAfterIndex !== undefined) {
        orderIndex = sectionForm.insertAfterIndex + 1
      } else if (sectionForm.id) {
        orderIndex = sections.find((item) => item.id === sectionForm.id)?.order_index || sections.length
      } else {
        orderIndex = sections.length
      }
      
      const payload = {
        page_id: selectedPageId,
        type: sectionForm.type,
        order_index: orderIndex,
        content_json: contentFromForm(sectionForm),
        style_json: styleFromForm(sectionForm),
        visibility: sectionForm.isVisible !== false,
      }
      await adminApiFetch(sectionForm.id ? `/api/cms/sections/${sectionForm.id}` : '/api/cms/sections', {
        method: sectionForm.id ? 'PATCH' : 'POST',
        body: payload,
      })
      await loadPages(selectedPageId)
      setStatus(sectionForm.id ? 'Section updated.' : 'Section added.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save section.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSection(id) {
    if (!window.confirm('Delete this section?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/sections/${id}`, { method: 'DELETE' })
      if (sectionForm.id === id) resetSectionForm()
      await loadPages(selectedPageId)
      setStatus('Section deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete section.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateSection(id) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/sections', {
        method: 'POST',
        body: { action: 'duplicate', id },
      })
      await loadPages(selectedPageId)
      setStatus('Section duplicated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate section.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisibility(section) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/sections/${section.id}`, {
        method: 'PATCH',
        body: { visibility: !section.visibility },
      })
      await loadPages(selectedPageId)
      setStatus('Section visibility updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to update visibility.')
    } finally {
      setSaving(false)
    }
  }

  async function reorderSections(nextSections) {
    setSaving(true)
    setStatus('')
    try {
      await Promise.all(
        nextSections.map((section, index) =>
          adminApiFetch(`/api/cms/sections/${section.id}`, {
            method: 'PATCH',
            body: { order_index: index },
          })
        )
      )
      await loadPages(selectedPageId)
      setStatus('Section order updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to reorder sections.')
    } finally {
      setSaving(false)
    }
  }

  // Undo/redo is scoped to reordering: it's the one section action that's cleanly and safely
  // reversible (same ids, just order_index changes). Create/delete/content-edit undo would need
  // to fabricate new ids on every step and was judged too easy to get subtly wrong - reordering
  // is the one that's genuinely robust to ship.
  function pushReorderHistory(before, after) {
    setReorderHistory((prev) => [...prev.slice(0, reorderPointer + 1), { before: before.map((s) => s.id), after: after.map((s) => s.id) }])
    setReorderPointer((prev) => prev + 1)
  }

  function reorderTo(idsInOrder) {
    const target = idsInOrder.map((id) => sections.find((s) => s.id === id)).filter(Boolean)
    if (target.length) reorderSections(target)
  }

  function undoReorder() {
    if (reorderPointer < 0) return
    reorderTo(reorderHistory[reorderPointer].before)
    setReorderPointer((prev) => prev - 1)
  }

  function redoReorder() {
    if (reorderPointer >= reorderHistory.length - 1) return
    reorderTo(reorderHistory[reorderPointer + 1].after)
    setReorderPointer((prev) => prev + 1)
  }

  function handleSectionDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(sections, oldIndex, newIndex)
    pushReorderHistory(sections, reordered)
    reorderSections(reordered)
  }

  function moveSectionUp(index) {
    if (index <= 0) return
    const newSections = [...sections]
    const [moved] = newSections.splice(index, 1)
    newSections.splice(index - 1, 0, moved)
    pushReorderHistory(sections, newSections)
    reorderSections(newSections)
  }

  function moveSectionDown(index) {
    if (index >= sections.length - 1) return
    const newSections = [...sections]
    const [moved] = newSections.splice(index, 1)
    newSections.splice(index + 1, 0, moved)
    pushReorderHistory(sections, newSections)
    reorderSections(newSections)
  }

  function copySection(section) {
    const payload = { type: section.type, content_json: section.content_json || {}, style_json: section.style_json || {} }
    setSectionClipboard(payload)
    try { sessionStorage.setItem('acadvizen_section_clipboard', JSON.stringify(payload)) } catch { /* private-browsing storage denial is non-fatal */ }
    setStatus(`Copied "${section.type.replace(/_/g, ' ')}" section - open any page and click Paste to add it there.`)
  }

  async function pasteSection() {
    if (!sectionClipboard || !selectedPage) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/sections', {
        method: 'POST',
        body: {
          page_id: selectedPage.id,
          type: sectionClipboard.type,
          content_json: sectionClipboard.content_json,
          style_json: sectionClipboard.style_json,
          order_index: sections.length,
          visibility: true,
        },
      })
      await loadPages(selectedPageId)
      setStatus('Section pasted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to paste section.')
    } finally {
      setSaving(false)
    }
  }

  async function saveCurrentPageAsTemplate() {
    if (!pageForm.id) return
    const name = window.prompt('Template name:', `${pageForm.title || 'Untitled'} Template`)
    if (!name || !name.trim()) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/templates', {
        method: 'POST',
        body: {
          name: name.trim(),
          description: `Created from "${pageForm.title || pageForm.slug}"`,
          template_type: 'landing',
          template_data: {
            sections: sections.map((section, index) => ({
              type: section.type,
              order_index: Number.isFinite(section.order_index) ? section.order_index : index,
              content_json: section.content_json || {},
              style_json: section.style_json || {},
              visibility: section.visibility !== false,
            })),
          },
        },
      })
      setStatus(`Saved as template "${name.trim()}". Find it under Templates to reuse or apply to new pages.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to save as template.')
    } finally {
      setSaving(false)
    }
  }

  async function saveReusableBlock() {
    if (!sectionForm.heading && !sectionForm.text) {
      setStatus('Add heading or content before saving reusable block.')
      return
    }
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/entities/reusable_blocks', {
        method: 'POST',
        body: {
          name: `${sectionForm.type}-${Date.now()}`,
          type: sectionForm.type,
          content_json: contentFromForm(sectionForm),
          style_json: styleFromForm(sectionForm),
          status: 'draft',
        },
      })
      setStatus('Reusable block saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save reusable block.')
    } finally {
      setSaving(false)
    }
  }

  async function importTemplate(template) {
    return importAllTemplates({ skipConfirm: false, slugs: [template.slug] })
  }

  async function importAllTemplates(options = {}) {
    if (!options.skipConfirm && !window.confirm('Sync the current live website content into the editor now? Existing CMS sections for those pages will be replaced.')) return
    setSaving(true)
    setStatus('')
    try {
      const json = await adminApiFetch('/api/cms/import-live-pages', {
        method: 'POST',
        body: { replace_sections: true, slugs: options.slugs || undefined },
      })
      const syncedSlug = options.slugs?.[0]
      const refreshedPages = await loadPages(selectedPageId)
      if (syncedSlug) {
        const syncedPage = refreshedPages.find((page) => page.slug === syncedSlug)
        if (syncedPage) {
          setSelectedPageId(syncedPage.id)
          syncPageForm(syncedPage)
        }
      }
      setStatus(`Synced ${json.data?.count || 0} page(s) from the current live website source.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to import live pages.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Visual Page Builder</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">Drag, Drop, and Edit Sections</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Build pages visually by adding, reordering, and customizing sections. No coding required.
          </p>
        </div>
        <div className="relative z-[60] flex gap-2">
          <button type="button" onClick={() => setPreviewMode(!previewMode)} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.05]">
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
          <button type="button" onClick={beginCreatePage} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200">
            New Page
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-semibold text-slate-100">1. Select Page</h3>
            <p className="mt-1 text-xs text-slate-400">Published pages stay editable here. You can update, unpublish, or delete them anytime.</p>
            <div className="mt-3 space-y-2">
              {loading && !bootstrapped ? (
                <div className="text-xs text-slate-400">Syncing current website content...</div>
              ) : loading ? (
                <div className="text-xs text-slate-400">Loading pages...</div>
              ) : pages.length === 0 ? (
                <div className="text-xs text-slate-400">No pages yet.</div>
              ) : (
                pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => {
                      setSelectedPageId(page.id)
                      syncPageForm(page)
                      resetSectionForm()
                    }}
                    className={`w-full rounded-xl px-3 py-3 text-left text-sm ${selectedPageId === page.id ? 'bg-teal-300 text-slate-950' : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'}`}
                  >
                    <div className="font-semibold">{page.title}</div>
                    <div className="mt-1 text-xs opacity-80">/{page.slug === 'home' ? '' : page.slug}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.14em] opacity-70">{page.status || 'draft'}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-semibold text-slate-100">Import current live page copy</h3>
            <p className="mt-1 text-xs text-slate-400">These actions pull content from the current live website source, not from old templates.</p>
            <button
              type="button"
              disabled={saving}
              onClick={importAllTemplates}
              className="mt-3 w-full rounded-xl bg-teal-300 px-3 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-60"
            >
              Sync All From Live Website
            </button>
            <div className="mt-3 space-y-2">
              {LIVE_SYNC_TARGETS.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={saving}
                  onClick={() => importTemplate(template)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-60"
                >
                  <div className="font-semibold">{template.title}</div>
                  <div className="mt-1 text-xs text-slate-400">/{template.slug === 'home' ? '' : template.slug}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <form ref={pageDetailsFormRef} data-testid="page-details-form" onSubmit={handleSavePage} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Page Details</h3>
                <p className="mt-1 text-xs text-slate-400">Edit page title, slug, SEO fields, and publish state.</p>
              </div>
              {pageForm.slug ? (
                <Link href={pagePreviewHref(pageForm.slug)} target="_blank" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.05]">
                  Open current route
                </Link>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-300">
              <p className="font-semibold uppercase tracking-[0.18em] text-slate-400">Route Slug Guide</p>
              <div className="mt-2 space-y-1">
                <p>`home` {'->'} `/`</p>
                <p>`about`, `contact`, `courses`, `placement`, `hire-from-us`, `tools` {'->'} same public route</p>
                <p>`course-basic` {'->'} `/courses/basic`</p>
                <p>`tool-canva` or `tools-canva` {'->'} `/tools/canva`</p>
                <p>`digital-marketing-course-in-bangalore` and similar SEO/location slugs {'->'} same public landing route</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Page Title
                <input {...fieldAttrs('page_title')} value={pageForm.title} onChange={(event) => setPageForm((prev) => {
                  // Keep auto-generating the slug from the title only while the slug is still
                  // exactly what auto-generation would have produced from the title's previous
                  // value - `prev.slug || ...` looked equivalent but actually "sticks" after the
                  // very first keystroke, since prev.slug becomes truthy immediately.
                  const nextTitle = event.target.value
                  const slugInSyncWithTitle = prev.slug === toSlug(prev.title)
                  return { ...prev, title: nextTitle, slug: slugInSyncWithTitle ? toSlug(nextTitle) : prev.slug }
                })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              </label>
              <label className="text-xs text-slate-400">
                Slug
                <input {...fieldAttrs('page_slug')} value={pageForm.slug} onChange={(event) => setPageForm((prev) => ({ ...prev, slug: toSlugLive(event.target.value) }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              </label>
              <TextAreaField label="Page Description" value={pageForm.description} onChange={(value) => setPageForm((prev) => ({ ...prev, description: value }))} rows={3} />
              <label className="text-xs text-slate-400">
                Publish Status
                <select {...fieldAttrs('page_status')} value={pageForm.status} onChange={(event) => setPageForm((prev) => ({ ...prev, status: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">
                  {['draft', 'published'].map((value) => (
                    <option key={value} value={value} className="bg-[#07101b]">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <div />
              <label className="text-xs text-slate-400">
                Go live at (optional)
                <input
                  type="datetime-local"
                  {...fieldAttrs('page_scheduled_publish_at')}
                  value={pageForm.scheduled_publish_at || ''}
                  onChange={(event) => setPageForm((prev) => ({ ...prev, scheduled_publish_at: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  Set Publish Status to Published and pick a future time - the page stays hidden from visitors until then, then goes live on its own.
                </span>
              </label>
              <label className="text-xs text-slate-400">
                Take down at (optional)
                <input
                  type="datetime-local"
                  {...fieldAttrs('page_scheduled_unpublish_at')}
                  value={pageForm.scheduled_unpublish_at || ''}
                  onChange={(event) => setPageForm((prev) => ({ ...prev, scheduled_unpublish_at: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  The page automatically becomes hidden from visitors after this time, without needing to come back and unpublish it manually.
                </span>
              </label>
              <label className="text-xs text-slate-400">
                SEO Title
                <input {...fieldAttrs('page_seo_title')} value={pageForm.seo_title} onChange={(event) => setPageForm((prev) => ({ ...prev, seo_title: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              </label>
              <label className="text-xs text-slate-400">
                Canonical URL
                <input {...fieldAttrs('page_canonical_url')} value={pageForm.canonical_url} onChange={(event) => setPageForm((prev) => ({ ...prev, canonical_url: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
              </label>
              <TextAreaField label="SEO Description" value={pageForm.seo_description} onChange={(value) => setPageForm((prev) => ({ ...prev, seo_description: value }))} rows={3} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70">
                {saving ? 'Saving...' : 'Save Page'}
              </button>
              <button type="button" data-testid="publish-page-button" disabled={saving} onClick={() => savePageWithStatus('published')} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-70">
                Publish Page
              </button>
              <button type="button" data-testid="save-page-draft-button" disabled={saving} onClick={() => savePageWithStatus('draft')} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-70">
                Save Draft
              </button>
              {liveUrl && pageForm.status === 'published' ? (
                <button type="button" disabled={saving} onClick={() => window.open(liveUrl, '_blank', 'noopener,noreferrer')} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-70">
                  View Live Page
                </button>
              ) : null}
              {pageForm.id ? (
                <>
                  <button type="button" disabled={saving} onClick={handleDuplicatePage} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-70">
                    Duplicate
                  </button>
                  <button type="button" disabled={saving || !sections.length} onClick={saveCurrentPageAsTemplate} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-70">
                    Save as Template
                  </button>
                  <VersionHistory entityType="page" entityId={pageForm.id} onRestore={() => loadPages(pageForm.id)} />
                  <button type="button" disabled={saving} onClick={handleDeletePage} className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10 disabled:opacity-70">
                    Delete Page
                  </button>
                </>
              ) : null}
              {matchedTemplate ? (
                <button type="button" disabled={saving} onClick={() => importTemplate(matchedTemplate)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-70">
                  Refresh from current website
                </button>
              ) : null}
            </div>
          </form>

          <div className="grid gap-6 2xl:grid-cols-[360px_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">2. Page Sections</h3>
                    <p className="mt-1 text-xs text-slate-400">Drag to reorder, click to edit, or use quick actions.</p>
                  </div>
                  <button type="button" onClick={() => resetSectionForm()} className="rounded-xl bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-200">
                    + Add Section
                  </button>
                </div>
                
                {/* Quick Add Section Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {['hero', 'text_block', 'feature_cards', 'stats_section', 'testimonial', 'faq', 'cta_banner'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { resetSectionForm(type); setSectionForm(prev => ({ ...prev, type })); }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-slate-300 hover:bg-white/[0.05] hover:border-teal-500/30"
                    >
                      {type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button type="button" onClick={undoReorder} disabled={reorderPointer < 0} className="px-2 py-1 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/[0.05] disabled:opacity-30" title="Undo reorder (Ctrl+Z)">
                    ↶ Undo
                  </button>
                  <button type="button" onClick={redoReorder} disabled={reorderPointer >= reorderHistory.length - 1} className="px-2 py-1 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/[0.05] disabled:opacity-30" title="Redo reorder (Ctrl+Shift+Z)">
                    ↷ Redo
                  </button>
                  {sectionClipboard ? (
                    <button type="button" onClick={pasteSection} disabled={!selectedPage || saving} className="px-2 py-1 rounded-lg border border-teal-500/30 bg-teal-500/10 text-xs text-teal-300 hover:bg-teal-500/20 disabled:opacity-30" title="Paste copied section here">
                      ⧉ Paste &quot;{sectionClipboard.type.replace(/_/g, ' ')}&quot;
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 space-y-2">
                  {!selectedPage ? (
                    <div className="text-sm text-slate-400">Select a page first.</div>
                  ) : sections.length === 0 ? (
                    <div className="text-sm text-slate-400">No sections yet. Add one or import the current live page copy.</div>
                  ) : (
                    <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                      <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                        {sections.map((section, index) => (
                          <SortableSectionRow
                            key={section.id}
                            section={section}
                            index={index}
                            isLast={index === sections.length - 1}
                            isSelected={sectionForm.id === section.id}
                            onEdit={beginEditSection}
                            onMoveUp={moveSectionUp}
                            onMoveDown={moveSectionDown}
                            onDuplicate={duplicateSection}
                            onCopy={copySection}
                            onToggleVisibility={toggleVisibility}
                            onDelete={deleteSection}
                            onInsertAfter={(insertIndex) => { resetSectionForm(); setSectionForm((prev) => ({ ...prev, insertAfterIndex: insertIndex })); }}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100">4. Preview</h3>
                <p className="mt-1 text-xs text-slate-400">Preview the page with the current section edits before publishing.</p>
                <div
                  className="mt-4 max-h-[620px] overflow-auto rounded-2xl border border-white/10 bg-[#020617] p-2"
                  tabIndex={0}
                  role="region"
                  aria-label="Section preview"
                >
                  {previewSections.length === 0 ? (
                    <div className="p-6 text-sm text-slate-400">Select or create a section to preview it here.</div>
                  ) : (
                    previewSections.map((section) => <PreviewSafeSection key={section.id || `${section.type}-${section.order_index}`} section={section} />)
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSection} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">3. Edit Exact Fields Inside Section</h3>
                  <p className="mt-1 text-xs text-slate-400">Edit exact visible text, buttons, items, cards, FAQs, counters, labels, and media.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Selected Section</div>
                  <div className="mt-1 text-sm text-slate-200">{sectionForm.id ? sectionForm.type : `New ${sectionForm.type}`}</div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Section Type
                  <select {...fieldAttrs('section_type')} value={sectionForm.type} onChange={(event) => setSectionForm((prev) => ({ ...createEmptySectionForm(event.target.value), id: prev.id || '' }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">
                    {SECTION_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-[#07101b]">
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-slate-400">
                  Layout Variant
                  <input {...fieldAttrs('section_layout_variant')} value={sectionForm.layoutVariant} onChange={(event) => setSectionForm((prev) => ({ ...prev, layoutVariant: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
                </label>
                <TextAreaField label="Heading" value={sectionForm.heading} onChange={(value) => setSectionForm((prev) => ({ ...prev, heading: value }))} rows={2} />
                <TextAreaField label="Subheading" value={sectionForm.subheading} onChange={(value) => setSectionForm((prev) => ({ ...prev, subheading: value }))} rows={3} />
                <TextAreaField label="Paragraph Text" value={sectionForm.text} onChange={(value) => setSectionForm((prev) => ({ ...prev, text: value }))} rows={5} className="md:col-span-2" />
                <TextAreaField label="List / Bullet Items" value={sectionForm.listText} onChange={(value) => setSectionForm((prev) => ({ ...prev, listText: value }))} rows={5} className="md:col-span-2" />
                <label className="text-xs text-slate-400">
                  Image URL
                  <input {...fieldAttrs('section_image_src')} value={sectionForm.imageSrc} onChange={(event) => setSectionForm((prev) => ({ ...prev, imageSrc: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
                </label>
                <label className="text-xs text-slate-400">
                  Image Alt
                  <input {...fieldAttrs('section_image_alt')} value={sectionForm.imageAlt} onChange={(event) => setSectionForm((prev) => ({ ...prev, imageAlt: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
                </label>
                <label className="text-xs text-slate-400 md:col-span-2">
                  Video URL / Embed URL
                  <input {...fieldAttrs('section_video_url')} value={sectionForm.videoUrl} onChange={(event) => setSectionForm((prev) => ({ ...prev, videoUrl: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
                </label>
                <label className="text-xs text-slate-400">
                  Single Button Text
                  <input {...fieldAttrs('section_button_label')} value={sectionForm.buttonLabel} onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonLabel: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
                </label>
                <label className="text-xs text-slate-400">
                  Single Button URL
                  <input {...fieldAttrs('section_button_href')} value={sectionForm.buttonHref} onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonHref: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
                </label>
              </div>

              <div className="mt-5">
                <PrecisionSectionFields sectionForm={sectionForm} setSectionForm={setSectionForm} />
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Visibility and Style</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={sectionForm.isVisible} onChange={(event) => setSectionForm((prev) => ({ ...prev, isVisible: event.target.checked }))} />Section visible</label>
                  <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={sectionForm.mobileHidden} onChange={(event) => setSectionForm((prev) => ({ ...prev, mobileHidden: event.target.checked }))} />Hide on mobile</label>
                  <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={sectionForm.desktopHidden} onChange={(event) => setSectionForm((prev) => ({ ...prev, desktopHidden: event.target.checked }))} />Hide on desktop</label>
                  <label className="text-xs text-slate-400">Background Color<input value={sectionForm.bgColor} onChange={(event) => setSectionForm((prev) => ({ ...prev, bgColor: event.target.value }))} placeholder="#0f172a" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Text Color<input value={sectionForm.textColor} onChange={(event) => setSectionForm((prev) => ({ ...prev, textColor: event.target.value }))} placeholder="#cbd5e1" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Font Family<select value={sectionForm.fontFamily} onChange={(event) => setSectionForm((prev) => ({ ...prev, fontFamily: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">{['poppins', 'montserrat', 'lato', 'open_sans', 'inter', 'system'].map((value) => <option key={value} value={value} className="bg-[#07101b]">{value}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Heading Size<select value={sectionForm.headingSize} onChange={(event) => setSectionForm((prev) => ({ ...prev, headingSize: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">{['sm', 'md', 'lg'].map((value) => <option key={value} value={value} className="bg-[#07101b]">{value}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Text Size<select value={sectionForm.textSize} onChange={(event) => setSectionForm((prev) => ({ ...prev, textSize: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">{['sm', 'md', 'lg'].map((value) => <option key={value} value={value} className="bg-[#07101b]">{value}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Button Background<input value={sectionForm.buttonBg} onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonBg: event.target.value }))} placeholder="#5eead4" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Button Text Color<input value={sectionForm.buttonText} onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonText: event.target.value }))} placeholder="#020617" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Image Width<input value={sectionForm.imageWidth} onChange={(event) => setSectionForm((prev) => ({ ...prev, imageWidth: event.target.value }))} placeholder="100%" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Image Height<input value={sectionForm.imageHeight} onChange={(event) => setSectionForm((prev) => ({ ...prev, imageHeight: event.target.value }))} placeholder="420px" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Image Radius<input value={sectionForm.imageRadius} onChange={(event) => setSectionForm((prev) => ({ ...prev, imageRadius: event.target.value }))} placeholder="16px" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Image Fit<select value={sectionForm.imageFit} onChange={(event) => setSectionForm((prev) => ({ ...prev, imageFit: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">{['cover', 'contain', 'fill'].map((value) => <option key={value} value={value} className="bg-[#07101b]">{value}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Alignment<select value={sectionForm.alignment} onChange={(event) => setSectionForm((prev) => ({ ...prev, alignment: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">{['left', 'center', 'right'].map((value) => <option key={value} value={value} className="bg-[#07101b]">{value}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Padding<select value={sectionForm.padding} onChange={(event) => setSectionForm((prev) => ({ ...prev, padding: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">{['none', 'sm', 'md', 'lg'].map((value) => <option key={value} value={value} className="bg-[#07101b]">{value}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Columns<input type="number" min={1} max={6} value={sectionForm.columnsCount} onChange={(event) => setSectionForm((prev) => ({ ...prev, columnsCount: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                  <label className="text-xs text-slate-400">Max Width<input value={sectionForm.maxWidth} onChange={(event) => setSectionForm((prev) => ({ ...prev, maxWidth: event.target.value }))} placeholder="1200px" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" /></label>
                </div>
              </div>

              <label className="mt-5 block text-xs text-slate-400">
                Advanced JSON Override
                <textarea rows={6} value={sectionForm.rawJson} onChange={(event) => setSectionForm((prev) => ({ ...prev, rawJson: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-slate-100" />
              </label>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70">
                  {saving ? 'Saving...' : sectionForm.id ? 'Update Section' : 'Add Section'}
                </button>
                <button type="button" onClick={() => resetSectionForm(sectionForm.type)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]">
                  Clear Section Form
                </button>
                <button type="button" disabled={saving} onClick={saveReusableBlock} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-70">
                  Save as Reusable Block
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}

      {previewMode ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#020617]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#050b12] px-6 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Live Preview</p>
              <p className="mt-0.5 text-sm text-slate-300">
                {pageForm.title || 'Untitled page'} · /{pageForm.slug || ''} · assembled from current unsaved edits, exactly as it will render publicly
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
            >
              Exit Preview
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {previewSections.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">This page has no sections yet - add one to see it here.</div>
            ) : (
              previewSections.map((section) => (
                <PreviewSafeSection key={section.id || `${section.type}-${section.order_index}`} section={section} />
              ))
            )}
          </div>
        </div>
      ) : null}
    </Surface>
  )
}
