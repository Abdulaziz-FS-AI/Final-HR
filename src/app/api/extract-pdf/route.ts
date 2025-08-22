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
      () => extractWithPdfJs(buffer),
      () => extractWithSimpleParser(buffer),
      () => extractWithFallback(buffer)
    ]

    let lastError: Error | null = null
    const failedMethods: string[] = []

    for (let i = 0; i < methods.length; i++) {
      const method = methods[i]
      const methodName = ['pdf-parse', 'simple-parser', 'pdfjs', 'fallback'][i]
      
      console.log(`🔄 Trying extraction method ${i + 1}/${methods.length}: ${methodName}`)
      
      try {
        const result = await method()
        
        // **IMPROVED** - More practical validation that accepts useful content
        if (result.text && result.text.length > 10) {
          if (isCleanText(result.text)) {
            console.log(`✅ Extraction successful with: ${result.method}, text length: ${result.text.length}`)
            return result
          } else if (result.text.length > 50 && methodName === 'aggressive-fallback') {
            // Accept fallback results even if not perfectly clean
            console.log(`✅ Fallback extraction accepted: ${result.method}, text length: ${result.text.length}`)
            return result
          } else {
            console.log(`⚠️ Method ${result.method} returned low quality text (length: ${result.text?.length || 0}), trying next method`)
            failedMethods.push(`${result.method} (low quality)`)
          }
        } else {
          console.log(`⚠️ Method ${result.method} returned insufficient text (length: ${result.text?.length || 0}), trying next method`)
          failedMethods.push(`${result.method} (insufficient text)`)
        }
      } catch (error: any) {
        lastError = error as Error
        const errorMsg = `${methodName} (${error.message})`
        failedMethods.push(errorMsg)
        console.warn(`❌ Method ${methodName} failed:`, error.message)
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
    const pdfParseModule = await import('pdf-parse')
    // Handle both default export and named export patterns
    const pdfParse = pdfParseModule.default || pdfParseModule
    const data = await pdfParse(buffer)
    
    return {
      text: data.text,
      pages: data.numpages,
      method: 'pdf-parse',
      info: data.info
    }
  } catch (error: any) {
    console.error('pdf-parse failed:', error.message)
    console.error('pdf-parse error stack:', error.stack)
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
  try {
    console.log('🔧 Attempting aggressive fallback extraction...')
    
    // Convert buffer to string and try to extract any readable text
    const bufferStr = buffer.toString('binary')
    
    // Very aggressive text extraction patterns
    const patterns = [
      /stream\s+(.*?)\s+endstream/gs,   // Text streams
      /\(\s*([^)]{10,})\s*\)/g,         // Text in parentheses (longer text)
      /\[\s*([^[\]]{10,})\s*\]/g,       // Text in brackets (longer text)
      /<\s*([^<>]{10,})\s*>/g,          // Text in angle brackets (longer text)
      /BT\s+(.*?)\s+ET/gs,              // Between BT and ET operators
      /q\s+(.*?)\s+Q/gs,                // Graphics state operators
      /[a-zA-Z]{3,}(?:\s+[a-zA-Z]{3,})*/g, // Sequences of words
    ]
    
    let extractedText = ''
    const foundTexts: string[] = []
    
    for (const pattern of patterns) {
      const matches = bufferStr.match(pattern) || []
      for (const match of matches) {
        let cleanMatch = match
          .replace(/^(stream\s+|BT\s+|q\s+|\(\s*|\[\s*|<\s*)/, '')
          .replace(/(\s+endstream|\s+ET|\s+Q|\s*\)|\s*\]|\s*>)$/, '')
          .replace(/\\[nrt]/g, ' ')
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        
        if (cleanMatch.length > 5 && /[a-zA-Z]/.test(cleanMatch)) {
          foundTexts.push(cleanMatch)
        }
      }
    }
    
    // Combine and deduplicate
    extractedText = [...new Set(foundTexts)].join(' ')
    
    // Final cleanup
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/(.{1,3})\s+\1/g, '$1') // Remove short repeated sequences
      .trim()
    
    if (extractedText.length < 10) {
      throw new Error('Fallback extraction found insufficient text')
    }
    
    console.log(`✅ Fallback extraction found ${extractedText.length} characters`)
    
    return {
      text: extractedText,
      pages: 1,
      method: 'aggressive-fallback',
      confidence: 0.3
    }
  } catch (error) {
    console.error('Fallback extraction failed:', error)
    throw new Error('All PDF extraction methods failed - PDF may be image-only, corrupted, or encrypted')
  }
}

// **FIXED** - More practical text validation that accepts useful content
function isCleanText(text: string): boolean {
  if (!text || text.length < 10) {
    console.log('❌ Text too short or empty')
    return false
  }
  
  // Only reject if text is MOSTLY PDF artifacts (not just contains them)
  const severeArtifactPatterns = [
    /^endstream\s*endobj/i,           // Starts with PDF structure
    /^%%PDF-[\d.]+\s*$/,              // Only PDF header
    /^\/Type\s*\/Font/i,              // Starts with font definition
    /^xref\s+\d+\s+\d+\s*$/,         // Only cross-reference table
  ]
  
  // Only reject if text is primarily artifacts
  for (const pattern of severeArtifactPatterns) {
    if (pattern.test(text.trim())) {
      console.log(`❌ Text is primarily PDF structure: ${pattern}`)
      return false
    }
  }
  
  // Check if text is mostly gibberish
  const printableText = text.replace(/[^\x20-\x7E\n\r\t]/g, '')
  const printableRatio = printableText.length / text.length
  
  if (printableRatio < 0.5) {
    console.log(`❌ Too many non-printable characters (${Math.round(printableRatio * 100)}%)`)
    return false
  }
  
  // Check for some meaningful content
  const words = text.split(/\s+/).filter((w: string) => w.length > 0)
  if (words.length < 3) {
    console.log(`❌ Too few words (${words.length})`)
    return false
  }
  
  // More lenient word structure check
  const validWords = words.filter(word => /[a-zA-Z]/.test(word))
  if (validWords.length < 2) {
    console.log('❌ No recognizable words found')
    return false
  }
  
  console.log(`✅ Text validation PASSED (${words.length} words, ${validWords.length} valid, ${Math.round(printableRatio * 100)}% printable)`)
  return true
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📥 PDF extraction API called')
    
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    console.log(`📄 Processing PDF: ${file?.name || 'unnamed'}, size: ${file?.size || 0} bytes, type: ${file?.type || 'unknown'}`)
    
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