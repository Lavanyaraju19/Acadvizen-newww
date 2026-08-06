import test from 'node:test'
import assert from 'node:assert/strict'

import { buildMenuTree, pruneMenuTree, wouldCreateMenuCycle, getMenuDepth, MAX_MENU_DEPTH } from '../../lib/menuTree.js'

test('buildMenuTree nests children under their parent and sorts by order_index', () => {
  const rows = [
    { id: 'b', parent_id: null, order_index: 1, title: 'Services' },
    { id: 'a', parent_id: null, order_index: 0, title: 'Courses' },
    { id: 'a1', parent_id: 'a', order_index: 1, title: 'SEO' },
    { id: 'a0', parent_id: 'a', order_index: 0, title: 'Digital Marketing' },
  ]
  const tree = buildMenuTree(rows)
  assert.deepEqual(tree.map((n) => n.id), ['a', 'b'])
  assert.deepEqual(tree[0].children.map((n) => n.id), ['a0', 'a1'])
  assert.deepEqual(tree[1].children, [])
})

test('buildMenuTree does not render the same id twice if it appears more than once in the input', () => {
  // Regression test: every occurrence of a duplicate id resolves to the same node object via
  // the internal id->node map, so without deduplication each extra occurrence gets pushed
  // again - this reproduced as a real menu item rendering multiple times in the live nav when
  // its id appeared more than once in the source array.
  const rows = [
    { id: 'a', parent_id: null, order_index: 0, title: 'Courses' },
    { id: 'a', parent_id: null, order_index: 0, title: 'Courses' },
    { id: 'a', parent_id: null, order_index: 0, title: 'Courses' },
    { id: 'b', parent_id: 'a', order_index: 0, title: 'SEO' },
  ]
  const tree = buildMenuTree(rows)
  assert.equal(tree.length, 1, 'the duplicated id must only produce one node')
  assert.equal(tree[0].children.length, 1)
})

test('buildMenuTree treats a row whose parent_id does not resolve as top-level, not dropped', () => {
  const rows = [
    { id: 'orphan', parent_id: 'missing-parent', order_index: 0, title: 'Orphan' },
  ]
  const tree = buildMenuTree(rows)
  assert.equal(tree.length, 1)
  assert.equal(tree[0].id, 'orphan')
})

test('buildMenuTree is safe against multiple items with no id at all (static fallback link arrays)', () => {
  const rows = [
    { title: 'Courses', url: '/courses' },
    { title: 'Placement', url: '/placement' },
    { title: 'Contact', url: '/contact' },
  ]
  const tree = buildMenuTree(rows)
  // Every item must appear exactly once, not collapsed onto a single duplicated node.
  assert.equal(tree.length, 3)
  assert.deepEqual(tree.map((n) => n.title), ['Courses', 'Placement', 'Contact'])
})

test('pruneMenuTree removes a hidden node and its whole subtree, not just the node itself', () => {
  const tree = [
    {
      id: 'a', title: 'Courses', desktop_visible: true,
      children: [
        { id: 'a1', title: 'SEO', desktop_visible: false, children: [] },
        { id: 'a2', title: 'PPC', desktop_visible: true, children: [] },
      ],
    },
    { id: 'b', title: 'Hidden Parent', desktop_visible: false, children: [
      { id: 'b1', title: 'Should also be hidden', desktop_visible: true, children: [] },
    ] },
  ]
  const pruned = pruneMenuTree(tree, 'desktop_visible')
  assert.equal(pruned.length, 1)
  assert.equal(pruned[0].id, 'a')
  assert.deepEqual(pruned[0].children.map((n) => n.id), ['a2'])
})

test('pruneMenuTree keeps a node whose visibility field is simply absent (treated as visible)', () => {
  const tree = [{ id: 'a', title: 'Courses', children: [] }]
  const pruned = pruneMenuTree(tree, 'desktop_visible')
  assert.equal(pruned.length, 1)
})

test('wouldCreateMenuCycle rejects a menu item being assigned as its own parent', () => {
  const rows = [{ id: 'a', parent_id: null }]
  assert.equal(wouldCreateMenuCycle(rows, 'a', 'a'), true)
})

test('wouldCreateMenuCycle rejects a genuine cycle (A -> parent B, B -> parent A)', () => {
  const rows = [
    { id: 'a', parent_id: null },
    { id: 'b', parent_id: 'a' },
  ]
  // Trying to make A's parent be B, when B's parent is already A, is a 2-cycle.
  assert.equal(wouldCreateMenuCycle(rows, 'a', 'b'), true)
})

test('wouldCreateMenuCycle allows a normal, non-cyclic re-parent', () => {
  const rows = [
    { id: 'a', parent_id: null },
    { id: 'b', parent_id: null },
    { id: 'c', parent_id: null },
  ]
  assert.equal(wouldCreateMenuCycle(rows, 'c', 'a'), false)
})

test('wouldCreateMenuCycle rejects nesting deeper than MAX_MENU_DEPTH', () => {
  const rows = [
    { id: 'a', parent_id: null },
    { id: 'b', parent_id: 'a' },
  ]
  // b is already at depth 1 (child of a, a top-level menu). Making a new item c's parent be b
  // would put c at depth 2, i.e. 3 levels total (a -> b -> c) which is exactly MAX_MENU_DEPTH -
  // still allowed. A 4th level should be rejected.
  assert.equal(getMenuDepth(rows, 'b'), 2, 'b is a top-level item (a) plus one child level, inclusive of b itself')
  const rowsWithC = [...rows, { id: 'c', parent_id: 'b' }]
  assert.equal(wouldCreateMenuCycle(rowsWithC, 'd', 'c'), true, `nesting past ${MAX_MENU_DEPTH} levels should be rejected`)
})

test('wouldCreateMenuCycle allows a menu item with no parent_id (top-level) unconditionally', () => {
  assert.equal(wouldCreateMenuCycle([], 'a', null), false)
})
