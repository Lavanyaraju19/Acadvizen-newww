import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../_utils'
import { loadLinkGraphSource, computeLinkGraph, generateSuggestions } from '../../../../lib/internalLinkGraph'

export const dynamic = 'force-dynamic'

// GET /api/cms/internal-links - computes the full live link graph (outgoing, incoming, broken,
// orphans) from current CMS content, regenerates relationship-based suggestions (upserting only
// genuinely new pending ones so an already-decided suggestion never resurfaces), and returns the
// decided-suggestion list plus manual edges alongside it. Nothing about the graph itself is
// persisted - only admin decisions are - so this is always a true snapshot of current content.
export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  try {
    const source = await loadLinkGraphSource(supabase)
    const graph = computeLinkGraph(source)
    const freshSuggestions = generateSuggestions(source)

    if (freshSuggestions.length) {
      const rows = freshSuggestions.map((s) => ({
        source_type: s.sourceType,
        source_id: s.sourceId,
        source_title: s.sourceTitle,
        source_url: s.sourceUrl,
        target_type: s.targetType,
        target_id: s.targetId,
        target_title: s.targetTitle,
        target_url: s.targetUrl,
        reason: s.reason,
        score: s.score,
      }))
      const { error: upsertError } = await supabase
        .from('internal_link_suggestions')
        .upsert(rows, { onConflict: 'source_type,source_id,target_type,target_id', ignoreDuplicates: true })
      if (upsertError) {
        return jsonError(`Failed to persist suggestions: ${upsertError.message}`, 500)
      }
    }

    const [{ data: suggestions, error: suggestionsError }, { data: edges, error: edgesError }] = await Promise.all([
      supabase.from('internal_link_suggestions').select('*').order('score', { ascending: false }).limit(1000),
      supabase.from('internal_link_edges').select('*').order('created_at', { ascending: false }).limit(1000),
    ])
    if (suggestionsError) return jsonError(`Failed to load suggestions: ${suggestionsError.message}`, 500)
    if (edgesError) return jsonError(`Failed to load manual links: ${edgesError.message}`, 500)

    return jsonOk({
      summary: {
        totalNodes: source.nodesByUrl.size,
        totalOutgoing: graph.outgoing.length,
        totalIncomingTargets: graph.incoming.length,
        totalBroken: graph.broken.length,
        totalOrphans: graph.orphans.length,
        pendingSuggestions: (suggestions || []).filter((s) => s.status === 'pending').length,
        manualEdges: (edges || []).length,
      },
      outgoing: graph.outgoing,
      incoming: graph.incoming,
      broken: graph.broken,
      orphans: graph.orphans,
      suggestions: suggestions || [],
      edges: edges || [],
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return jsonError(error?.message || 'Failed to build internal link graph.', 500)
  }
}
