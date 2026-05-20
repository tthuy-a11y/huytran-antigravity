import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { CVDocument } from './src/components/cv/CVDocument.tsx';
import fs from 'fs';

async function run() {
  try {
    const stream = await renderToStream(React.createElement(CVDocument));
    const writeStream = fs.createWriteStream('test_output.pdf');
    stream.pipe(writeStream);
    
    writeStream.on('finish', () => {
      console.log('PDF saved to test_output.pdf successfully. Size:', fs.statSync('test_output.pdf').size, 'bytes');
    });
  } catch (err) {
    console.error('Failed to render:', err);
  }
}
run();
