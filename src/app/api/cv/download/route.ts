import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { CVDocument } from '@/components/cv/CVDocument';

export async function GET() {
  try {
    // Generate the PDF stream
    const stream = await renderToStream(React.createElement(CVDocument));

    // Convert NodeJS ReadableStream to Web ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });

    // Create the response with the PDF stream
    const response = new NextResponse(readableStream);

    // Set headers for download
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '.'); // e.g. 2026.05
    const filename = `CV_TranThanhHuy_Frontend_Developer_${dateStr}.pdf`;

    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return response;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
