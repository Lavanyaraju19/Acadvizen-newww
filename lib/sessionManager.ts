'use client'

import { supabase } from './supabaseClient'

type SessionState = {
  initialized: boolean
  lastRefresh: number
  lastRefreshAttempt: number
  refreshAttempts: number
  isRefreshing: boolean
  lastError: string | null
  reconnecting: boolean
}

export type SessionEvent = 'expiring' | 'expired' | 'recovered' | 'refreshed' | 'reconnecting'

type SessionListener = (event: SessionEvent) => void

export type SessionStatus = {
  valid: boolean
  expiresIn: number | null
  hasRefreshToken: boolean
  needsRefresh: boolean
  reconnecting: boolean
  lastError: string | null
}

class SessionManager {
  private static instance: SessionManager
  private state: SessionState = {
    initialized: false,
    lastRefresh: 0,
    lastRefreshAttempt: 0,
    refreshAttempts: 0,
    isRefreshing: false,
    lastError: null,
    reconnecting: false,
  }
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private refreshPromise: Promise<boolean> | null = null
  private authSubscription: { unsubscribe: () => void } | null = null
  private listeners: Set<SessionListener> = new Set()
  private readonly HEARTBEAT_MS = 120_000
  private readonly MAX_REFRESH_RETRIES = 4
  private readonly RETRY_BACKOFF_BASE_MS = 1_000
  private readonly REFRESH_COOLDOWN_MS = 10_000
  private readonly REFRESH_WINDOW_SECONDS = 300

  private constructor() {
    if (typeof window === 'undefined') return
    this.init()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(event: SessionEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch {
        // Ignore listener errors.
      }
    })
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void this.refreshIfNeeded()
    }
  }

  private handleFocus = () => {
    void this.refreshIfNeeded()
  }

  private handleOnline = () => {
    this.state.reconnecting = false
    void this.refreshIfNeeded(true)
  }

  private handleOffline = () => {
    this.state.reconnecting = true
    this.notify('reconnecting')
  }

  private init() {
    if (this.state.initialized) return
    if (!supabase?.auth) return

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        this.startHeartbeat()
      }

      if (event === 'TOKEN_REFRESHED') {
        this.markRefreshSuccess()
        this.notify('refreshed')
      }

      if (event === 'SIGNED_OUT') {
        this.state.reconnecting = false
        this.stopHeartbeat()
      }
    })

    this.authSubscription = data?.subscription || null
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('focus', this.handleFocus)
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    this.state.initialized = true
    this.startHeartbeat()
    void this.refreshIfNeeded()
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return
    this.heartbeatInterval = setInterval(() => {
      void this.refreshIfNeeded()
    }, this.HEARTBEAT_MS)
  }

  private stopHeartbeat() {
    if (!this.heartbeatInterval) return
    clearInterval(this.heartbeatInterval)
    this.heartbeatInterval = null
  }

  private markRefreshSuccess() {
    this.state.lastRefresh = Date.now()
    this.state.refreshAttempts = 0
    this.state.lastError = null
    this.state.reconnecting = false
    this.state.isRefreshing = false
  }

  private setTransientError(error: unknown) {
    this.state.lastError = error instanceof Error ? error.message : String(error || 'Unable to refresh session.')
    this.state.reconnecting = true
    this.notify('reconnecting')
  }

  private isOnline(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine !== false
  }

  private jitter(ms: number): number {
    return ms + Math.floor(Math.random() * ms * 0.3)
  }

  private getBackoffDelay(attempt: number): number {
    const base = this.RETRY_BACKOFF_BASE_MS * Math.pow(2, Math.max(0, attempt - 1))
    return Math.min(this.jitter(base), 30_000)
  }

  private isTransientError(error: unknown): boolean {
    if (!error) return false
    if (error instanceof Error && error.name === 'AbortError') return true
    const message = String(error instanceof Error ? error.message : error).toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('econnrefused') ||
      message.includes('etimedout') ||
      message.includes('enotfound') ||
      message.includes('abort') ||
      message.includes('signal') ||
      message.includes('temporarily unavailable')
    )
  }

  private async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getSessionState(): Promise<{
    valid: boolean
    expiresIn: number | null
    hasRefreshToken: boolean
    needsRefresh: boolean
  }> {
    if (!supabase?.auth) {
      return { valid: false, expiresIn: null, hasRefreshToken: false, needsRefresh: false }
    }

    try {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      if (!session) {
        return { valid: false, expiresIn: null, hasRefreshToken: false, needsRefresh: false }
      }

      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      const expiresIn = expiresAt - now
      const hasRefreshToken = !!session.refresh_token

      return {
        valid: expiresIn > 0,
        expiresIn,
        hasRefreshToken,
        needsRefresh: expiresIn <= this.REFRESH_WINDOW_SECONDS,
      }
    } catch (error) {
      this.setTransientError(error)
      return { valid: false, expiresIn: null, hasRefreshToken: false, needsRefresh: false }
    }
  }

  getSessionStatus(): SessionStatus {
    return {
      valid: !this.state.lastError && !this.state.reconnecting,
      expiresIn: null,
      hasRefreshToken: false,
      needsRefresh: false,
      reconnecting: this.state.reconnecting,
      lastError: this.state.lastError,
    }
  }

  async refreshIfNeeded(force = false): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = this.runRefreshIfNeeded(force).finally(() => {
      this.refreshPromise = null
    })

    return this.refreshPromise
  }

  private async runRefreshIfNeeded(force: boolean): Promise<boolean> {
    if (!supabase?.auth) return false

    const sessionState = await this.getSessionState()
    if (!sessionState.needsRefresh && sessionState.valid) {
      this.state.refreshAttempts = 0
      this.state.lastError = null
      this.state.reconnecting = false
      return true
    }

    if (sessionState.valid && !sessionState.hasRefreshToken) {
      return true
    }

    if (!sessionState.hasRefreshToken) {
      if (this.state.reconnecting && this.state.lastError) {
        return false
      }
      this.notify('expired')
      return false
    }

    if (!this.isOnline()) {
      this.state.reconnecting = true
      this.notify('reconnecting')
      return false
    }

    const now = Date.now()
    const inCooldown = now - this.state.lastRefreshAttempt < this.REFRESH_COOLDOWN_MS
    if (!force && inCooldown) {
      return sessionState.valid
    }

    this.state.isRefreshing = true
    this.state.reconnecting = true
    this.notify(sessionState.expiresIn !== null && sessionState.expiresIn <= this.REFRESH_WINDOW_SECONDS ? 'expiring' : 'reconnecting')

    try {
      for (let attempt = 1; attempt <= this.MAX_REFRESH_RETRIES; attempt += 1) {
        this.state.lastRefreshAttempt = Date.now()
        this.state.refreshAttempts = attempt

        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data?.session) {
          this.markRefreshSuccess()
          this.notify('recovered')
          return true
        }

        const refreshError = error || new Error('Unable to refresh session.')
        this.state.lastError = refreshError.message

        if (!this.isTransientError(refreshError)) {
          this.state.reconnecting = false
          this.state.isRefreshing = false
          this.notify('expired')
          return false
        }

        if (attempt < this.MAX_REFRESH_RETRIES) {
          await this.delay(this.getBackoffDelay(attempt))
        }
      }

      this.state.reconnecting = true
      this.notify('reconnecting')
      return false
    } catch (error) {
      this.setTransientError(error)
      return false
    } finally {
      this.state.isRefreshing = false
    }
  }

  getLastError(): string | null {
    return this.state.lastError
  }

  isReconnecting(): boolean {
    return this.state.reconnecting
  }

  destroy() {
    this.stopHeartbeat()
    this.authSubscription?.unsubscribe()
    this.authSubscription = null
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
      window.removeEventListener('focus', this.handleFocus)
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    this.listeners.clear()
    this.refreshPromise = null
    this.state.initialized = false
    this.state.reconnecting = false
    this.state.isRefreshing = false
  }
}

export const sessionManager = SessionManager.getInstance()
export type { SessionListener }
