import test from 'node:test'
import assert from 'node:assert/strict'
import { groupMenuRows } from '../../lib/menuTree.js'

test('menu rows are grouped by location, with header, footer and bottom_dock always present', () => {
  const grouped = groupMenuRows([
    { id: 'a', menu_location: 'header', title: 'Courses' },
    { id: 'b', menu_location: 'footer', title: 'Home' },
    { id: 'c', menu_location: 'legal', title: 'Terms' },
    { id: 'd', title: 'No location: header' },
  ])
  assert.deepEqual(grouped.header.map((r) => r.id), ['a', 'd'])
  assert.deepEqual(grouped.footer.map((r) => r.id), ['b'])
  assert.deepEqual(grouped.legal.map((r) => r.id), ['c'])
  assert.deepEqual(grouped.bottom_dock, [])
})

test('every call starts from new lists: earlier requests never leak into later ones', () => {
  // Before the fix, the empty lists were shared between calls, so each page view appended its rows
  // again: links multiplied and deleted or renamed links kept showing until the server restarted.
  groupMenuRows([{ id: 'x', menu_location: 'footer', title: 'Old title' }, { id: 'y', menu_location: 'header', title: 'Deleted' }])
  const later = groupMenuRows([{ id: 'x', menu_location: 'footer', title: 'New title' }])
  assert.deepEqual(later.footer.map((r) => r.title), ['New title'])
  assert.deepEqual(later.header, [])
  const empty = groupMenuRows([])
  empty.header.push({ id: 'mutated' })
  assert.deepEqual(groupMenuRows([]).header, [])
})
