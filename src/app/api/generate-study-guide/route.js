import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not defined in environment variables.');
            return NextResponse.json({ error: 'AI integration is not configured correctly on the server.' }, { status: 500 });
        }

        const body = await req.json();
        const { year, branch, subject } = body;

        if (!subject || !branch || !year) {
            return NextResponse.json({ error: 'Missing required fields: year, branch, or subject.' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an elite academic professor building a study guide for computer science and engineering students.
        The target demographic is a ${year} student studying ${branch} engineering.
        The subject they need to prepare for is: ${subject}.

        Generate a strict JSON structure containing "summaries" and "questions".
        
        Requirements:
        1. "summaries" must be an array of exactly 5 items (Unit 1 through Unit 5).
        2. Each unit must have a "unit" string (e.g., "Unit 1"), a concise "title" string, and an array of 4 to 6 "points" (bullet points mapping out the most critical sub-topics).
        3. "questions" must be an array of 8 to 10 highly frequent, important exam questions across the units.
        4. Each question must have a "q" string (the actual question) and a "marks" string (e.g., "5 marks" or "10 marks").

        Return ONLY raw JSON. Do not include markdown blocks like \`\`\`json.
        Example Format:
        {
            "summaries": [
                { "unit": "Unit 1", "title": "Introduction", "points": ["Concept A", "Concept B"] }
            ],
            "questions": [
                { "q": "Explain Concept A?", "marks": "10 marks" }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Strip markdown backticks if Gemini includes them
        if (text.startsWith('\`\`\`json')) {
            text = text.substring(7);
        }
        if (text.endsWith('\`\`\`')) {
            text = text.substring(0, text.length - 3);
        }
        if (text.startsWith('\`\`\`')) {
            text = text.substring(3);
        }

        const parsedJson = JSON.parse(text.trim());

        // Validate structure safely
        if (!parsedJson.summaries || !parsedJson.questions) {
            throw new Error('AI returned an invalid JSON schema structure.');
        }

        return NextResponse.json(parsedJson);

    } catch (error) {
        console.error('Gemini Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate plan. Please try again or check the AI key limits.' }, { status: 500 });
    }
}
