# PragmaVA - Desktop Automation Assistant

This is the static marketing landing page for **PragmaVA**, built with Vite + React + TypeScript.

## Features
- Modern, responsive design with Tailwind CSS
- Integration with external form services (Google Sheets) via `WaitlistForm` and `IdeaForm`
- Completely static deployment (no backend required)

## Development

```bash
# Install dependencies
npm install

# Start local server
npm run dev
```

## Deployment

This site is automatically deployed to GitHub Pages via GitHub Actions.
- **Push to `main`**: Triggers a build and deployment.
- **Secrets**: Requires `VITE_GOOGLE_SCRIPT_URL` for form functionality.

## Project Structure
- `src/components`: UI sections (Hero, Features, Forms)
- `src/hooks`: Custom hooks (if applicable)
- `.github/workflows`: Deployment configuration
