// Shared menu-hierarchy helpers used by both the admin Menu Builder and the public nav/footer
// renderers, so the tree-building logic (and its safety guards) exist in exactly one place.

export const MAX_MENU_DEPTH = 3 // parent -> dropdown item -> nested submenu item

/**
 * Turns a flat list of menu rows (each with `id`/`parent_id`) into a nested tree.
 * Rows whose `parent_id` doesn't resolve to another row in the same list (deleted parent,
 * cross-location parent, etc.) are treated as top-level so nothing silently disappears.
 */
export function buildMenuTree(items = []) {
  const rows = Array.isArray(items) ? items.filter(Boolean) : []
  // Only rows with a real id participate in parent/child lookup - static fallback link arrays
  // (no `id`/`parent_id` at all) would otherwise all collide on the same `undefined` map key.
  const map = new Map()
  rows.forEach((item) => {
    if (item.id) map.set(item.id, { ...item, children: [] })
  })

  // If the same id appears more than once in `items` (a duplicate row from the data source, a
  // caller accidentally concatenating two overlapping lists, etc.), every occurrence resolves
  // to the *same* node object via `map.get(id)` - without tracking which ids have already been
  // placed, each extra occurrence would get pushed again, rendering that item N times.
  const placedIds = new Set()
  const roots = []
  rows.forEach((item) => {
    if (item.id && placedIds.has(item.id)) return
    if (item.id) placedIds.add(item.id)

    const node = item.id ? map.get(item.id) : { ...item, children: [] }
    const parent = item.id && item.parent_id ? map.get(item.parent_id) : null
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortByOrder = (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  const sortTree = (nodes) => {
    nodes.sort(sortByOrder)
    nodes.forEach((node) => sortTree(node.children))
    return nodes
  }

  return sortTree(roots)
}

/**
 * Removes any node whose `visibilityField` is explicitly false, along with that node's whole
 * subtree - a hidden parent hides its children too, rather than orphaning them up to
 * top-level. Static fallback link objects (no such field at all) are always kept, since
 * `!== false` treats a missing field as visible.
 */
export function pruneMenuTree(nodes = [], visibilityField) {
  return nodes
    .filter((node) => node[visibilityField] !== false)
    .map((node) => ({
      ...node,
      children: pruneMenuTree(node.children || [], visibilityField),
    }))
}

/**
 * Counts how many levels are already stacked up through `parentId`, inclusive of `parentId`
 * itself: a top-level item (no parent_id) returns 1, its child returns 2, and so on.
 */
export function getMenuDepth(items, parentId) {
  const rows = Array.isArray(items) ? items : []
  const byId = new Map(rows.map((item) => [item.id, item]))
  let depth = 0
  let current = parentId ? byId.get(parentId) : null
  const seen = new Set()

  while (current) {
    if (seen.has(current.id)) break // corrupt/cyclic data already in the table - stop, don't loop forever
    seen.add(current.id)
    depth += 1
    current = current.parent_id ? byId.get(current.parent_id) : null
  }

  return depth
}

/**
 * True if setting `menuId`'s parent to `newParentId` would create a cycle (including the
 * trivial "a menu item is its own parent" case) or would exceed MAX_MENU_DEPTH.
 * Mirrors lib/templateResolver.js's wouldCreateTemplateCycle for page templates.
 */
export function wouldCreateMenuCycle(items, menuId, newParentId) {
  if (!newParentId) return false
  if (newParentId === menuId) return true

  const rows = Array.isArray(items) ? items : []
  const byId = new Map(rows.map((item) => [item.id, item]))
  const seen = new Set([menuId])
  let current = byId.get(newParentId)

  while (current) {
    if (seen.has(current.id)) return true
    seen.add(current.id)
    if (!current.parent_id) break
    current = byId.get(current.parent_id)
  }

  const parentDepth = getMenuDepth(rows, newParentId) + 1 // +1 for newParentId itself
  return parentDepth >= MAX_MENU_DEPTH
}
