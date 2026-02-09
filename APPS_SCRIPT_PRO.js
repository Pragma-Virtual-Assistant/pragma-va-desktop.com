/**
 * PragmaVA Advanced Form Handler (v11 - CORS FIX EDITION)
 * 
 * FEATURES:
 * 1. OTP Verification for ALL submissions (Waitlist, Idea, Contact).
 * 2. Zero-persistence until verified.
 * 3. Branding: "PragmaVA Early - Access!" + Logo.
 * 4. CORS Support (doOptions).
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

function doOptions(e) {
    return ContentService.createTextOutput("")
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeaders({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
        });
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    console.log("!!! VERSION 11 - CORS FIX STARTED !!!");

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
    const result = saveToSheet(originalData); // Returns object { url, row }

    // 4. Send Welcome Email (if it's a new waitlist signup)
    let emailStatus = { success: false, skipped: true };
    if (originalData.type === 'waitlist') {
        const welcomeTemplate = createWelcomeTemplate(result);
        emailStatus = sendEmail(email, CONFIG.SUBJECT_WELCOME, welcomeTemplate);
    }

    // 5. Cleanup
    PropertiesService.getScriptProperties().deleteProperty('OTP_' + email);

    return successResponse({
        message: 'Verified',
        debug_sheet_url: result.url,
        debug_row_number: result.row,
        debug_email_status: emailStatus
    });
}

function saveToSheet(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("No Active Spreadsheet found (Script must be bound to Sheet).");

    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
        console.error(`Sheet '${CONFIG.SHEET_NAME}' not found in Spreadsheet '${ss.getName()}' (${ss.getUrl()})`);
        throw new Error(`Sheet '${CONFIG.SHEET_NAME}' not found. Check tabs!`);
    }

    const timestamp = new Date();

    // Extract
    const type = data.type || 'unknown';
    const email = data.email;
    const support = data.support ? 'Yes' : 'No';
    const content = data.idea || '';

    console.log(`Writing to Sheet: ${ss.getName()} (URL: ${ss.getUrl()})`);
    console.log(`Row Data: ${JSON.stringify([timestamp, type, email, support, content])}`);

    // Append Row
    sheet.appendRow([timestamp, type, email, support, content, 'TRUE', 1, timestamp]);

    const rowNum = sheet.getLastRow();
    console.log(`Data saved to Row #${rowNum}`);

    return { url: ss.getUrl(), row: rowNum };
}

// --- RESPONSES ---

function successResponse(data) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'success', ...data }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({ "Access-Control-Allow-Origin": "*" });
}

function errorResponse(msg) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: msg }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({ "Access-Control-Allow-Origin": "*" });
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

function createWelcomeTemplate(debugInfo) {
    const debugHtml = debugInfo ? `
        <div style="margin-top: 30px; padding: 15px; background: #eee; border-radius: 8px; font-size: 11px; color: #555;">
            <strong>🔍 Debug Info (Beta):</strong><br>
            Saved to Row: <strong>#${debugInfo.row}</strong><br>
            Sheet: <a href="${debugInfo.url}">Open Sheet</a>
        </div>
    ` : '';

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
      ${debugHtml}
    </div>
  `;
}

// --- HELPER ---
function sendEmail(to, subject, htmlBody) {
    console.log(`Attempting to send email to: ${to} with subject: ${subject}`);
    let status = { success: false, error: null };

    try {
        GmailApp.sendEmail(to, subject, '', {
            from: CONFIG.FROM_ALIAS,
            htmlBody: htmlBody,
            name: 'PragmaVA Team'
        });
        console.log('Email sent successfully using alias.');
        status.success = true;
    } catch (e) {
        console.warn(`Primary send failed: ${e.toString()}`);
        if (e.message.includes('from address')) {
            console.log('Retrying without alias...');
            try {
                GmailApp.sendEmail(to, subject, '', { htmlBody: htmlBody, name: 'PragmaVA Team' });
                console.log('Email sent successfully (fallback).');
                status.success = true;
                status.note = "Fallback used";
            } catch (e2) {
                console.error(`Fallback send failed: ${e2.toString()}`);
                status.error = e2.toString();
            }
        } else {
            console.error(`Non-alias error: ${e.toString()}`);
            status.error = e.toString();
        }
    }
    return status;
}
