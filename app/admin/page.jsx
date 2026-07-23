'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Image as ImageIcon, 
  Search, 
  Handshake, 
  MapPinned, 
  Inbox, 
  Tags, 
  FileEdit, 
  Wrench, 
  Building, 
  Briefcase, 
  MessageSquare, 
  Users, 
  Monitor, 
  Settings, 
  Popcorn, 
  RectangleHorizontal,
  Plus,
  Bell,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  X,
  Clock,
  Database,
  Server,
  Mail,
  Globe,
  Shield
} from 'lucide-react'
import { Surface } from '../../src/components/ui/Surface'
import HealthDashboard from '../../components/admin/HealthDashboard'
import { adminApiFetch } from '../../lib/adminApiClient'

export const dynamic = 'force-dynamic'

export default function Page() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [systemStatus, setSystemStatus] = useState({
    database: 'online',
    storage: 'online',
    auth: 'online',
    email: 'unknown',
    api: 'online',
  })

  const quickActions = [
    { href: '/admin/pages', label: 'Create Page', icon: LayoutDashboard },
    { href: '/admin/blogs', label: 'Create Blog', icon: BookOpen },
    { href: '/admin/courses', label: 'Create Course', icon: GraduationCap },
    { href: '/admin/cities', label: 'Create City Page', icon: MapPinned },
    { href: '/admin/media', label: 'Upload Media', icon: ImageIcon },
    { href: '/admin/banners', label: 'Create Banner', icon: RectangleHorizontal },
    { href: '/admin/leads', label: 'View Leads', icon: Inbox },
    { href: '/', label: 'Preview Website', icon: Globe, external: true },
  ]

  useEffect(() => {
    loadNotifications()
    // Check system status every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadNotifications() {
    try {
      const { data } = await adminApiFetch('/api/admin/notifications', {
        cache: 'no-store',
      })
      
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  async function checkSystemStatus() {
    // In production, this would check actual service status
    // For now, it simulates the checks
    setSystemStatus({
      database: 'online',
      storage: 'online',
      auth: 'online',
      email: 'unknown',
      api: 'online',
    })
  }

  async function markNotificationAsRead(id) {
    try {
      await adminApiFetch(`/api/admin/notifications/${id}/read`, {
        method: 'POST',
      })
      
      loadNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  function getStatusColor(status) {
    if (status === 'online') return 'text-green-400'
    if (status === 'warning') return 'text-yellow-400'
    return 'text-rose-400'
  }

  function getStatusIcon(status) {
    if (status === 'online') return <CheckCircle className="w-4 h-4" />
    if (status === 'warning') return <AlertTriangle className="w-4 h-4" />
    return <X className="w-4 h-4" />
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Admin Dashboard</h2>
          <p className="mt-1 text-sm text-slate-300">
            Welcome back! Here's what's happening with your website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/ADMIN_USER_MANUAL.md"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
          >
            Help
          </a>
          <button
            type="button"
            className="relative p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Health Dashboard */}
        <div className="lg:col-span-2">
          <HealthDashboard />
        </div>

        {/* System Status */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Database className="w-4 h-4" />
                Database
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(systemStatus.database)}
                <span className={`text-xs ${getStatusColor(systemStatus.database)}`}>
                  {systemStatus.database}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Server className="w-4 h-4" />
                Storage
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(systemStatus.storage)}
                <span className={`text-xs ${getStatusColor(systemStatus.storage)}`}>
                  {systemStatus.storage}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Shield className="w-4 h-4" />
                Authentication
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(systemStatus.auth)}
                <span className={`text-xs ${getStatusColor(systemStatus.auth)}`}>
                  {systemStatus.auth}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(systemStatus.email)}
                <span className={`text-xs ${getStatusColor(systemStatus.email)}`}>
                  {systemStatus.email}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Zap className="w-4 h-4" />
                API
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(systemStatus.api)}
                <span className={`text-xs ${getStatusColor(systemStatus.api)}`}>
                  {systemStatus.api}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-400" />
          Quick Actions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((item) => {
            const Icon = item.icon
            const Component = item.external ? 'a' : Link
            const props = item.external 
              ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
              : { href: item.href }
            
            return (
              <Component
                key={item.href}
                {...props}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-slate-200 hover:bg-white/[0.05] block"
              >
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Component>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-400" />
              Recent Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-teal-300 hover:text-teal-200"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              No notifications
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg transition-colors ${
                    !notification.is_read ? 'bg-teal-500/10 border border-teal-500/30' : 'bg-white/[0.02] border border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200">{notification.title}</div>
                      {notification.message && (
                        <div className="text-xs text-slate-400 mt-1">{notification.message}</div>
                      )}
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <div className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">System</span> ran health scan
              </div>
              <div className="text-xs text-slate-500 mt-1">Just now</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <div className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">Admin</span> updated settings
              </div>
              <div className="text-xs text-slate-500 mt-1">5 minutes ago</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <div className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">Editor</span> created new blog post
              </div>
              <div className="text-xs text-slate-500 mt-1">1 hour ago</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
              <div className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">Backup</span> completed successfully
              </div>
              <div className="text-xs text-slate-500 mt-1">2 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  )
}

