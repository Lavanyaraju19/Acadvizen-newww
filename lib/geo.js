// `Number(null) === 0`, and 0 is a finite number - a naive `Number.isFinite(Number(x))` presence
// check treats a genuinely missing (null/undefined/blank) coordinate as valid, which renders maps
// with a literal "0,0" or "null,null" query. Reject null/undefined/blank explicitly first.
export function hasValidCoordinate(value) {
  if (value === null || value === undefined) return false
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (trimmed === '') return false
  return Number.isFinite(Number(trimmed))
}

export function hasValidCoordinatePair(latitude, longitude) {
  return hasValidCoordinate(latitude) && hasValidCoordinate(longitude)
}
