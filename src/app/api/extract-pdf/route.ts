import { NextRequest, NextResponse } from 'next/server'

// Dynamically import PDF.js to avoid build issues
let pdfjsLib: any = null

async function initPdfJs() {
  if (!pdfjsLib) {
    // Only import on server during runtime
    if (typeof window === 'undefined') {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      // Configure PDF.js worker for legacy build
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      }
    }
  }
  return pdfjsLib
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

    // Extract text using pdf-parse
    const data = await extractTextFromPDF(buffer)

    return NextResponse.json({
      text: data.text,
      info: data.info,
      metadata: {},
      pages: data.numpages
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