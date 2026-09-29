import { NextResponse, type NextRequest } from 'next/server';
import { extractDocumentMetadataWithClaude } from '@/lib/ai/claude';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { base64Data, mimeType, docTypeHint, fileName } = body;

    if (!base64Data) {
      return NextResponse.json(
        { error: 'base64Data is required' },
        { status: 400 }
      );
    }

    const metadata = await extractDocumentMetadataWithClaude({
      base64Data,
      mimeType: mimeType || 'application/pdf',
      docTypeHint,
      fileName,
    });

    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error('Error in /api/ai/extract-doc-dates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract document metadata',
      },
      { status: 500 }
    );
  }
}
