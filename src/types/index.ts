import { Tables, TablesInsert, TablesUpdate } from './database-generated'
import { Database } from './database-generated'

// Database table types
export type User = Tables<'users'>
export type Role = Tables<'roles'>
export type RoleSkill = Tables<'role_skills'>
export type RoleQuestion = Tables<'role_questions'>
export type RoleEducationRequirement = Database['public']['Tables']['role_education_requirements']['Row']
export type RoleExperienceRequirement = Database['public']['Tables']['role_experience_requirements']['Row']
export type UploadSession = Tables<'upload_sessions'>
export type FileUpload = Tables<'file_uploads'>
export type EvaluationSession = Tables<'evaluation_sessions'>
export type EvaluationResult = Tables<'evaluation_results'>
export type ProcessingQueue = Tables<'processing_queue'>
export type AnalyticsEvent = Tables<'analytics_events'>

// Insert types
export type UserInsert = TablesInsert<'users'>
export type RoleInsert = TablesInsert<'roles'>
export type RoleSkillInsert = TablesInsert<'role_skills'>
export type RoleQuestionInsert = TablesInsert<'role_questions'>
export type RoleEducationRequirementInsert = Database['public']['Tables']['role_education_requirements']['Insert']
export type RoleExperienceRequirementInsert = Database['public']['Tables']['role_experience_requirements']['Insert']
export type UploadSessionInsert = TablesInsert<'upload_sessions'>
export type FileUploadInsert = TablesInsert<'file_uploads'>
export type EvaluationSessionInsert = TablesInsert<'evaluation_sessions'>
export type EvaluationResultInsert = TablesInsert<'evaluation_results'>

// Update types
export type RoleUpdate = TablesUpdate<'roles'>
export type UserUpdate = TablesUpdate<'users'>

// Extended types with relations
export type RoleWithDetails = Role & {
  skills: RoleSkill[]
  questions: RoleQuestion[]
  education_requirements?: RoleEducationRequirement[]
  experience_requirements?: RoleExperienceRequirement[]
}

export type EvaluationResultWithDetails = EvaluationResult & {
  file: FileUpload | null
  role: Role | null
}

export type UploadSessionWithFiles = UploadSession & {
  files: FileUpload[]
  role: Role
}

// Form types
export interface RoleFormData {
  title: string
  description: string
  responsibilities?: string
  education_requirements: {
    requirement: string
  }[]
  experience_requirements: {
    requirement: string
  }[]
  skills: {
    skill_name: string
    skill_category?: string
    weight: number
    is_required: boolean
  }[]
  questions: {
    question_text: string
    category?: string
    weight: number
  }[]
  bonus_config: SophisticatedBonusConfig
  penalty_config: SophisticatedPenaltyConfig
}

// Sophisticated Bonus/Penalty Configuration Types
export interface SophisticatedBonusConfig {
  // Preferred Education
  preferredEducation: {
    enabled: boolean
    specificUniversities: string[]
    categories: {
      topLeague: boolean // Ivy League/Oxbridge
      top100Global: boolean
      top50Global: boolean
      regionalTop: boolean
    }
  }
  
  // Preferred Company Experience  
  preferredCompanies: {
    enabled: boolean
    specificCompanies: string[]
    categories: {
      faangTech: boolean // FAANG/Top Tech
      fortune500: boolean
      unicorns: boolean // $1B+ startups
      industryLeaders: boolean
      directCompetitors: boolean
    }
  }
  
  // Related Project Experience
  relatedProjects: {
    enabled: boolean
    idealProjectDescription: string
    maxProjects: number // up to 5
  }
  
  // Valuable Certifications
  valuableCertifications: {
    enabled: boolean
    certifications: string[]
    maxCertifications: number // up to 15
  }
}

export interface SophisticatedPenaltyConfig {
  // Job Stability Check
  jobStabilityCheck: {
    enabled: boolean
    jobHoppingConcern: 'lenient' | 'moderate' | 'strict'
    jobHoppingThresholds: {
      lenient: string // >50% short tenures
      moderate: string // >30% short tenures  
      strict: string // >20% short tenures
    }
  }
  
  // Employment Gap Check
  employmentGapCheck: {
    enabled: boolean
    gapThreshold: '6months' | '1year' | '2years'
    gapPenalty: number
  }
}

// File upload types
export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  result?: EvaluationResult
}

export interface UploadOptions {
  roleId: string
  sessionName?: string
  priority?: 'low' | 'normal' | 'high'
}

// AI evaluation types
export interface AIEvaluationRequest {
  roleId: string
  fileId: string
  resumeText: string
  contactInfo?: {
    name?: string
    email?: string
    phone?: string
  }
}

export interface AIEvaluationResponse {
  candidate_name: string
  overall_score: number
  skills_score: number
  questions_score: number
  bonus_points: number
  penalty_points: number
  bonus_breakdown?: {
    education_bonus?: number
    company_bonus?: number
    projects_bonus?: number
    certifications_bonus?: number
  }
  penalty_breakdown?: {
    job_stability_penalty?: number
    employment_gap_penalty?: number
  }
  skills_analysis: {
    skill_name: string
    found: boolean
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
    evidence?: string
  }[]
  questions_analysis: {
    question: string
    answer: 'YES' | 'NO' | 'PARTIAL'
    quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
    evidence?: string
  }[]
  recommendations: string[]
  red_flags: string[]
  analysis_summary: string
  ai_confidence: number
}

// Analytics types
export interface RoleAnalytics {
  roleId: string
  roleTitle: string
  totalEvaluated: number
  averageScore: number
  qualificationRate: number
  skillsAnalysis: {
    [skillName: string]: {
      availability: number
      averageProficiency: number
      isBottleneck: boolean
    }
  }
  questionsAnalysis: {
    [questionText: string]: {
      positiveRate: number
      averageQuality: number
    }
  }
  topCandidates: EvaluationResult[]
  timeToFill?: number
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  activeTab: string
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  avatarUrl?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: AppError
  success: boolean
}

// Pagination types
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}