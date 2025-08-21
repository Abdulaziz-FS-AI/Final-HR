import { NextRequest, NextResponse } from 'next/server'

interface ExtractionResult {
  text: string
  pages: number
  method: string
  confidence?: number
  info?: any
  extractionFailed?: boolean
}

// **FIXED PDF EXTRACTION** - Solves your Google Docs artifacts problem
async function extractTextFromPDFFixed(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log(`🔍 Starting FIXED PDF extraction for ${buffer.length} byte file`)
    
    // Check file size (limit to 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('PDF file too large (max 10MB)')
    }

    // Try extraction methods in order of preference
    const methods = [
      () => extractWithEnhancedPdfJs(buffer),
      () => extractWithPdfParse(buffer), 
      () => extractWithTesseractOCR(buffer),
      () => extractWithFallback(buffer)
    ]

    let lastError: Error | null = null

    for (const method of methods) {
      try {
        const result = await method()
        
        // **CRITICAL FIX** - Enhanced validation that catches your artifacts
        if (result.text && result.text.length > 20 && isCleanText(result.text)) {
          console.log(`✅ FIXED extraction successful with: ${result.method}, text length: ${result.text.length}`)
          return result
        } else {
          console.log(`⚠️ Method ${result.method} returned poor quality text, trying next method`)
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`❌ Method failed:`, error)
        continue
      }
    }

    throw new Error(`All PDF extraction methods failed. Last error: ${lastError?.message}`)
  } catch (error) {
    console.error('FIXED PDF extraction error:', error)
    throw error
  }
}

// Method 1: Enhanced PDF.js with better error handling
async function extractWithEnhancedPdfJs(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('📄 Attempting ENHANCED PDF.js extraction...')
    
    const pdfjs = await import('pdfjs-dist')
    
    // Configure for server-side
    if (typeof window === 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = ''
    }

    const doc = await pdfjs.getDocument({ 
      data: buffer,
      verbosity: 0,
      standardFontDataUrl: '',
      cMapUrl: '',
      cMapPacked: false
    }).promise
    
    let text = ''
    const maxPages = Math.min(doc.numPages, 20) // Limit for performance
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        const page = await doc.getPage(i)
        const content = await page.getTextContent({
          includeMarkedContent: false,
          disableNormalization: false
        })
        
        // **ENHANCED** text extraction with better spacing
        const pageText = content.items
          .map((item: any) => {
            if (item.str && typeof item.str === 'string' && item.str.trim()) {
              return item.str.trim()
            }
            return ''
          })
          .filter(str => str.length > 0)
          .join(' ')
        
        if (pageText.trim()) {
          text += pageText + '\n\n'
        }
      } catch (pageError) {
        console.warn(`Failed to extract page ${i}:`, pageError)
        continue
      }
    }
    
    // **ENHANCED** text cleaning
    const cleanedText = text
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .replace(/\n\s*\n\s*\n+/g, '\n\n')  // Fix line breaks
      .trim()
    
    console.log(`📊 Enhanced PDF.js extracted ${cleanedText.length} characters`)
    
    return {
      text: cleanedText,
      pages: doc.numPages,
      method: 'enhanced-pdfjs',
      confidence: 0.9,
      info: {
        totalPages: doc.numPages,
        processedPages: maxPages
      }
    }
  } catch (error) {
    console.error('💥 Enhanced PDF.js failed:', error)
    throw error
  }
}

// Method 2: pdf-parse with validation
async function extractWithPdfParse(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('📋 Attempting pdf-parse extraction...')
    
    const pdfParse = await import('pdf-parse')
    const data = await pdfParse.default(buffer)
    
    console.log(`📝 pdf-parse extracted ${data.text.length} characters`)
    
    return {
      text: data.text,
      pages: data.numpages,
      method: 'pdf-parse',
      confidence: 0.8,
      info: data.info
    }
  } catch (error) {
    console.error('💥 pdf-parse failed:', error)
    throw error
  }
}

// Method 3: Tesseract.js OCR (for scanned PDFs)
async function extractWithTesseractOCR(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('🤖 Attempting Tesseract.js OCR extraction...')
    
    // For server-side, we'll implement a basic fallback
    // In production, you'd convert PDF to images first
    console.log('⚠️ Tesseract.js OCR requires additional setup for server-side')
    throw new Error('Tesseract.js OCR not implemented for server-side yet')
    
  } catch (error) {
    console.error('💥 Tesseract.js OCR failed:', error)
    throw error
  }
}

// Method 4: Smart fallback
async function extractWithFallback(buffer: Buffer): Promise<ExtractionResult> {
  console.log('🆘 Using smart fallback extraction...')
  
  const text = `[PDF EXTRACTION FAILED]

File Information:
- Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB
- Attempted: ${new Date().toISOString()}

This PDF could not be processed. Common causes:
- Complex layouts or formatting
- Scanned document requiring OCR
- Password protection or corruption
- Google Docs rendering artifacts

Recommendations:
1. Try converting to plain text format
2. Re-export as a simpler PDF
3. Use OCR software if scanned
4. Manual text extraction

Note: This is a fallback message - manual review required.`
  
  return {
    text,
    pages: 1,
    method: 'fallback',
    confidence: 0.1,
    extractionFailed: true,
    info: {
      fileSize: buffer.length,
      reason: 'All extraction methods failed'
    }
  }
}

// **CRITICAL FIX** - Enhanced text validation that catches your artifacts
function isCleanText(text: string): boolean {
  if (!text || text.length < 20) {
    console.log('❌ Text too short or empty')
    return false
  }
  
  // **YOUR MAIN PROBLEM** - Check for PDF rendering artifacts
  const badPatterns = [
    /Skia\/PDF/i,                    // ← YOUR ISSUE: Google Docs renderer
    /Google Docs Renderer/i,          // ← YOUR ISSUE: Google Docs artifacts
    /endstream/i,                     // PDF structure
    /endobj/i,                        // PDF structure  
    /\/Type.*\/Font/i,               // Font definitions
    /\/Filter.*\/FlateDecode/i,      // Compression artifacts
    /\/Length\s+\d+/i,               // PDF length headers
    /%%PDF-/i,                        // PDF headers
    /startxref/i,                     // PDF references
    /xref\s+\d+/i,                   // Cross-references
    /\/Root\s+\d+/i,                 // PDF root objects
    /\/Info\s+\d+/i,                 // PDF info objects
    /\/Catalog/i,                     // PDF catalog
    />>.*<<.*>>/,                     // PDF object delimiters
  ]
  
  // **REJECT** if contains PDF artifacts (this fixes your problem!)
  for (const pattern of badPatterns) {
    if (pattern.test(text)) {
      console.log(`❌ Text contains PDF artifacts: ${pattern}`)
      return false
    }
  }
  
  // Check character quality
  const printableText = text.replace(/[^\x20-\x7E\n\r\t]/g, '')
  const printableRatio = printableText.length / text.length
  
  if (printableRatio < 0.7) {
    console.log(`❌ Too many non-printable characters (${Math.round(printableRatio * 100)}%)`)
    return false
  }
  
  // Check word structure
  const words = text.split(/\s+/).filter((w: string) => w.length > 0)
  if (words.length < 5) {
    console.log(`❌ Too few words (${words.length})`)
    return false
  }
  
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
  if (averageWordLength < 2 || averageWordLength > 30) {
    console.log(`❌ Unusual word structure (avg length: ${averageWordLength})`)
    return false
  }
  
  // Check for reasonable text content
  const hasAlphabeticWords = words.some(word => /^[a-zA-Z]{3,}$/.test(word))
  if (!hasAlphabeticWords) {
    console.log('❌ No recognizable alphabetic words found')
    return false
  }
  
  console.log(`✅ Text validation PASSED (${words.length} words, ${Math.round(printableRatio * 100)}% printable)`)
  return true
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 FIXED PDF extraction API called')
    
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    console.log(`📁 Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text using FIXED methods
    const data = await extractTextFromPDFFixed(buffer)

    const wordCount = data.text.split(/\s+/).filter((w: string) => w.length > 0).length
    const quality = data.extractionFailed ? 'failed' : 
                   wordCount > 200 ? 'high' : 
                   wordCount > 50 ? 'medium' : 'low'

    console.log(`🎉 FIXED extraction completed: ${wordCount} words, quality: ${quality}`)

    return NextResponse.json({
      text: data.text,
      info: { 
        pages: data.pages,
        characters: data.text.length,
        words: wordCount,
        method: data.method,
        extractionFailed: data.extractionFailed || false,
        confidence: data.confidence || 0.8,
        quality,
        artifactsDetected: !isCleanText(data.text)
      },
      metadata: { 
        extraction_method: data.method,
        file_size: buffer.length,
        extraction_quality: quality,
        processing_time: new Date().toISOString(),
        fixed_version: true
      },
      pages: data.pages,
      numpages: data.pages,
      success: !data.extractionFailed
    })

  } catch (error: any) {
    console.error('💥 FIXED PDF extraction API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to extract text from PDF',
        details: error.message,
        method: 'none',
        success: false
      },
      { status: 500 }
    )
  }
}