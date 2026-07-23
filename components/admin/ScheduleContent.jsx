'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, X, Check, AlertCircle } from 'lucide-react'
import { adminApiFetch } from '../../lib/adminApiClient'

export default function ScheduleContent({ 
  entityType, 
  entityId, 
  scheduledPublishAt, 
  scheduledUnpublishAt, 
  autoPublish,
  onScheduleChange 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [publishDate, setPublishDate] = useState(scheduledPublishAt || '')
  const [unpublishDate, setUnpublishDate] = useState(scheduledUnpublishAt || '')
  const [enableAutoPublish, setEnableAutoPublish] = useState(autoPublish || false)
  const [saving, setSaving] = useState(false)
  const [scheduledItems, setScheduledItems] = useState([])

  async function loadScheduledItems() {
    try {
      const json = await adminApiFetch('/api/cms/scheduled-items', { cache: 'no-store' })
      setScheduledItems(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      console.error('Failed to load scheduled items:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadScheduledItems()
    }
  }, [isOpen])

  async function handleSave() {
    setSaving(true)
    try {
      onScheduleChange({
        scheduled_publish_at: publishDate || null,
        scheduled_unpublish_at: unpublishDate || null,
        auto_publish: enableAutoPublish,
      })
      setIsOpen(false)
      await loadScheduledItems()
    } catch (error) {
      console.error('Failed to save schedule:', error)
    } finally {
      setSaving(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date - now
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 0) return 'Overdue'
    if (diffMins < 60) return `In ${diffMins} minutes`
    if (diffHours < 24) return `In ${diffHours} hours`
    return `In ${diffDays} days`
  }

  const scheduledCount = scheduledItems.filter(item => 
    item.scheduled_at && new Date(item.scheduled_at) > new Date()
  ).length

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          (scheduledPublishAt || scheduledUnpublishAt) 
            ? 'border-teal-500/50 bg-teal-500/10 text-teal-300' 
            : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.05]'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm">Schedule</span>
        {(scheduledPublishAt || scheduledUnpublishAt) && (
          <span className="w-2 h-2 rounded-full bg-teal-400" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Content Scheduling</h3>
                <p className="text-sm text-slate-400 mt-1">Set automatic publish and unpublish times</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upcoming Scheduled Items */}
            {scheduledItems.length > 0 && (
              <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <h4 className="text-sm font-semibold text-slate-200">
                    Upcoming Scheduled Actions ({scheduledCount})
                  </h4>
                </div>
                <div className="space-y-2">
                  {scheduledItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.action === 'publish' ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {item.action}
                        </span>
                        <span className="text-sm text-slate-300">{item.item_title}</span>
                        <span className="text-xs text-slate-500 capitalize">({item.item_type})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">{formatDate(item.scheduled_at)}</div>
                        <div className="text-xs text-slate-500">{formatRelativeTime(item.scheduled_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={enableAutoPublish}
                  onChange={(e) => setEnableAutoPublish(e.target.checked)}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                <label htmlFor="autoPublish" className="text-sm text-slate-300 flex-1">
                  Enable automatic publishing
                </label>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Publish At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
                {publishDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(publishDate)} • {formatRelativeTime(publishDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Unpublish At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={unpublishDate}
                  onChange={(e) => setUnpublishDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
                {unpublishDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(unpublishDate)} • {formatRelativeTime(unpublishDate)}
                  </p>
                )}
              </div>

              {publishDate && unpublishDate && new Date(publishDate) >= new Date(unpublishDate) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <p className="text-sm text-rose-300">
                    Warning: Unpublish date must be after publish date
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || (publishDate && unpublishDate && new Date(publishDate) >= new Date(unpublishDate))}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}