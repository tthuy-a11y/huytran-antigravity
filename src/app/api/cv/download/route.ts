import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { CVDocument } from '@/components/cv/CVDocument';

export async function GET() {
  try {
    // Generate the PDF stream
    const stream = await renderToStream(React.createElement(CVDocument));

    // Convert stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Create the response with the PDF Buffer
    const response = new NextResponse(pdfBuffer);

    // Set headers for download
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '.'); // e.g. 2026.05
    const filename = `CV_TranThanhHuy_Frontend_Developer_${dateStr}.pdf`;

    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return response;
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message + " | " + error.stack;
    } else {
      try { errorMessage = JSON.stringify(error); } catch(e) { errorMessage = String(error); }
    }
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: errorMessage },
      { status: 500 }
    );
  }
}
