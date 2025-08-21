import { NextRequest, NextResponse } from 'next/server'

// **FIXED** PDF extraction - solves Google Docs artifacts problem
async function extractTextFromPDFRobust(buffer: Buffer) {
  try {
    // Check file size (limit to 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('PDF file too large (max 10MB)')
    }

    // Try extraction methods in order of preference
    const methods = [
      () => extractWithPdfJs(buffer),
      () => extractWithPdfParse(buffer),
      () => extractWithSimpleParser(buffer),
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
        console.warn('PDF extraction method failed:', error)
        continue
      }
    }

    throw new Error(`All PDF extraction methods failed. Last error: ${lastError?.message}`)
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw error
  }
}

async function extractWithPdfParse(buffer: Buffer) {
  try {
    const pdfParse = await import('pdf-parse')
    const data = await pdfParse.default(buffer)
    
    return {
      text: data.text,
      pages: data.numpages,
      method: 'pdf-parse',
      info: data.info
    }
  } catch (error) {
    console.error('pdf-parse failed:', error)
    throw error
  }
}

async function extractWithPdfJs(buffer: Buffer) {
  try {
    // Dynamic import
    const pdfjs = await import('pdfjs-dist')
    
    // Configure worker
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
    
    // Limit to 50 pages for performance
    const maxPages = Math.min(doc.numPages, 50)
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        const page = await doc.getPage(i)
        const content = await page.getTextContent({
          includeMarkedContent: false,
          disableNormalization: false
        })
        
        // Extract text with better spacing
        const pageText = content.items
          .map((item: any) => item.str || '')
          .join(' ')
        
        if (pageText.trim()) {
          text += pageText + '\n\n'
        }
      } catch (pageError) {
        console.warn(`Failed to extract page ${i}:`, pageError)
        continue
      }
    }
    
    // Clean and validate text
    const cleanedText = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
    
    return {
      text: cleanedText,
      pages: doc.numPages,
      method: 'pdfjs',
      extractedPages: maxPages
    }
  } catch (error) {
    console.error('PDF.js extraction failed:', error)
    throw error
  }
}

async function extractWithSimpleParser(buffer: Buffer) {
  // Try to extract readable text from PDF buffer
  const bufferStr = buffer.toString('binary')
  const textMatches = bufferStr.match(/\(([^)]+)\)/g) || []
  
  let text = textMatches
    .map(match => match.slice(1, -1))
    .filter(str => str.length > 2 && /[a-zA-Z]/.test(str))
    .join(' ')
  
  // Clean extracted text
  text = text
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  return {
    text,
    pages: 1,
    method: 'simple-parser'
  }
}

async function extractWithFallback(buffer: Buffer) {
  // CRITICAL: This should NEVER return the same text for different files
  // If we reach this point, extraction has failed completely
  throw new Error('PDF extraction failed - all methods exhausted. The PDF may be corrupted, encrypted, or in an unsupported format.')
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text using robust method
    const data = await extractTextFromPDFRobust(buffer)

    const wordCount = data.text.split(/\s+/).filter(w => w.length > 0).length

    return NextResponse.json({
      text: data.text,
      info: { 
        pages: data.pages || 1,
        characters: data.text.length,
        words: wordCount,
        method: data.method,
        extractedPages: (data as any).extractedPages || data.pages || 1,
        extractionFailed: (data as any).extractionFailed || false
      },
      metadata: { 
        extraction_method: data.method,
        file_size: buffer.length,
        extraction_quality: (data as any).extractionFailed ? 'low' : wordCount > 100 ? 'high' : 'medium'
      },
      pages: data.pages || 1,
      numpages: data.pages || 1
    })

  } catch (error: any) {
    console.error('PDF extraction error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to extract text from PDF',
        details: error.message 
      },
      { status: 500 }
    )
  }
}