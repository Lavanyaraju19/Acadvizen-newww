export function ConsistentPortraitMedia({ src, alt, className = '', scale = 1.12 }) {
  return (
    <div className={`h-[320px] w-full overflow-hidden ${className}`.trim()}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-top"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
        loading="lazy"
      />
    </div>
  )
}

export default ConsistentPortraitMedia
