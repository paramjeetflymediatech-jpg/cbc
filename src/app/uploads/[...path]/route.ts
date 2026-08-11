import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const relativePath = pathSegments.join('/');
    
    // Check root public/uploads first
    let filePath = path.join(process.cwd(), 'public', 'uploads', relativePath);

    if (!fs.existsSync(filePath)) {
      // Check standalone directory if applicable
      const standalonePath = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', relativePath);
      if (fs.existsSync(standalonePath)) {
        filePath = standalonePath;
      } else {
        return new NextResponse('File Not Found', { status: 404 });
      }
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return new NextResponse('Server Error', { status: 500 });
  }
}
