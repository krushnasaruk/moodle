import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Make file name safe
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filename = `${Date.now()}_${safeName}`;
        
        // Define path to public/uploads
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const filePath = join(uploadDir, filename);

        // Ensure the uploads directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (dirError) {
            console.error("Could not create uploads directory:", dirError);
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Write the file
        await writeFile(filePath, buffer);

        // Return the relative URL which can be accessed instantly
        const fileUrl = `/uploads/${filename}`;
        
        return NextResponse.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error("API Upload Error:", error);
        return NextResponse.json({ error: "Failed to upload file to local server." }, { status: 500 });
    }
}
