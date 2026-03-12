import { subscribeToTable } from '../../lib/realtime'

// Example usage for tools_extended table
export function listenToToolsExtended(callback) {
  return subscribeToTable('tools_extended', callback)
}

// Usage: Call listenToToolsExtended((payload) => { ... }) in your component
