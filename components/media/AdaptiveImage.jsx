'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { buildSourceChain } from '../../lib/mediaAssets'

const VARIANT_STYLES = {
  hero: {
    aspectRatio: '16 / 9',
    imageClassName: 'object-contain p-2 sm:p-3',
    wrapperClassName: 'bg-white/[0.02]',
  },
  content: {
    aspectRatio: '4 / 3',
    imageClassName: 'object-contain p-2 sm:p-3',
    wrapperClassName: 'bg-white/[0.02]',
  },
  card: {
    aspectRatio: '16 / 10',
    imageClassName: 'object-contain p-3',
    wrapperClassName: 'bg-white/[0.02]',
  },
  logo: {
    aspectRatio: '1 / 1',
    imageClassName: 'object-contain p-2',
    wrapperClassName: 'bg-transparent',
  },
  cover: {
    aspectRatio: '16 / 9',
    imageClassName: 'object-cover',
    wrapperClassName: 'bg-white/[0.02]',
  },
}

export default function AdaptiveImage({
  src,
  fallbackSrcs = [],
  alt,
  variant = 'content',
  aspectRatio,
  sizes = '100vw',
  priority = false,
  caption,
  wrapperClassName = '',
  imageClassName = '',
  borderClassName = 'border border-white/10',
  roundedClassName = 'rounded-2xl',
  fill = true,
  width = 1200,
  height = 900,
  loading,
  style = {},
}) {
  const sources = useMemo(() => buildSourceChain(src, fallbackSrcs), [src, fallbackSrcs])
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [sources])

  const activeSrc = sources[sourceIndex] || '/logo-mark.png'
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.content
  const computedAspectRatio =
    aspectRatio || style.aspectRatio || variantStyle.aspectRatio || (height && width ? `${width} / ${height}` : '4 / 3')

  const imageNode = fill ? (
    <div
      className={`relative w-full overflow-hidden ${roundedClassName} ${borderClassName} ${variantStyle.wrapperClassName} ${wrapperClassName}`.trim()}
      style={{ aspectRatio: computedAspectRatio }}
    >
      <Image
        src={activeSrc}
        alt={alt}
        fill
        priority={priority}
        loading={loading}
        sizes={sizes}
        className={`${variantStyle.imageClassName} ${imageClassName}`.trim()}
        style={style}
        onError={() => {
          if (sourceIndex < sources.length - 1) {
            setSourceIndex((current) => current + 1)
          }
        }}
      />
    </div>
  ) : (
    <Image
      src={activeSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={loading}
      sizes={sizes}
      className={`${roundedClassName} ${borderClassName} ${variantStyle.imageClassName} ${imageClassName}`.trim()}
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((current) => current + 1)
        }
      }}
      style={style}
    />
  )

  if (!caption) return imageNode

  return (
    <figure className="space-y-3">
      {imageNode}
      <figcaption className="px-1 text-xs text-slate-400">{caption}</figcaption>
    </figure>
  )
}
