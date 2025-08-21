const pdfParse = require('pdf-parse');

// Test if pdf-parse module loads correctly
console.log('pdf-parse module loaded:', typeof pdfParse);
console.log('pdf-parse is a function:', typeof pdfParse === 'function');

// Check if we can access pdf-parse internals
if (pdfParse.default) {
  console.log('Using pdf-parse.default');
} else {
  console.log('Using pdf-parse directly');
}

// Test with empty buffer to see error handling
const emptyBuffer = Buffer.from('');
console.log('\nTesting with empty buffer...');

pdfParse(emptyBuffer)
  .then(data => {
    console.log('Unexpected success with empty buffer');
  })
  .catch(error => {
    console.log('Expected error with empty buffer:', error.message);
  });