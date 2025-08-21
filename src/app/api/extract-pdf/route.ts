import { NextRequest, NextResponse } from 'next/server'

// **FIXED** PDF extraction - solves Google Docs artifacts problem
async function extractTextFromPDFRobust(buffer: Buffer) {
  try {
    // Basic PDF signature check
    const pdfHeader = buffer.subarray(0, 8).toString('ascii')
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('File does not appear to be a valid PDF (missing PDF header)')
    }

    // Check for PDF encryption markers
    const bufferStr = buffer.toString('ascii', 0, Math.min(buffer.length, 4096))
    if (bufferStr.includes('/Encrypt') && bufferStr.includes('/Filter')) {
      throw new Error('PDF appears to be encrypted or password protected')
    }

    // Check file size (limit to 5MB as defined in main function)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('PDF file too large (max 5MB)')
    }

    // Try extraction methods in order of preference (most reliable first)
    const methods = [
      () => extractWithPdfParse(buffer),
      () => extractWithSimpleParser(buffer),
      () => extractWithPdfJs(buffer),
      () => extractWithFallback(buffer)
    ]

    let lastError: Error | null = null
    const failedMethods: string[] = []

    for (const method of methods) {
      try {
        const result = await method()
        
        // **CRITICAL FIX** - Enhanced validation that catches your artifacts
        if (result.text && result.text.length > 20 && isCleanText(result.text)) {
          console.log(`✅ FIXED extraction successful with: ${result.method}, text length: ${result.text.length}`)
          return result
        } else {
          console.log(`⚠️ Method ${result.method} returned poor quality text (length: ${result.text?.length || 0}), trying next method`)
          failedMethods.push(`${result.method} (poor quality)`)
        }
      } catch (error) {
        lastError = error as Error
        failedMethods.push(`${(error as any).method || 'unknown'} (${error.message})`)
        console.warn('PDF extraction method failed:', error)
        continue
      }
    }

    // Provide detailed failure information
    const errorDetails = failedMethods.length > 0 
      ? `Methods tried: ${failedMethods.join(', ')}`
      : 'No extraction methods available'

    throw new Error(`All PDF extraction methods failed. ${errorDetails}. Last error: ${lastError?.message}`)
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
    const enhancedError = error as any
    enhancedError.method = 'pdf-parse'
    throw enhancedError
  }
}

async function extractWithPdfJs(buffer: Buffer) {
  try {
    // Dynamic import
    const pdfjs = await import('pdfjs-dist')
    
    // Disable worker for Node.js server environment
    pdfjs.GlobalWorkerOptions.workerSrc = ''

    const doc = await pdfjs.getDocument({ 
      data: buffer,
      verbosity: 0,
      useSystemFonts: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      maxImageSize: 1024 * 1024 // 1MB max image size
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
    const enhancedError = error as any
    enhancedError.method = 'pdfjs'
    throw enhancedError
  }
}

async function extractWithSimpleParser(buffer: Buffer) {
  try {
    const bufferStr = buffer.toString('binary')
    
    // Multiple extraction patterns for different PDF encodings
    const patterns = [
      /\(([^)]+)\)/g,           // Standard text objects (text)
      /\[([^\]]+)\]/g,          // Array text objects [text]
      /<([^>]+)>/g,             // Hex encoded text <text>
      /BT\s+(.*?)\s+ET/gs,      // Text blocks between BT and ET
      /Tj\s*\(([^)]*)\)/g,      // Show text operator with parentheses
      /TJ\s*\[([^\]]*)\]/g      // Show text array operator
    ]
    
    let allMatches: string[] = []
    
    for (const pattern of patterns) {
      const matches = bufferStr.match(pattern) || []
      allMatches = allMatches.concat(matches)
    }
    
    // Extract text from matches
    let text = allMatches
      .map(match => {
        // Remove operators and brackets
        return match
          .replace(/^(BT\s+|Tj\s*\(|TJ\s*\[|\(|\[|<)/, '')
          .replace(/(\)|ET\s*|\]|>)$/, '')
          .trim()
      })
      .filter(str => {
        // Filter for meaningful text
        return str.length > 1 && 
               /[a-zA-Z]/.test(str) && 
               !str.match(/^[0-9\s.,-]+$/) // Skip pure numbers/spacing
      })
      .join(' ')
    
    // Advanced cleaning
    text = text
      .replace(/\\n/g, '\n')           // Convert escaped newlines
      .replace(/\\r/g, '\r')           // Convert escaped carriage returns
      .replace(/\\t/g, '\t')           // Convert escaped tabs
      .replace(/\\\(/g, '(')           // Unescape parentheses
      .replace(/\\\)/g, ')')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Replace non-printable chars
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim()
    
    if (text.length < 20) {
      throw new Error('Simple parser extracted insufficient text')
    }
    
    return {
      text,
      pages: 1,
      method: 'simple-parser',
      confidence: text.length > 100 ? 0.7 : 0.5
    }
  } catch (error) {
    console.error('Simple parser failed:', error)
    const enhancedError = error as any
    enhancedError.method = 'simple-parser'
    throw enhancedError
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
  const startTime = Date.now()
  
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    console.log(`📄 Processing PDF: ${file?.name || 'unnamed'}, size: ${file?.size || 0} bytes`)
    
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. File must be a PDF.` },
        { status: 400 }
      )
    }

    // Check file size limits
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'PDF file is empty (0 bytes)' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json(
        { error: `PDF file too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 5MB.` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text using robust method
    const data = await extractTextFromPDFRobust(buffer)

    const wordCount = data.text.split(/\s+/).filter(w => w.length > 0).length
    const processingTime = Date.now() - startTime

    console.log(`✅ PDF extraction successful: ${file.name}, ${wordCount} words, ${processingTime}ms, method: ${data.method}`)

    return NextResponse.json({
      text: data.text,
      info: { 
        pages: data.pages || 1,
        characters: data.text.length,
        words: wordCount,
        method: data.method,
        extractedPages: (data as any).extractedPages || data.pages || 1,
        processingTime: processingTime
      },
      metadata: { 
        extraction_method: data.method,
        file_size: buffer.length,
        file_name: file.name,
        extraction_quality: wordCount > 100 ? 'high' : wordCount > 20 ? 'medium' : 'low',
        processing_time_ms: processingTime
      },
      pages: data.pages || 1,
      numpages: data.pages || 1
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error(`❌ PDF extraction failed after ${processingTime}ms:`, error)
    
    // Provide specific error messages based on error type
    let userMessage = 'Failed to extract text from PDF'
    let statusCode = 500
    
    if (error.message.includes('corrupted')) {
      userMessage = 'PDF file appears to be corrupted or damaged'
      statusCode = 400
    } else if (error.message.includes('encrypted')) {
      userMessage = 'PDF file is password protected or encrypted'
      statusCode = 400
    } else if (error.message.includes('unsupported format')) {
      userMessage = 'PDF format is not supported or contains only images'
      statusCode = 400
    } else if (error.message.includes('too large')) {
      userMessage = 'PDF file is too large to process'
      statusCode = 400
    } else if (error.message.includes('timeout')) {
      userMessage = 'PDF processing timed out - file may be too complex'
      statusCode = 408
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        details: error.message,
        processing_time_ms: processingTime,
        suggestions: [
          'Ensure the PDF is not password protected',
          'Try converting the PDF to a newer format',
          'Check if the PDF contains searchable text (not just images)',
          'Reduce file size if it\'s very large'
        ]
      },
      { status: statusCode }
    )
  }
}