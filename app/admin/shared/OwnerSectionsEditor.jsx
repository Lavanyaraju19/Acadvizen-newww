'use client'

import { useEffect, useMemo, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Plus, Save, Trash2 } from 'lucide-react'
import { adminApiFetch } from '../../../lib/adminApiClient'
import DynamicSectionRenderer from '../../../components/sections/DynamicSectionRenderer'
import PrecisionSectionFields from '../pages/PrecisionSectionFields'
import {
  SECTION_TYPES,
  SECTION_TYPE_LABELS,
  IMMERSIVE_VARIANT_TYPES,
  createEmptySectionForm,
  formFromContent,
  formFromStyle,
  contentFromForm,
  styleFromForm,
} from '../../../lib/sectionFormKit'
import { defaultSeedContent } from './sectionSeedContent'

// Generic "designed block" editor reused by City pages and Location/Area pages so both content
// owners get the same admin-controlled block library (the ~32 types PrecisionSectionFields and
// DynamicSectionRenderer already support for the generic Page Builder), true drag-and-drop
// reordering, and insertion zones between each owner's fixed sections - without a second,
// divergent editor implementation per owner type.

export const POSITION_ZONES = [
  { value: 'top', label: 'Top zone', hint: 'Renders right after the Hero, before the existing intro content.' },
  { value: 'after_intro', label: 'Middle zone', hint: 'Renders after the existing intro/overview, before the rest of the fixed content.' },
  { value: 'before_faq', label: 'Before FAQ zone', hint: 'Renders after the existing fixed content, before the FAQ section.' },
  { value: 'end', label: 'End zone', hint: 'Renders after everything else, right before the final CTA and footer.' },
]

const LIVE_DATA_ONLY_SECTION_TYPES = new Set([
  'testimonials_feed', 'placement_feed', 'recruiters_feed', 'instructors_feed',
  'certifications_feed', 'success_stories_feed', 'metrics_counters', 'trust_badges_feed',
  'community_events_feed', 'cta_block_ref', 'courses_feed', 'tools_feed', 'company_logos_feed',
  'location_explorer', 'interactive_learner_map',
])

function PreviewSafeSection({ section }) {
  if (LIVE_DATA_ONLY_SECTION_TYPES.has(String(section?.type || '').toLowerCase())) {
    return (
      <div className="mx-2 my-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">{section.type.replace(/_/g, ' ')}</span> pulls live data - publish
        and visit the live URL to see it rendered with real content.
      </div>
    )
  }
  return <DynamicSectionRenderer section={section} />
}

function buildFormFromSection(section) {
  return {
    id: section.id,
    isVisible: section.visibility !== false,
    position: POSITION_ZONES.some((z) => z.value === section.position) ? section.position : 'end',
    ...createEmptySectionForm(section.type),
    ...formFromContent(section.content_json || {}),
    ...formFromStyle(section.style_json || {}),
  }
}

function TextField({ label, value, onChange, placeholder, rows }) {
  if (rows) {
    return (
      <label className="text-xs text-slate-400">
        {label}
        <textarea
          rows={rows}
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
        />
      </label>
    )
  }
  return (
    <label className="text-xs text-slate-400">
      {label}
      <input
        type="text"
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
      />
    </label>
  )
}

function SortableSectionCard({ section, form, onChange, onSave, onDelete, onMoveUp, onMoveDown, isFirst, isLast, busy }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const set = (patch) => onChange(section.id, patch)

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/[0.05] cursor-grab active:cursor-grabbing"
            aria-label={`Drag to reorder ${SECTION_TYPE_LABELS[section.type] || section.type}`}
            title="Drag to reorder (or use keyboard: Tab here, press Space, Arrow keys, Space to drop)"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-100">{SECTION_TYPE_LABELS[section.type] || section.type}</span>
          {!form.isVisible ? <span className="text-[10px] uppercase tracking-wide text-amber-300/80 border border-amber-400/30 rounded px-1.5 py-0.5">Hidden</span> : null}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.05] disabled:opacity-30" aria-label="Move up" title="Move up">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.05] disabled:opacity-30" aria-label="Move down" title="Move down">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => set({ isVisible: !form.isVisible })} className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.05]" aria-label="Toggle visibility" title="Toggle visibility">
            {form.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => onDelete(section.id)} className="p-1.5 rounded-lg border border-rose-400/30 text-rose-300 hover:bg-rose-500/10" aria-label="Delete section" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-xs text-slate-400">
          Insertion zone
          <select
            value={form.position}
            onChange={(e) => set({ position: e.target.value })}
            className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
          >
            {POSITION_ZONES.map((zone) => (
              <option key={zone.value} value={zone.value}>{zone.label}</option>
            ))}
          </select>
        </label>
        {IMMERSIVE_VARIANT_TYPES.has(section.type) ? (
          <label className="text-xs text-slate-400">
            Design
            <select
              value={form.layoutVariant || 'default'}
              onChange={(e) => set({ layoutVariant: e.target.value })}
              className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
            >
              <option value="default">Default design</option>
              <option value="immersive">Immersive design</option>
            </select>
          </label>
        ) : null}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <TextField label="Heading" value={form.heading} onChange={(v) => set({ heading: v })} />
        <TextField label="Subheading" value={form.subheading} onChange={(v) => set({ subheading: v })} />
        {['text_block', 'two_column_layout', 'cta_banner'].includes(section.type) ? (
          <TextField label="Text" value={form.text} onChange={(v) => set({ text: v })} rows={3} />
        ) : null}
        {['image_block', 'two_column_layout'].includes(section.type) ? (
          <>
            <TextField label="Image URL" value={form.imageSrc} onChange={(v) => set({ imageSrc: v })} />
            <TextField label="Image Alt" value={form.imageAlt} onChange={(v) => set({ imageAlt: v })} />
          </>
        ) : null}
        {section.type === 'video_block' ? <TextField label="Video / Embed URL" value={form.videoUrl} onChange={(v) => set({ videoUrl: v })} /> : null}
        {section.type === 'cta_banner' ? (
          <>
            <TextField label="Button label" value={form.buttonLabel} onChange={(v) => set({ buttonLabel: v })} />
            <TextField label="Button link" value={form.buttonHref} onChange={(v) => set({ buttonHref: v })} />
          </>
        ) : null}
      </div>

      <PrecisionSectionFields sectionForm={form} setSectionForm={(updater) => onChange(section.id, typeof updater === 'function' ? updater(form) : updater)} />

      <div className="rounded-xl border border-dashed border-white/10 bg-[#020617] p-2">
        <PreviewSafeSection
          section={{ id: section.id, type: section.type, content_json: contentFromForm(form), style_json: styleFromForm(form), visibility: true }}
        />
      </div>

      <button
        type="button"
        onClick={() => onSave(section.id)}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs disabled:opacity-50"
      >
        <Save className="w-3 h-3 inline mr-1" />
        {busy ? 'Saving...' : 'Save Section'}
      </button>
    </div>
  )
}

export default function OwnerSectionsEditor({ ownerId, ownerParam, apiBase, emptyHint }) {
  const [sections, setSections] = useState([])
  const [forms, setForms] = useState({})
  const [addType, setAddType] = useState('feature_cards')
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState('')

  // One DndContext renders per position zone below (a fixed, constant-length list -
  // POSITION_ZONES never changes at runtime - so calling useSensors() a fixed number of times
  // here, once per zone, does not violate the rules of hooks). Each zone needs its own sensor
  // instance rather than one shared across all four simultaneously-mounted DndContexts: sharing
  // one caused the KeyboardSensor's pickup to register but its arrow-key coordinate movement to
  // silently no-op (drop always resolved active.id === over.id, confirmed via instrumented
  // dnd end handler during manual verification), even though PointerSensor still worked.
  const zoneSensors = {
    top: useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    ),
    after_intro: useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    ),
    before_faq: useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    ),
    end: useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    ),
  }

  useEffect(() => {
    if (ownerId) load()
    else { setSections([]); setForms({}) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId])

  async function load() {
    try {
      const json = await adminApiFetch(`${apiBase}?${ownerParam}=${ownerId}&include_hidden=1`, { cache: 'no-store' })
      const data = Array.isArray(json.data) ? json.data : []
      setSections(data)
      setForms(Object.fromEntries(data.map((section) => [section.id, buildFormFromSection(section)])))
    } catch (error) {
      setStatus(error?.message || 'Failed to load designed sections.')
    }
  }

  const grouped = useMemo(() => {
    const byZone = Object.fromEntries(POSITION_ZONES.map((z) => [z.value, []]))
    sections
      .slice()
      .sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))
      .forEach((section) => {
        const zone = POSITION_ZONES.some((z) => z.value === section.position) ? section.position : 'end'
        byZone[zone].push(section)
      })
    return byZone
  }, [sections])

  async function addSection(zone) {
    setBusyId('new')
    setStatus('')
    try {
      await adminApiFetch(apiBase, {
        method: 'POST',
        body: {
          [ownerParam]: ownerId,
          type: addType,
          order_index: (grouped[zone] || []).length,
          position: zone,
          content_json: defaultSeedContent(addType),
          style_json: {},
        },
      })
      await load()
      setStatus('Section added.')
    } catch (error) {
      setStatus(error?.message || 'Failed to add section.')
    } finally {
      setBusyId('')
    }
  }

  function updateLocal(id, patch) {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function saveSection(id) {
    const form = forms[id]
    if (!form) return
    setBusyId(id)
    setStatus('')
    try {
      await adminApiFetch(`${apiBase}/${id}`, {
        method: 'PATCH',
        body: {
          content_json: contentFromForm(form),
          style_json: styleFromForm(form),
          visibility: form.isVisible,
          position: form.position,
        },
      })
      await load()
      setStatus('Section saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save section.')
    } finally {
      setBusyId('')
    }
  }

  async function deleteSection(id) {
    if (!window.confirm('Remove this section? This cannot be undone.')) return
    setBusyId(id)
    setStatus('')
    try {
      await adminApiFetch(`${apiBase}/${id}`, { method: 'DELETE' })
      await load()
      setStatus('Section removed.')
    } catch (error) {
      setStatus(error?.message || 'Failed to remove section.')
    } finally {
      setBusyId('')
    }
  }

  async function persistOrder(zone, orderedIds) {
    setBusyId(zone)
    try {
      await Promise.all(orderedIds.map((id, index) => adminApiFetch(`${apiBase}/${id}`, { method: 'PATCH', body: { order_index: index } })))
      await load()
    } catch (error) {
      setStatus(error?.message || 'Failed to reorder.')
    } finally {
      setBusyId('')
    }
  }

  function moveWithinZone(zone, index, direction) {
    const items = grouped[zone] || []
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const reordered = arrayMove(items, index, target)
    persistOrder(zone, reordered.map((s) => s.id))
  }

  function handleDragEnd(zone, items) {
    return (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = items.findIndex((s) => s.id === active.id)
      const newIndex = items.findIndex((s) => s.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return
      const reordered = arrayMove(items, oldIndex, newIndex)
      persistOrder(zone, reordered.map((s) => s.id))
    }
  }

  if (!ownerId) {
    return <p className="text-sm text-slate-400">{emptyHint || 'Save this page first, then add designed sections.'}</p>
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400">
        Add any of the {SECTION_TYPES.length} block types the Page Builder supports, drag to reorder, and choose which
        zone each block renders in relative to this page&apos;s existing fixed sections.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-400">
          Block type to add
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value)}
            className="mt-1 block px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>{SECTION_TYPE_LABELS[type] || type}</option>
            ))}
          </select>
        </label>
      </div>

      {POSITION_ZONES.map((zone) => {
        const items = grouped[zone.value] || []
        return (
          <div key={zone.value} className="rounded-2xl border border-white/10 bg-white/[0.015] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{zone.label}</h4>
                <p className="text-[11px] text-slate-500">{zone.hint}</p>
              </div>
              <button
                type="button"
                onClick={() => addSection(zone.value)}
                disabled={busyId === 'new'}
                className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                Add {SECTION_TYPE_LABELS[addType] || addType} here
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No blocks in this zone yet.</p>
            ) : (
              <DndContext sensors={zoneSensors[zone.value]} collisionDetection={closestCenter} onDragEnd={handleDragEnd(zone.value, items)}>
                <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {items.map((section, index) => (
                      <SortableSectionCard
                        key={section.id}
                        section={section}
                        form={forms[section.id] || buildFormFromSection(section)}
                        onChange={updateLocal}
                        onSave={saveSection}
                        onDelete={deleteSection}
                        onMoveUp={() => moveWithinZone(zone.value, index, -1)}
                        onMoveDown={() => moveWithinZone(zone.value, index, 1)}
                        isFirst={index === 0}
                        isLast={index === items.length - 1}
                        busy={busyId === section.id || busyId === zone.value}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )
      })}

      {status && <p className="text-xs text-slate-400">{status}</p>}
    </div>
  )
}
