'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Surface } from '../../../src/components/ui/Surface'
import { deleteFileAsset, replaceFileAsset, uploadFileAsset } from '../../../lib/storageUpload'
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
  List,
  Link2,
  MoveRight,
  Pencil,
} from 'lucide-react'
import ImageEditor from '../../../components/admin/ImageEditor'

const buckets = CMS_MEDIA_BUCKETS

function buildFolderTree(folders, parentId = null) {
  return folders
    .filter((f) => (f.parent_id || null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({ ...f, children: buildFolderTree(folders, f.id) }))
}

function flattenFolderTree(tree, depth = 0, acc = []) {
  tree.forEach((node) => {
    acc.push({ id: node.id, name: node.name, depth })
    flattenFolderTree(node.children, depth + 1, acc)
  })
  return acc
}

function FolderNode({ node, depth, currentFolderId, expanded, onToggle, onSelect, onRename, onDelete, countFor }) {
  const isExpanded = expanded.has(node.id)
  const isActive = currentFolderId === node.id
  const count = countFor(node.id)
  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm cursor-pointer ${
          isActive ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300 hover:bg-white/[0.05]'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className={`p-0.5 rounded ${node.children.length ? 'text-slate-400 hover:text-slate-200' : 'invisible'}`}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={() => onSelect(node.id)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
          {isActive ? <FolderOpen className="w-4 h-4 flex-shrink-0" /> : <Folder className="w-4 h-4 flex-shrink-0" />}
          <span className="truncate">{node.name}</span>
          {count > 0 && <span className="text-xs text-slate-500">({count})</span>}
        </button>
        <button
          type="button"
          onClick={() => onRename(node)}
          className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200"
          title="Rename folder"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(node)}
          className="p-1 rounded opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300"
          title="Delete folder"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {isExpanded && node.children.map((child) => (
        <FolderNode
          key={child.id}
          node={child}
          depth={depth + 1}
          currentFolderId={currentFolderId}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          countFor={countFor}
        />
      ))}
    </div>
  )
}

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
  const [folders, setFolders] = useState([])
  const [currentFolderId, setCurrentFolderId] = useState(null) // null = All Files, 'unfiled' = no folder
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [editingItem, setEditingItem] = useState(null)
  const [editingImage, setEditingImage] = useState(null)
  const [referencesItem, setReferencesItem] = useState(null)
  const [referencesData, setReferencesData] = useState(null)
  const [referencesLoading, setReferencesLoading] = useState(false)
  const [bulkMoveTarget, setBulkMoveTarget] = useState('')

  async function loadMedia() {
    try {
      const payload = await adminApiFetch('/api/cms/media?limit=500', { cache: 'no-store' })
      setItems(Array.isArray(payload.data) ? payload.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load media library.')
    }
  }

  async function loadFolders() {
    try {
      const payload = await adminApiFetch('/api/cms/media/folders', { cache: 'no-store' })
      setFolders(Array.isArray(payload.data) ? payload.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load folders.')
    }
  }

  useEffect(() => {
    loadMedia()
    loadFolders()
  }, [])

  const foldersById = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders])
  const folderTree = useMemo(() => buildFolderTree(folders), [folders])
  const flatFolders = useMemo(() => flattenFolderTree(folderTree), [folderTree])

  const folderMediaCounts = useMemo(() => {
    const counts = new Map()
    items.forEach((item) => {
      if (item.folder_id) counts.set(item.folder_id, (counts.get(item.folder_id) || 0) + 1)
    })
    return counts
  }, [items])

  function folderPath(id) {
    const path = []
    let cursor = id ? foldersById.get(id) : null
    while (cursor) {
      path.unshift(cursor)
      cursor = cursor.parent_id ? foldersById.get(cursor.parent_id) : null
    }
    return path
  }

  function toggleExpand(id) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function createFolder(parentId = null) {
    const folderName = prompt('Enter folder name:')
    if (!folderName || !folderName.trim()) return
    setSaving(true)
    setStatus('')
    try {
      const payload = await adminApiFetch('/api/cms/media/folders', {
        method: 'POST',
        body: { name: folderName.trim(), parent_id: parentId },
      })
      await loadFolders()
      if (parentId) setExpandedFolders((prev) => new Set(prev).add(parentId))
      setCurrentFolderId(payload.data.id)
      setStatus('Folder created.')
    } catch (error) {
      setStatus(error?.message || 'Failed to create folder.')
    } finally {
      setSaving(false)
    }
  }

  async function renameFolder(folder) {
    const nextName = prompt('Rename folder:', folder.name)
    if (!nextName || !nextName.trim() || nextName.trim() === folder.name) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/media/folders/${folder.id}`, { method: 'PATCH', body: { name: nextName.trim() } })
      await loadFolders()
      setStatus('Folder renamed.')
    } catch (error) {
      setStatus(error?.message || 'Failed to rename folder.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteFolder(folder, { force = false } = {}) {
    if (!force && !window.confirm(`Delete folder "${folder.name}"?`)) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/media/folders/${folder.id}${force ? '?force=1' : ''}`, { method: 'DELETE' })
      if (currentFolderId === folder.id) setCurrentFolderId(null)
      await Promise.all([loadFolders(), loadMedia()])
      setStatus('Folder deleted.')
    } catch (error) {
      if (error?.status === 409 && window.confirm(`${error.message}\n\nDelete it anyway?`)) {
        return deleteFolder(folder, { force: true })
      }
      setStatus(error?.message || 'Failed to delete folder.')
    } finally {
      setSaving(false)
    }
  }

  function currentFolderIdForUpload() {
    return currentFolderId && currentFolderId !== 'unfiled' ? currentFolderId : null
  }

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
          folder_id: currentFolderIdForUpload(),
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

  async function saveMediaItem(item) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/media/${item.id}`, {
        method: 'PATCH',
        body: {
          alt_text: item.alt_text || '',
          caption: item.caption || '',
          name: item.name || '',
          folder_id: item.folder_id || null,
          tags: Array.isArray(item.tags) ? item.tags : [],
        },
      })
      setStatus('Media metadata updated.')
      setEditingItem(null)
      await loadMedia()
    } catch (error) {
      setStatus(error?.message || 'Failed to update media.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(item, { force = false } = {}) {
    if (!force && !window.confirm('Delete this media item?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/media/${item.id}${force ? '?force=1' : ''}`, { method: 'DELETE' })
      if (item.bucket && item.path) {
        await deleteFileAsset({ bucket: item.bucket, path: item.path })
      }
      setItems((prev) => prev.filter((entry) => entry.id !== item.id))
      setSelectedItems((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      setStatus('Media deleted.')
    } catch (error) {
      if (error?.status === 409 && window.confirm(`${error.message}\n\nDelete it anyway?`)) {
        return deleteItem(item, { force: true })
      }
      setStatus(error?.message || 'Failed to delete media.')
    } finally {
      setSaving(false)
    }
  }

  async function bulkDelete() {
    if (selectedItems.size === 0) return
    if (!window.confirm(`Delete ${selectedItems.size} selected items? Items still in use elsewhere will be skipped.`)) return
    setSaving(true)
    setStatus('')
    const deletedIds = []
    const blocked = []
    try {
      for (const id of selectedItems) {
        const item = items.find((i) => i.id === id)
        if (!item) continue
        try {
          await adminApiFetch(`/api/cms/media/${id}`, { method: 'DELETE' })
          if (item.bucket && item.path) {
            await deleteFileAsset({ bucket: item.bucket, path: item.path })
          }
          deletedIds.push(id)
        } catch (error) {
          blocked.push({ item, message: error?.message || 'Failed to delete.' })
        }
      }
      setItems((prev) => prev.filter((entry) => !deletedIds.includes(entry.id)))
      setSelectedItems(new Set())
      setStatus(
        blocked.length
          ? `Deleted ${deletedIds.length} item(s). Skipped ${blocked.length} still in use: ${blocked.map((b) => b.message).join(' ')}`
          : `Deleted ${deletedIds.length} item(s).`
      )
    } finally {
      setSaving(false)
    }
  }

  async function bulkMove() {
    if (selectedItems.size === 0) return
    const targetId = bulkMoveTarget === 'unfiled' ? null : bulkMoveTarget || null
    setSaving(true)
    setStatus('')
    try {
      let moved = 0
      for (const id of selectedItems) {
        await adminApiFetch(`/api/cms/media/${id}`, { method: 'PATCH', body: { folder_id: targetId } })
        moved += 1
      }
      await loadMedia()
      setSelectedItems(new Set())
      setStatus(`Moved ${moved} item(s).`)
    } catch (error) {
      setStatus(error?.message || 'Failed to move selected items.')
    } finally {
      setSaving(false)
    }
  }

  async function openReferences(item) {
    setReferencesItem(item)
    setReferencesData(null)
    setReferencesLoading(true)
    try {
      const payload = await adminApiFetch(`/api/cms/media/${item.id}/references`, { cache: 'no-store' })
      setReferencesData(payload.data)
    } catch (error) {
      setReferencesData({ error: error?.message || 'Failed to load references.' })
    } finally {
      setReferencesLoading(false)
    }
  }

  function toggleSelection(id) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedItems(new Set(filteredItems.map((item) => item.id)))
  }

  function clearSelection() {
    setSelectedItems(new Set())
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
    if (currentFolderId === 'unfiled' && item.folder_id) return false
    if (currentFolderId && currentFolderId !== 'unfiled' && item.folder_id !== currentFolderId) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (!query.trim()) return true
    const tagText = Array.isArray(item.tags) ? item.tags.join(' ') : ''
    const folderName = item.folder_id ? foldersById.get(item.folder_id)?.name || '' : ''
    const source = `${item.name || ''} ${item.url || ''} ${item.alt_text || ''} ${item.caption || ''} ${tagText} ${folderName}`.toLowerCase()
    return source.includes(query.trim().toLowerCase())
  })

  const currentPath = currentFolderId && currentFolderId !== 'unfiled' ? folderPath(currentFolderId) : []

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
            aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Folder Tree Sidebar */}
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-1 lg:max-h-[70vh] lg:overflow-y-auto">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`w-full flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-left ${
              currentFolderId === null ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <FolderOpen className="w-4 h-4" /> All Files
            <span className="text-xs text-slate-500 ml-auto">({items.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentFolderId('unfiled')}
            className={`w-full flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-left ${
              currentFolderId === 'unfiled' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <Folder className="w-4 h-4" /> Unfiled
            <span className="text-xs text-slate-500 ml-auto">({items.filter((i) => !i.folder_id).length})</span>
          </button>

          <div className="pt-2 space-y-0.5">
            {folderTree.map((node) => (
              <FolderNode
                key={node.id}
                node={node}
                depth={0}
                currentFolderId={currentFolderId}
                expanded={expandedFolders}
                onToggle={toggleExpand}
                onSelect={setCurrentFolderId}
                onRename={renameFolder}
                onDelete={deleteFolder}
                countFor={(id) => folderMediaCounts.get(id) || 0}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => createFolder(currentFolderId && currentFolderId !== 'unfiled' ? currentFolderId : null)}
            className="w-full mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-2 py-1.5 text-sm text-slate-400 hover:border-teal-500/50 hover:text-teal-300"
          >
            <Plus className="w-3.5 h-3.5" /> New Folder
          </button>
        </aside>

        <div className="min-w-0">
          {/* Breadcrumb */}
          {(currentFolderId === 'unfiled' || currentPath.length > 0) && (
            <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
              <button type="button" onClick={() => setCurrentFolderId(null)} className="hover:text-teal-300">All Files</button>
              {currentFolderId === 'unfiled' ? (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-slate-200">Unfiled</span>
                </>
              ) : (
                currentPath.map((folder) => (
                  <span key={folder.id} className="flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={folder.id === currentFolderId ? 'text-slate-200' : 'hover:text-teal-300'}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="media-bucket-select" className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Storage Bucket</label>
                <select
                  id="media-bucket-select"
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

              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Upload Files {currentPath.length > 0 && `(to "${currentPath[currentPath.length - 1].name}")`}
                </label>
                <input
                  id="media-upload-input"
                  aria-label="Upload files"
                  type="file"
                  multiple
                  onChange={(event) => handleUpload(event.target.files)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, alt text, caption, tag, or folder..."
                    className="w-full pl-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="min-w-[150px]">
                <label htmlFor="media-type-filter" className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Filter by Type</label>
                <select
                  id="media-type-filter"
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

            {selectedItems.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
                <span className="text-sm text-teal-300">{selectedItems.size} selected</span>
                <select
                  value={bulkMoveTarget}
                  onChange={(event) => setBulkMoveTarget(event.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-200"
                >
                  <option value="">Move to...</option>
                  <option value="unfiled">Unfiled</option>
                  {flatFolders.map((f) => (
                    <option key={f.id} value={f.id}>{'  '.repeat(f.depth)}{f.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={bulkMove}
                  disabled={saving || !bulkMoveTarget}
                  className="px-3 py-1.5 rounded-lg border border-teal-400/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 disabled:opacity-50"
                >
                  <MoveRight className="w-4 h-4 inline mr-1" />
                  Move
                </button>
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
            <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
              {status}
            </div>
          )}

          {uploading && (
            <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full" />
                Uploading files...
              </div>
            </div>
          )}

          <div className="flex items-center justify-between my-4">
            <p className="text-sm text-slate-400">
              {filteredItems.length} file{filteredItems.length !== 1 ? 's' : ''}
            </p>
            {selectedItems.size === 0 && filteredItems.length > 0 && (
              <button type="button" onClick={selectAll} className="text-xs text-teal-400 hover:text-teal-300">
                Select All
              </button>
            )}
          </div>

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
                      <Image src={item.url} alt={item.alt_text || 'Media'} fill className="object-cover" />
                    ) : item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" controls />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="w-12 h-12 text-slate-500" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/20"
                      />
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 rounded-full bg-black/50 text-xs text-white backdrop-blur-sm">
                        {getFileIcon(item.type)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="truncate text-xs text-slate-400 mb-2">{item.name || item.url.split('/').pop()}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{formatFileSize(item.size)}</span>
                      <div className="flex gap-1">
                        {item.type === 'image' && (
                          <button
                            type="button"
                            onClick={() => setEditingImage(item)}
                            className="p-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
                            title="Edit Image"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openReferences(item)}
                          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                          title="Where is this used?"
                        >
                          <Link2 className="w-3 h-3" />
                        </button>
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
                      <Image src={item.url} alt={item.alt_text || 'Media'} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">{getFileIcon(item.type)}</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-slate-200">{item.name || item.url.split('/').pop()}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>{formatFileSize(item.size)}</span>
                      {item.folder_id && foldersById.get(item.folder_id) && <span>• {foldersById.get(item.folder_id).name}</span>}
                      {item.alt_text && <span>• {item.alt_text}</span>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => openReferences(item)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Where is this used?">
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setEditingItem(item)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" title="Edit">
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
                    <button type="button" onClick={() => deleteItem(item)} className="p-2 rounded-lg border border-rose-400/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" title="Delete">
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
                {query || typeFilter !== 'all' || currentFolderId ? 'Try adjusting your filters' : 'Upload your first file to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Edit Media</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Display Name (rename without changing the file URL)</label>
                <input
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder={editingItem.url?.split('/').pop()}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </div>

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
                  value={editingItem.folder_id || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, folder_id: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="">Unfiled</option>
                  {flatFolders.map((f) => (
                    <option key={f.id} value={f.id}>{'  '.repeat(f.depth)}{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Tags (comma-separated)</label>
                <input
                  value={Array.isArray(editingItem.tags) ? editingItem.tags.join(', ') : ''}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                  })}
                  placeholder="hero, homepage, banner"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
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
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* References Modal */}
      {referencesItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Where is this used?</h3>
              <button type="button" onClick={() => setReferencesItem(null)} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 break-all">{referencesItem.url}</p>
            {referencesLoading && <p className="text-sm text-slate-400">Scanning direct fields and JSON content for references...</p>}
            {referencesData?.error && <p className="text-sm text-rose-400">{referencesData.error}</p>}
            {referencesData && !referencesData.error && (
              referencesData.references.length === 0 ? (
                <p className="text-sm text-slate-400">Not referenced anywhere - safe to delete.</p>
              ) : (
                <div className="space-y-3">
                  {referencesData.references.map((ref) => (
                    <div key={ref.table} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-sm font-medium text-slate-200">{ref.label} <span className="text-slate-500">({ref.count})</span></p>
                      <ul className="mt-1 space-y-1">
                        {ref.items.map((row) => (
                          <li key={row.id} className="text-xs text-slate-400">
                            {row.link ? (
                              <a href={row.link} target="_blank" rel="noreferrer" className="text-teal-400 hover:text-teal-300">
                                {row.title || row.id}
                              </a>
                            ) : (
                              <span>{row.title || row.id}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage.url}
          onSave={async (file) => {
            try {
              await replaceFileAsset(editingImage.id, file)
              setEditingImage(null)
              await loadMedia()
              setStatus('Image replaced - every place that uses it now shows the edited version.')
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
