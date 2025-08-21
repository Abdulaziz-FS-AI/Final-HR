'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function PDFTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setDiagnostics(null)
      setError(null)
    }
  }

  const runDiagnostic = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/pdf-diagnostic', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        setDiagnostics(result.diagnostics)
      } else {
        setError(result.error || 'Diagnostic failed')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testExtraction = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`Extraction successful! Extracted ${result.info?.words || 0} words using ${result.metadata?.extraction_method}`)
      } else {
        setError(`Extraction failed: ${result.error}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            PDF Diagnostic Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Select PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={runDiagnostic}
              disabled={!file || loading}
              className="flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Run Diagnostic
            </Button>
            <Button
              onClick={testExtraction}
              disabled={!file || loading}
              variant="outline"
              className="flex items-center"
            >
              <FileText className="mr-2 h-4 w-4" />
              Test Extraction
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Diagnostic Results */}
          {diagnostics && (
            <div className="space-y-4">
              {/* Overall Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      {diagnostics.overall.isValidPDF ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span>Valid PDF: {diagnostics.overall.isValidPDF ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center">
                      {diagnostics.overall.canExtract ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span>Can Extract Text: {diagnostics.overall.canExtract ? 'Yes' : 'No'}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {diagnostics.overall.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* File Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">File Name:</dt>
                    <dd>{diagnostics.fileName}</dd>
                    <dt className="font-medium">File Size:</dt>
                    <dd>{diagnostics.fileSizeReadable}</dd>
                    <dt className="font-medium">MIME Type:</dt>
                    <dd>{diagnostics.mimeType}</dd>
                  </dl>
                </CardContent>
              </Card>

              {/* Test Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* PDF Signature Test */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>PDF Signature</span>
                    <div className="flex items-center">
                      {diagnostics.tests.pdfSignature.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-2 text-sm">{diagnostics.tests.pdfSignature.message}</span>
                    </div>
                  </div>

                  {/* Encryption Test */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>Encryption Check</span>
                    <div className="flex items-center">
                      {!diagnostics.tests.encryption.encrypted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-2 text-sm">{diagnostics.tests.encryption.message}</span>
                    </div>
                  </div>

                  {/* EOF Marker Test */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>EOF Marker</span>
                    <div className="flex items-center">
                      {diagnostics.tests.eofMarker.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-2 text-sm">{diagnostics.tests.eofMarker.message}</span>
                    </div>
                  </div>

                  {/* PDF Parse Test */}
                  {diagnostics.tests.pdfParse && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>PDF Parse Library</span>
                      <div className="flex items-center">
                        {diagnostics.tests.pdfParse.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="ml-2 text-sm">
                          {diagnostics.tests.pdfParse.success
                            ? `Success - ${diagnostics.tests.pdfParse.pages} pages, ${diagnostics.tests.pdfParse.textLength} chars`
                            : `Failed: ${diagnostics.tests.pdfParse.error}`}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Structure Tests */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PDF Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(diagnostics.tests.structure).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className="text-sm">{key}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              {diagnostics.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {diagnostics.suggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700">{suggestion}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Text Preview if available */}
              {diagnostics.tests.pdfParse?.success && diagnostics.tests.pdfParse.textPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Text Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                      {diagnostics.tests.pdfParse.textPreview}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}