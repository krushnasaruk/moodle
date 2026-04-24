import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { studentPhone, parentPhone, studentName, assignmentTitle, marks } = body;

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

        // Message body formulation
        const messageText = `🎓 *Grade Update for ${studentName}*\n\nAssignment: *${assignmentTitle}*\nScore: *${marks.obtained}/${marks.max}*\n\nKeep up the great work!`;

        let successStudent = false;
        let successParent = false;

        // If credentials are not set, run in Simulation/Developer Mode
        if (!accountSid || !authToken) {
            console.log('\n=============================================');
            console.log('📱 SIMULATED WHATSAPP MESSAGE (Twilio keys missing)');
            if (studentPhone) {
                console.log(`To Student (${studentPhone}):\n${messageText}`);
                successStudent = true;
            }
            if (parentPhone) {
                console.log(`To Parent (${parentPhone}):\n${messageText}`);
                successParent = true;
            }
            console.log('=============================================\n');
            
            return NextResponse.json({ 
                success: true, 
                simulated: true, 
                message: 'Messages simulated successfully.' 
            });
        }

        // Production Mode: Send actual WhatsApp messages
        const sendTwilioMessage = async (toPhone) => {
            if (!toPhone) return false;
            
            // Twilio requires 'whatsapp:' prefix
            const formattedPhone = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
            
            const params = new URLSearchParams();
            params.append('To', formattedPhone);
            params.append('From', twilioPhoneNumber);
            params.append('Body', messageText);

            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            
            const authHeader = 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Twilio Error:', errorData);
                return false;
            }

            return true;
        };

        if (studentPhone) {
            successStudent = await sendTwilioMessage(studentPhone);
        }
        if (parentPhone) {
            successParent = await sendTwilioMessage(parentPhone);
        }

        return NextResponse.json({ 
            success: true, 
            studentSent: successStudent, 
            parentSent: successParent 
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
