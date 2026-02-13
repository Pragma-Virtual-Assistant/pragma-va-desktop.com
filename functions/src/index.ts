import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

admin.initializeApp();
const db = admin.firestore();
const secretClient = new SecretManagerServiceClient();

const CONFIG = {
    FROM_ALIAS: 'PragmaVA Team <hello@pragma-va-desktop.com>',
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
 * Helper to ensure secrets are loaded
 */
async function ensureSecrets() {
    if (!cachedSecrets.email || !cachedSecrets.pass) {
        console.log("Fetching secrets from Secret Manager...");
        cachedSecrets.email = await getSecret('GMAIL_EMAIL');
        cachedSecrets.pass = await getSecret('GMAIL_PASSWORD');
    }
}

// --- FIRESTORE TRIGGERS ---

/**
 * Triggered when a new waitlist entry is created.
 */
export const onWaitlistCreated = onDocumentCreated({
    document: 'waitlist/{docId}',
    region: 'us-central1'
}, async (event) => {
    const data = event.data?.data();
    if (!data) return;

    console.log(`New waitlist entry: ${data.email}`);
    await ensureSecrets();
    await sendEmail(data.email, CONFIG.SUBJECT_WELCOME, `Welcome to PragmaVA! You are on the list.`);
});

/**
 * Triggered when a new contact message is created.
 */
export const onContactCreated = onDocumentCreated({
    document: 'contact/{docId}',
    region: 'us-central1'
}, async (event) => {
    const data = event.data?.data();
    if (!data) return;

    console.log(`New contact message: ${data.email}`);
    await ensureSecrets();

    const subject = "New Contact: " + (data.email || 'Unknown');
    const body = "New Message:\n\n" + JSON.stringify(data, null, 2);
    // Send to self (the secret email)
    await sendEmail(cachedSecrets.email, subject, body);
});

/**
 * Triggered when a new idea entry is created.
 */
export const onIdeaCreated = onDocumentCreated({
    document: 'ideas/{docId}',
    region: 'us-central1'
}, async (event) => {
    const data = event.data?.data();
    if (!data) return;

    console.log(`New idea entry: ${data.email}`);
    await ensureSecrets();

    const body = `Thanks for your idea! We'll look into it.\n\nYour Idea: ${data.idea}`;
    await sendEmail(data.email, CONFIG.SUBJECT_IDEA, body);
});

// --- HTTPS API (Legacy/Backup) ---

export const apiService = onRequest({
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true // Gen 2 has built-in CORS
}, async (req, res) => {
    try {
        console.log(`API Request: ${req.method} ${req.url}`, { body: req.body });
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        await ensureSecrets();

        const data = req.body;
        const action = data.action || 'submit';

        // Route Action
        if (action === 'request_code') {
            await handleRequestCode(data, res);
        } else if (action === 'verify_code') {
            await handleVerifyCode(data, res);
        } else if (action === 'submit' || action === 'submit_idea') {
            await handleIdeaSubmit(data, res);
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
    const { email, type } = data;
    if (!email) {
        res.status(400).json({ result: 'error', message: 'Email missing' });
        return;
    }

    // 1. Check if already in waitlist (obfuscated for privacy)
    let isAlreadyRegistered = false;
    if (type === 'waitlist') {
        const existing = await db.collection('waitlist').where('email', '==', email).limit(1).get();
        if (!existing.empty) {
            isAlreadyRegistered = true;
        }
    }

    // 2. Check for existing block
    const docRef = db.collection('pending_verifications').doc(email);
    const doc = await docRef.get();
    if (doc.exists) {
        const current = doc.data();
        const now = admin.firestore.Timestamp.now();
        if (current?.blockedUntil && current.blockedUntil.toMillis() > now.toMillis()) {
            res.status(429).json({
                result: 'error',
                message: 'Too many attempts.',
                blockedUntil: current.blockedUntil.toMillis()
            });
            return;
        }
    }

    // 3. Handle Email Flow
    if (isAlreadyRegistered) {
        // Obfuscation: Send "Already Registered" email but return success to UI
        await sendEmail(
            email,
            "PragmaVA Waitlist",
            "You are already registered on the PragmaVA early-access waitlist. All is good! We will notify you as soon as we launch."
        );
    } else {
        // New User: Send Verification Code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const payload = {
            code,
            type,
            originalData: data,
            failedAttempts: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
        };

        await docRef.set(payload, { merge: true });

        await sendEmail(
            email,
            `Your Verification Code: ${code}`,
            `Here is your verification code for the PragmaVA ${type || 'request'}: ${code}. It expires in 15 minutes. If you did not request this, please ignore this email.`
        );
    }

    res.json({ result: 'success', message: 'Verification code sent.' });
}

async function handleVerifyCode(data: any, res: any) {
    const { email, code } = data;

    if (!email || !code) {
        res.status(400).json({ result: 'error', message: 'Missing email or code' });
        return;
    }

    // 1. Fetch from pending_verifications
    const docRef = db.collection('pending_verifications').doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
        res.status(400).json({ result: 'error', message: 'Verification session not found. Please request a new code.' });
        return;
    }

    const verification = doc.data();
    const now = admin.firestore.Timestamp.now();

    // 2. Check for block
    if (verification?.blockedUntil && verification.blockedUntil.toMillis() > now.toMillis()) {
        res.status(429).json({
            result: 'error',
            message: 'Account temporarily blocked.',
            blockedUntil: verification.blockedUntil.toMillis()
        });
        return;
    }

    // 3. Validate
    if (verification?.code !== code.toString()) {
        const newAttempts = (verification?.failedAttempts || 0) + 1;
        const updates: any = { failedAttempts: newAttempts };

        if (newAttempts >= 10) {
            const blockTime = new Date();
            blockTime.setMinutes(blockTime.getMinutes() + 5);
            updates.blockedUntil = admin.firestore.Timestamp.fromDate(blockTime);
        }

        await docRef.update(updates);

        res.status(400).json({
            result: 'error',
            message: newAttempts >= 10 ? 'Too many failed attempts. Blocked for 5 minutes.' : 'Invalid verification code.',
            failedAttempts: newAttempts,
            blockedUntil: updates.blockedUntil ? updates.blockedUntil.toMillis() : null
        });
        return;
    }

    if (verification.expiresAt.toMillis() < now.toMillis()) {
        res.status(400).json({ result: 'error', message: 'Verification code expired.' });
        return;
    }

    // 3. Promote to Final Collection
    const originalData = verification.originalData;
    const finalData = {
        ...originalData,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: admin.firestore.FieldValue.serverTimestamp() // Keep compatibility
    };
    delete finalData.action;
    delete finalData.code;

    let collectionName = 'submissions';
    if (originalData.type === 'waitlist') collectionName = 'waitlist';
    else if (originalData.type === 'contact') collectionName = 'contact';
    else if (originalData.type === 'idea') collectionName = 'ideas';

    await db.collection(collectionName).add(finalData);

    // 4. Cleanup
    await docRef.delete();

    // 5. Final Confirmation Email
    if (originalData.type === 'waitlist') {
        await sendEmail(email, CONFIG.SUBJECT_WELCOME, `Welcome to PragmaVA! You are now officially on the early-access waitlist.`);
    } else {
        await sendEmail(email, "Request Received", `Thank you! We have received your ${originalData.type} and will review it shortly.`);
    }

    res.json({ result: 'success', message: 'Verified and saved.' });
}

async function handleIdeaSubmit(data: any, res: any) {
    const { idea, email } = data;
    const finalData = {
        idea,
        email: email || 'Anonymous user',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('ideas').add(finalData);
    res.json({ result: 'success', message: 'Idea received. Thank you!' });
}

async function handleGenericSubmit(data: any, res: any) {
    // Legacy support
    const finalData = { ...data };
    delete finalData.action;
    await db.collection('submissions').add(finalData);
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
        console.log(`Setting up SMTP transporter for ${emailUser} (Alias: ${CONFIG.FROM_ALIAS})`);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        console.log(`Attempting to send email to ${to}...`);
        const info = await transporter.sendMail({
            from: CONFIG.FROM_ALIAS,
            to: to,
            subject: subject,
            text: text,
            html: text.replace(/\n/g, '<br>') // Simple HTML fallback
        });
        console.log(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    } catch (e) {
        console.error("Email Failed:", e);
    }
}
