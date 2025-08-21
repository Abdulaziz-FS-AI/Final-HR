'use client'

import { StorageService } from './storage'
import { supabase } from './supabase'
import { handleApiError, createAppError, ErrorLogger } from './error-handling'

export interface ExtractionResult {
  success: boolean
  extractionId: string
  text?: string
  metadata?: any
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
          user_id: userId,
          original_name: file.name,
          stored_name: `${extractionId}.pdf`,
          storage_path: `resumes/${userId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${extractionId}.pdf`,
          file_size: file.size,
          mime_type: file.type,
          file_code: extractionId,
          upload_status: 'uploading',
          uploaded_at: new Date().toISOString()
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
          upload_status: 'uploaded',
          storage_url: pdfUrl
        })
        .eq('id', fileRecord.id)
      
      // Step 7: Extract text with multiple fallbacks
      const extractedData = await this.extractWithFallbacks(file)
      
      // Step 8: Store extracted text
      const textPath = await this.storage.storeExtractedText(
        extractedData.text,
        userId,
        extractionId
      )
      
      // Step 9: Update file record with pure extraction results
      await supabase
        .from('file_uploads')
        .update({
          extracted_text: extractedData.text,
          extraction_method: extractedData.method,
          processed_at: new Date().toISOString()
        })
        .eq('id', fileRecord.id)
      
      
      return {
        success: true,
        extractionId,
        text: extractedData.text,
        metadata: extractedData.metadata,
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
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
      const suggestions = errorData.suggestions || []
      
      console.error('PDF extraction API failed:', errorMessage)
      if (suggestions.length > 0) {
        console.log('Suggestions:', suggestions.join('; '))
      }
      
      throw new Error(errorMessage)
    }
    
    const result = await response.json()
    
    // Validate the extracted text
    if (!result.text || result.text.length < 10) {
      throw new Error('PDF extraction returned insufficient text content')
    }
    
    return result
  }
  
  /**
   * Fallback extraction method
   */
  private async extractViaFallback(file: File): Promise<string> {
    // CRITICAL: Never return the same hardcoded text for different files
    console.error('PDF extraction failed for file:', file.name)
    throw new Error(`Unable to extract text from ${file.name}. The PDF may be corrupted, encrypted, or contain only images without OCR.`)
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
      .eq('user_id', userId)
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
        extracted_text: existing.extracted_text,
        is_duplicate: true,
        duplicate_of: existing.id,
        processed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    return {
      success: true,
      extractionId: newExtractionId,
      text: existing.extracted_text,
      metadata: {},
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
  
}