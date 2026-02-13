import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

export function PlacementDetailPage() {
  const { id } = useParams()
  const [placement, setPlacement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlacement()
  }, [id])

  async function loadPlacement() {
    setLoading(true)
    const { data } = await supabase
      .from('placements')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    setPlacement(data || null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
      </div>
    )
  }

  if (!placement) {
    return (
      <Section className="py-16">
        <Container>
          <Surface className="p-10 text-center text-slate-400">
            Placement not found. <Link to="/placement" className="text-teal-300">Back to placements</Link>
          </Surface>
        </Container>
      </Section>
    )
  }

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <Container className="max-w-4xl">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Placement</div>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{placement.title}</h1>
          <p className="mt-3 text-slate-300">
            {placement.company_name} · {placement.location}
          </p>
        </Container>
      </Section>

      {placement.featured_image && (
        <Section className="py-4">
          <Container className="max-w-4xl">
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
              <img src={placement.featured_image} alt={placement.title} className="w-full h-full object-cover" />
            </div>
          </Container>
        </Section>
      )}

      <Section className="py-8">
        <Container className="max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Surface className="p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</div>
              <div className="mt-2 text-lg font-semibold text-slate-50">{placement.role}</div>
            </Surface>
            <Surface className="p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Package</div>
              <div className="mt-2 text-lg font-semibold text-slate-50">{placement.package || 'TBA'}</div>
            </Surface>
          </div>
          {placement.description && (
            <Surface className="mt-6 p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Description</div>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{placement.description}</p>
            </Surface>
          )}
        </Container>
      </Section>
    </div>
  )
}
