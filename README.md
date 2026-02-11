# PragmaVA - Desktop Automation Assistant

This is the static marketing landing page for **PragmaVA**, built with Vite + React + TypeScript.

## Features
- Modern, responsive design with Tailwind CSS
- Integration with Firebase Cloud Functions for lead capture and notifications
- Secure Firestore-backed storage and OTP verification

## Development

```bash
# Install dependencies
npm install

# Start local server
npm run dev
```

## Deployment

This site is automatically deployed to Firebase via GitHub Actions.
- **Push to `main`**: Triggers a build and deployment.
- **Secrets**: Requires `VITE_API_BASE_URL` and Firebase configuration to be provided.

## Project Structure
- `src/components`: UI sections (Hero, Features, Forms)
- `src/hooks`: Custom hooks
- `functions`: Firebase Cloud Functions (Gen 2)
- `.github/workflows`: Deployment configuration
