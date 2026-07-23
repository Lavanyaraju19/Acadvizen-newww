'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Surface } from '../../../src/components/ui/Surface'
import { deleteFileAsset, uploadFileAsset } from '../../../lib/storageUpload'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { CMS_MEDIA_BUCKETS } from '../../../lib/mediaBuckets'
import { 
  Folder, 
  Upload, 
  Search, 
  Trash2, 
  Copy, 
  Download, 
  Edit2, 
  X,
  Check,
  FolderOpen,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Grid3x3,
  List
} from 'lucide-react'
import ImageEditor from '../../../components/admin/ImageEditor'

const buckets = CMS_MEDIA_BUCKETS

export default function MediaManagerClient() {
  const [bucket, setBucket] = useState('site-assets')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [items, setItems] = useState([])
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [viewMode, setViewMode] = useState('grid')
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState('')
  const [folders, setFolders] = useState([''])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingImage, setEditingImage] = useState(null)

  async function loadMedia() {
    try {
      const payload = await adminApiFetch('/api/cms/media?limit=500', { cache: 'no-store' })
      setItems(Array.isArray(payload.data) ? payload.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load media library.')
      return
    }
  }

  useEffect(() => {
    loadMedia()
  }, [])

  async function handleUpload(files) {
    if (!files || files.length === 0) return
    setUploading(true)
    setStatus('')
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const asset = await uploadFileAsset(file, bucket)
        const payload = {
          url: asset.url,
          bucket: asset.bucket,
          path: asset.path,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          size: asset.size,
          alt_text: '',
          caption: '',
          folder: currentFolder,
        }
        return adminApiFetch('/api/cms/media', {
          method: 'POST',
          body: payload,
        })
      })
      
      await Promise.all(uploadPromises)
      setStatus(`Successfully uploaded ${files.length} file(s).`)
      await loadMedia()
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSingleUpload(file) {
    if (!file) return
    setUploading(true)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, bucket)
      const payload = {
        url: asset.url,
        bucket: asset.bucket,
        path: asset.path,
        type: asset.type,
        width: asset.width,
        height: asset.height,
        size: asset.size,
        alt_text: '',
        caption: '',
        folder: currentFolder,
      }
      await adminApiFetch('/api/cms/media', {
        method: 'POST',
        body: payload,
      })
      setStatus('Upload complete.')
      await loadMedia()
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function saveMediaItem(item) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/media/${item.id}`, {
        method: 'PATCH',
        body: {
          alt_text: item.alt_text || '',
          caption: item.caption || '',
          folder: item.folder || '',
        },
      })
      setStatus('Media metadata updated.')
      setEditingItem(null)
    } catch (error) {
      setStatus(error?.message || 'Failed to update media.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(item) {
    if (!window.confirm('Delete this media item?')) return
    setSaving(true)
    setStatus('')
    try {
      if (item.bucket && item.path) {
        await deleteFileAsset({ bucket: item.bucket, path: item.path })
      }
      await adminApiFetch(`/api/cms/media/${item.id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((entry) => entry.id !== item.id))
      setSelectedItems(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      setStatus('Media deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete media.')
    } finally {
      setSaving(false)
    }
  }

  async function bulkDelete() {
    if (selectedItems.size === 0) return
    if (!window.confirm(`Delete ${selectedItems.size} selected items?`)) return
    setSaving(true)
    setStatus('')
    try {
      const deletePromises = Array.from(selectedItems).map(async (id) => {
        const item = items.find(i => i.id === id)
        if (item?.bucket && item?.path) {
          await deleteFileAsset({ bucket: item.bucket, path: item.path })
        }
        return adminApiFetch(`/api/cms/media/${id}`, { method: 'DELETE' })
      })
      
      await Promise.all(deletePromises)
      setItems((prev) => prev.filter((entry) => !selectedItems.has(entry.id)))
      setSelectedItems(new Set())
      setShowBulkActions(false)
      setStatus(`Deleted ${selectedItems.size} items.`)
    } catch (error) {
      setStatus(error?.message || 'Bulk delete failed.')
    } finally {
      setSaving(false)
    }
  }

  function updateField(id, key, value) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )
  }

  function toggleSelection(id) {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectAll() {
    const allIds = filteredItems.map(item => item.id)
    setSelectedItems(new Set(allIds))
  }

  function clearSelection() {
    setSelectedItems(new Set())
  }

  function createFolder() {
    const folderName = prompt('Enter folder name:')
    if (folderName && folderName.trim()) {
      setFolders(prev => [...prev, folderName.trim()])
      setCurrentFolder(folderName.trim())
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const size = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, size)).toFixed(1)} ${units[size]}`
  }

  function getFileIcon(type) {
    if (type === 'image') return <ImageIcon className="w-4 h-4" />
    if (type === 'video') return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const filteredItems = items.filter((item) => {
    if (currentFolder && item.folder !== currentFolder) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (!query.trim()) return true
    const source = `${item.url || ''} ${item.alt_text || ''} ${item.caption || ''}`.toLowerCase()
    return source.includes(query.trim().toLowerCase())
  })

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Media Library</h2>
          <p className="mt-1 text-sm text-slate-300">Upload, organize, and manage all your media files</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Bucket Selection */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Storage Bucket</label>
            <select
              value={bucket}
              onChange={(event) => setBucket(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            >
              {buckets.map((name) => (
                <option key={name} value={name} className="bg-[#050b12]">
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Folder Navigation */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Folder</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentFolder('')}
                className={`px-3 py-2 rounded-lg text-sm ${!currentFolder ? 'bg-teal-500/20 text-teal-300' : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]'}`}
              >
                All Files
              </button>
              {folders.map(folder => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setCurrentFolder(folder)}
                  className={`px-3 py-2 rounded-lg text-sm ${currentFolder === folder ? 'bg-teal-500/20 text-teal-300' : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]'}`}
                >
                  <Folder className="w-4 h-4 inline mr-1" />
                  {folder}
                </button>
              ))}
              <button
                type="button"
                onClick={createFolder}
                className="px-3 py-2 rounded-lg border border-dashed border-white/20 text-slate-400 hover:border-teal-500/50 hover:text-teal-300"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                New Folder
              </button>
            </div>
          </div>

          {/* Upload */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Upload Files</label>
            <input
              type="file"
              multiple
              onChange={(event) => handleUpload(event.target.files)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, alt text, or caption..."
                className="w-full pl-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            >
              <option value="all" className="bg-[#050b12]">All Types</option>
              <option value="image" className="bg-[#050b12]">Images</option>
              <option value="video" className="bg-[#050b12]">Videos</option>
              <option value="file" className="bg-[#050b12]">Documents</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
            <span className="text-sm text-teal-300">{selectedItems.size} selected</span>
            <button
              type="button"
              onClick={bulkDelete}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
            >
              <X className="w-4 h-4 inline mr-1" />
              Clear
            </button>
          </div>
        )}
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      {uploading && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full" />
            Uploading files...
          </div>
        </div>
      )}

      {/* File Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          {filteredItems.length} file{filteredItems.length !== 1 ? 's' : ''} 
          {currentFolder && ` in ${currentFolder}`}
        </p>
        {selectedItems.size === 0 && filteredItems.length > 0 && (
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-teal-400 hover:text-teal-300"
          >
            Select All
          </button>
        )}
      </div>

      {/* Media Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border bg-white/[0.03] overflow-hidden transition-all ${
                selectedItems.has(item.id) ? 'border-teal-500/50 ring-2 ring-teal-500/20' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="relative aspect-square overflow-hidden bg-white/[0.02]">
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={item.alt_text || 'Media'}
                    fill
                    className="object-cover"
                  />
                ) : item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" controls />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText className="w-12 h-12 text-slate-500" />
                  </div>
                )}
                
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/20"
                  />
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 rounded-full bg-black/50 text-xs text-white backdrop-blur-sm">
                    {getFileIcon(item.type)}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <p className="truncate text-xs text-slate-400 mb-2">{item.url.split('/').pop()}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{formatFileSize(item.size)}</span>
                  <div className="flex gap-1">
                    {item.type === 'image' && (
                      <button
                        type="button"
                        onClick={() => setEditingImage(item.url)}
                        className="p-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
                        title="Edit Image"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                      title="Edit Details"
                    >
                      <FileText className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.url)
                        setStatus('URL copied to clipboard')
                      }}
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                      title="Copy URL"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item)}
                      className="p-1.5 rounded-lg border border-rose-400/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border p-3 flex items-center gap-4 transition-all ${
                selectedItems.has(item.id) ? 'border-teal-500/50 bg-teal-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleSelection(item.id)}
                className="w-4 h-4 rounded border-white/20 bg-white/20"
              />
              
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/[0.02] flex-shrink-0">
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={item.alt_text || 'Media'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getFileIcon(item.type)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-slate-200">{item.url.split('/').pop()}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                  <span>{formatFileSize(item.size)}</span>
                  {item.folder && <span>• {item.folder}</span>}
                  {item.alt_text && <span>• {item.alt_text}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.url)
                    setStatus('URL copied to clipboard')
                  }}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(item)}
                  className="p-2 rounded-lg border border-rose-400/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!filteredItems.length && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No media files found</p>
          <p className="text-sm mt-2 opacity-70">
            {query || typeFilter !== 'all' || currentFolder 
              ? 'Try adjusting your filters' 
              : 'Upload your first file to get started'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Edit Media</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Alt Text</label>
                <input
                  value={editingItem.alt_text || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, alt_text: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-2">Caption</label>
                <textarea
                  value={editingItem.caption || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-2">Folder</label>
                <select
                  value={editingItem.folder || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, folder: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="">No folder</option>
                  {folders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => saveMediaItem(editingItem)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage}
          onSave={async (file) => {
            try {
              const asset = await uploadFileAsset(file, bucket)
              await adminApiFetch('/api/cms/media', {
                method: 'POST',
                body: {
                  url: asset.url,
                  bucket: asset.bucket,
                  path: asset.path,
                  type: asset.type,
                  width: asset.width,
                  height: asset.height,
                  size: asset.size,
                  alt_text: '',
                  caption: '',
                  folder: currentFolder,
                },
              })
              setEditingImage(null)
              await loadMedia()
              setStatus('Image edited and saved successfully.')
            } catch (error) {
              setStatus(error?.message || 'Failed to save edited image.')
            }
          }}
          onClose={() => setEditingImage(null)}
        />
      )}
    </Surface>
  )
}
