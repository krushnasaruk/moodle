import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not defined in environment variables.');
            return NextResponse.json({ error: 'AI Assistant requires the GEMINI_API_KEY environment variable. Please configure it.' }, { status: 500 });
        }

        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Missing or invalid "messages" array in request body.' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Map the messages array to the format Gemini expects for history
        // The user messages shouldn't contain system prompts so we'll prepend it to the first message 
        // to set the persona.
        
        const systemPrompt = `
You are Sutras AI, an elite academic study assistant and professor designed to help college students.
Your personality is encouraging, knowledgeable, and concise. 
Use modern formatting like markdown headers, lists, code blocks, and bold text for readability.
If a student asks you to explain a concept, explain it clearly with analogies if helpful.
Do not reply with extremely long essays unless deeply complex. Keep it structured.
        `;

        // Format history
        const formattedHistory = [];
        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];
            formattedHistory.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        // The latest message
        const lastMessage = messages[messages.length - 1].content;
        
        // If it's the very first message in the conversation, prepend the system prompt
        const promptToSend = formattedHistory.length === 0 
           ? `${systemPrompt}\n\nStudent Question: ${lastMessage}`
           : lastMessage;

        const result = await chat.sendMessage(promptToSend);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error) {
        console.error('Gemini Chat Error:', error);
        
        // Return a safe error message if quota exceeded
        let errorMessage = 'Failed to generate response.';
        if (error.message?.includes('429')) {
             errorMessage = 'API rate limit exceeded. Please try again later.';
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
