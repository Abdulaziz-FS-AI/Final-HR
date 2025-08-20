import { NextRequest, NextResponse } from 'next/server'

// More robust PDF extraction with better error handling
async function extractTextFromPDFRobust(buffer: Buffer) {
  try {
    // Check file size (limit to 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('PDF file too large (max 5MB)')
    }

    // Try multiple extraction methods
    const methods = [
      () => extractWithPdfJs(buffer),
      () => extractWithSimpleParser(buffer)
    ]

    for (const method of methods) {
      try {
        return await method()
      } catch (error) {
        console.warn('PDF extraction method failed:', error)
        continue
      }
    }

    throw new Error('All PDF extraction methods failed')
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw error
  }
}

async function extractWithPdfJs(buffer: Buffer) {
  // Dynamic import with timeout
  const pdfjs = await Promise.race([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF.js import timeout')), 5000)
    )
  ]) as any

  // Configure worker
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  }

  const doc = await pdfjs.getDocument({ data: buffer }).promise
  let text = ''
  
  // Limit to 20 pages for performance
  const maxPages = Math.min(doc.numPages, 20)
  
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ') + '\n'
  }
  
  return {
    text: text.trim(),
    pages: doc.numPages,
    method: 'pdfjs'
  }
}

async function extractWithSimpleParser(buffer: Buffer) {
  // Fallback: basic text extraction
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))
  
  return {
    text: text.replace(/[^\x20-\x7E\n]/g, '').trim(),
    pages: 1,
    method: 'fallback'
  }
}

async function extractTextFromPDF(buffer: Buffer) {
  try {
    // Initialize PDF.js
    const pdf = await initPdfJs()
    if (!pdf) {
      throw new Error('PDF.js not available in this environment')
    }
    
    // Load the PDF document
    const loadingTask = pdf.getDocument({
      data: buffer,
      verbosity: 0
    })
    
    const pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages
    let fullText = ''
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Combine text items into readable text
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n'
    }
    
    // Clean up the extracted text
    const cleanedText = fullText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n')  // Remove empty lines
      .trim()
    
    return {
      text: cleanedText,
      info: { 
        pages: numPages,
        characters: cleanedText.length,
        words: cleanedText.split(/\s+/).length
      },
      numpages: numPages
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF: ' + error)
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

    return NextResponse.json({
      text: data.text,
      info: { 
        pages: data.pages,
        characters: data.text.length,
        words: data.text.split(/\s+/).length,
        method: data.method
      },
      metadata: { extraction_method: data.method },
      pages: data.pages
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