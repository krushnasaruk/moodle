import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { filename } = await params;
    
    // Redirect old /uploads/... URLs to the new /api/downloads/... route
    // This fixes 404s for records that were already saved with the old URL format
    const url = new URL(request.url);
    url.pathname = `/api/downloads/${filename}`;
    
    return NextResponse.redirect(url, 301);
}
