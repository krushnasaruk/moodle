import { NextResponse } from 'next/server';
import { copyFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
    try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const dirsToProcess = [
            { path: join(process.cwd(), '..', 'bee notes quetions bank assignments'), subject: 'BEE' },
            { path: join(process.cwd(), '..', 'iks assignments'), subject: 'Indian Knowledge System (IKS)' },
            { path: join(process.cwd(), '..', 'fpl assignment notes question bank paper'), subject: 'FPL' },
            { path: join(process.cwd(), '..', 'pps notes assignment and question bank with papers'), subject: 'PPS' }
        ];

        let metadataList = [];

        for (const { path: dirPath, subject } of dirsToProcess) {
            let files;
            try {
                files = await readdir(dirPath);
            } catch (e) {
                console.warn("Could not read directory", dirPath, e.message);
                continue;
            }

            for (const file of files) {
                const extMatch = file.match(/\.[0-9a-z]+$/i);
                if (!extMatch) continue;

                // Determine type
                let type = 'Notes';
                const lowerFile = file.toLowerCase();
                if (lowerFile.includes('assignment')) type = 'Assignment';
                else if (lowerFile.includes('question bank') || lowerFile.includes('qb')) type = 'PYQ';

                const safeName = file.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const uniqueName = `${Date.now()}_${safeName}`;
                
                const sourcePath = join(dirPath, file);
                const destPath = join(uploadDir, uniqueName);
                
                await copyFile(sourcePath, destPath);
                
                const stats = await stat(sourcePath);

                const metadata = {
                    title: file.replace(extMatch[0], ''),
                    subject: subject,
                    type: type,
                    branch: 'All', 
                    year: '1st Year',
                    description: `Auto-seeded from Admin for ${subject}`,
                    fileURL: `/uploads/${uniqueName}`,
                    fileName: uniqueName,
                    fileSize: stats.size,
                    rating: 0,
                    ratingCount: 0,
                    downloads: 0,
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                };

                metadataList.push(metadata);
            }
        }
        
        return NextResponse.json({ success: true, metadataList });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
