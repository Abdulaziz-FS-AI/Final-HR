'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from './button'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAll = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const getToastStyles = (type: ToastType) => {
    const baseStyles = 'border-l-4 bg-white shadow-lg rounded-lg transform transition-all duration-300 ease-in-out'
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`
    }

    const typeStyles = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500',
    }

    return `${baseStyles} translate-x-0 opacity-100 ${typeStyles[type]}`
  }

  const getIcon = (type: ToastType) => {
    const iconProps = { className: 'h-5 w-5' }
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle {...iconProps} className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info {...iconProps} className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className={getToastStyles(toast.type)}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {getIcon(toast.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {toast.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {toast.message}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-2 p-1 h-auto text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {toast.action && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toast.action.onClick}
                  className="text-xs"
                >
                  {toast.action.label}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast()
  
  return (title: string, message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'success',
      title,
      message,
      ...options
    })
  }
}

export function useErrorToast() {
  const { addToast } = useToast()
  
  return (title: string, message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'error',
      title,
      message,
      duration: 8000, // Error toasts stay longer
      ...options
    })
  }
}

export function useWarningToast() {
  const { addToast } = useToast()
  
  return (title: string, message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'warning',
      title,
      message,
      ...options
    })
  }
}

export function useInfoToast() {
  const { addToast } = useToast()
  
  return (title: string, message: string, options?: Partial<Toast>) => {
    addToast({
      type: 'info',
      title,
      message,
      ...options
    })
  }
}