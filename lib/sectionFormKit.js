import { generateSlug } from './slugUtils'

// Shared section-type registry and content_json/style_json <-> form-state adapters.
//
// This is an intentional, verbatim copy of the equivalent private functions in
// app/admin/pages/PageBuilderClient.jsx (SECTION_TYPES, EMPTY_SECTION_FORM, formFromContent,
// contentFromForm, formFromStyle, styleFromForm) rather than an import from that file. Copying
// keeps this module standalone so any owner (City pages, Location pages, and PageBuilderClient
// itself) can render the same ~32 block types via PrecisionSectionFields/DynamicSectionRenderer
// without risking a behavior change in PageBuilderClient, which is already verified and in
// production use. Keep the two copies in sync when adding a new section type.

export const SECTION_TYPES = [
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

export const SECTION_TYPE_LABELS = {
  hero: 'Hero',
  text_block: 'Rich Text',
  image_block: 'Image',
  video_block: 'Video',
  two_column_layout: 'Image + Text (2 Column)',
  three_column_layout: 'Three Column',
  testimonial: 'Testimonials',
  faq: 'FAQ',
  gallery: 'Gallery',
  cta_banner: 'CTA Banner',
  stats_section: 'Statistics',
  feature_cards: 'Feature Cards',
  pricing: 'Pricing',
  team: 'Team',
  map: 'Map',
  custom_rich_text: 'Custom HTML',
  testimonials_feed: 'Testimonials (live feed)',
  placement_feed: 'Placements (live feed)',
  recruiters_feed: 'Recruiters / Hiring Partners',
  instructors_feed: 'Trainers / Instructors',
  certifications_feed: 'Certifications',
  success_stories_feed: 'Success Stories',
  metrics_counters: 'Metrics Counters',
  trust_badges_feed: 'Trust Badges',
  community_events_feed: 'Community Events',
  cta_block_ref: 'Reusable CTA Block',
  courses_feed: 'Course Cards (live feed)',
  tools_feed: 'Tool Cards (live feed)',
  company_logos_feed: 'Company Logos',
  lead_form: 'Lead Form',
  form_embed: 'Form Embed',
  location_explorer: 'Location Explorer',
  interactive_learner_map: 'Learner Map',
}

export const IMMERSIVE_VARIANT_TYPES = new Set(['hero', 'stats_section', 'testimonial', 'faq', 'cta_banner', 'feature_cards'])

export const EMPTY_SECTION_FORM = {
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
}

export function createEmptySectionForm(type = 'hero') {
  return { ...EMPTY_SECTION_FORM, type }
}

export function toSlug(value = '') {
  return generateSlug(value)
}

export function parseLines(value = '') {
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function safeArray(value) {
  return Array.isArray(value) ? value : []
}

export function buildButton(button = {}) {
  if (!button?.label && !button?.href) return null
  return {
    label: button.label || 'Learn more',
    href: button.href || '#',
    target: button.target || '_self',
  }
}

export function normalizeButtons(content = {}) {
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

export function normalizeCardItems(items = []) {
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

export function buildCardItems(items = []) {
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

export function formFromContent(content = {}) {
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
    groupId: content.group_id || '',
    cta_label: content.cta_label || '',
    cta_url: content.cta_url || '',
    description: content.description || '',
    height: content.height || '',
    initialZoom: content.initialZoom || '',
    mapStyle: content.mapStyle || '',
    showSearch: content.showSearch !== false,
    showGrowth: content.showGrowth !== false,
    ctaLabel: content.ctaLabel || '',
    ctaUrl: content.ctaUrl || '',
    rawJson: JSON.stringify(content, null, 2),
  }
}

export function formFromStyle(style = {}) {
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

export function contentFromForm(form) {
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

export function styleFromForm(form) {
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

export function hasDraftContent(form) {
  return Object.keys(contentFromForm(form)).length > 0
}
