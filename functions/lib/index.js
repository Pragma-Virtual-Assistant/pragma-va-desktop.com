"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const db = admin.firestore();
// Define Secrets
const GMAIL_EMAIL = (0, params_1.defineSecret)('GMAIL_EMAIL');
const GMAIL_PASSWORD = (0, params_1.defineSecret)('GMAIL_PASSWORD');
const CONFIG = {
    FROM_ALIAS: 'PragmaVA Team <contact@pragma-va-desktop.com>',
    SUBJECT_OTP: 'Your PragmaVA Verification Code',
    SUBJECT_WELCOME: 'Welcome to PragmaVA Early-Access!',
    SUBJECT_IDEA: 'PragmaVA: Idea Received'
};
exports.api = (0, https_1.onRequest)({
    region: 'us-central1',
    cors: true,
    secrets: [GMAIL_EMAIL, GMAIL_PASSWORD]
}, async (req, res) => {
    // CORS Preflight is handled by the `cors: true` option in Gen 2, 
    // but explicit handling for complicated cases or local dev sometimes helps.
    // We rely on the framework's built-in CORS for simplicity.
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
        }
        else if (action === 'verify_code') {
            await handleVerifyCode(data, res);
        }
        else if (action === 'submit') {
            await handleGenericSubmit(data, res);
        }
        else {
            res.status(400).json({ result: 'error', message: 'Invalid action: ' + action });
        }
    }
    catch (e) {
        console.error("FATAL CRASH:", e);
        res.status(500).json({ result: 'error', message: e.toString() });
    }
});
// --- HANDLERS ---
async function handleRequestCode(data, res) {
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
async function handleVerifyCode(data, res) {
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
    if ((storedData === null || storedData === void 0 ? void 0 : storedData.code) !== userCode.toString()) {
        res.status(400).json({ result: 'error', message: 'Invalid code' });
        return;
    }
    // Code Valid -> Process Original Data
    const originalData = storedData.originalData;
    await processSubmission(originalData);
    // Cleanup OTP
    await docRef.delete();
    // Welcome Email if Waitlist
    // Note: We use the secret value for the sender/admin email if needed
    if (originalData.type === 'waitlist') {
        await sendEmail(email, CONFIG.SUBJECT_WELCOME, `Welcome to PragmaVA! You are on the list.`);
    }
    res.json({ result: 'success', message: 'Verified' });
}
async function handleGenericSubmit(data, res) {
    await processSubmission(data);
    res.json({ result: 'success', message: 'Saved' });
}
// --- HELPERS ---
async function processSubmission(data) {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const submission = Object.assign(Object.assign({}, data), { timestamp });
    delete submission.action; // Cleanup
    // 1. Save to DB
    let collectionName = 'submissions';
    if (data.type === 'waitlist')
        collectionName = 'waitlist';
    else if (data.type === 'contact')
        collectionName = 'contact';
    else if (data.type === 'idea')
        collectionName = 'ideas';
    await db.collection(collectionName).add(submission);
    // 2. Email Logic
    if (data.type === 'contact') {
        const subject = "New Contact: " + (data.email || 'Unknown');
        const body = "New Message:\n\n" + JSON.stringify(data, null, 2);
        // Send to self (the secret email)
        await sendEmail(GMAIL_EMAIL.value(), subject, body);
    }
    else if (data.type === 'waitlist') {
        await sendEmail(data.email, CONFIG.SUBJECT_WELCOME, `Welcome to PragmaVA! You are on the list.`);
    }
    else if (data.type === 'idea') {
        const body = `Thanks for your idea! We'll look into it.\n\nYour Idea: ${data.idea}`;
        await sendEmail(data.email, CONFIG.SUBJECT_IDEA, body);
    }
}
async function sendEmail(to, subject, text) {
    // Access secrets via .value()
    const emailUser = GMAIL_EMAIL.value();
    const emailPass = GMAIL_PASSWORD.value();
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
    }
    catch (e) {
        console.error("Email Failed:", e);
    }
}
//# sourceMappingURL=index.js.map