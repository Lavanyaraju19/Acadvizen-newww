// Autosave utility for CMS content
const AUTOSAVE_INTERVAL = 30000 // 30 seconds
const AUTOSAVE_KEY_PREFIX = 'acadvizen-autosave-'

export function getAutosaveKey(entityType, entityId) {
  return `${AUTOSAVE_KEY_PREFIX}${entityType}-${entityId}`
}

export function saveAutosave(entityType, entityId, data) {
  if (typeof window === 'undefined') return false
  try {
    const key = getAutosaveKey(entityType, entityId)
    const payload = {
      data,
      savedAt: new Date().toISOString(),
      entityType,
      entityId,
    }
    localStorage.setItem(key, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('Autosave failed:', error)
    return false
  }
}

export function loadAutosave(entityType, entityId) {
  if (typeof window === 'undefined') return null
  try {
    const key = getAutosaveKey(entityType, entityId)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Check if autosave is less than 24 hours old
    const savedAt = new Date(parsed.savedAt)
    const now = new Date()
    const hoursDiff = (now - savedAt) / (1000 * 60 * 60)
    if (hoursDiff > 24) {
      localStorage.removeItem(key)
      return null
    }
    return parsed
  } catch (error) {
    console.error('Failed to load autosave:', error)
    return null
  }
}

export function clearAutosave(entityType, entityId) {
  if (typeof window === 'undefined') return
  try {
    const key = getAutosaveKey(entityType, entityId)
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear autosave:', error)
  }
}

export function getAllAutosaves() {
  if (typeof window === 'undefined') return []
  try {
    const keys = Object.keys(localStorage)
    const autosaves = []
    keys.forEach(key => {
      if (key.startsWith(AUTOSAVE_KEY_PREFIX)) {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            autosaves.push(parsed)
          }
        } catch (error) {
          // Skip invalid entries
        }
      }
    })
    return autosaves.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
  } catch (error) {
    console.error('Failed to get all autosaves:', error)
    return []
  }
}

export function clearAllAutosaves() {
  if (typeof window === 'undefined') return
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(AUTOSAVE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Failed to clear all autosaves:', error)
  }
}

export function useAutosave(entityType, entityId, data, deps = []) {
  useEffect(() => {
    if (!entityId) return
    
    const interval = setInterval(() => {
      saveAutosave(entityType, entityId, data)
    }, AUTOSAVE_INTERVAL)
    
    return () => clearInterval(interval)
  }, [entityType, entityId, data, ...deps])
}