import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Diagnostic information
    const diagnostics: any = {
      fileName: file.name,
      fileSize: file.size,
      fileSizeReadable: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      mimeType: file.type,
      bufferSize: buffer.length,
      tests: {}
    }

    // Test 1: Check PDF signature
    const header = buffer.subarray(0, 8).toString('ascii')
    diagnostics.tests.pdfSignature = {
      passed: header.startsWith('%PDF-'),
      header: header,
      message: header.startsWith('%PDF-') 
        ? `Valid PDF signature found: ${header.trim()}`
        : 'Invalid PDF signature - file may not be a PDF'
    }

    // Test 2: Check for encryption
    const first4KB = buffer.toString('ascii', 0, Math.min(buffer.length, 4096))
    const hasEncrypt = first4KB.includes('/Encrypt')
    diagnostics.tests.encryption = {
      passed: !hasEncrypt,
      encrypted: hasEncrypt,
      message: hasEncrypt 
        ? 'PDF appears to be encrypted or password protected'
        : 'No encryption detected'
    }

    // Test 3: Check for EOF marker
    const last1KB = buffer.toString('ascii', Math.max(0, buffer.length - 1024))
    const hasEOF = last1KB.includes('%%EOF')
    diagnostics.tests.eofMarker = {
      passed: hasEOF,
      hasEOF: hasEOF,
      message: hasEOF 
        ? 'Valid EOF marker found'
        : 'Missing EOF marker - PDF may be truncated or corrupted'
    }

    // Test 4: Try basic text extraction
    diagnostics.tests.textExtraction = {
      methods: []
    }

    // Method A: Look for text between parentheses
    const textMatches = first4KB.match(/\(([^)]+)\)/g) || []
    const extractedText = textMatches
      .map(m => m.slice(1, -1))
      .filter(s => s.length > 2 && /[a-zA-Z]/.test(s))
      .join(' ')
      .substring(0, 200)

    diagnostics.tests.textExtraction.methods.push({
      name: 'parentheses',
      foundText: extractedText.length > 0,
      sampleText: extractedText || 'No text found',
      textLength: extractedText.length
    })

    // Method B: Look for BT...ET blocks
    const btBlocks = first4KB.match(/BT\s+(.*?)\s+ET/gs) || []
    diagnostics.tests.textExtraction.methods.push({
      name: 'BT/ET blocks',
      foundBlocks: btBlocks.length,
      message: btBlocks.length > 0 
        ? `Found ${btBlocks.length} text blocks`
        : 'No BT/ET text blocks found'
    })

    // Test 5: Check for common PDF issues
    diagnostics.tests.structure = {
      hasXref: first4KB.includes('xref') || last1KB.includes('xref'),
      hasStartxref: last1KB.includes('startxref'),
      hasTrailer: last1KB.includes('trailer'),
      hasPages: first4KB.includes('/Pages'),
      hasType: first4KB.includes('/Type')
    }

    // Test 6: Try with pdf-parse
    try {
      const pdfParseModule = await import('pdf-parse')
      const pdfParse = pdfParseModule.default || pdfParseModule
      const parseResult = await pdfParse(buffer)
      
      diagnostics.tests.pdfParse = {
        success: true,
        pages: parseResult.numpages,
        textLength: parseResult.text?.length || 0,
        textPreview: parseResult.text?.substring(0, 200) || '',
        info: parseResult.info
      }
    } catch (error: any) {
      diagnostics.tests.pdfParse = {
        success: false,
        error: error.message,
        errorType: error.name
      }
    }

    // Overall assessment
    const problems = []
    if (!diagnostics.tests.pdfSignature.passed) problems.push('Invalid PDF signature')
    if (diagnostics.tests.encryption.encrypted) problems.push('PDF is encrypted')
    if (!diagnostics.tests.eofMarker.passed) problems.push('Missing EOF marker')
    if (!diagnostics.tests.structure.hasXref) problems.push('Missing xref table')
    if (!diagnostics.tests.structure.hasPages) problems.push('No pages structure found')

    diagnostics.overall = {
      isValidPDF: diagnostics.tests.pdfSignature.passed,
      canExtract: diagnostics.tests.pdfParse?.success || false,
      problems: problems,
      recommendation: problems.length === 0 
        ? 'PDF appears valid and should be extractable'
        : `Issues detected: ${problems.join(', ')}`
    }

    // Suggestions based on diagnostics
    diagnostics.suggestions = []
    if (diagnostics.tests.encryption.encrypted) {
      diagnostics.suggestions.push('Remove password protection from the PDF')
      diagnostics.suggestions.push('Use a PDF tool to decrypt the file first')
    }
    if (!diagnostics.tests.eofMarker.passed) {
      diagnostics.suggestions.push('PDF may be corrupted - try re-downloading or re-creating it')
      diagnostics.suggestions.push('Use a PDF repair tool to fix the file')
    }
    if (!diagnostics.tests.pdfSignature.passed) {
      diagnostics.suggestions.push('File does not appear to be a valid PDF')
      diagnostics.suggestions.push('Ensure the file extension matches the actual file type')
    }
    if (diagnostics.tests.pdfParse?.error?.includes('Image')) {
      diagnostics.suggestions.push('PDF may contain only images without text')
      diagnostics.suggestions.push('Use OCR software to extract text from images')
    }

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error: any) {
    console.error('PDF diagnostic error:', error)
    return NextResponse.json(
      { 
        error: 'Diagnostic failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}