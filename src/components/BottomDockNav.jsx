import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Phone } from 'lucide-react'

const dockItems = [
  { label: 'Overview', hash: '#overview' },
  { label: 'Course Highlights', hash: '#course-highlights' },
  { label: 'Success Stories', hash: '#success-stories' },
  { label: 'Our People', hash: '#our-people' },
  { label: 'Curriculum', hash: '#curriculum' },
  { label: 'Projects', hash: '#projects' },
]

export function BottomDockNav() {
  const location = useLocation()
  const isCoursesPage = location.pathname === '/courses'
  const activeHash = location.hash || '#overview'

  return (
    <div className="dock-nav-wrap" role="navigation" aria-label="Course quick navigation">
      <div className="dock-nav">
        <div className="dock-scroll">
          {dockItems.map((item) => {
            const isActive = isCoursesPage && activeHash === item.hash
            return (
              <Link
                key={item.label}
                to={`/courses${item.hash}`}
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
