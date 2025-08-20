// Performance monitoring utility for optimization
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Start a performance measurement
  public startMeasurement(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration)
    }
  }

  // Record a metric value
  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  // Get performance statistics for a metric
  public getStats(name: string): {
    count: number
    average: number
    min: number
    max: number
    latest: number
  } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) {
      return null
    }

    return {
      count: values.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    }
  }

  // Get all metrics
  public getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name)
    }
    
    return stats
  }

  // Log performance report
  public logReport(): void {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Performance Report')
      
      const stats = this.getAllStats()
      
      for (const [name, stat] of Object.entries(stats)) {
        if (stat) {
          console.log(`📊 ${name}:`, {
            average: `${stat.average.toFixed(2)}ms`,
            latest: `${stat.latest.toFixed(2)}ms`,
            min: `${stat.min.toFixed(2)}ms`,
            max: `${stat.max.toFixed(2)}ms`,
            samples: stat.count
          })
        }
      }
      
      console.groupEnd()
    }
  }

  // Monitor API calls
  public wrapApiCall<T>(
    name: string, 
    apiCall: () => Promise<T>
  ): Promise<T> {
    const endMeasurement = this.startMeasurement(`api.${name}`)
    
    return apiCall()
      .then(result => {
        endMeasurement()
        return result
      })
      .catch(error => {
        endMeasurement()
        this.recordMetric(`api.${name}.errors`, 1)
        throw error
      })
  }

  // Monitor React component render times
  public useRenderMonitor(componentName: string): void {
    if (process.env.NODE_ENV === 'development') {
      const endMeasurement = this.startMeasurement(`render.${componentName}`)
      
      // Use useEffect to measure render completion
      setTimeout(() => {
        endMeasurement()
      }, 0)
    }
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  // Monitor component render time
  monitor.useRenderMonitor(componentName)

  // Provide helper functions
  return {
    startMeasurement: (name: string) => monitor.startMeasurement(name),
    recordMetric: (name: string, value: number) => monitor.recordMetric(name, value),
    wrapApiCall: <T>(name: string, apiCall: () => Promise<T>) => 
      monitor.wrapApiCall(name, apiCall),
    getStats: (name: string) => monitor.getStats(name),
    logReport: () => monitor.logReport()
  }
}

// Decorator for measuring function execution time
export function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
  const monitor = PerformanceMonitor.getInstance()

  descriptor.value = async function (...args: any[]) {
    const endMeasurement = monitor.startMeasurement(`method.${target.constructor.name}.${propertyKey}`)
    
    try {
      const result = await originalMethod.apply(this, args)
      endMeasurement()
      return result
    } catch (error) {
      endMeasurement()
      monitor.recordMetric(`method.${target.constructor.name}.${propertyKey}.errors`, 1)
      throw error
    }
  }

  return descriptor
}

// Auto performance logger that runs periodically
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const monitor = PerformanceMonitor.getInstance()
  
  // Log performance report every 30 seconds in development
  setInterval(() => {
    monitor.logReport()
  }, 30000)
}