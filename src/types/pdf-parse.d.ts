declare module 'pdf-parse' {
  interface PDFParseResult {
    text: string
    numpages: number
    info: any
    metadata: any
  }

  function pdfParse(buffer: Buffer): Promise<PDFParseResult>
  export = pdfParse
}