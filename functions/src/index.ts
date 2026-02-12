import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

admin.initializeApp();
const db = admin.firestore();
const secretClient = new SecretManagerServiceClient();

const CONFIG = {
    FROM_ALIAS: 'PragmaVA Team <contact@pragma-va-desktop.com>',
    SUBJECT_OTP: 'Your PragmaVA Verification Code',
    SUBJECT_WELCOME: 'Welcome to PragmaVA Early-Access!',
    SUBJECT_IDEA: 'PragmaVA: Idea Received'
};

// Cache for secrets to avoid hitting API limit
let cachedSecrets: { email?: string; pass?: string } = {};

/**
 * Fetch a secret from Secret Manager
 */
async function getSecret(name: string): Promise<string | undefined> {
    try {
        const projectId = process.env.GCLOUD_PROJECT || 'pragmavadesktopinfowebsite';
        const [version] = await secretClient.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        });
        return version.payload?.data?.toString();
    } catch (e) {
        console.error(`Failed to fetch secret ${name}:`, e);
        return undefined;
    }
}

/**
 * Gen 2 API Endpoint - Renamed to apiService.
 * We use invoker: 'private' to prevent CLI from trying to make it public (which is blocked by Org Policy).
 */
export const apiService = onRequest({
    region: 'us-central1',
    invoker: 'private',
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true // Gen 2 has built-in CORS
}, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        // Initialize secrets if not cached
        if (!cachedSecrets.email || !cachedSecrets.pass) {
            console.log("Fetching secrets from Secret Manager...");
            cachedSecrets.email = await getSecret('GMAIL_EMAIL');
            cachedSecrets.pass = await getSecret('GMAIL_PASSWORD');
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
        await sendEmail(cachedSecrets.email, subject, body);
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
    const emailUser = cachedSecrets.email;
    const emailPass = cachedSecrets.pass;

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
