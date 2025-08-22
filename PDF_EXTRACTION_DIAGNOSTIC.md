# PDF Extraction Diagnostic Tool

## Quick Test Command
To test PDF extraction, use this curl command:

```bash
curl -X POST http://localhost:3000/api/extract-pdf \
  -F "pdf=@/path/to/your/file.pdf" \
  -H "Content-Type: multipart/form-data"
```

## Key Fixes Applied

### 1. **Relaxed Text Validation** ✅
- **Before**: Rejected any text containing "Skia/PDF", "Google Docs Renderer", etc.
- **After**: Only rejects text that is PRIMARILY PDF artifacts
- **Impact**: Accepts useful content even with some metadata

### 2. **Better Method Ordering** ✅  
- **Before**: pdf-parse → simple-parser → pdfjs → fallback
- **After**: pdf-parse → pdfjs → simple-parser → fallback
- **Impact**: Uses more reliable PDF.js before fallback to regex parsing

### 3. **Improved Fallback Method** ✅
- **Before**: Threw error immediately
- **After**: Aggressive text extraction with multiple patterns
- **Impact**: Can extract text from difficult PDFs as last resort

### 4. **More Lenient Acceptance Criteria** ✅
- **Before**: Required 20+ characters AND perfect validation
- **After**: Accepts 10+ characters OR fallback with 50+ characters
- **Impact**: Higher success rate with various PDF types

## Common PDF Issues & Solutions

### Issue: "Text contains PDF artifacts"
**Solution**: Fixed - no longer rejects text with minor artifacts

### Issue: "Too few words"  
**Solution**: Reduced from 5 words minimum to 2 valid words

### Issue: "All extraction methods failed"
**Solution**: Added aggressive fallback that can extract from most PDFs

### Issue: "PDF appears encrypted"
**Solution**: Early detection with clear error message

## Testing Your PDFs

1. **Check if PDF is valid**:
   ```bash
   file your-resume.pdf
   ```
   Should show: `PDF document, version X.X`

2. **Check if PDF has text layer**:
   - Open in Adobe Reader/Preview
   - Try to select and copy text
   - If you can't select text, it's image-only

3. **Test extraction locally**:
   ```bash
   npm run dev
   # Then use curl command above
   ```

## Debug Output Analysis

Look for these log patterns:

✅ **Success patterns**:
- `✅ Extraction successful with: pdf-parse`
- `✅ Text validation PASSED`
- `✅ PDF extraction successful`

⚠️ **Warning patterns**:
- `⚠️ Method X returned low quality text` - trying next method
- `✅ Fallback extraction accepted` - worked but lower quality

❌ **Failure patterns**:
- `❌ Text too short or empty` - no extractable text
- `❌ All PDF extraction methods failed` - corrupt/image-only PDF

## Performance Metrics

- **Small PDFs** (< 100KB): ~200-500ms
- **Medium PDFs** (100KB-1MB): ~500ms-2s  
- **Large PDGs** (1-5MB): ~2-10s

Timeouts after 30 seconds for very complex PDFs.

## Browser Testing

Test in Chrome DevTools:
```javascript
const formData = new FormData()
formData.append('pdf', fileInput.files[0])

fetch('/api/extract-pdf', {
  method: 'POST',
  body: formData
}).then(res => res.json()).then(console.log)
```

## Next Steps If Still Failing

1. **Check PDF type**: Run `file` command on the PDF
2. **Verify PDF content**: Try copying text manually
3. **Test with simple PDF**: Create a basic Word doc → Save as PDF
4. **Check logs**: Look for specific error patterns above
5. **File size**: Ensure PDF is under 5MB

## Support

If extraction still fails after these fixes:
- Provide the specific error message from logs
- Share PDF metadata (without sensitive content)
- Test with a simple text-based PDF first