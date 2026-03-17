import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Phone } from 'lucide-react'
import { useSiteCms } from '../hooks/useSiteCms'
import { trackContact } from '../../lib/metaPixel'

const dockItems = [
  { label: 'Overview', to: '/' },
  { label: 'Course Highlights', to: '/courses#course-highlights' },
  { label: 'Success Stories', to: '/placement#success-stories' },
  { label: 'About Us', to: '/about' },
  { label: 'Curriculum', to: '/courses#curriculum' },
  { label: 'Projects', to: '/courses#projects' },
]

export function BottomDockNav() {
  const location = useLocation()
  const { menus, settings } = useSiteCms()
  const uiCopy = settings?.ui_copy && typeof settings.ui_copy === 'object' ? settings.ui_copy : {}
  const currentRoute = `${location.pathname}${location.hash || ''}`
  const uiDockItems = Array.isArray(uiCopy.bottom_dock_fallback_items)
    ? uiCopy.bottom_dock_fallback_items
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({ label: String(item.label || '').trim(), to: String(item.to || '').trim() }))
        .filter((item) => item.label && item.to)
    : []
  const dynamicItems = Array.isArray(menus?.bottom_dock) && menus.bottom_dock.length
    ? menus.bottom_dock.filter((item) => !item.parent_id).map((item) => ({
        label: item.title,
        to: item.url,
      }))
    : (uiDockItems.length ? uiDockItems : dockItems)
  const phoneNumber = settings?.phone_number || '+917411314848'
  const whatsappRaw = settings?.social_links?.whatsapp || settings?.phone_number || '917411314848'
  const whatsappNumber = String(whatsappRaw).replace(/[^\d]/g, '')
  const applyLabel = String(uiCopy.dock_apply_label || 'Apply Now')
  const dockAriaLabel = String(uiCopy.dock_aria_label || 'Course quick navigation')
  const callAriaLabel = String(uiCopy.dock_call_label || 'Call us')
  const whatsappAriaLabel = String(uiCopy.dock_whatsapp_label || 'Chat on WhatsApp')

  return (
    <div className="dock-nav-wrap" role="navigation" aria-label={dockAriaLabel}>
      <div className="dock-nav">
        <div className="dock-scroll">
          {dynamicItems.map((item) => {
            const isActive = currentRoute === item.to
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`dock-link ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="dock-actions">
          <Link to="/register" className="dock-apply">
            {applyLabel}
          </Link>
          <a
            href={`tel:${phoneNumber}`}
            className="dock-icon dock-phone"
            aria-label={callAriaLabel}
            onClick={() => trackContact({ content_name: 'Bottom Dock Call' }, `bottom-dock-call:${phoneNumber}`)}
          >
            <Phone size={16} />
          </a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="dock-icon dock-whatsapp"
            aria-label={whatsappAriaLabel}
            onClick={() => trackContact({ content_name: 'Bottom Dock WhatsApp' }, `bottom-dock-whatsapp:${whatsappNumber}`)}
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
