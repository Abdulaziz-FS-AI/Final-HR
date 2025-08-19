// Retry utility for handling transient failures

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  maxDelayMs?: number
  shouldRetry?: (error: any, attempt: number) => boolean
  onRetry?: (error: any, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  shouldRetry: (error) => {
    // Retry on network errors and specific database errors
    const message = error?.message?.toLowerCase() || ''
    const code = error?.code
    
    // Don't retry on validation or permission errors
    if (message.includes('validation') || 
        message.includes('permission') ||
        message.includes('unauthorized') ||
        code === '42501' || // Permission denied
        code === '23505' || // Duplicate key
        code === '23514' || // Check constraint violation
        code === '23502') { // Not null violation
      return false
    }
    
    // Retry on network and timeout errors
    if (message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND') {
      return true
    }
    
    // Retry on temporary database errors
    if (message.includes('deadlock') ||
        message.includes('could not serialize') ||
        message.includes('connection reset') ||
        code === '40001' || // Serialization failure
        code === '40P01' || // Deadlock detected
        code === '57P03' || // Cannot connect now
        code === '08006' || // Connection failure
        code === '08001') { // Unable to establish connection
      return true
    }
    
    // Don't retry by default
    return false
  },
  onRetry: (error, attempt) => {
    console.log(`Retry attempt ${attempt} after error:`, error.message)
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any
  let delay = opts.delayMs
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Try the operation
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
        throw error
      }
      
      // Call retry callback
      opts.onRetry(error, attempt)
      
      // Wait before retrying (with exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Increase delay for next attempt
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs)
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError
}

// Specific retry wrapper for database operations
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3,
    delayMs: 500,
    onRetry: (error, attempt) => {
      console.log(`Retrying ${operationName} (attempt ${attempt}/3) after error:`, error.message)
    }
  })
}

// Specific retry wrapper for network operations
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'network operation'
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 5,
    delayMs: 1000,
    backoffMultiplier: 1.5,
    maxDelayMs: 5000,
    onRetry: (error, attempt) => {
      console.log(`Retrying ${operationName} (attempt ${attempt}/5) after network error:`, error.message)
    }
  })
}