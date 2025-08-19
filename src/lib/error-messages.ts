// User-friendly error message mapping
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'No user found': 'Please log in to continue',
  'Authentication required': 'Please log in to create roles',
  'User session invalid': 'Your session has expired. Please log in again',
  'No active session': 'Your session has expired. Please log in again',
  'Session expired': 'Your session has expired. Please log in again',
  'User authentication mismatch': 'Authentication error. Please refresh the page and try again',
  
  // Validation errors
  'Form validation failed': 'Please check your form and fix the highlighted errors',
  'Role title is required': 'Please enter a job title',
  'Role description is required': 'Please enter a job description',
  'At least one skill is required': 'Please add at least one required skill',
  
  // Database errors
  'duplicate key value': 'A role with this title already exists',
  'foreign key violation': 'Invalid data reference. Please refresh and try again',
  'check constraint violation': 'Some values are outside allowed limits',
  'not-null constraint': 'Required information is missing',
  
  // Network errors
  'Failed to fetch': 'Connection error. Please check your internet and try again',
  'NetworkError': 'Network connection lost. Please try again',
  'Request timeout': 'The request took too long. Please try again',
  
  // Permission errors
  'permission denied': 'You don\'t have permission to perform this action',
  'row-level security': 'Access denied. Please ensure you\'re logged in',
  
  // Generic errors
  'An unexpected error occurred': 'Something went wrong. Please try again',
  'Unknown error': 'Something went wrong. Please try again'
}

export function getUserFriendlyError(error: any): string {
  // If error is already user-friendly, return it
  if (typeof error === 'string' && error.length < 100) {
    return error
  }
  
  // Check error message
  const errorMessage = error?.message || error?.toString() || ''
  
  // Look for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage
    }
  }
  
  // Check for Supabase specific errors
  if (error?.code) {
    switch (error.code) {
      case '23505': return 'This item already exists'
      case '23503': return 'Related data is missing or invalid'
      case '23514': return 'Some values are invalid'
      case '23502': return 'Required information is missing'
      case '42501': return 'You don\'t have permission for this action'
      case 'PGRST301': return 'Please log in to continue'
      default: break
    }
  }
  
  // Return generic message for unknown errors
  return 'Something went wrong. Please try again or contact support if the problem persists.'
}

export function getFieldError(field: string, error: string): string {
  const fieldLabels: Record<string, string> = {
    'title': 'Job Title',
    'description': 'Job Description',
    'responsibilities': 'Responsibilities',
    'skill_name': 'Skill Name',
    'question_text': 'Question',
    'requirement': 'Requirement'
  }
  
  const label = fieldLabels[field] || field
  
  if (error.includes('required')) {
    return `${label} is required`
  }
  if (error.includes('too short') || error.includes('at least')) {
    const match = error.match(/\d+/)
    return `${label} must be at least ${match?.[0] || '2'} characters`
  }
  if (error.includes('too long') || error.includes('exceed')) {
    const match = error.match(/\d+/)
    return `${label} cannot exceed ${match?.[0] || '500'} characters`
  }
  
  return `${label}: ${error}`
}