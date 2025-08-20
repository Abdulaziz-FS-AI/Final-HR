import { NextRequest, NextResponse } from 'next/server'

// Robust PDF extraction with multiple fallback methods
async function extractTextFromPDFRobust(buffer: Buffer) {
  try {
    // Check file size (limit to 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('PDF file too large (max 5MB)')
    }

    // Try extraction methods in order of preference
    const methods = [
      () => extractWithPdfJs(buffer),
      () => extractWithSimpleParser(buffer),
      () => extractWithFallback(buffer)
    ]

    let lastError: Error | null = null

    for (const method of methods) {
      try {
        const result = await method()
        
        // Validate result quality
        if (result.text && result.text.length > 50) {
          return result
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

async function extractWithPdfJs(buffer: Buffer) {
  // Dynamic import with timeout
  const pdfjs = await Promise.race([
    import('pdfjs-dist'),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF.js import timeout')), 10000)
    )
  ]) as any

  // Configure worker path (Node.js environment doesn't need worker)
  if (typeof window === 'undefined') {
    // Server-side: disable worker
    pdfjs.GlobalWorkerOptions.workerSrc = null
  }

  const doc = await pdfjs.getDocument({ 
    data: buffer,
    verbosity: 0,
    standardFontDataUrl: null,
    cMapUrl: null,
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
        .map((item: any) => {
          if (item.str && typeof item.str === 'string') {
            return item.str
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
  // Last resort: return basic file info
  const text = `[PDF Document - ${buffer.length} bytes] 
Failed to extract readable text. This may be a scanned PDF or contain complex formatting.
Please try uploading a text-based PDF or provide the content manually.`
  
  return {
    text,
    pages: 1,
    method: 'fallback',
    extractionFailed: true
  }
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
        extractedPages: data.extractedPages || data.pages || 1,
        extractionFailed: data.extractionFailed || false
      },
      metadata: { 
        extraction_method: data.method,
        file_size: buffer.length,
        extraction_quality: data.extractionFailed ? 'low' : wordCount > 100 ? 'high' : 'medium'
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