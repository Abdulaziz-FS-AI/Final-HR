import { RoleFormData } from '@/types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationConfig {
  // Basic info constraints
  titleMinLength: number
  titleMaxLength: number
  descriptionMinLength: number
  descriptionMaxLength: number
  responsibilitiesMaxLength: number
  
  // Requirements constraints
  requirementMinLength: number
  requirementMaxLength: number
  
  // Skills constraints
  skillNameMinLength: number
  skillNameMaxLength: number
  skillCategoryMaxLength: number
  weightMin: number
  weightMax: number
  maxSkills: number
  
  // Questions constraints
  questionTextMinLength: number
  questionTextMaxLength: number
  questionCategoryMaxLength: number
  maxQuestions: number
}

// Database-derived validation config
export const VALIDATION_CONFIG: ValidationConfig = {
  // From database schema constraints
  titleMinLength: 2,
  titleMaxLength: 120,
  descriptionMinLength: 10,
  descriptionMaxLength: 2500,
  responsibilitiesMaxLength: 2500,
  
  requirementMinLength: 5,
  requirementMaxLength: 500,
  
  skillNameMinLength: 1,
  skillNameMaxLength: 200,
  skillCategoryMaxLength: 50,
  weightMin: 1,
  weightMax: 10,
  maxSkills: 10,
  
  questionTextMinLength: 5,
  questionTextMaxLength: 500,
  questionCategoryMaxLength: 50,
  maxQuestions: 10,
}

/**
 * Comprehensive form validation that handles all dynamic scenarios
 */
export function validateRoleForm(formData: RoleFormData): ValidationResult {
  const errors: string[] = []
  const config = VALIDATION_CONFIG

  // ===== BASIC INFORMATION VALIDATION =====
  
  // Title validation
  if (!formData.title?.trim()) {
    errors.push('Job title is required')
  } else if (formData.title.trim().length < config.titleMinLength) {
    errors.push(`Job title must be at least ${config.titleMinLength} characters long`)
  } else if (formData.title.trim().length > config.titleMaxLength) {
    errors.push(`Job title cannot exceed ${config.titleMaxLength} characters`)
  }

  // Description validation
  if (!formData.description?.trim()) {
    errors.push('Job description is required')
  } else if (formData.description.trim().length < config.descriptionMinLength) {
    errors.push(`Job description must be at least ${config.descriptionMinLength} characters long`)
  } else if (formData.description.trim().length > config.descriptionMaxLength) {
    errors.push(`Job description cannot exceed ${config.descriptionMaxLength} characters`)
  }

  // Responsibilities validation (optional)
  if (formData.responsibilities && formData.responsibilities.trim().length > config.responsibilitiesMaxLength) {
    errors.push(`Responsibilities cannot exceed ${config.responsibilitiesMaxLength} characters`)
  }

  // ===== DYNAMIC REQUIREMENTS VALIDATION =====
  
  // Education requirements (array of requirements)
  if (formData.education_requirements.length > 5) {
    errors.push('Cannot have more than 5 education requirements')
  }
  formData.education_requirements.forEach((req, index) => {
    const reqNum = index + 1
    if (!req.requirement?.trim()) {
      errors.push(`Education requirement ${reqNum}: Text is required`)
    } else if (req.requirement.trim().length < config.requirementMinLength) {
      errors.push(`Education requirement ${reqNum}: Must be at least ${config.requirementMinLength} characters long`)
    } else if (req.requirement.trim().length > config.requirementMaxLength) {
      errors.push(`Education requirement ${reqNum}: Cannot exceed ${config.requirementMaxLength} characters`)
    }
  })

  // Experience requirements (array of requirements)
  if (formData.experience_requirements.length > 5) {
    errors.push('Cannot have more than 5 experience requirements')
  }
  formData.experience_requirements.forEach((req, index) => {
    const reqNum = index + 1
    if (!req.requirement?.trim()) {
      errors.push(`Experience requirement ${reqNum}: Text is required`)
    } else if (req.requirement.trim().length < config.requirementMinLength) {
      errors.push(`Experience requirement ${reqNum}: Must be at least ${config.requirementMinLength} characters long`)
    } else if (req.requirement.trim().length > config.requirementMaxLength) {
      errors.push(`Experience requirement ${reqNum}: Cannot exceed ${config.requirementMaxLength} characters`)
    }
  })

  // ===== DYNAMIC SKILLS VALIDATION =====
  
  // Skills are OPTIONAL - can be empty array (max 10)
  if (formData.skills.length > config.maxSkills) {
    errors.push(`Cannot have more than ${config.maxSkills} skills`)
  }

  // Validate each skill if any exist
  formData.skills.forEach((skill, index) => {
    const skillNum = index + 1

    // Skill name validation
    if (!skill.skill_name?.trim()) {
      errors.push(`Skill ${skillNum}: Name is required`)
    } else if (skill.skill_name.trim().length < config.skillNameMinLength) {
      errors.push(`Skill ${skillNum}: Name must be at least ${config.skillNameMinLength} character long`)
    } else if (skill.skill_name.trim().length > config.skillNameMaxLength) {
      errors.push(`Skill ${skillNum}: Name cannot exceed ${config.skillNameMaxLength} characters`)
    }

    // Skill category validation (optional)
    if (skill.skill_category && skill.skill_category.trim().length > config.skillCategoryMaxLength) {
      errors.push(`Skill ${skillNum}: Category cannot exceed ${config.skillCategoryMaxLength} characters`)
    }

    // Weight validation
    if (skill.weight < config.weightMin || skill.weight > config.weightMax) {
      errors.push(`Skill ${skillNum}: Weight must be between ${config.weightMin} and ${config.weightMax}`)
    }

    // Required flag validation (boolean, so always valid)
  })

  // ===== DYNAMIC QUESTIONS VALIDATION =====
  
  // Questions are OPTIONAL - can be empty array (max 10)
  if (formData.questions.length > config.maxQuestions) {
    errors.push(`Cannot have more than ${config.maxQuestions} questions`)
  }

  // Validate each question if any exist
  formData.questions.forEach((question, index) => {
    const questionNum = index + 1

    // Question text validation
    if (!question.question_text?.trim()) {
      errors.push(`Question ${questionNum}: Text is required`)
    } else if (question.question_text.trim().length < config.questionTextMinLength) {
      errors.push(`Question ${questionNum}: Text must be at least ${config.questionTextMinLength} characters long`)
    } else if (question.question_text.trim().length > config.questionTextMaxLength) {
      errors.push(`Question ${questionNum}: Text cannot exceed ${config.questionTextMaxLength} characters`)
    }

    // Question category validation (optional)
    if (question.category && question.category.trim().length > config.questionCategoryMaxLength) {
      errors.push(`Question ${questionNum}: Category cannot exceed ${config.questionCategoryMaxLength} characters`)
    }

    // Weight validation
    if (question.weight < config.weightMin || question.weight > config.weightMax) {
      errors.push(`Question ${questionNum}: Weight must be between ${config.weightMin} and ${config.weightMax}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get user-friendly summary of what will be included in the role
 */
export function getRoleDataSummary(formData: RoleFormData): string {
  const parts: string[] = []
  
  parts.push(`Title: "${formData.title}"`)
  parts.push(`Description: ${formData.description.length} characters`)
  
  if (formData.responsibilities?.trim()) {
    parts.push(`Responsibilities: ${formData.responsibilities.length} characters`)
  }
  
  if (formData.education_requirements.length > 0) {
    parts.push(`Education requirements: ${formData.education_requirements.length} items`)
  }
  
  if (formData.experience_requirements.length > 0) {
    parts.push(`Experience requirements: ${formData.experience_requirements.length} items`)
  }
  
  if (formData.skills.length > 0) {
    const requiredSkills = formData.skills.filter(s => s.is_required).length
    parts.push(`${formData.skills.length} skills (${requiredSkills} required)`)
  }
  
  if (formData.questions.length > 0) {
    parts.push(`${formData.questions.length} custom questions`)
  }
  
  return parts.join(', ')
}