import { AppError } from '@/types'

// Error types and codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',

  // File processing errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  FILE_EXTRACTION_FAILED: 'FILE_EXTRACTION_FAILED',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // AI evaluation errors
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_EVALUATION_FAILED: 'AI_EVALUATION_FAILED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',

  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_VALIDATION_FAILED: 'DB_VALIDATION_FAILED',

  // Role management errors
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  ROLE_CREATION_FAILED: 'ROLE_CREATION_FAILED',

  // General errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// Error messages mapping
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'Authentication required to access this resource',
  AUTH_INVALID: 'Invalid authentication credentials',
  AUTH_EXPIRED: 'Your session has expired. Please log in again',

  FILE_TOO_LARGE: 'File size exceeds the maximum limit (5MB)',
  FILE_INVALID_TYPE: 'Invalid file type. Only PDF files are supported',
  FILE_EXTRACTION_FAILED: 'Failed to extract text from the PDF file',
  FILE_UPLOAD_FAILED: 'Failed to upload file. Please try again',

  AI_SERVICE_UNAVAILABLE: 'AI evaluation service is currently unavailable',
  AI_EVALUATION_FAILED: 'AI evaluation failed. Please try again later',
  AI_QUOTA_EXCEEDED: 'AI evaluation quota exceeded. Please try again later',

  DB_CONNECTION_FAILED: 'Database connection failed. Please try again',
  DB_QUERY_FAILED: 'Database operation failed. Please try again',
  DB_VALIDATION_FAILED: 'Data validation failed. Please check your input',

  ROLE_NOT_FOUND: 'The requested role was not found',
  ROLE_CREATION_FAILED: 'Failed to create role. Please try again',

  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  VALIDATION_ERROR: 'Invalid input data. Please check and try again',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again',
}

// Create standardized error
export function createAppError(
  code: ErrorCode, 
  message?: string, 
  details?: any
): AppError {
  return {
    code,
    message: message || ERROR_MESSAGES[code],
    details,
    timestamp: new Date().toISOString()
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): AppError {
  console.error('API Error:', error)

  // Handle different error types
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return createAppError('NETWORK_ERROR', error.message)
    }
    
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      return createAppError('AUTH_INVALID', error.message)
    }
    
    if (error.message.includes('file size') || error.message.includes('too large')) {
      return createAppError('FILE_TOO_LARGE', error.message)
    }
    
    if (error.message.includes('PDF') || error.message.includes('extraction')) {
      return createAppError('FILE_EXTRACTION_FAILED', error.message)
    }
    
    if (error.message.includes('AI') || error.message.includes('evaluation')) {
      return createAppError('AI_EVALUATION_FAILED', error.message)
    }
    
    if (error.message.includes('database') || error.message.includes('supabase')) {
      return createAppError('DB_QUERY_FAILED', error.message)
    }

    // Generic error
    return createAppError('UNKNOWN_ERROR', error.message)
  }

  // Supabase error handling
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    
    if (supabaseError.code === '23505') {
      return createAppError('DB_VALIDATION_FAILED', 'Duplicate entry found')
    }
    
    if (supabaseError.code === '42501') {
      return createAppError('AUTH_REQUIRED', 'Insufficient permissions')
    }
    
    return createAppError('DB_QUERY_FAILED', supabaseError.message || 'Database operation failed')
  }

  // Default fallback
  return createAppError('UNKNOWN_ERROR', 'An unexpected error occurred')
}

// Client-side error handler
export function handleClientError(error: unknown): AppError {
  console.error('Client Error:', error)

  if (error instanceof Error) {
    return createAppError('UNKNOWN_ERROR', error.message)
  }

  return createAppError('UNKNOWN_ERROR')
}

// Global error logging service
export class ErrorLogger {
  private static instance: ErrorLogger
  
  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  public async logError(
    error: AppError, 
    context: {
      userId?: string
      component?: string
      action?: string
      metadata?: any
    } = {}
  ): Promise<void> {
    const logEntry = {
      ...error,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    }

    // Log to console (always)
    console.error('Error logged:', logEntry)

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      try {
        // TODO: Send to external monitoring service (e.g., Sentry, LogRocket)
        await this.sendToMonitoringService(logEntry)
      } catch (monitoringError) {
        console.error('Failed to send error to monitoring service:', monitoringError)
      }
    }

    // Store in local storage for debugging (development only)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]')
        existingLogs.unshift(logEntry)
        // Keep only last 50 errors
        const limitedLogs = existingLogs.slice(0, 50)
        localStorage.setItem('error_logs', JSON.stringify(limitedLogs))
      } catch (storageError) {
        console.warn('Failed to store error log:', storageError)
      }
    }
  }

  private async sendToMonitoringService(logEntry: any): Promise<void> {
    // Placeholder for monitoring service integration
    // In a real app, this would send to Sentry, LogRocket, or similar
    console.log('Would send to monitoring service:', logEntry)
  }
}

// React hook for error handling
export function useErrorHandler() {
  const errorLogger = ErrorLogger.getInstance()

  const handleError = async (
    error: unknown,
    context?: {
      component?: string
      action?: string
      metadata?: any
    }
  ) => {
    const appError = handleClientError(error)
    await errorLogger.logError(appError, context)
    return appError
  }

  return { handleError }
}

// Utility function to check if error is recoverable
export function isRecoverableError(error: AppError): boolean {
  const recoverableCodes: ErrorCode[] = [
    'NETWORK_ERROR',
    'AI_SERVICE_UNAVAILABLE',
    'DB_CONNECTION_FAILED',
    'FILE_UPLOAD_FAILED'
  ]
  
  return recoverableCodes.includes(error.code as ErrorCode)
}

// Utility function to get user-friendly error message
export function getUserFriendlyMessage(error: AppError): string {
  // Provide more user-friendly messages for common errors
  const friendlyMessages: Partial<Record<ErrorCode, string>> = {
    NETWORK_ERROR: 'Please check your internet connection and try again.',
    AI_SERVICE_UNAVAILABLE: 'Our AI service is temporarily unavailable. Please try again in a few minutes.',
    FILE_TOO_LARGE: 'Your file is too large. Please use a file smaller than 5MB.',
    FILE_INVALID_TYPE: 'Please upload a PDF file only.',
    AUTH_EXPIRED: 'Your session has expired. Please refresh the page and log in again.',
  }

  return friendlyMessages[error.code as ErrorCode] || error.message
}