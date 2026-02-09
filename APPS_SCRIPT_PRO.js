/**
 * PragmaVA Advanced Form Handler
 * 
 * FEATURES:
 * 1. Handles 'waitlist', 'idea', and 'contact' submissions.
 * 2. Checks for duplicate emails.
 * 3. Sends Validation/Welcome emails using an Alias.
 * 4. Tracks validation count to prevent spam (Limit: 2).
 * 
 * SETUP:
 * 1. In your Google Sheet, ensure you have these header columns in Row 1:
 *    [Timestamp, Type, Email, Support, Idea_Content, Validated, Email_Sent_Count, First_Seen]
 * 2. Update the CONFIG object below with your details.
 */

const CONFIG = {
    // The exact email alias you have configured in Gmail settings
    FROM_ALIAS: 'contact@pragma-va-desktop.com',

    // Email Subjects
    SUBJECT_WELCOME: 'Welcome to PragmaVA Early Access!',
    SUBJECT_VALIDATE: 'Action Required: Validate your PragmaVA waitlist spot',
    SUBJECT_RETURN: 'We didn\'t forget you! (PragmaVA)',

    // Sheet Name
    SHEET_NAME: 'PragmaVA Waitlist'
};

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
        const data = JSON.parse(e.postData.contents);
        const timestamp = new Date();

        // Extract Data
        const type = data.type || 'unknown';
        const email = data.email || '';
        const support = data.support ? 'Yes' : 'No';
        const content = data.idea || ''; // 'idea' field maps to Idea_Content column

        if (!email) {
            return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'No email provided' }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // --- SMART LOGIC ---

        // 1. Check if email exists
        const ranges = sheet.getDataRange().getValues();
        let rowIndex = -1;
        let existingData = null;

        // Search for email in Column C (Index 2)
        // Start from row 1 (skipping header row 0)
        for (let i = 1; i < ranges.length; i++) {
            if (ranges[i][2] == email) {
                rowIndex = i + 1; // 1-based index for Sheet API
                existingData = ranges[i];
                break;
            }
        }

        if (existingData) {
            // --- EXISTING USER FLOW ---
            const firstSeen = existingData[7] ? new Date(existingData[7]) : timestamp;
            const isValidated = existingData[5] === 'TRUE';
            let emailCount = parseInt(existingData[6] || '0');

            // Update specific fields based on submission type
            if (type === 'idea' || type === 'contact') {
                // Just append the new idea to the existing "Idea_Content" (or you could prefer adding a new row)
                // For simplicity in this structure, let's append a log to the idea column or create a new row if you prefer simple logging.
                // User requested: "Identify if someone already submitted... greet them"
                // Since we can't easily pop UI back, we handle the *Email* communication here.

                // Let's ALWAYS add a new row for Ideas/Contacts to keep history clear, 
                // BUT we carry over their "Verified" status.
                sheet.appendRow([timestamp, type, email, support, content, isValidated, emailCount, firstSeen]);

            } else if (type === 'waitlist') {
                // Re-submission of waitlist
                if (!isValidated && emailCount < 2) {
                    // Resend Validation
                    sendEmail(email, CONFIG.SUBJECT_VALIDATE, createValidationTemplate());
                    // Update count in the ORIGINAL row (or the new one? Let's update the original for tracking)
                    sheet.getRange(rowIndex, 7).setValue(emailCount + 1);
                } else if (isValidated) {
                    // Already validated, maybe send a "Thanks for showing interest again"
                    sendEmail(email, CONFIG.SUBJECT_RETURN, createReturnTemplate(firstSeen));
                }

                // Log this interactions as well
                sheet.appendRow([timestamp, 'waitlist_retry', email, support, '', isValidated, emailCount, firstSeen]);
            }

        } else {
            // --- NEW USER FLOW ---
            // Append new row
            // Cols: [Timestamp, Type, Email, Support, Idea_Content, Validated, Email_Sent_Count, First_Seen]
            sheet.appendRow([timestamp, type, email, support, content, 'FALSE', 1, timestamp]);

            // Send Welcome/Validation Email
            sendEmail(email, CONFIG.SUBJECT_WELCOME, createWelcomeTemplate());
        }

        return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

// --- EMAIL HELPERS ---

function sendEmail(to, subject, htmlBody) {
    try {
        GmailApp.sendEmail(to, subject, '', {
            from: CONFIG.FROM_ALIAS,
            htmlBody: htmlBody,
            name: 'PragmaVA Team'
        });
    } catch (e) {
        // Fallback if alias fails (e.g. not configured)
        console.log('Alias failed, sending as primary: ' + e.toString());
        GmailApp.sendEmail(to, subject, '', {
            htmlBody: htmlBody,
            name: 'PragmaVA Team'
        });
    }
}

function createWelcomeTemplate() {
    return `
    <div style="font-family: sans-serif; max-w-lg mx-auto; color: #333;">
      <h2>Welcome to PragmaVA! 🚀</h2>
      <p>Thanks for joining the waitlist. We're building the ultimate desktop assistant, and we're thrilled to have you on board.</p>
      <p><strong>Please reply to this email</strong> to confirm your address and ensure you get your early access invite.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">Example Validation Email</p>
    </div>
  `;
}

function createValidationTemplate() {
    return `
    <div style="font-family: sans-serif; color: #333;">
      <h2>Action Required 🔒</h2>
      <p>We noticed you signed up again, but we haven't verified your email yet.</p>
      <p>Please click here to verify (Mock Link) or reply to this email.</p>
    </div>
  `;
}

function createReturnTemplate(date) {
    const options = { month: 'long', day: 'numeric' };
    const dateStr = new Date(date).toLocaleDateString('en-US', options);

    return `
    <div style="font-family: sans-serif; color: #333;">
      <h2>Welcome Back! 👋</h2>
      <p>Thanks for checking in again. We remember you! You first joined us on <strong>${dateStr}</strong>.</p>
      <p>We have your spot secured. No need to do anything else!</p>
    </div>
  `;
}
