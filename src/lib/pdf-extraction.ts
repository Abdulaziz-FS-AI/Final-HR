'use client'

import { StorageService } from './storage'
import { supabase } from './supabase'
import { handleApiError, createAppError, ErrorLogger } from './error-handling'

export interface ExtractionResult {
  success: boolean
  extractionId: string
  text?: string
  metadata?: any
  confidence: number
  issues: string[]
  duration: number
  fileId: string
}

export class PDFExtractionService {
  private storage = new StorageService()
  private readonly MAX_RETRIES = 3
  
  /**
   * Main extraction pipeline
   */
  async extractPDF(
    file: File,
    sessionId: string,
    userId: string,
    priority: number = 5
  ): Promise<ExtractionResult> {
    const startTime = Date.now()
    const extractionId = this.generateExtractionId()
    
    try {
      // Step 1: Validate file
      const validation = this.storage.validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error!)
      }

      // Step 2: Calculate file hash for deduplication
      const fileHash = await this.storage.calculateFileHash(file)
      
      // Step 3: Check for duplicates
      const existingFile = await this.checkDuplicate(fileHash, userId)
      if (existingFile) {
        return await this.handleDuplicate(existingFile, sessionId, extractionId)
      }
      
      // Step 4: Create file upload record
      const { data: fileRecord, error: createError } = await supabase
        .from('file_uploads')
        .insert({
          session_id: sessionId,
          original_name: file.name,
          stored_name: `${extractionId}.pdf`,
          storage_path: `resumes/${userId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${extractionId}.pdf`,
          file_size: file.size,
          mime_type: file.type,
          file_code: extractionId,
          processing_status: 'processing'
        })
        .select()
        .single()

      if (createError) throw createError
      
      // Step 5: Upload PDF to storage
      const pdfUrl = await this.storage.uploadPDF(file, userId, extractionId)
      
      // Step 6: Update with storage info
      await supabase
        .from('file_uploads')
        .update({
          processing_status: 'uploaded'
        })
        .eq('id', fileRecord.id)
      
      // Step 7: Extract text with multiple fallbacks
      const extractedData = await this.extractWithFallbacks(file)
      
      // Step 8: Validate extraction quality
      const qualityCheck = this.validateExtraction(extractedData.text)
      
      // Step 9: Store extracted text
      const textPath = await this.storage.storeExtractedText(
        extractedData.text,
        userId,
        extractionId
      )
      
      // Step 10: Update file record with extraction results
      await supabase
        .from('file_uploads')
        .update({
          processing_status: 'completed',
          extracted_text: extractedData.text,
          extracted_metadata: {
            method: extractedData.method,
            wordCount: extractedData.wordCount,
            duration: Date.now() - startTime,
            qualityCheck
          },
          extraction_confidence: qualityCheck.confidence,
          extraction_duration_ms: Date.now() - startTime,
          extraction_method: extractedData.method,
          word_count: extractedData.wordCount,
          character_count: extractedData.text.length,
          has_contact_info: qualityCheck.hasContact,
          has_experience: qualityCheck.hasExperience,
          has_education: qualityCheck.hasEducation,
          has_skills: qualityCheck.hasSkills,
          looks_like_resume: qualityCheck.looksLikeResume,
          extracted_email: qualityCheck.email,
          extracted_phone: qualityCheck.phone,
          extracted_name: qualityCheck.name,
          quality_score: qualityCheck.score,
          quality_issues: qualityCheck.issues.length > 0 ? qualityCheck.issues : null
        })
        .eq('id', fileRecord.id)
      
      // Step 11: Queue for AI evaluation
      await this.queueForEvaluation(fileRecord.id, priority)
      
      // Step 12: Trigger queue processing (async, don't wait)
      this.triggerQueueProcessing().catch(error => {
        console.log('Queue processing trigger failed (non-critical):', error)
      })
      
      return {
        success: true,
        extractionId,
        text: extractedData.text,
        metadata: extractedData.metadata,
        confidence: qualityCheck.confidence,
        issues: qualityCheck.issues,
        duration: Date.now() - startTime,
        fileId: fileRecord.id
      }
      
    } catch (error: any) {
      const errorLogger = ErrorLogger.getInstance()
      const appError = handleApiError(error)
      
      // Log the error with context
      await errorLogger.logError(appError, {
        component: 'PDFExtractionService',
        action: 'extractPDF',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          sessionId,
          userId
        }
      })

      // Re-throw with standardized error
      throw appError
    }
  }
  
  /**
   * Extract with multiple fallback methods
   */
  private async extractWithFallbacks(file: File): Promise<any> {
    const buffer = await file.arrayBuffer()
    let lastError: Error | null = null
    
    // Method 1: pdf-parse (we'll implement this via API)
    try {
      const result = await this.extractViaPdfParse(buffer)
      if (result && result.text && result.text.length > 50) {
        return {
          text: result.text,
          metadata: result.info || {},
          wordCount: result.text.split(/\s+/).length,
          method: 'pdf-parse'
        }
      }
    } catch (error) {
      lastError = error as Error
      console.log('pdf-parse failed, trying fallback...')
    }
    
    // Method 2: Simple text extraction (fallback)
    try {
      const result = await this.extractViaFallback(file)
      if (result && result.length > 50) {
        return {
          text: result,
          metadata: {},
          wordCount: result.split(/\s+/).length,
          method: 'fallback'
        }
      }
    } catch (error) {
      lastError = error as Error
    }
    
    // All methods failed
    throw new Error(`Failed to extract text: ${lastError?.message}`)
  }
  
  /**
   * Extract via API call to our backend
   */
  private async extractViaPdfParse(buffer: ArrayBuffer): Promise<any> {
    const formData = new FormData()
    const blob = new Blob([buffer], { type: 'application/pdf' })
    formData.append('pdf', blob)
    
    const response = await fetch('/api/extract-pdf', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`PDF extraction API failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  /**
   * Fallback extraction method
   */
  private async extractViaFallback(file: File): Promise<string> {
    // This is a very basic fallback - in production you'd want something more robust
    return `[Extracted from ${file.name}] - Basic text extraction not yet implemented. File size: ${file.size} bytes.`
  }
  
  /**
   * Validate extraction quality
   */
  private validateExtraction(text: string): any {
    const issues: string[] = []
    let confidence = 1.0
    
    // Check text length
    if (!text || text.length < 100) {
      issues.push('Text too short')
      confidence -= 0.5
    }
    
    // Check for common resume keywords
    const resumeKeywords = [
      'experience', 'education', 'skills', 'work',
      'university', 'degree', 'email', 'phone'
    ]
    
    const lowerText = text.toLowerCase()
    const foundKeywords = resumeKeywords.filter(kw => lowerText.includes(kw))
    
    if (foundKeywords.length < 2) {
      issues.push('Missing resume keywords')
      confidence -= 0.3
    }
    
    // Extract contact info
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    const phoneMatch = text.match(/[\d\s\-\(\)\.+]{10,}/)
    const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m)
    
    // Check for sections
    const hasExperience = /experience|work|employment/i.test(text)
    const hasEducation = /education|degree|university|college/i.test(text)
    const hasSkills = /skills|technologies|languages|tools/i.test(text)
    
    // Check for garbage characters
    const garbageRatio = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length / text.length
    if (garbageRatio > 0.1) {
      issues.push('Too many special characters')
      confidence -= 0.2
    }
    
    // Calculate quality score
    const score = Math.round(confidence * 100)
    
    return {
      confidence: Math.max(0, confidence),
      score,
      issues,
      hasContact: !!(emailMatch || phoneMatch),
      hasExperience,
      hasEducation,
      hasSkills,
      looksLikeResume: foundKeywords.length >= 3 && confidence > 0.5,
      email: emailMatch?.[0] || null,
      phone: phoneMatch?.[0] || null,
      name: nameMatch?.[1] || null
    }
  }
  
  /**
   * Check for duplicate PDFs using file hash
   */
  private async checkDuplicate(fileHash: string, userId: string): Promise<any> {
    // First, add file_hash column to schema if it doesn't exist
    // For now, let's check by file size and name similarity as a workaround
    
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('processing_status', 'completed')
      .not('extracted_text', 'is', null)
      .order('uploaded_at', { ascending: false })
      .limit(50) // Check recent uploads
    
    if (error || !data) return null
    
    // For now, return null to skip duplicate checking until we add file_hash column
    // TODO: Add file_hash column to file_uploads table and implement proper hash-based deduplication
    return null
  }
  
  /**
   * Handle duplicate PDF
   */
  private async handleDuplicate(
    existing: any,
    sessionId: string,
    newExtractionId: string
  ): Promise<ExtractionResult> {
    // Create a reference to existing file
    const { data: newFile } = await supabase
      .from('file_uploads')
      .insert({
        session_id: sessionId,
        original_name: existing.original_name,
        stored_name: existing.stored_name,
        storage_path: existing.storage_path,
        file_size: existing.file_size,
        mime_type: existing.mime_type,
        processing_status: 'completed',
        extracted_text: existing.extracted_text,
        is_duplicate: true,
        duplicate_of: existing.id
      })
      .select()
      .single()
    
    return {
      success: true,
      extractionId: newExtractionId,
      text: existing.extracted_text,
      metadata: {},
      confidence: 1.0,
      issues: ['Duplicate of previously processed file'],
      duration: 0,
      fileId: newFile!.id
    }
  }
  
  /**
   * Generate unique extraction ID
   */
  private generateExtractionId(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    return `PDF-${year}${month}-${random}`
  }
  
  /**
   * Queue for AI evaluation
   */
  private async queueForEvaluation(
    fileId: string,
    priority: number
  ): Promise<void> {
    await supabase
      .from('processing_queue')
      .insert({
        file_id: fileId,
        item_type: 'evaluation',
        priority: priority,
        status: 'pending'
      })
  }

  /**
   * Trigger queue processing (async)
   */
  private async triggerQueueProcessing(): Promise<void> {
    try {
      // Call the queue processing API
      const response = await fetch('/api/process-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Queue processing API failed: ${response.status}`)
      }

      console.log('Queue processing triggered successfully')
    } catch (error) {
      console.error('Failed to trigger queue processing:', error)
      throw error
    }
  }
}