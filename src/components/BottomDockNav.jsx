import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Phone } from 'lucide-react'

const dockItems = [
  { label: 'Overview', to: '/' },
  { label: 'Course Highlights', to: '/courses#course-highlights' },
  { label: 'Success Stories', to: '/placement#success-stories' },
  { label: 'Our People', to: '/about' },
  { label: 'Curriculum', to: '/courses#curriculum' },
  { label: 'Projects', to: '/courses#projects' },
]

export function BottomDockNav() {
  const location = useLocation()
  const currentRoute = `${location.pathname}${location.hash || ''}`

  return (
    <div className="dock-nav-wrap" role="navigation" aria-label="Course quick navigation">
      <div className="dock-nav">
        <div className="dock-scroll">
          {dockItems.map((item) => {
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
            Apply Now
          </Link>
          <a href="tel:+917411314848" className="dock-icon dock-phone" aria-label="Call us">
            <Phone size={16} />
          </a>
          <a
            href="https://wa.me/917411314848"
            target="_blank"
            rel="noreferrer"
            className="dock-icon dock-whatsapp"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
