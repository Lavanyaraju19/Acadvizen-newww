import { AnimatePresence } from 'framer-motion'
import { useLocation, Outlet } from 'react-router-dom'

export function AnimatedOutlet() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Outlet key={location.pathname} />
    </AnimatePresence>
  )
}
