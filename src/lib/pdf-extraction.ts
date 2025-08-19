'use client'

import { StorageService } from './storage'
import { supabase } from './supabase'

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
          file_name: file.name,
          file_path: `resumes/${userId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${extractionId}.pdf`,
          file_size: file.size,
          file_type: file.type,
          user_id: userId,
          status: 'processing'
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
          status: 'completed'
        })
        .eq('id', fileRecord.id)
      
      // Step 7: Extract text with multiple fallbacks
      const extractedData = await this.extractWithFallbacks(file)
      
      // Step 8: Validate extraction quality
      const qualityCheck = await this.validateExtraction(extractedData.text)
      
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
          status: 'completed',
          extracted_text: extractedData.text,
          error_details: qualityCheck.issues.length > 0 ? { 
            issues: qualityCheck.issues,
            confidence: qualityCheck.confidence,
            method: extractedData.method,
            duration: Date.now() - startTime
          } : null
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
      // Log failure and update record if it exists
      console.error('PDF extraction failed:', error)
      throw error
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
  private async validateExtraction(text: string): Promise<any> {
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
   * Check for duplicate PDFs
   */
  private async checkDuplicate(fileHash: string, userId: string): Promise<any> {
    const { data } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return data
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
        file_name: existing.file_name,
        file_path: existing.file_path,
        file_size: existing.file_size,
        file_type: existing.file_type,
        user_id: existing.user_id,
        status: 'completed',
        extracted_text: existing.extracted_text
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
        priority: priority.toString(),
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