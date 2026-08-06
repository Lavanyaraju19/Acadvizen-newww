'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Save,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Check,
  Crop as CropIcon,
} from 'lucide-react'

export default function ImageEditor({ imageUrl, onSave, onClose }) {
  const canvasRef = useRef(null)
  const [image, setImage] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [scale, setScale] = useState(1)
  const [quality, setQuality] = useState(0.9)
  const [format, setFormat] = useState('image/jpeg')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [outputSize, setOutputSize] = useState({ width: 0, height: 0 })
  const [cropMode, setCropMode] = useState(false)
  const [cropRect, setCropRect] = useState(null)
  const [dragStart, setDragStart] = useState(null)

  const loadImage = useCallback((src) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      setOutputSize({ width: img.width, height: img.height })
      setHistory([{ img, rotation: 0, flipH: false, flipV: false }])
      setHistoryIndex(0)
      drawImage(img, 0, false, false, 1)
    }
    img.src = src
  }, [])

  useEffect(() => {
    if (imageUrl) {
      loadImage(imageUrl)
    }
  }, [imageUrl, loadImage])

  function drawImage(img, rot, fh, fv, scl) {
    const canvas = canvasRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.scale(fh ? -1 : 1, fv ? -1 : 1)
    ctx.scale(scl, scl)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    ctx.restore()
  }

  // Crop operates on the flattened raster currently painted on the canvas (post
  // rotate/flip/zoom) rather than trying to compose a crop rectangle with those
  // transforms mathematically - copying the visible pixels into a fresh canvas and
  // treating that as the new base image is simpler and can't drift out of sync with
  // whatever the user is currently looking at.
  function toCanvasCoords(clientX, clientY) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY)),
    }
  }

  function startCropMode() {
    setCropMode(true)
    setCropRect(null)
  }

  function cancelCrop() {
    setCropMode(false)
    setCropRect(null)
    setDragStart(null)
  }

  function handleCropPointerDown(e) {
    if (!cropMode) return
    const point = toCanvasCoords(e.clientX, e.clientY)
    setDragStart(point)
    setCropRect({ x: point.x, y: point.y, width: 0, height: 0 })
  }

  function handleCropPointerMove(e) {
    if (!cropMode || !dragStart) return
    const point = toCanvasCoords(e.clientX, e.clientY)
    setCropRect({
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    })
  }

  function handleCropPointerUp() {
    setDragStart(null)
  }

  function applyCrop() {
    const canvas = canvasRef.current
    if (!canvas || !cropRect || cropRect.width < 4 || cropRect.height < 4) return

    const width = Math.round(cropRect.width)
    const height = Math.round(cropRect.height)
    const cropped = document.createElement('canvas')
    cropped.width = width
    cropped.height = height
    cropped.getContext('2d').drawImage(canvas, Math.round(cropRect.x), Math.round(cropRect.y), width, height, 0, 0, width, height)

    const next = new Image()
    next.onload = () => {
      setImage(next)
      setRotation(0)
      setFlipH(false)
      setFlipV(false)
      setScale(1)
      setOutputSize({ width: next.width, height: next.height })
      const state = { img: next, rotation: 0, flipH: false, flipV: false }
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), state])
      setHistoryIndex((prev) => prev + 1)
      setCropMode(false)
      setCropRect(null)
      drawImage(next, 0, false, false, 1)
    }
    next.src = cropped.toDataURL('image/png')
  }

  function saveToHistory() {
    const state = { img: image, rotation, flipH, flipV }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  function undo() {
    if (historyIndex > 0) {
      const state = history[historyIndex - 1]
      setRotation(state.rotation)
      setFlipH(state.flipH)
      setFlipV(state.flipV)
      setHistoryIndex(historyIndex - 1)
      drawImage(state.img, state.rotation, state.flipH, state.flipV, scale)
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      const state = history[historyIndex + 1]
      setRotation(state.rotation)
      setFlipH(state.flipH)
      setFlipV(state.flipV)
      setHistoryIndex(historyIndex + 1)
      drawImage(state.img, state.rotation, state.flipH, state.flipV, scale)
    }
  }

  function handleRotate(direction) {
    const newRotation = direction === 'cw' ? rotation + 90 : rotation - 90
    setRotation(newRotation)
    saveToHistory()
    drawImage(image, newRotation, flipH, flipV, scale)
  }

  function handleFlip(axis) {
    if (axis === 'h') {
      setFlipH(!flipH)
      saveToHistory()
      drawImage(image, rotation, !flipH, flipV, scale)
    } else {
      setFlipV(!flipV)
      saveToHistory()
      drawImage(image, rotation, flipH, !flipV, scale)
    }
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], 'edited-image.jpg', { type: format })
        if (onSave) onSave(file)
      },
      format,
      quality
    )
  }

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'edited-image.jpg'
    link.href = canvas.toDataURL(format, quality)
    link.click()
  }

  function handleResize() {
    const newWidth = prompt('Enter new width:', outputSize.width)
    if (newWidth && !isNaN(newWidth)) {
      const aspectRatio = outputSize.height / outputSize.width
      const newHeight = Math.round(parseInt(newWidth) * aspectRatio)
      setOutputSize({ width: parseInt(newWidth), height: newHeight })
      
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = parseInt(newWidth)
        canvas.height = newHeight
        drawImage(image, rotation, flipH, flipV, scale)
      }
    }
  }

  if (!image) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="rounded-2xl border border-white/10 bg-[#050b12] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-300">Loading image...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-100">Image Editor</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Tools Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-3">Crop</h4>
              {cropMode ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Drag on the image to select a crop area.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={applyCrop}
                      disabled={!cropRect || cropRect.width < 4 || cropRect.height < 4}
                      className="flex-1 px-3 py-2 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-30 text-sm"
                    >
                      Apply Crop
                    </button>
                    <button
                      type="button"
                      onClick={cancelCrop}
                      className="px-3 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.05] text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCropMode}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] flex items-center justify-center gap-2 text-sm"
                >
                  <CropIcon className="w-4 h-4" /> Start Crop
                </button>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-3">Transform</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRotate('ccw')}
                  className="p-3 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                  title="Rotate Left"
                >
                  <RotateCcw className="w-5 h-5 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate('cw')}
                  className="p-3 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                  title="Rotate Right"
                >
                  <RotateCw className="w-5 h-5 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFlip('h')}
                  className="p-3 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-5 h-5 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFlip('v')}
                  className="p-3 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-3">Zoom</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setScale(Math.max(0.1, scale - 0.1)); drawImage(image, rotation, flipH, flipV, Math.max(0.1, scale - 0.1)) }}
                  className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center text-sm text-slate-300">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => { setScale(Math.min(3, scale + 0.1)); drawImage(image, rotation, flipH, flipV, Math.min(3, scale + 0.1)) }}
                  className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-3">Resize</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Width:</span>
                  <span className="text-slate-200">{outputSize.width}px</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Height:</span>
                  <span className="text-slate-200">{outputSize.height}px</span>
                </div>
                <button
                  type="button"
                  onClick={handleResize}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                >
                  Resize
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-3">Export</h4>
              <div className="space-y-3">
                <label className="text-xs text-slate-400">
                  Quality: {Math.round(quality * 100)}%
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full mt-1"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Format
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 text-sm"
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-3">History</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="flex-1 p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] disabled:opacity-30"
                >
                  <Undo className="w-4 h-4 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-1 p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] disabled:opacity-30"
                >
                  <Redo className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </aside>

          {/* Canvas Area */}
          <main>
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4 flex items-center justify-center min-h-[400px]">
              <div
                className="relative inline-block"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerLeave={handleCropPointerUp}
                style={{ cursor: cropMode ? 'crosshair' : 'default', touchAction: cropMode ? 'none' : 'auto' }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[600px] object-contain block"
                />
                {cropMode && cropRect && canvasRef.current && (
                  <div
                    className="absolute border-2 border-teal-400 bg-teal-400/10 pointer-events-none"
                    style={{
                      left: `${(cropRect.x / canvasRef.current.width) * 100}%`,
                      top: `${(cropRect.y / canvasRef.current.height) * 100}%`,
                      width: `${(cropRect.width / canvasRef.current.width) * 100}%`,
                      height: `${(cropRect.height / canvasRef.current.height) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save & Replace
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
