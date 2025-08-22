import { 
  RoleFormData, 
  RoleInsert, 
  RoleSkillInsert, 
  RoleQuestionInsert,
  RoleEducationRequirementInsert,
  RoleExperienceRequirementInsert
} from '@/types'

export interface TransformedRoleData {
  roleData: RoleInsert
  skillsData: Omit<RoleSkillInsert, 'role_id'>[]
  questionsData: Omit<RoleQuestionInsert, 'role_id'>[]
  educationData: Omit<RoleEducationRequirementInsert, 'role_id'>[]
  experienceData: Omit<RoleExperienceRequirementInsert, 'role_id'>[]
}

export interface RoleCreationSummary {
  hasEducationRequirements: boolean
  hasExperienceRequirements: boolean
  skillsCount: number
  requiredSkillsCount: number
  questionsCount: number
  estimatedProcessingComplexity: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Transform form data into database-ready format with proper handling of all dynamic scenarios
 */
export function transformRoleFormData(
  formData: RoleFormData, 
  userId: string
): TransformedRoleData {
  
  // ===== MAIN ROLE TRANSFORMATION =====
  const roleData: RoleInsert = {
    user_id: userId,
    title: formData.title.trim(),
    description: formData.description.trim(),
    responsibilities: formData.responsibilities?.trim() || null,
    
    // REMOVED education_requirements and experience_requirements - they go in separate tables
    
    // Optimize bonus/penalty configurations for Brave browser compatibility
    // Compress large config objects to reduce payload size
    bonus_config: compressBonusConfig(formData.bonus_config),
    penalty_config: compressPenaltyConfig(formData.penalty_config),
    
    // DATABASE WILL HANDLE TIMESTAMPS AUTOMATICALLY
    is_active: true
  }

  // ===== SKILLS TRANSFORMATION =====
  // Skills are OPTIONAL - transform only if they exist
  const skillsData: Omit<RoleSkillInsert, 'role_id'>[] = formData.skills.map(skill => ({
    // role_id will be set after role creation
    skill_name: skill.skill_name.trim(),
    skill_category: skill.skill_category?.trim() || null,
    weight: skill.weight,
    is_required: skill.is_required
  }))

  // ===== QUESTIONS TRANSFORMATION =====
  // Questions are OPTIONAL - transform only if they exist
  const questionsData: Omit<RoleQuestionInsert, 'role_id'>[] = formData.questions.map(question => ({
    // role_id will be set after question creation
    question_text: question.question_text.trim(),
    question_category: question.category?.trim() || null,
    weight: question.weight
  }))

  // ===== EDUCATION REQUIREMENTS TRANSFORMATION =====
  // For separate role_education_requirements table
  const educationData = formData.education_requirements.map((req, index) => ({
    // role_id will be set after role creation
    requirement: req.requirement.trim(),
    is_required: true,
    display_order: index + 1
  }))

  // ===== EXPERIENCE REQUIREMENTS TRANSFORMATION =====
  // For separate role_experience_requirements table
  const experienceData = formData.experience_requirements.map((req, index) => ({
    // role_id will be set after role creation
    requirement: req.requirement.trim(),
    minimum_years: 0, // Can be enhanced to extract from requirement text
    is_required: true,
    display_order: index + 1
  }))

  return {
    roleData,
    skillsData,
    questionsData,
    educationData,
    experienceData
  }
}

/**
 * Generate role creation summary for logging and user feedback
 */
export function generateRoleCreationSummary(
  formData: RoleFormData
): RoleCreationSummary {
  
  const hasEducationRequirements = formData.education_requirements.length > 0
  const hasExperienceRequirements = formData.experience_requirements.length > 0
  const skillsCount = formData.skills.length
  const requiredSkillsCount = formData.skills.filter(s => s.is_required).length
  const questionsCount = formData.questions.length
  
  // Calculate processing complexity for AI evaluation
  let complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  
  const complexityScore = 
    (hasEducationRequirements ? 1 : 0) +
    (hasExperienceRequirements ? 1 : 0) +
    Math.min(skillsCount / 5, 2) + // Max 2 points for skills
    Math.min(questionsCount / 3, 2) + // Max 2 points for questions
    (requiredSkillsCount > 3 ? 1 : 0) // Bonus for many required skills
  
  if (complexityScore >= 5) complexity = 'HIGH'
  else if (complexityScore >= 3) complexity = 'MEDIUM'
  
  return {
    hasEducationRequirements,
    hasExperienceRequirements,
    skillsCount,
    requiredSkillsCount,
    questionsCount,
    estimatedProcessingComplexity: complexity
  }
}

/**
 * Generate AI evaluation prompt based on role configuration
 */
export function generateEvaluationPrompt(
  roleData: RoleInsert,
  skills: Omit<RoleSkillInsert, 'role_id'>[],
  questions: Omit<RoleQuestionInsert, 'role_id'>[],
  education?: Omit<RoleEducationRequirementInsert, 'role_id'>[],
  experience?: Omit<RoleExperienceRequirementInsert, 'role_id'>[]
): string {
  
  const promptParts: string[] = []
  
  // Role overview
  promptParts.push(`Role: ${roleData.title}`)
  promptParts.push(`Description: ${roleData.description}`)
  
  if (roleData.responsibilities) {
    promptParts.push(`Key Responsibilities: ${roleData.responsibilities}`)
  }
  
  // Education requirements (all are required by default)
  if (education && education.length > 0) {
    promptParts.push(`\nEducation Requirements (Required):`)
    education.forEach((edu, index) => {
      promptParts.push(`${index + 1}. ${edu.requirement}`)
    })
  }
  
  // Experience requirements (all are required by default)
  if (experience && experience.length > 0) {
    promptParts.push(`\nExperience Requirements (Required):`)
    experience.forEach((exp, index) => {
      const years = exp.minimum_years ? ` (${exp.minimum_years}+ years)` : ''
      promptParts.push(`${index + 1}. ${exp.requirement}${years}`)
    })
  }
  
  // Skills (if any)
  if (skills.length > 0) {
    promptParts.push(`\nRequired Skills:`)
    const requiredSkills = skills.filter(s => s.is_required)
    const optionalSkills = skills.filter(s => !s.is_required)
    
    if (requiredSkills.length > 0) {
      promptParts.push(`Must Have: ${requiredSkills.map(s => 
        `${s.skill_name} (weight: ${s.weight}${s.skill_category ? `, category: ${s.skill_category}` : ''})`
      ).join(', ')}`)
    }
    
    if (optionalSkills.length > 0) {
      promptParts.push(`Nice to Have: ${optionalSkills.map(s => 
        `${s.skill_name} (weight: ${s.weight}${s.skill_category ? `, category: ${s.skill_category}` : ''})`
      ).join(', ')}`)
    }
  }
  
  // Questions (if any)
  if (questions.length > 0) {
    promptParts.push(`\nCustom Evaluation Questions:`)
    questions.forEach((q, index) => {
      promptParts.push(`${index + 1}. ${q.question_text} (weight: ${q.weight})`)
    })
  }
  
  return promptParts.join('\n')
}

/**
 * Validate transformed data before database insertion
 */
export function validateTransformedData(data: TransformedRoleData): string[] {
  const errors: string[] = []
  
  // Validate role data
  if (!data.roleData.user_id) errors.push('User ID is required')
  if (!data.roleData.title?.trim()) errors.push('Role title is required')
  if (!data.roleData.description?.trim()) errors.push('Role description is required')
  
  // Validate skills data
  data.skillsData.forEach((skill, index) => {
    if (!skill.skill_name?.trim()) {
      errors.push(`Skill ${index + 1}: Name is required`)
    }
    if (skill.weight < 1 || skill.weight > 10) {
      errors.push(`Skill ${index + 1}: Weight must be between 1 and 10`)
    }
  })
  
  // Validate questions data
  data.questionsData.forEach((question, index) => {
    if (!question.question_text?.trim()) {
      errors.push(`Question ${index + 1}: Text is required`)
    }
    if (question.weight < 1 || question.weight > 10) {
      errors.push(`Question ${index + 1}: Weight must be between 1 and 10`)
    }
  })
  
  // Validate education requirements data
  data.educationData.forEach((edu, index) => {
    if (!edu.requirement?.trim()) {
      errors.push(`Education requirement ${index + 1}: Text is required`)
    }
  })
  
  // Validate experience requirements data
  data.experienceData.forEach((exp, index) => {
    if (!exp.requirement?.trim()) {
      errors.push(`Experience requirement ${index + 1}: Text is required`)
    }
  })
  
  return errors
}

/**
 * Create user-friendly creation summary
 */
export function createUserSummary(
  summary: RoleCreationSummary,
  roleTitle: string
): string {
  const parts: string[] = []
  
  parts.push(`✅ Role "${roleTitle}" created successfully`)
  
  if (summary.hasEducationRequirements) {
    parts.push(`📚 Education requirements defined`)
  }
  
  if (summary.hasExperienceRequirements) {
    parts.push(`💼 Experience requirements defined`)
  }
  
  if (summary.skillsCount > 0) {
    parts.push(`🎯 ${summary.skillsCount} skills configured (${summary.requiredSkillsCount} required)`)
  }
  
  if (summary.questionsCount > 0) {
    parts.push(`❓ ${summary.questionsCount} custom questions added`)
  }
  
  parts.push(`🤖 Processing complexity: ${summary.estimatedProcessingComplexity}`)
  
  return parts.join('\n')
}

/**
 * Compress bonus configuration to reduce payload size for Brave browser compatibility
 */
function compressBonusConfig(bonusConfig: any): any {
  if (!bonusConfig) return null
  
  // Create a lightweight version that preserves functionality but reduces size
  const compressed: any = {}
  
  // Preferred Education - compress university lists
  if (bonusConfig.preferredEducation?.enabled) {
    compressed.education = {
      enabled: true,
      universities: bonusConfig.preferredEducation.specificUniversities?.slice(0, 10) || [], // Limit to 10
      categories: {
        topLeague: bonusConfig.preferredEducation.categories?.topLeague || false,
        top50: bonusConfig.preferredEducation.categories?.top50Global || false,
        top100: bonusConfig.preferredEducation.categories?.top100Global || false,
        regional: bonusConfig.preferredEducation.categories?.regionalTop || false
      }
    }
  }
  
  // Preferred Companies - compress company lists
  if (bonusConfig.preferredCompanies?.enabled) {
    compressed.companies = {
      enabled: true,
      list: bonusConfig.preferredCompanies.specificCompanies?.slice(0, 20) || [], // Limit to 20
      categories: {
        faang: bonusConfig.preferredCompanies.categories?.faangTech || false,
        unicorns: bonusConfig.preferredCompanies.categories?.unicorns || false,
        fortune500: bonusConfig.preferredCompanies.categories?.fortune500 || false,
        industry: bonusConfig.preferredCompanies.categories?.industryLeaders || false,
        competitors: bonusConfig.preferredCompanies.categories?.directCompetitors || false
      }
    }
  }
  
  // Related Projects - keep description but limit size
  if (bonusConfig.relatedProjects?.enabled) {
    compressed.projects = {
      enabled: true,
      description: bonusConfig.relatedProjects.idealProjectDescription?.substring(0, 500) || '', // Limit to 500 chars
      maxProjects: bonusConfig.relatedProjects.maxProjects || 5
    }
  }
  
  // Valuable Certifications - compress certification lists
  if (bonusConfig.valuableCertifications?.enabled) {
    compressed.certifications = {
      enabled: true,
      list: bonusConfig.valuableCertifications.certifications?.slice(0, 15) || [], // Limit to 15
      maxCerts: bonusConfig.valuableCertifications.maxCertifications || 15
    }
  }
  
  return Object.keys(compressed).length > 0 ? compressed : null
}

/**
 * Compress penalty configuration to reduce payload size for Brave browser compatibility
 */
function compressPenaltyConfig(penaltyConfig: any): any {
  if (!penaltyConfig) return null
  
  const compressed: any = {}
  
  // Job Stability Check - keep only essential data
  if (penaltyConfig.jobStabilityCheck?.enabled) {
    compressed.jobStability = {
      enabled: true,
      concern: penaltyConfig.jobStabilityCheck.jobHoppingConcern || 'moderate'
    }
  }
  
  // Employment Gap Check - keep only essential data
  if (penaltyConfig.employmentGapCheck?.enabled) {
    compressed.employmentGap = {
      enabled: true,
      threshold: penaltyConfig.employmentGapCheck.gapThreshold || '1year',
      penalty: penaltyConfig.employmentGapCheck.gapPenalty || 10
    }
  }
  
  return Object.keys(compressed).length > 0 ? compressed : null
}