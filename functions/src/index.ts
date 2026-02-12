import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

const CONFIG = {
    FROM_ALIAS: 'PragmaVA Team <contact@pragma-va-desktop.com>',
    SUBJECT_OTP: 'Your PragmaVA Verification Code',
    SUBJECT_WELCOME: 'Welcome to PragmaVA Early-Access!',
    SUBJECT_IDEA: 'PragmaVA: Idea Received'
};

/**
 * Gen 1 API Endpoint
 * We explicitly set region and runWith to avoid Gen 2 resource conflicts.
 */
export const api = functions
    .region('us-central1')
    .runWith({
        secrets: ['GMAIL_EMAIL', 'GMAIL_PASSWORD'],
        timeoutSeconds: 60,
        memory: '256MB'
    }).https.onRequest(async (req, res) => {
        // Enable CORS manually for Gen 1
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        try {
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            const data = req.body;
            const action = data.action || 'submit';

            // Route Action
            if (action === 'request_code') {
                await handleRequestCode(data, res);
            } else if (action === 'verify_code') {
                await handleVerifyCode(data, res);
            } else if (action === 'submit') {
                await handleGenericSubmit(data, res);
            } else {
                res.status(400).json({ result: 'error', message: 'Invalid action: ' + action });
            }

        } catch (e: any) {
            console.error("FATAL CRASH:", e);
            res.status(500).json({ result: 'error', message: e.toString() });
        }
    });

// --- HANDLERS ---

async function handleRequestCode(data: any, res: any) {
    const email = data.email;
    if (!email) {
        res.status(400).json({ result: 'error', message: 'Email missing' });
        return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const payload = {
        code: code,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        originalData: data
    };

    // Save OTP to Firestore (with overwrite)
    await db.collection('otp_codes').doc(email).set(payload);

    // Send Email
    await sendEmail(email, CONFIG.SUBJECT_OTP, `Your Code is: ${code}`);

    res.json({ result: 'success', message: 'Code sent' });
}

async function handleVerifyCode(data: any, res: any) {
    const email = data.email;
    const userCode = data.code;

    if (!email || !userCode) {
        res.status(400).json({ result: 'error', message: 'Missing credentials' });
        return;
    }

    const docRef = db.collection('otp_codes').doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
        res.status(400).json({ result: 'error', message: 'Code expired or not found.' });
        return;
    }

    const storedData = doc.data();
    if (storedData?.code !== userCode.toString()) {
        res.status(400).json({ result: 'error', message: 'Invalid code' });
        return;
    }

    // Code Valid -> Process Original Data
    const originalData = storedData.originalData;
    await processSubmission(originalData);

    // Cleanup OTP
    await docRef.delete();

    // Welcome Email if Waitlist
    if (originalData.type === 'waitlist') {
        await sendEmail(email, CONFIG.SUBJECT_WELCOME, `Welcome to PragmaVA! You are on the list.`);
    }

    res.json({ result: 'success', message: 'Verified' });
}

async function handleGenericSubmit(data: any, res: any) {
    await processSubmission(data);
    res.json({ result: 'success', message: 'Saved' });
}

// --- HELPERS ---

async function processSubmission(data: any) {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const submission = { ...data, timestamp };
    delete submission.action; // Cleanup

    // 1. Save to DB
    let collectionName = 'submissions';
    if (data.type === 'waitlist') collectionName = 'waitlist';
    else if (data.type === 'contact') collectionName = 'contact';
    else if (data.type === 'idea') collectionName = 'ideas';

    await db.collection(collectionName).add(submission);

    // 2. Email Logic
    if (data.type === 'contact') {
        const subject = "New Contact: " + (data.email || 'Unknown');
        const body = "New Message:\n\n" + JSON.stringify(data, null, 2);
        // Send to self (the secret email)
        await sendEmail(process.env.GMAIL_EMAIL, subject, body);
    }
    else if (data.type === 'waitlist') {
        await sendEmail(data.email, CONFIG.SUBJECT_WELCOME, `Welcome to PragmaVA! You are on the list.`);
    }
    else if (data.type === 'idea') {
        const body = `Thanks for your idea! We'll look into it.\n\nYour Idea: ${data.idea}`;
        await sendEmail(data.email, CONFIG.SUBJECT_IDEA, body);
    }
}

async function sendEmail(to: string | undefined, subject: string, text: string) {
    // Access secrets via process.env in Gen 1
    const emailUser = process.env.GMAIL_EMAIL;
    const emailPass = process.env.GMAIL_PASSWORD;

    if (!to || !emailUser || !emailPass) {
        console.warn("Email skipped: Missing 'to' address or Gmail credentials.");
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        await transporter.sendMail({
            from: CONFIG.FROM_ALIAS,
            to: to,
            subject: subject,
            text: text,
            html: text.replace(/\n/g, '<br>') // Simple HTML fallback
        });
        console.log(`Email sent to ${to}`);
    } catch (e) {
        console.error("Email Failed:", e);
    }
}
