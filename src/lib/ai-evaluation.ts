'use client'

import { supabase } from './supabase'
import { AIEvaluationRequest, AIEvaluationResponse, RoleWithDetails, FileUpload } from '@/types'
import { handleApiError, createAppError, ErrorLogger } from './error-handling'

export class AIEvaluationService {
  private readonly HYPERBOLIC_API_URL = 'https://api.hyperbolic.xyz/v1/chat/completions'
  private readonly apiKey: string

  constructor() {
    // API key will be handled server-side
    this.apiKey = ''
  }

  /**
   * Main evaluation function - evaluates a candidate against a specific role
   */
  async evaluateCandidate(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    try {
      // Fetch role details with skills and questions
      const role = await this.getRoleDetails(request.roleId)
      if (!role) {
        throw new Error('Role not found')
      }

      // Generate AI prompt based on role and resume
      const prompt = this.buildEvaluationPrompt(role, request.resumeText, request.contactInfo)

      // Call Hyperbolic API
      const aiResponse = await this.callHyperbolicAPI(prompt)

      // Parse and validate AI response
      const evaluation = this.parseAIResponse(aiResponse, role)

      // Save evaluation results to database
      await this.saveEvaluationResults(request, evaluation)

      return evaluation

    } catch (error: any) {
      const errorLogger = ErrorLogger.getInstance()
      const appError = handleApiError(error)
      
      await errorLogger.logError(appError, {
        component: 'AIEvaluationService',
        action: 'evaluateCandidate',
        metadata: {
          roleId: request.roleId,
          fileId: request.fileId
        }
      })
      
      throw appError
    }
  }

  /**
   * Batch evaluation for multiple files
   */
  async evaluateBatch(sessionId: string, roleId: string): Promise<AIEvaluationResponse[]> {
    const results: AIEvaluationResponse[] = []

    try {
      // Get all completed files from the session
      const { data: files, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'completed')
        .not('extracted_text', 'is', null)

      if (error) throw error

      // Process each file
      for (const file of files || []) {
        try {
          const contactInfo = this.extractContactInfo(file.extracted_text || '')
          
          const evaluation = await this.evaluateCandidate({
            roleId,
            fileId: file.id,
            resumeText: file.extracted_text || '',
            contactInfo
          })

          results.push(evaluation)
        } catch (error) {
          console.error(`Failed to evaluate file ${file.id}:`, error)
          // Continue with other files even if one fails
        }
      }

      return results

    } catch (error: any) {
      console.error('Batch evaluation failed:', error)
      throw new Error(`Batch evaluation failed: ${error.message}`)
    }
  }

  /**
   * Get role details with skills and questions
   */
  private async getRoleDetails(roleId: string): Promise<RoleWithDetails | null> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        skills:role_skills(*),
        questions:role_questions(*)
      `)
      .eq('id', roleId)
      .single()

    if (error) {
      console.error('Error fetching role:', error)
      return null
    }

    return data
  }

  /**
   * Build comprehensive evaluation prompt for AI
   */
  private buildEvaluationPrompt(
    role: RoleWithDetails, 
    resumeText: string, 
    contactInfo?: any
  ): string {
    const skillsList = role.skills?.map(s => 
      `${s.skill_name} (${s.skill_category || 'General'}) - Weight: ${s.weight}${s.is_required ? ' [REQUIRED]' : ''}`
    ).join('\n') || 'No specific skills defined'

    const questionsList = role.questions?.map(q => 
      `${q.question_text} (Category: ${q.question_category || 'General'}) - Weight: ${q.weight}`
    ).join('\n') || 'No specific questions defined'

    return `You are an expert HR recruiter evaluating a candidate's resume against a specific job role. Provide a comprehensive, objective evaluation.

**JOB ROLE DETAILS:**
Title: ${role.title}
Description: ${role.description}
Responsibilities: ${role.responsibilities || 'Not specified'}

**REQUIRED SKILLS (with weights):**
${skillsList}

**EVALUATION QUESTIONS (with weights):**
${questionsList}

**EDUCATION REQUIREMENTS:**
${role.education_requirements ? JSON.stringify(role.education_requirements) : 'No specific requirements'}

**EXPERIENCE REQUIREMENTS:**
${role.experience_requirements ? JSON.stringify(role.experience_requirements) : 'No specific requirements'}

**SOPHISTICATED BONUS/PENALTY CONFIGURATION:**
${this.buildBonusPenaltyPrompt(role)}

**CANDIDATE RESUME:**
${resumeText}

**EVALUATION INSTRUCTIONS:**
1. Extract candidate name, email, and phone from the resume
2. Analyze each required skill individually - determine if found and proficiency level
3. Answer each evaluation question based on resume evidence
4. Calculate base scores using the provided weights
5. **SOPHISTICATED BONUS/PENALTY EVALUATION:**
   - EDUCATION BONUSES: Check university names against preferred lists and categories
   - COMPANY BONUSES: Analyze work experience for target companies and categories
   - PROJECT BONUSES: Evaluate project descriptions against ideal criteria (1-10 scale)
   - CERTIFICATION BONUSES: Identify valuable certifications and rate relevance (1-10 scale)
   - JOB STABILITY PENALTIES: Calculate tenure patterns and job hopping frequency
   - EMPLOYMENT GAP PENALTIES: Identify unexplained career gaps exceeding thresholds
6. Apply calculated bonus/penalty points to base score (cap total at 0-100 range)
7. Provide specific recommendations and identify red flags
8. Give overall assessment with confidence level

**RESPONSE FORMAT (JSON only):**
{
  "candidate_name": "Full name extracted from resume",
  "overall_score": number (0-100),
  "base_score": number (0-100),
  "skills_score": number (0-100),
  "questions_score": number (0-100),
  "bonus_points": number,
  "penalty_points": number,
  "bonus_breakdown": {
    "education_bonus": number,
    "company_bonus": number,
    "projects_bonus": number,
    "certifications_bonus": number
  },
  "penalty_breakdown": {
    "job_stability_penalty": number,
    "employment_gap_penalty": number
  },
  "skills_analysis": [
    {
      "skill_name": "skill name",
      "found": boolean,
      "level": "HIGH|MEDIUM|LOW|NONE",
      "evidence": "specific text from resume that demonstrates this skill"
    }
  ],
  "questions_analysis": [
    {
      "question": "the question text",
      "answer": "YES|NO|PARTIAL",
      "quality": "HIGH|MEDIUM|LOW|NONE",
      "evidence": "specific evidence from resume"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "red_flags": ["red flag 1", "red flag 2"],
  "analysis_summary": "Overall assessment paragraph",
  "ai_confidence": number (0-1)
}

Respond with ONLY the JSON object, no additional text.`
  }

  /**
   * Build sophisticated bonus/penalty configuration for AI prompt
   */
  private buildBonusPenaltyPrompt(role: RoleWithDetails): string {
    if (!role.bonus_config && !role.penalty_config) {
      return 'No bonus/penalty configuration defined.'
    }

    let prompt = ''
    
    // Bonus Configuration
    if (role.bonus_config) {
      const bonusConfig = typeof role.bonus_config === 'string' 
        ? JSON.parse(role.bonus_config) 
        : role.bonus_config

      prompt += '**QUALITY BONUSES:**\n'
      
      // Preferred Education
      if (bonusConfig.preferredEducation?.enabled) {
        prompt += '• PREFERRED EDUCATION (Award +5 to +15 bonus points):\n'
        if (bonusConfig.preferredEducation.specificUniversities?.length > 0) {
          prompt += `  - Specific Universities: ${bonusConfig.preferredEducation.specificUniversities.join(', ')}\n`
        }
        const categories = bonusConfig.preferredEducation.categories
        if (categories?.topLeague) prompt += '  - Top League Universities (Ivy League/Oxbridge): +15 points\n'
        if (categories?.top50Global) prompt += '  - Top 50 Global Universities: +12 points\n'
        if (categories?.top100Global) prompt += '  - Top 100 Global Universities: +8 points\n'
        if (categories?.regionalTop) prompt += '  - Regional Top Universities: +5 points\n'
      }

      // Preferred Companies
      if (bonusConfig.preferredCompanies?.enabled) {
        prompt += '• PREFERRED COMPANY EXPERIENCE (Award +3 to +20 bonus points):\n'
        if (bonusConfig.preferredCompanies.specificCompanies?.length > 0) {
          prompt += `  - Specific Companies: ${bonusConfig.preferredCompanies.specificCompanies.join(', ')}\n`
        }
        const categories = bonusConfig.preferredCompanies.categories
        if (categories?.faangTech) prompt += '  - FAANG/Top Tech Companies: +20 points\n'
        if (categories?.unicorns) prompt += '  - Unicorns ($1B+ startups): +15 points\n'
        if (categories?.fortune500) prompt += '  - Fortune 500: +10 points\n'
        if (categories?.industryLeaders) prompt += '  - Industry Leaders: +8 points\n'
        if (categories?.directCompetitors) prompt += '  - Direct Competitors: +12 points\n'
      }

      // Related Projects
      if (bonusConfig.relatedProjects?.enabled && bonusConfig.relatedProjects.idealProjectDescription) {
        prompt += '• RELATED PROJECT EXPERIENCE (Scale 1-10, award +2 to +25 bonus points):\n'
        prompt += `  - Ideal Projects: ${bonusConfig.relatedProjects.idealProjectDescription}\n`
        prompt += '  - Evaluate up to 5 most relevant projects\n'
        prompt += '  - Score 9-10: +25 points, 7-8: +15 points, 5-6: +8 points, 3-4: +3 points\n'
      }

      // Valuable Certifications
      if (bonusConfig.valuableCertifications?.enabled && bonusConfig.valuableCertifications.certifications?.length > 0) {
        prompt += '• VALUABLE CERTIFICATIONS (Scale 1-10, award +1 to +15 bonus points per cert):\n'
        prompt += `  - Target Certifications: ${bonusConfig.valuableCertifications.certifications.join(', ')}\n`
        prompt += '  - Evaluate up to 15 certifications\n'
        prompt += '  - Score 9-10: +15 points, 7-8: +10 points, 5-6: +5 points, 3-4: +2 points per certification\n'
      }
    }

    // Penalty Configuration  
    if (role.penalty_config) {
      const penaltyConfig = typeof role.penalty_config === 'string'
        ? JSON.parse(role.penalty_config)
        : role.penalty_config

      prompt += '\n**RISK PENALTIES:**\n'
      
      // Job Stability Check
      if (penaltyConfig.jobStabilityCheck?.enabled) {
        prompt += '• JOB STABILITY CHECK (Deduct -5 to -25 penalty points):\n'
        const concern = penaltyConfig.jobStabilityCheck.jobHoppingConcern
        if (concern === 'strict') {
          prompt += '  - STRICT: Penalize if >20% of positions were short tenure (<2 years): -25 points\n'
        } else if (concern === 'moderate') {
          prompt += '  - MODERATE: Penalize if >30% of positions were short tenure (<2 years): -15 points\n'
        } else if (concern === 'lenient') {
          prompt += '  - LENIENT: Penalize if >50% of positions were short tenure (<2 years): -8 points\n'
        }
      }

      // Employment Gap Check
      if (penaltyConfig.employmentGapCheck?.enabled) {
        prompt += '• EMPLOYMENT GAP CHECK (Deduct -5 to -20 penalty points):\n'
        const threshold = penaltyConfig.employmentGapCheck.gapThreshold
        if (threshold === '6months') {
          prompt += '  - Penalize unexplained gaps longer than 6 months: -5 points per gap\n'
        } else if (threshold === '1year') {
          prompt += '  - Penalize unexplained gaps longer than 1 year: -10 points per gap\n'
        } else if (threshold === '2years') {
          prompt += '  - Penalize unexplained gaps longer than 2 years: -20 points per gap\n'
        }
      }
    }

    return prompt || 'No bonus/penalty configuration defined.'
  }

  /**
   * Call Hyperbolic API for AI evaluation
   */
  private async callHyperbolicAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/ai-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error(`AI evaluation API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.content) {
        throw new Error(data.error || 'Invalid response from AI service')
      }

      return data.content

    } catch (error: any) {
      console.error('AI evaluation API call failed:', error)
      throw new Error(`AI evaluation failed: ${error.message}`)
    }
  }


  /**
   * Parse and validate AI response
   */
  private parseAIResponse(aiResponse: string, role: RoleWithDetails): AIEvaluationResponse {
    try {
      // Clean the response to extract JSON
      let jsonStr = aiResponse.trim()
      
      // Remove any markdown formatting
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '')
      }
      
      const parsed = JSON.parse(jsonStr)
      
      // Validate required fields
      const evaluation: AIEvaluationResponse = {
        candidate_name: parsed.candidate_name || 'Unknown Candidate',
        overall_score: Math.max(0, Math.min(100, parsed.overall_score || 0)),
        skills_score: Math.max(0, Math.min(100, parsed.skills_score || 0)),
        questions_score: Math.max(0, Math.min(100, parsed.questions_score || 0)),
        bonus_points: parsed.bonus_points || 0,
        penalty_points: parsed.penalty_points || 0,
        skills_analysis: Array.isArray(parsed.skills_analysis) ? parsed.skills_analysis : [],
        questions_analysis: Array.isArray(parsed.questions_analysis) ? parsed.questions_analysis : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
        analysis_summary: parsed.analysis_summary || 'No analysis provided',
        ai_confidence: Math.max(0, Math.min(1, parsed.ai_confidence || 0.5))
      }

      return evaluation

    } catch (error) {
      console.error('Failed to parse AI response:', error)
      // Return default evaluation on parse error
      return {
        candidate_name: 'Parse Error',
        overall_score: 0,
        skills_score: 0,
        questions_score: 0,
        bonus_points: 0,
        penalty_points: 0,
        skills_analysis: [],
        questions_analysis: [],
        recommendations: ['AI response parsing failed - manual review required'],
        red_flags: ['Unable to process AI evaluation'],
        analysis_summary: 'AI evaluation parsing failed. Manual review required.',
        ai_confidence: 0
      }
    }
  }

  /**
   * Save evaluation results to database
   */
  private async saveEvaluationResults(
    request: AIEvaluationRequest, 
    evaluation: AIEvaluationResponse
  ): Promise<void> {
    try {
      // First create or get evaluation session
      const sessionId = await this.getOrCreateEvaluationSession(request.roleId)

      // Save the evaluation result
      const { error } = await supabase
        .from('evaluation_results')
        .insert({
          file_id: request.fileId,
          session_id: sessionId,
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          candidate_name: evaluation.candidate_name,
          overall_score: evaluation.overall_score,
          bonus_points: evaluation.bonus_points,
          penalty_points: evaluation.penalty_points,
          skills_score: evaluation.skills_score,
          questions_score: evaluation.questions_score,
          ai_confidence: evaluation.ai_confidence / 100, // Convert to decimal
          ai_model_used: 'openai/gpt-oss-120b',
          status: 'QUALIFIED', // Based on score threshold
          match_level: evaluation.overall_score >= 90 ? 'PERFECT' : 
                      evaluation.overall_score >= 80 ? 'STRONG' : 
                      evaluation.overall_score >= 70 ? 'GOOD' : 
                      evaluation.overall_score >= 60 ? 'FAIR' : 'POOR',
          table_view: {
            candidate_name: evaluation.candidate_name,
            overall_score: evaluation.overall_score,
            skills_score: evaluation.skills_score,
            questions_score: evaluation.questions_score,
            bonus_points: evaluation.bonus_points,
            penalty_points: evaluation.penalty_points,
            ai_confidence: evaluation.ai_confidence,
            recommendations_count: evaluation.recommendations?.length || 0,
            red_flags_count: evaluation.red_flags?.length || 0
          },
          expanded_view: {
            skills_analysis: evaluation.skills_analysis,
            questions_analysis: evaluation.questions_analysis,
            recommendations: evaluation.recommendations,
            red_flags: evaluation.red_flags,
            analysis_summary: evaluation.analysis_summary,
            bonus_breakdown: evaluation.bonus_breakdown || {},
            penalty_breakdown: evaluation.penalty_breakdown || {},
            raw_ai_output: evaluation
          }
        })

      if (error) {
        console.error('Failed to save evaluation results:', error)
        throw error
      }

      // Update processing queue status
      await supabase
        .from('processing_queue')
        .update({ status: 'completed' })
        .eq('file_id', request.fileId)

    } catch (error) {
      console.error('Error saving evaluation results:', error)
      throw error
    }
  }

  /**
   * Get or create evaluation session
   */
  private async getOrCreateEvaluationSession(roleId: string): Promise<string> {
    const userId = (await supabase.auth.getUser()).data.user?.id

    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Try to find existing active session
    const { data: existingSession } = await supabase
      .from('evaluation_sessions')
      .select('id')
      .eq('role_id', roleId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (existingSession) {
      return existingSession.id
    }

    // Get role details for snapshot
    const role = await this.getRoleDetails(roleId)
    if (!role) {
      throw new Error('Role not found for session creation')
    }

    // Create minimal role snapshot
    const roleSnapshot = {
      id: role.id,
      title: role.title,
      description: role.description,
      skills: role.skills?.map(s => ({
        skill_name: s.skill_name,
        weight: s.weight,
        is_required: s.is_required
      })) || [],
      questions: role.questions?.map(q => ({
        question_text: q.question_text,
        weight: q.weight
      })) || []
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('evaluation_sessions')
      .insert({
        role_id: roleId,
        user_id: userId,
        session_name: `Evaluation ${new Date().toLocaleDateString()}`,
        status: 'pending',
        total_resumes: 0,
        role_snapshot: roleSnapshot
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return newSession.id
  }

  /**
   * Extract contact information from resume text
   */
  private extractContactInfo(resumeText: string): any {
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    const phoneMatch = resumeText.match(/[\+]?[\d\s\-\(\)\.\+]{10,}/)
    
    // Try to extract name (look for patterns at the beginning)
    const lines = resumeText.split('\n').filter(line => line.trim())
    let nameMatch = null
    
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      const possibleName = line.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/)
      if (possibleName && !line.includes('@') && !line.includes('http')) {
        nameMatch = possibleName[1]
        break
      }
    }

    return {
      name: nameMatch,
      email: emailMatch?.[0],
      phone: phoneMatch?.[0]
    }
  }

  /**
   * Process the evaluation queue
   */
  async processQueue(): Promise<void> {
    try {
      // Get pending items from queue
      const { data: queueItems, error } = await supabase
        .from('processing_queue')
        .select(`
          *,
          file:file_uploads!inner(*)
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(10)

      if (error) {
        console.error('Error fetching queue items:', error)
        return
      }

      // Process each item
      for (const item of queueItems || []) {
        try {
          await this.processQueueItem(item)
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error)
          
          // Update queue item with error
          await supabase
            .from('processing_queue')
            .update({
              status: 'failed',
              error_details: { error: error instanceof Error ? error.message : 'Unknown error' },
              attempts: (item.attempts || 0) + 1
            })
            .eq('id', item.id)
        }
      }

    } catch (error) {
      console.error('Queue processing failed:', error)
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: any): Promise<void> {
    const file = item.file
    
    if (!file?.extracted_text) {
      throw new Error('No extracted text available for evaluation')
    }

    // Get evaluation session to determine role
    const { data: evaluationSession, error: sessionError } = await supabase
      .from('evaluation_sessions')
      .select('role_id')
      .eq('id', file.session_id)
      .single()

    if (sessionError || !evaluationSession) {
      throw new Error('Could not determine role for evaluation')
    }

    // Extract contact info
    const contactInfo = this.extractContactInfo(file.extracted_text)

    // Perform evaluation
    await this.evaluateCandidate({
      roleId: evaluationSession.role_id,
      fileId: file.id,
      resumeText: file.extracted_text,
      contactInfo
    })
  }
}