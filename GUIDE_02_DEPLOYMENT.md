# Deployment & DNS Guide

## 1. Create the Repository
1. Go to **[GitHub New Repository](https://github.com/organizations/Pragma-Virtual-Assistant/repositories/new)** (Make sure owner is **Pragma-Virtual-Assistant**).
2. Repository name: `pragma-va-desktop.com`.
3. Connectivity: **Public** (required for free GitHub Pages) or **Private** (if you have Pro).
4. Do **not** initialize with README, .gitignore, or License (we already have them).
5. Click **Create repository**.

## 2. Push Code
Run these commands in your *local terminal* (inside the `pragma-va-desktop.com` folder):

```powershell
git init
git add .
git commit -m "Initial launch"
git branch -M main
git remote add origin https://github.com/Pragma-Virtual-Assistant/pragma-va-desktop.com.git
git push -u origin main
```

## 3. Add the Secret (Crucial for Forms)
Since I cannot log into your account, you must do this one step:

1. **[Click this Direct Link](https://github.com/Pragma-Virtual-Assistant/pragma-va-desktop.com/settings/secrets/actions/new)**
   *(If that link doesn't work, go to Settings > Secrets and variables > Actions > New repository secret)*
2. **Name**: `VITE_GOOGLE_SCRIPT_URL`
3. **Secret**: `https://script.google.com/macros/s/AKfycbwmhCVIYZH4twbICu2RDNRVMPhyjlmDBPqtP58yfHQgrRwR7Rf3Lu4YcoKs274bu0pueg/exec`
4. Click **Add secret**.

## 4. Verify Deployment
1. Go to the **Actions** tab in your repo.
2. You should see a workflow running titled "Deploy to GitHub Pages".
3. Once green, go to **Settings > Pages** to see your live URL.

## 5. DNS Setup (Final Step)
Once the site is live at `pragma-virtual-assistant.github.io/pragma-va-desktop.com` (or similar), configure your custom domains:

### In GitHub Settings > Pages
- Custom domain: `pragma-va-desktop.com`
- Save & Enforce HTTPS.

### In Namecheap/GoDaddy
| Type | Host | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | pragma-virtual-assistant.github.io |
