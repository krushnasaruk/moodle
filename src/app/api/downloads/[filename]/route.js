import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request, { params }) {
    const { filename } = await params;
    
    // We expect files to be in public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, filename);

    if (!existsSync(filePath)) {
        return new NextResponse("File not found", { status: 404 });
    }

    try {
        const fileBuffer = await readFile(filePath);
        
        // Determine content type
        const ext = filename.split('.').pop().toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === 'pdf') contentType = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'txt') contentType = 'text/plain';

        const response = new NextResponse(fileBuffer);
        response.headers.set('Content-Type', contentType);
        // Inline allows viewing PDFs in browser instead of forced download
        response.headers.set('Content-Disposition', `inline; filename="${filename}"`);
        
        return response;
    } catch (error) {
        console.error("Error reading file:", error);
        return new NextResponse("Error reading file", { status: 500 });
    }
}
