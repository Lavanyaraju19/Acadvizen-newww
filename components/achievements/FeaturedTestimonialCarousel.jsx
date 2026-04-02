'use client'

import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function VerticalPanel({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-[580px] w-full items-center justify-center rounded-[26px] bg-[#10150f] px-3 py-6 text-white shadow-[0_18px_42px_rgba(11,19,14,0.18)] transition hover:-translate-y-1"
    >
      <span
        className="text-xs font-semibold uppercase tracking-[0.38em] text-white"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {label}
      </span>
    </button>
  )
}

function CarouselButton({ direction, onClick, disabled }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d7decd] bg-white text-[#132718] shadow-[0_10px_28px_rgba(19,39,24,0.08)] transition hover:border-[#b9c8ae] disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={direction === 'left' ? 'Previous testimonial' : 'Next testimonial'}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function TestimonialViewport({ item, videoRef, isPlaying, onPlayRequest, onPlay, onPause, compact = false }) {
  return (
    <div className="rounded-[26px] border border-[#dfe5d7] bg-white p-3 shadow-[0_20px_55px_rgba(20,39,24,0.10)]">
      <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[22px] bg-[#101010]" style={{ aspectRatio: '4 / 5' }}>
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.thumbnail || undefined}
          preload="metadata"
          playsInline
          controls={isPlaying}
          className="h-full w-full object-contain object-center"
          onPlay={onPlay}
          onPause={onPause}
        />
        {!isPlaying ? (
          <button
            type="button"
            onClick={onPlayRequest}
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#132718] shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition hover:scale-105 ${
              compact ? 'h-16 w-16' : 'h-20 w-20'
            }`}
            aria-label={`Play ${item.personName}`}
          >
            <Play className={`ml-1 fill-current ${compact ? 'h-7 w-7' : 'h-9 w-9'}`} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default function FeaturedTestimonialCarousel({ items = [] }) {
  const entries = Array.isArray(items) ? items.filter(Boolean) : []
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const desktopVideoRef = useRef(null)
  const mobileVideoRef = useRef(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [entries.length])

  useEffect(() => {
    setIsPlaying(false)
    ;[desktopVideoRef.current, mobileVideoRef.current].forEach((node) => {
      if (!node) return
      node.pause()
      node.currentTime = 0
    })
  }, [activeIndex])

  if (!entries.length) return null

  const active = entries[activeIndex]
  const total = entries.length
  const leftFar = entries[(activeIndex - 2 + total) % total]
  const leftNear = entries[(activeIndex - 1 + total) % total]
  const rightNear = entries[(activeIndex + 1) % total]
  const rightFar = entries[(activeIndex + 2) % total]

  const playFrom = async (ref) => {
    const node = ref.current
    if (!node) return
    if (isPlaying) {
      node.pause()
      setIsPlaying(false)
      return
    }
    try {
      await node.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const markPlaying = () => setIsPlaying(true)
  const markPaused = () => setIsPlaying(false)

  return (
    <div className="space-y-6">
      <div className="hidden grid-cols-[56px_82px_minmax(0,1fr)_82px_56px] items-center gap-4 xl:grid">
        <VerticalPanel label={leftFar.personName} onClick={() => setActiveIndex((activeIndex - 2 + total) % total)} />
        <VerticalPanel label={leftNear.personName} onClick={() => setActiveIndex((activeIndex - 1 + total) % total)} />

        <div className="rounded-[34px] bg-[linear-gradient(180deg,#fefefb_0%,#f4f6ee_100%)] px-5 py-7 shadow-[0_24px_80px_rgba(17,32,19,0.12)]">
          <div className="text-center">
            <p className="text-3xl font-semibold tracking-tight text-[#111913]">{active.personName}</p>
            {active.designation ? <p className="mt-2 text-sm text-[#607160]">{active.designation}</p> : null}
          </div>

          <div className="mt-6">
            <TestimonialViewport
              item={active}
              videoRef={desktopVideoRef}
              isPlaying={isPlaying}
              onPlayRequest={() => playFrom(desktopVideoRef)}
              onPlay={markPlaying}
              onPause={markPaused}
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <CarouselButton direction="left" onClick={() => setActiveIndex((activeIndex - 1 + total) % total)} disabled={total < 2} />
            <CarouselButton direction="right" onClick={() => setActiveIndex((activeIndex + 1) % total)} disabled={total < 2} />
          </div>
        </div>

        <VerticalPanel label={rightNear.personName} onClick={() => setActiveIndex((activeIndex + 1) % total)} />
        <VerticalPanel label={rightFar.personName} onClick={() => setActiveIndex((activeIndex + 2) % total)} />
      </div>

      <div className="space-y-4 xl:hidden">
        <div className="rounded-[30px] bg-[linear-gradient(180deg,#fefefb_0%,#f4f6ee_100%)] px-4 py-5 shadow-[0_20px_60px_rgba(17,32,19,0.10)]">
          <div className="text-center">
            <p className="text-2xl font-semibold tracking-tight text-[#111913]">{active.personName}</p>
            {active.designation ? <p className="mt-2 text-sm text-[#607160]">{active.designation}</p> : null}
          </div>
          <div className="mt-5">
            <TestimonialViewport
              item={active}
              videoRef={mobileVideoRef}
              isPlaying={isPlaying}
              onPlayRequest={() => playFrom(mobileVideoRef)}
              onPlay={markPlaying}
              onPause={markPaused}
              compact
            />
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            <CarouselButton direction="left" onClick={() => setActiveIndex((activeIndex - 1 + total) % total)} disabled={total < 2} />
            <CarouselButton direction="right" onClick={() => setActiveIndex((activeIndex + 1) % total)} disabled={total < 2} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {entries.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-[20px] px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
                index === activeIndex ? 'bg-[#10150f] text-white' : 'bg-white text-[#17301d] shadow-[0_12px_28px_rgba(17,32,19,0.08)]'
              }`}
            >
              {item.personName}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
