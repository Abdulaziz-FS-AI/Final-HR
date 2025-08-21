const fs = require('fs');
const pdfParse = require('pdf-parse');

async function testExtraction() {
  try {
    // Create a simple test PDF buffer (this is a minimal valid PDF)
    const testPDFContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Content) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000203 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
293
%%EOF`;

    const buffer = Buffer.from(testPDFContent, 'utf-8');
    
    console.log('Testing pdf-parse with test PDF...');
    console.log('Buffer size:', buffer.length);
    
    try {
      const data = await pdfParse(buffer);
      console.log('✅ PDF parsed successfully!');
      console.log('Text extracted:', data.text);
      console.log('Number of pages:', data.numpages);
    } catch (parseError) {
      console.error('❌ pdf-parse failed:', parseError.message);
    }
    
    // Test with a real PDF if it exists
    const testFile = '/Users/abdulaziz.f/Desktop/abdulaziz/2nd project/Final-HR/12.pdf';
    if (fs.existsSync(testFile)) {
      console.log('\nTesting with real file: 12.pdf');
      const realBuffer = fs.readFileSync(testFile);
      console.log('File size:', realBuffer.length, 'bytes');
      
      try {
        const realData = await pdfParse(realBuffer);
        console.log('✅ Real PDF parsed successfully!');
        console.log('Text length:', realData.text.length);
        console.log('First 200 chars:', realData.text.substring(0, 200));
        console.log('Number of pages:', realData.numpages);
      } catch (realError) {
        console.error('❌ Real PDF parsing failed:', realError.message);
        console.error('Error stack:', realError.stack);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExtraction();