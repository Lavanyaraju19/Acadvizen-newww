'use client'

// Generic dropdown/accordion renderer for any top-level nav item that has children - not
// hardcoded to "Courses" or any other specific label. Desktop items render a hover/click
// flyout panel (with a nested indented group for a third menu level); mobile items render a
// recursive expand/collapse accordion. Both read the same `menus` tree (built by
// lib/menuTree.js's buildMenuTree) so admin edits show up identically in both layouts.

import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Plus } from 'lucide-react'

const CLOSE_DELAY_MS = 150
const PANEL_WIDTH_PX = 288 // matches w-72 below

function hasChildren(item) {
  return Array.isArray(item?.children) && item.children.length > 0
}

function focusableMenuItems(panel) {
  if (!panel) return []
  return Array.from(panel.querySelectorAll('a[role="menuitem"]'))
}

function DropdownRow({ item, onNavigate }) {
  return (
    <div role="none">
      <Link
        role="menuitem"
        to={item.url}
        target={item.target || '_self'}
        onClick={onNavigate}
        className="flex items-start gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:bg-white/[0.07] focus-visible:text-white focus-visible:outline-none"
      >
        {item.icon ? <span aria-hidden="true" className="mt-0.5 leading-none">{item.icon}</span> : null}
        <span className="min-w-0">
          <span className="block truncate font-medium">{item.title}</span>
          {item.description ? (
            <span className="mt-0.5 block text-xs leading-snug text-slate-400">{item.description}</span>
          ) : null}
        </span>
      </Link>
      {hasChildren(item) ? (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map((grandchild) => (
            <Link
              key={grandchild.id}
              role="menuitem"
              to={grandchild.url}
              target={grandchild.target || '_self'}
              onClick={onNavigate}
              className="block rounded-lg px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:bg-white/[0.07] focus-visible:text-white focus-visible:outline-none"
            >
              {grandchild.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Desktop nav item - a plain link if it has no children, a hover/click dropdown if it does.
 *
 * `renderPanel` lets a caller (e.g. the course mega-menu) swap the default child-list panel for
 * custom content while reusing this component's open/close state machine, hover-intent delay,
 * outside-click handling, edge-aware alignment, and full keyboard support (Enter/Space/Arrow
 * keys/Escape) rather than re-implementing accessible dropdown behavior a second time.
 */
export function DesktopNavItem({ item, linkClassName, renderPanel, panelWidthPx }) {
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState('left')
  const containerRef = useRef(null)
  const panelRef = useRef(null)
  const closeTimerRef = useRef(null)
  const buttonId = useId()
  const panelId = useId()

  const itemHasChildren = hasChildren(item) || Boolean(renderPanel)
  const effectivePanelWidth = panelWidthPx || PANEL_WIDTH_PX

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        containerRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const overflowsRight = rect.left + effectivePanelWidth > window.innerWidth - 16
    setAlign(overflowsRight ? 'right' : 'left')
  }, [open, effectivePanelWidth])

  function openNow() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(true)
  }

  function closeSoon() {
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  function closeNow() {
    setOpen(false)
  }

  function handleButtonKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openNow()
      requestAnimationFrame(() => focusableMenuItems(panelRef.current)[0]?.focus())
    }
  }

  function handlePanelKeyDown(event) {
    const items = focusableMenuItems(panelRef.current)
    const currentIndex = items.indexOf(document.activeElement)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(currentIndex + 1) % items.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(currentIndex - 1 + items.length) % items.length]?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeNow()
      containerRef.current?.querySelector('button')?.focus()
    }
  }

  if (!itemHasChildren) {
    return (
      <Link to={item.url} target={item.target || '_self'} className={linkClassName}>
        {item.icon ? <span aria-hidden="true" className="mr-1.5">{item.icon}</span> : null}
        {item.title}
      </Link>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        id={buttonId}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? closeNow() : openNow())}
        onKeyDown={handleButtonKeyDown}
        className={`inline-flex items-center gap-1 ${linkClassName}`}
      >
        {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
        {item.title}
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-labelledby={buttonId}
          onKeyDown={renderPanel ? undefined : handlePanelKeyDown}
          style={{ width: effectivePanelWidth }}
          className={`absolute top-full z-[70] mt-3 rounded-2xl border border-white/10 bg-slate-950 shadow-[0_24px_60px_rgba(2,6,23,0.55)] ${
            renderPanel ? '' : 'p-2'
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {renderPanel
            ? renderPanel({ closeNow })
            : item.children.map((child) => <DropdownRow key={child.id} item={child} onNavigate={closeNow} />)}
        </div>
      ) : null}
    </div>
  )
}

/** Mobile nav item - a plain link if it has no children, a recursive accordion if it does. */
export function MobileNavAccordionItem({ item, onNavigate, level = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const itemHasChildren = hasChildren(item)

  if (!itemHasChildren) {
    return (
      <Link
        to={item.url}
        target={item.target || '_self'}
        onClick={onNavigate}
        className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
      >
        {item.icon ? <span aria-hidden="true" className="mr-1.5">{item.icon}</span> : null}
        {item.title}
      </Link>
    )
  }

  return (
    <div>
      <div className="flex items-stretch gap-1">
        <Link
          to={item.url}
          target={item.target || '_self'}
          onClick={onNavigate}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 hover:bg-white/[0.05]"
        >
          {item.icon ? <span aria-hidden="true" className="mr-1.5">{item.icon}</span> : null}
          {item.title}
        </Link>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.title} submenu`}
          onClick={() => setExpanded((value) => !value)}
          className="flex w-11 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.05] hover:text-white"
        >
          <Plus aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-45' : ''}`} />
        </button>
      </div>
      {expanded ? (
        <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-3">
          {item.children.map((child) => (
            <MobileNavAccordionItem key={child.id} item={child} onNavigate={onNavigate} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
