/**
 * PragmaVA Advanced Form Handler (v16 - FINAL STABLE)
 * 
 * CHANGES:
 * 1. Removed invalid .setHeaders() calls (Fixed TypeError).
 * 2. Kept Global Crash Handler.
 * 3. Kept text/plain support.
 */

const CONFIG = {
    FROM_ALIAS: 'contact@pragma-va-desktop.com',
    SUBJECT_OTP: 'Your PragmaVA Verification Code',
    SUBJECT_WELCOME: 'Welcome to PragmaVA Early - Access!',
    SHEET_NAME: 'PragmaVA Waitlist',
    LOGO_URL: 'https://pragma-va-desktop.com/images/email-header.png'
};

function doOptions(e) {
    return ContentService.createTextOutput("")
        .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
    return ContentService.createTextOutput("PragmaVA API is Active (v16). Use POST to submit.")
        .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
    // Global Lock & Logic Wrapper
    try {
        var lock = LockService.getScriptLock();
        lock.tryLock(10000); // Wait up to 10s
    } catch (e) {
        console.error("Lock Failed: " + e.toString());
    }

    console.log("!!! VERSION 16 - FINAL STABLE STARTED !!!");

    try {
        if (!e) throw new Error("Event object 'e' is undefined. Run from Web App, not Editor.");

        // 1. Parse Data (Handle text/plain or json)
        let data;
        try {
            const rawContent = e.postData ? (e.postData.contents || e.postData.getDataAsString()) : "{}";
            data = JSON.parse(rawContent);
        } catch (parseError) {
            console.error("JSON Parse Error: " + parseError.toString());
            data = {};
        }

        const action = data.action || 'submit';

        // 2. Route Action
        if (action === 'request_code') {
            return handleRequestCode(data);
        } else if (action === 'verify_code') {
            return handleVerifyCode(data);
        } else {
            return errorResponse('Invalid action: ' + action);
        }

    } catch (fatalError) {
        console.error("FATAL CRASH: " + fatalError.toString());
        return errorResponse("Server Error: " + fatalError.toString());
    } finally {
        if (lock) lock.releaseLock();
    }
}

// --- HANDLERS ---

function handleRequestCode(data) {
    try {
        const email = data.email;
        if (!email) return errorResponse('Email missing');

        const code = Math.floor(1000 + Math.random() * 9000).toString();

        const payload = {
            code: code,
            timestamp: new Date().getTime(),
            data: data
        };

        PropertiesService.getScriptProperties().setProperty('OTP_' + email, JSON.stringify(payload));

        // Email Attempt
        const emailStatus = sendEmail(email, CONFIG.SUBJECT_OTP, `Your Code is: ${code}`);
        if (!emailStatus.success) {
            return errorResponse("Failed to send email: " + (emailStatus.error || "Unknown error"));
        }

        return successResponse({ message: 'Code sent' });
    } catch (e) {
        throw new Error("Handler Request Error: " + e.toString());
    }
}

function handleVerifyCode(data) {
    try {
        const email = data.email;
        const userCode = data.code;

        if (!email || !userCode) return errorResponse('Missing credentials');

        const storedJson = PropertiesService.getScriptProperties().getProperty('OTP_' + email);
        if (!storedJson) return errorResponse('Code expired or not found. Please try again.');

        const storedPayload = JSON.parse(storedJson);

        if (storedPayload.code !== userCode.toString()) {
            return errorResponse('Invalid code');
        }

        const originalData = storedPayload.data;
        const result = saveToSheet(originalData);

        let emailStatus = { success: false, skipped: true };
        if (originalData.type === 'waitlist') {
            const welcomeTemplate = `Welcome to PragmaVA! You are on the list.`;
            emailStatus = sendEmail(email, CONFIG.SUBJECT_WELCOME, welcomeTemplate);
        }

        PropertiesService.getScriptProperties().deleteProperty('OTP_' + email);

        return successResponse({
            message: 'Verified',
            debug_sheet_url: result.url,
            debug_row_number: result.row,
            debug_email_status: emailStatus
        });
    } catch (e) {
        throw new Error("Handler Verify Error: " + e.toString());
    }
}

function saveToSheet(data) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) throw new Error("No Active Spreadsheet.");

        let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
        if (!sheet) {
            sheet = ss.insertSheet(CONFIG.SHEET_NAME);
            sheet.appendRow(['Timestamp', 'Type', 'Email', 'Support', 'Idea_Content', 'Validated', 'Email_Sent_Count', 'First_Seen']);
        }

        const timestamp = new Date();
        const type = data.type || 'unknown';
        const email = data.email;
        const support = data.support ? 'Yes' : 'No';
        const content = data.idea || '';

        sheet.appendRow([timestamp, type, email, support, content, 'TRUE', 1, timestamp]);
        return { url: ss.getUrl(), row: sheet.getLastRow() };
    } catch (e) {
        throw new Error("Sheet Save Error: " + e.toString());
    }
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

// --- EMAIL ---
function sendEmail(to, subject, body) {
    try {
        GmailApp.sendEmail(to, subject, body);
        return { success: true };
    } catch (e) {
        console.error("Email Error: " + e.toString());
        return { success: false, error: e.toString() };
    }
}
