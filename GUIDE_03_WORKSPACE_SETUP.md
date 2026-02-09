# Google Workspace Migration Guide

Since you are moving to a Workspace account (`ronen@evolutionaryml.com`), follow these exact steps to ensure the integration works.

## 1. Prepare the Google Sheet
1.  Log in to your **Workspace Account**.
2.  Create a **New Google Sheet**.
3.  Name it: `PragmaVA Waitlist`.
4.  **Crucial:** Copy these exact headers into Row 1:
    
    | A | B | C | D | E | F | G | H |
    | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
    | **Timestamp** | **Type** | **Email** | **Support** | **Idea_Content** | **Validated** | **Email_Sent_Count** | **First_Seen** |

## 2. Setup the Script
1.  in the Sheet, go to **Extensions > Apps Script**.
2.  Delete any code in `Code.gs`.
3.  Copy and Paste the full code from `APPS_SCRIPT_PRO.js` (file is in your project repo).
    *   *Note:* Ensure `FROM_ALIAS` in the code matches your desired sender address. If you want to send as `ronen@evolutionaryml.com`, you can leave it or update it.

## 3. Deploy (Critical Step)
Refer to your screenshot. You must change one setting:

1.  Click **Deploy** (blue button top right) -> **New deployment**.
2.  **Select type**: Gear icon ⚙️ -> **Web app**.
3.  **Description**: `v1`
4.  **Execute as**: `Me (ronen@evolutionaryml.com)`
5.  **Who has access**: Change this to **Anyone** ⚠️
    *   *Why?* Your website visitors are "Anyone". If you leave it as "Only myself", the form will fail for everyone else.
6.  Click **Deploy**.
7.  **Authorize Access**:
    *   Click *Review permissions*.
    *   Select your account.
    *   If you see "App isn't verified", click **Advanced** -> **Go to (Untitled project) (unsafe)**. (This is normal for internal scripts).
    *   Click **Allow**.

## 4. Get the New URL
1.  Copy the **Web App URL** (starts with `https://script.google.com/macros/s/...`).

## 5. Update GitHub
The website currently points to your *old* Gmail script. We need to point it to the *new* Workspace script.

1.  Go to your GitHub Repo: **Settings > Secrets and variables > Actions**.
2.  Look for `VITE_GOOGLE_SCRIPT_URL`.
3.  Click the **Pencil Icon** (Edit).
4.  Delete the old value and **Paste this NEW Workspace URL**:
    ```text
    https://script.google.com/macros/s/AKfycbysVa038S0DS_Xkaxd8hm6wOfCKEmUif-RnoBVwaneLkCLv6FMxFvRG6o4SgYDiZ0mbYQ/exec
    ```
5.  Click **Update Secret**.

## 6. Trigger a Update
To make the site use the new secret, we need to trigger a redeploy.
1.  Go to the **Actions** tab in GitHub.
2.  Click on the last successful workflow (e.g., "Feat: Mandatory email...").
3.  Top right, click **Re-run jobs** -> **Re-run all jobs**.
    *   *Alternatively:* You can push a small change (like a whitespace change) to trigger it.

**Done!** Your site is now backed by your Workspace account.
