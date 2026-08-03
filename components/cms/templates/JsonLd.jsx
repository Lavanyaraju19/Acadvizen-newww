// Renders one or more JSON-LD structured-data blocks. Accepts a single schema object, an
// array of schema objects, or a mix of both (falsy entries are dropped so callers can pass
// `buildXSchema(...)` results directly without pre-filtering nulls).
export default function JsonLd({ id, data }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean)
  if (!items.length) return null

  return (
    <>
      {items.map((item, index) => (
        <script
          key={`${id || 'jsonld'}-${index}`}
          id={`${id || 'jsonld'}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}
