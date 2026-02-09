# Google Sheets Integration Setup

Since this is a static site (GitHub Pages), we can't save to a database directly. Instead, we'll use a **Google Apps Script** to receive the form data and append it to a Google Sheet.

## Step 1: Create the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new sheet.
2. Name it `PragmaVA Waitlist`.
3. In the first row (the header), add these columns:
    - **A1**: `Timestamp`
    - **B1**: `Type` (Waitlist vs Idea)
    - **C1**: `Email`
    - **D1**: `Support` (Active/False)
    - **E1**: `Idea_Content`

## Step 2: Create the Script
1. In the Google Sheet, go to **Extensions > Apps Script**.
2. Delete any code in the `Code.gs` file and paste the following:

```javascript
/* 
  PragmaVA Form Handler 
  Accepts JSON POST requests and appends to the active sheet.
*/

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Default values
    var timestamp = new Date();
    var type = data.type || 'unknown';
    var email = data.email || '';
    var support = data.support ? 'Yes' : 'No';
    var idea = data.idea || '';

    // Append to sheet
    sheet.appendRow([timestamp, type, email, support, idea]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. Press `Ctrl+S` (or Command+S) to save the project. Name it "PragmaVA API".

## Step 3: Deploy as Web App
1. Click the blue **Deploy** button > **New deployment**.
2. Click the specific **Select type** gear icon > **Web app**.
3. Configure the settings exactly like this:
    - **Description**: `v1`
    - **Execute as**: `Me` (your email)
    - **Who has access**: `Anyone` (This is CRITICAL - checking "Anyone" allows your static site to post data without login)
4. Click **Deploy**.
5. You may be asked to **Authorize access**.
    - Click "Review permissions".
    - Choose your account.
    - If you see "App isn't verified", click **Advanced** -> **Go to PragmaVA API (unsafe)**. This is safe because it's *your own* script.
    - Click **Allow**.

## Step 4: Connect to Website
1. Copy the **Web App URL** (it starts with `https://script.google.com/macros/s/...`).
2. Open your project folder locally.
3. Create a file named `.env.local` in the root folder (`pragma-va-desktop.com/.env.local`).
4. Paste the URL like this:
   ```env
   VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_LONG_SCRIPT_ID/exec
   ```
5. Restart your local server (`npm run dev`) to test.

## Notes & Security
- **Email Notifications**: To get an email when someone signs up, you can add `MailApp.sendEmail("your@email.com", "New PragmaVA Signup", email);` inside the validation block in the script.
