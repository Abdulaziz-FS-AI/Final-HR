'use client'

export interface ErrorReport {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
  sessionId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class ErrorMonitoring {
  private sessionId: string
  private userId?: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandling()
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  private setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || event.reason
      
      // Skip extension errors - they don't affect app functionality
      if (this.isExtensionError(message)) {
        event.preventDefault()
        return
      }

      this.reportError({
        message: `Unhandled Promise Rejection: ${message}`,
        stack: event.reason?.stack,
        severity: 'high'
      })
    })

    // Handle runtime errors
    window.addEventListener('error', (event) => {
      // Skip extension errors
      if (this.isExtensionError(event.message) || event.filename?.includes('extension')) {
        event.preventDefault()
        return false
      }

      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        severity: 'medium'
      })
    })
  }

  private isExtensionError(message: string): boolean {
    if (!message) return false
    
    const extensionErrorPatterns = [
      'Could not establish connection',
      'Receiving end does not exist',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'The message port closed before a response was received'
    ]

    return extensionErrorPatterns.some(pattern => 
      message.toString().includes(pattern)
    )
  }

  reportError(error: Partial<ErrorReport>) {
    const errorReport: ErrorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      severity: error.severity || 'medium'
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Application Error:', errorReport)
    }

    // Send to your monitoring service (replace with your actual service)
    this.sendToMonitoringService(errorReport)
  }

  private async sendToMonitoringService(error: ErrorReport) {
    try {
      // In production, send to your error monitoring service
      // Examples: Sentry, LogRocket, Bugsnag, DataDog, etc.
      
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to your API
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        }).catch(err => {
          // Fallback: store in localStorage for later retry
          this.storeErrorLocally(error)
        })
      }
    } catch (err) {
      // Last resort: store locally
      this.storeErrorLocally(error)
    }
  }

  private storeErrorLocally(error: ErrorReport) {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      storedErrors.push(error)
      
      // Keep only last 50 errors
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50)
      }
      
      localStorage.setItem('app_errors', JSON.stringify(storedErrors))
    } catch (err) {
      // Can't even store locally - silent fail
    }
  }

  // Public method to manually report errors
  logError(message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    this.reportError({ message, severity })
  }

  // Method to get stored errors for debugging
  getStoredErrors(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]')
    } catch {
      return []
    }
  }

  // Clear stored errors
  clearStoredErrors() {
    localStorage.removeItem('app_errors')
  }
}

// Create global instance
export const errorMonitoring = new ErrorMonitoring()

// Export hook for React components
export function useErrorMonitoring() {
  return {
    reportError: (message: string, severity?: 'low' | 'medium' | 'high' | 'critical') => 
      errorMonitoring.logError(message, severity),
    setUserId: (userId: string) => errorMonitoring.setUserId(userId),
    getStoredErrors: () => errorMonitoring.getStoredErrors(),
    clearStoredErrors: () => errorMonitoring.clearStoredErrors()
  }
}