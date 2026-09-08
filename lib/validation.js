/**
 * Comprehensive validation utilities for CMS entities
 */

// Field length validations based on database schema
export const FIELD_LENGTHS = {
  title: { min: 3, max: 200 },
  slug: { min: 3, max: 100 },
  description: { max: 5000 },
  seo_title: { max: 60 },
  seo_description: { max: 160 },
  url: { max: 500 },
  email: { max: 255 },
  phone: { max: 20 },
  city_name: { max: 100 },
  meta_keywords: { max: 500 },
  canonical_url: { max: 500 },
}

/**
 * Validate field length
 */
export function validateFieldLength(fieldName, value) {
  const limits = FIELD_LENGTHS[fieldName]
  if (!limits) return { valid: true }

  const strValue = String(value || '')
  
  if (limits.min && strValue.length < limits.min) {
    return { 
      valid: false, 
      error: `${fieldName} must be at least ${limits.min} characters` 
    }
  }

  if (limits.max && strValue.length > limits.max) {
    return { 
      valid: false, 
      error: `${fieldName} must be less than ${limits.max} characters` 
    }
  }

  return { valid: true }
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email) return { valid: true } // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  
  return { valid: true }
}

/**
 * Validate phone format
 */
export function validatePhone(phone) {
  if (!phone) return { valid: true } // Optional field
  
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Invalid phone format' }
  }
  
  return { valid: true }
}

/**
 * Validate URL format
 */
export function validateURL(url) {
  if (!url) return { valid: true } // Optional field
  
  try {
    new URL(url)
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = []
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field)
    }
  }
  
  if (missing.length > 0) {
    return { 
      valid: false, 
      error: `Missing required fields: ${missing.join(', ')}` 
    }
  }
  
  return { valid: true }
}

/**
 * Latitude/longitude are optional, but if present must be real, in-range numbers - not the
 * `Number(null) === 0` trap that silently turns a blank field into a valid "0,0" coordinate.
 * A non-coder admin only ever sees "Latitude"/"Longitude" text inputs, so this is the one place
 * that stands between a stray space or a copy-pasted degree symbol and a broken map embed.
 */
export function validateCoordinate(value, { min, max, label }) {
  if (value === null || value === undefined) return { valid: true }
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (trimmed === '') return { valid: true }
  const num = Number(trimmed)
  if (!Number.isFinite(num)) {
    return { valid: false, error: `${label} must be a valid number.` }
  }
  if (num < min || num > max) {
    return { valid: false, error: `${label} must be between ${min} and ${max}.` }
  }
  return { valid: true }
}

/**
 * Comprehensive entity validation
 */
export function validateEntity(entityType, data) {
  const errors = []

  if (entityType === 'locations') {
    const latValidation = validateCoordinate(data.latitude, { min: -90, max: 90, label: 'Latitude' })
    if (!latValidation.valid) errors.push(latValidation.error)

    const lngValidation = validateCoordinate(data.longitude, { min: -180, max: 180, label: 'Longitude' })
    if (!lngValidation.valid) errors.push(lngValidation.error)

    const hasLat = data.latitude !== null && data.latitude !== undefined && String(data.latitude).trim() !== ''
    const hasLng = data.longitude !== null && data.longitude !== undefined && String(data.longitude).trim() !== ''
    if (hasLat !== hasLng) {
      errors.push('Enter both Latitude and Longitude, or leave both blank.')
    }
  }


  const requiredFieldsByType = {
    pages: ['title', 'slug'],
    blogs: ['title', 'slug'],
    cities: ['name', 'slug'],
    courses: ['title', 'slug'],
    forms: ['name'],
    banners: ['title'],
    popups: ['title'],
    course_projects: ['course_id', 'title'],
    course_gallery: ['course_id', 'image_url'],
  }
  
  // Check required fields
  const requiredFields = requiredFieldsByType[entityType]
  if (requiredFields) {
    const requiredValidation = validateRequiredFields(data, requiredFields)
    if (!requiredValidation.valid) {
      errors.push(requiredValidation.error)
    }
  }
  
  // Validate field lengths
  if (data.title) {
    const titleValidation = validateFieldLength('title', data.title)
    if (!titleValidation.valid) errors.push(titleValidation.error)
  }
  
  if (data.slug) {
    const slugValidation = validateFieldLength('slug', data.slug)
    if (!slugValidation.valid) errors.push(slugValidation.error)
  }
  
  if (data.seo_title) {
    const seoTitleValidation = validateFieldLength('seo_title', data.seo_title)
    if (!seoTitleValidation.valid) errors.push(seoTitleValidation.error)
  }
  
  if (data.seo_description) {
    const seoDescValidation = validateFieldLength('seo_description', data.seo_description)
    if (!seoDescValidation.valid) errors.push(seoDescValidation.error)
  }
  
  // Validate email if present
  if (data.email) {
    const emailValidation = validateEmail(data.email)
    if (!emailValidation.valid) errors.push(emailValidation.error)
  }
  
  // Validate phone if present
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone)
    if (!phoneValidation.valid) errors.push(phoneValidation.error)
  }
  
  // Validate URLs if present
  if (data.url) {
    const urlValidation = validateURL(data.url)
    if (!urlValidation.valid) errors.push(urlValidation.error)
  }
  
  if (data.canonical_url) {
    const canonicalValidation = validateURL(data.canonical_url)
    if (!canonicalValidation.valid) errors.push(canonicalValidation.error)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}