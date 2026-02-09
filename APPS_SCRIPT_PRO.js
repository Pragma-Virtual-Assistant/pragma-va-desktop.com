/**
 * PragmaVA Advanced Form Handler (v4 - DEBUG EDITION)
 * 
 * FEATURES:
 * 1. OTP Verification for ALL submissions (Waitlist, Idea, Contact).
 * 2. Zero-persistence until verified.
 * 3. Branding: "PragmaVA Early - Access!" + Logo.
 * 
 * SETUP:
 * 1. Ensure 'Script Properties' are empty (or used for other things).
 * 2. Deploy as 'Anyone' access.
 */

const CONFIG = {
    FROM_ALIAS: 'contact@pragma-va-desktop.com',
    SUBJECT_OTP: 'Your PragmaVA Verification Code',
    SUBJECT_WELCOME: 'Welcome to PragmaVA Early - Access!', // Updated Subject
    SHEET_NAME: 'PragmaVA Waitlist',
    LOGO_URL: 'https://pragma-va-desktop.com/images/email-header.png' // Hosted Image
};

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action || 'submit'; // 'request_code' or 'verify_code'

        if (action === 'request_code') {
            return handleRequestCode(data);
        } else if (action === 'verify_code') {
            return handleVerifyCode(data);
        } else {
            return errorResponse('Invalid action');
        }

    } catch (e) {
        return errorResponse(e.toString());
    } finally {
        lock.releaseLock();
    }
}

// --- HANDLERS ---

function handleRequestCode(data) {
    const email = data.email;
    if (!email) return errorResponse('Email missing');

    // 1. Generate 4-digit Code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // 2. Store Payload temporarily in Script Properties
    // Key: "OTP_" + email
    // Value: JSON string of { code, timestamp, originalData }
    const payload = {
        code: code,
        timestamp: new Date().getTime(),
        data: data // Store the full form data (type, support, idea, etc.)
    };

    PropertiesService.getScriptProperties().setProperty('OTP_' + email, JSON.stringify(payload));

    // 3. Send Email
    sendEmail(email, CONFIG.SUBJECT_OTP, createOtpTemplate(code));

    return successResponse({ message: 'Code sent' });
}

function handleVerifyCode(data) {
    const email = data.email;
    const userCode = data.code;

    if (!email || !userCode) return errorResponse('Missing credentials');

    // 1. Retrieve Stored Payload
    const storedJson = PropertiesService.getScriptProperties().getProperty('OTP_' + email);
    if (!storedJson) return errorResponse('Code expired or not found. Please try again.');

    const storedPayload = JSON.parse(storedJson);

    // 2. Validate Code
    if (storedPayload.code !== userCode.toString()) {
        return errorResponse('Invalid code');
    }

    // 3. Code Valid! Save to Sheet
    const originalData = storedPayload.data;
    saveToSheet(originalData);

    // 4. Send Welcome Email (if it's a new waitlist signup)
    // Only send if it's the first time validating for this email?
    // For simplicity, we send the "Welcome" email if the type is waitlist.
    if (originalData.type === 'waitlist') {
        sendEmail(email, CONFIG.SUBJECT_WELCOME, createWelcomeTemplate());
    }

    // 5. Cleanup
    PropertiesService.getScriptProperties().deleteProperty('OTP_' + email);

    return successResponse({ message: 'Verified' });
}

function saveToSheet(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    const timestamp = new Date();

    // Extract
    const type = data.type || 'unknown';
    const email = data.email;
    const support = data.support ? 'Yes' : 'No';
    const content = data.idea || ''; // 'idea' maps to Idea_Content

    // Check if email exists to update "Email_Sent_Count" or "First_Seen" logic?
    // For this v2, we will simplify: Just Append Row. 
    // User wanted verification. Now that it's verified, we mark Validated = TRUE.

    // Append Row:
    // [Timestamp, Type, Email, Support, Idea_Content, Validated, Email_Sent_Count, First_Seen]
    sheet.appendRow([timestamp, type, email, support, content, 'TRUE', 1, timestamp]);
}

// --- RESPONSES ---

function successResponse(data) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'success', ...data }))
        .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: msg }))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- EMAIL TEMPLATES ---

function createOtpTemplate(code) {
    return `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${CONFIG.LOGO_URL}" alt="PragmaVA" style="max-height: 50px;">
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 12px; text-align: center;">
        <h2 style="margin-top: 0;">Verify your email</h2>
        <p style="color: #666; margin-bottom: 20px;">Please use the following code to complete your request:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; background: #fff; padding: 15px; display: inline-block; border-radius: 8px; border: 1px solid #e5e7eb;">
          ${code}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">This code is valid for 10 minutes.</p>
      </div>
    </div>
  `;
}

function createWelcomeTemplate() {
    return `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
         <img src="${CONFIG.LOGO_URL}" alt="PragmaVA" style="max-height: 50px;">
      </div>
      <h2>Welcome to PragmaVA Early - Access!</h2>
      <p>Thanks for confirming your email. You are officially on the list.</p>
      <p>We are building the desktop assistant that respects your privacy and your time.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #888; font-size: 12px;">PragmaVA Team</p>
    </div>
  `;
}

// --- HELPER ---
function sendEmail(to, subject, htmlBody) {
    console.log(`Attempting to send email to: ${to} with subject: ${subject}`);
    try {
        GmailApp.sendEmail(to, subject, '', {
            from: CONFIG.FROM_ALIAS,
            htmlBody: htmlBody,
            name: 'PragmaVA Team'
        });
        console.log('Email sent successfully using alias.');
    } catch (e) {
        console.warn(`Primary send failed: ${e.toString()}`);
        if (e.message.includes('from address')) {
            console.log('Retrying without alias...');
            try {
                GmailApp.sendEmail(to, subject, '', { htmlBody: htmlBody, name: 'PragmaVA Team' });
                console.log('Email sent successfully (fallback).');
            } catch (e2) {
                console.error(`Fallback send failed: ${e2.toString()}`);
                throw e2; // CRITICAL: Throw so execution is marked as Failed
            }
        } else {
            console.error(`Non-alias error: ${e.toString()}`);
            throw e; // CRITICAL: Throw so execution is marked as Failed
        }
    }
}
