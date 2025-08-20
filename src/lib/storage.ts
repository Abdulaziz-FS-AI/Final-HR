import { supabase } from './supabase'

export const STORAGE_BUCKETS = {
  RESUMES: 'resumes',
  EXTRACTED_TEXTS: 'extracted-texts',
  LOGS: 'extraction-logs'
} as const

export class StorageService {
  /**
   * Upload PDF to Supabase Storage
   */
  async uploadPDF(
    file: File,
    userId: string,
    extractionId: string
  ): Promise<string> {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    
    const path = `resumes/${userId}/${year}/${month}/${extractionId}.pdf`
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.RESUMES)
      .upload(path, file, {
        contentType: 'application/pdf',
        upsert: false
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.RESUMES)
      .getPublicUrl(path)
    
    return publicUrl
  }

  /**
   * Store extracted text
   */
  async storeExtractedText(
    text: string,
    userId: string,
    extractionId: string
  ): Promise<string> {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    
    const path = `texts/${userId}/${year}/${month}/${extractionId}.txt`
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.EXTRACTED_TEXTS)
      .upload(path, text, {
        contentType: 'text/plain',
        upsert: false
      })
    
    if (error) throw error
    
    return path
  }

  /**
   * Calculate file hash for deduplication using Web Crypto API
   */
  async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  /**
   * Get PDF download URL
   */
  async getPDFUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.RESUMES)
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  /**
   * Delete PDF file
   */
  async deletePDF(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.RESUMES)
      .remove([path])
    
    if (error) throw error
  }

  /**
   * Get file size and validate
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Only PDF files are allowed' }
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' }
    }

    // Check file name
    if (file.name.length > 255) {
      return { valid: false, error: 'File name is too long' }
    }

    return { valid: true }
  }
}