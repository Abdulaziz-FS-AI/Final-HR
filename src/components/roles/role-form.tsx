'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoles } from '@/hooks/use-roles'
import { RoleFormData, SophisticatedBonusConfig, SophisticatedPenaltyConfig } from '@/types'
import { SophisticatedBonusPenalty } from './sophisticated-bonus-penalty'
import { Plus, Minus, Save, AlertCircle, CheckCircle } from 'lucide-react'

export function RoleForm() {
  const router = useRouter()
  const { createRole } = useRoles()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<RoleFormData>({
    title: '',
    description: '',
    responsibilities: '',
    education_requirements: [],
    experience_requirements: [],
    skills: [],
    questions: [],
    bonus_config: {
      preferredEducation: {
        enabled: false,
        specificUniversities: [],
        categories: {
          topLeague: false,
          top100Global: false,
          top50Global: false,
          regionalTop: false
        }
      },
      preferredCompanies: {
        enabled: false,
        specificCompanies: [],
        categories: {
          faangTech: false,
          fortune500: false,
          unicorns: false,
          industryLeaders: false,
          directCompetitors: false
        }
      },
      relatedProjects: {
        enabled: false,
        idealProjectDescription: '',
        maxProjects: 5
      },
      valuableCertifications: {
        enabled: false,
        certifications: [],
        maxCertifications: 15
      }
    },
    penalty_config: {
      jobStabilityCheck: {
        enabled: false,
        jobHoppingConcern: 'moderate',
        jobHoppingThresholds: {
          lenient: '>50% short tenures',
          moderate: '>30% short tenures',
          strict: '>20% short tenures'
        }
      },
      employmentGapCheck: {
        enabled: false,
        gapThreshold: '1year',
        gapPenalty: 10
      }
    }
  })

  const skillCategories = [
    'Technical Skills',
    'Programming Languages',
    'Frameworks & Libraries',
    'Tools & Software',
    'Databases',
    'Cloud Platforms',
    'Soft Skills',
    'Management',
    'Design',
    'Analytics',
    'Other'
  ]

  const questionCategories = [
    'Technical Experience',
    'Problem Solving',
    'Leadership',
    'Communication',
    'Project Management',
    'Industry Knowledge',
    'Cultural Fit',
    'Motivation',
    'Other'
  ]

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        skill_name: '',
        skill_category: '',
        weight: 5,
        is_required: false
      }]
    }))
  }

  const updateSkill = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => {
        if (i === index) {
          // If setting required to true, automatically set weight to 10
          if (field === 'is_required' && value === true) {
            return { ...skill, [field]: value, weight: 10 }
          }
          return { ...skill, [field]: value }
        }
        return skill
      })
    }))
  }

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question_text: '',
        category: '',
        weight: 5
      }]
    }))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((question, i) => 
        i === index ? { ...question, [field]: value } : question
      )
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  // Education Requirements Management
  const addEducationRequirement = () => {
    if (formData.education_requirements.length >= 5) return
    setFormData(prev => ({
      ...prev,
      education_requirements: [...prev.education_requirements, {
        requirement: ''
      }]
    }))
  }

  const updateEducationRequirement = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      education_requirements: prev.education_requirements.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      )
    }))
  }

  const removeEducationRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education_requirements: prev.education_requirements.filter((_, i) => i !== index)
    }))
  }

  // Experience Requirements Management
  const addExperienceRequirement = () => {
    if (formData.experience_requirements.length >= 5) return
    setFormData(prev => ({
      ...prev,
      experience_requirements: [...prev.experience_requirements, {
        requirement: ''
      }]
    }))
  }

  const updateExperienceRequirement = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      experience_requirements: prev.experience_requirements.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      )
    }))
  }

  const removeExperienceRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience_requirements: prev.experience_requirements.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🚀 Form submitting with comprehensive validation and dynamic handling...')
      console.log('📝 Form data:', {
        title: formData.title,
        descriptionLength: formData.description.length,
        hasResponsibilities: !!formData.responsibilities,
        educationRequirementsCount: formData.education_requirements.length,
        experienceRequirementsCount: formData.experience_requirements.length,
        skillsCount: formData.skills.length,
        questionsCount: formData.questions.length
      })
      
      const result = await createRole(formData)
      console.log('✅ Role created successfully:', result)
      
      // Update state and show success
      setLoading(false)
      setError('')
      setSuccess(true)
      
      // Navigate to roles list after showing success
      setTimeout(() => {
        router.push('/dashboard/roles')
      }, 1500)
      
    } catch (err: any) {
      console.error('❌ Role creation failed:', err)
      
      // Error message is already user-friendly from the hook
      setError(err.message || 'Failed to create role. Please try again.')
      setSuccess(false)
      setLoading(false)
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>
          <p className="text-gray-600 mt-1">
            Define the requirements and evaluation criteria for this position
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the essential details about this role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide a detailed description of the role, responsibilities, and what you're looking for..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Key Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                placeholder="List the main responsibilities and duties for this position..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Education Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Education Requirements</CardTitle>
            <CardDescription>
              Add education requirements for this role (max 5)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.education_requirements.map((req, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`education-req-${index}`}>Education Requirement *</Label>
                  <Textarea
                    id={`education-req-${index}`}
                    value={req.requirement}
                    onChange={(e) => updateEducationRequirement(index, 'requirement', e.target.value)}
                    placeholder="e.g., Bachelor's degree in Computer Science or related field"
                    className="min-h-[60px]"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEducationRequirement(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button 
              type="button" 
              variant="outline" 
              onClick={addEducationRequirement}
              disabled={formData.education_requirements.length >= 5}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Education Requirement {formData.education_requirements.length >= 5 && '(Max 5)'}
            </Button>
          </CardContent>
        </Card>

        {/* Experience Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Experience Requirements</CardTitle>
            <CardDescription>
              Add experience requirements for this role (max 5)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.experience_requirements.map((req, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`experience-req-${index}`}>Experience Requirement *</Label>
                  <Textarea
                    id={`experience-req-${index}`}
                    value={req.requirement}
                    onChange={(e) => updateExperienceRequirement(index, 'requirement', e.target.value)}
                    placeholder="e.g., 3+ years of experience in software development"
                    className="min-h-[60px]"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeExperienceRequirement(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button 
              type="button" 
              variant="outline" 
              onClick={addExperienceRequirement}
              disabled={formData.experience_requirements.length >= 5}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Experience Requirement {formData.experience_requirements.length >= 5 && '(Max 5)'}
            </Button>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
            <CardDescription>
              Define the skills needed for this role and their importance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.skills.map((skill, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg">
                <div className="md:col-span-4">
                  <Label htmlFor={`skill-name-${index}`}>Skill Name *</Label>
                  <Input
                    id={`skill-name-${index}`}
                    value={skill.skill_name}
                    onChange={(e) => updateSkill(index, 'skill_name', e.target.value)}
                    placeholder="e.g., React.js"
                    required
                  />
                </div>
                
                <div className="md:col-span-3">
                  <Label htmlFor={`skill-category-${index}`}>Category</Label>
                  <Select
                    value={skill.skill_category}
                    onValueChange={(value) => updateSkill(index, 'skill_category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`skill-weight-${index}`}>
                    Weight: {skill.weight}
                    {skill.is_required && <span className="text-xs text-gray-500 ml-1">(Auto)</span>}
                  </Label>
                  <div className="pt-2">
                    <Slider
                      id={`skill-weight-${index}`}
                      min={1}
                      max={10}
                      step={1}
                      value={[skill.weight]}
                      onValueChange={(values) => updateSkill(index, 'weight', values[0])}
                      disabled={skill.is_required}
                      className={skill.is_required ? 'opacity-50' : ''}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center space-x-2">
                  <Switch
                    id={`skill-required-${index}`}
                    checked={skill.is_required}
                    onCheckedChange={(checked) => updateSkill(index, 'is_required', checked)}
                  />
                  <Label htmlFor={`skill-required-${index}`}>Required</Label>
                </div>

                <div className="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSkill(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addSkill}>
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Questions</CardTitle>
            <CardDescription>
              Add custom questions to evaluate candidates beyond their skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.questions.map((question, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg">
                <div className="md:col-span-6">
                  <Label htmlFor={`question-text-${index}`}>Question *</Label>
                  <Textarea
                    id={`question-text-${index}`}
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    placeholder="e.g., Has the candidate led a development team?"
                    className="min-h-[60px]"
                    required
                  />
                </div>
                
                <div className="md:col-span-3">
                  <Label htmlFor={`question-category-${index}`}>Category</Label>
                  <Select
                    value={question.category}
                    onValueChange={(value) => updateQuestion(index, 'category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`question-weight-${index}`}>
                    Weight: {question.weight}
                  </Label>
                  <div className="pt-2">
                    <Slider
                      id={`question-weight-${index}`}
                      min={1}
                      max={10}
                      step={1}
                      value={[question.weight]}
                      onValueChange={(values) => updateQuestion(index, 'weight', values[0])}
                    />
                  </div>
                </div>

                <div className="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CardContent>
        </Card>

        {/* Sophisticated Bonus/Penalty Configuration */}
        <SophisticatedBonusPenalty
          bonusConfig={formData.bonus_config}
          penaltyConfig={formData.penalty_config}
          onBonusChange={useCallback((config: SophisticatedBonusConfig) => 
            setFormData(prev => ({ ...prev, bonus_config: config })), [])}
          onPenaltyChange={useCallback((config: SophisticatedPenaltyConfig) => 
            setFormData(prev => ({ ...prev, penalty_config: config })), [])}
        />

        {/* Error Display */}
        {error && (
          <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm whitespace-pre-line">{error}</div>
          </div>
        )}
        
        {/* Success Display */}
        {success && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Role created successfully! Redirecting...</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating Role...' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  )
}