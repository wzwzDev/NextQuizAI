# NextQuizAI — AI-powered quiz generation (TFM)

A resilient Next.js quiz platform that generates quizzes from uploaded study materials using AI and OCR. This repository is my TFM (Master's thesis) project: it combines a production-grade Next.js app with server-side processing, AI integration, analytics, and deployment-ready configuration.

---

## TL;DR
- Upload a PDF (text or image-based) and the system generates multiple-choice and open-ended questions automatically.
- Scanned/low-quality PDFs are handled by an async Google Vision OCR fallback; otherwise the app uses client/server parsing + OpenAI to generate questions.
- Auth via NextAuth (Google + credentials), persistent storage with Prisma + MySQL, and deployment targeted at Vercel.

---

## Highlights
- Robust AI-driven question generation using OpenAI with strict output adapters.
- Multi-layer OCR: fast local parsing for text PDFs, and reliable Google Vision async OCR for image-only or scanned PDFs.
- Role-based access, admin moderation tools, and analytics dashboards.
- Comprehensive test coverage and CI-friendly scripts.

---

## Features
- AI-generated quizzes (MCQ + open-ended)
- PDF upload handling (text & scanned image PDFs)
- Google Vision async OCR integration for high-quality OCR on serverless
- Authentication with Google OAuth + email/password (NextAuth)
- Admin dashboard: quiz management, user moderation, analytics
- Similarity-based answer scoring for open-ended responses
- Responsive UI (Next.js + Tailwind), accessible components (Radix)

---

## Architecture overview
- Frontend: Next.js 15 (App Router) + React + TypeScript + Tailwind
- Serverless API: Next.js API routes / server components for business logic
- DB: Prisma ORM with MySQL
- AI: OpenAI for question generation and content summarization
- OCR: pdfjs for client/local text extraction; Google Vision async OCR via GCS for image PDFs

Key server files:
- `src/server/services/uploadQuizGenerationService.ts` — PDF handling, OCR fallback chain, and question generation orchestration
- `src/server/core/auth.ts` & `src/server/core/roles.ts` — NextAuth setup and production safety checks

---

## Getting started (developer)

Prerequisites
- Node.js 18+ (recommended)
- npm or pnpm
- MySQL (local or remote)
- OpenAI API key
- (Optional for production testing) Google Cloud project with Vision API & a GCS bucket

Quick start

```bash
# clone
git clone https://github.com/wzwzDev/TFM.git nextquizai
cd nextquizai

# install
author: npm install

# env (see next section for vars)
cp .env.example .env.local
# edit .env.local with your values

# prisma
npx prisma generate
npx prisma db push

# run
npm run dev
```

Environment variables (essential)
- `DATABASE_URL` — Prisma connection string
- `NEXTAUTH_URL` — e.g. `http://localhost:3000` (and production domain)
- `NEXTAUTH_SECRET` — secure secret for NextAuth
- `OPENAI_API_KEY` — OpenAI key
- `OWNER_EMAIL` — (production) owner account used by admin checks

OCR & GCS (production)
- `GOOGLE_VISION_GCS_BUCKET` — bucket name used for async Vision jobs
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` — service account JSON (single-line escaped JSON or base64 encoded). See Troubleshooting > GCS credentials.
- `GOOGLE_VISION_API_KEY` — optional REST fallback key

Notes: never commit secrets. Use Vercel/GCP secret management for production.

---

## Local development and useful commands

```bash
# dev server
npm run dev

# build
npm run build
npm start

# tests
npm run test        # runs both frontend & backend suites
npx playwright test  # e2e

# lint & format
npm run lint
npm run format
```

---

## Deployment notes (Vercel)
1. Set the environment variables in the Vercel dashboard for both Preview and Production.
2. For `GOOGLE_APPLICATION_CREDENTIALS_JSON`, either:
   - Paste the service key JSON as a single-line escaped string (replace newlines with `\n`), or
   - Base64-encode the JSON locally and set `GOOGLE_APPLICATION_CREDENTIALS_BASE64`, then decode it at runtime inside the app.
3. Add this redirect to Google Cloud OAuth credentials for production:
   - `https://<your-vercel-domain>/api/auth/callback/google`
4. Required production envs: `OWNER_EMAIL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, any Google/OpenAI keys.

Important: Vercel serverless instances do not provide native canvas or browser DOM APIs. See Troubleshooting: PDF canvas warnings — the app short-circuits `pdfjs` parsing on serverless and routes files to Google Vision OCR.

---

## Troubleshooting (common issues)

1. Canvas / `pdfjs-dist` warnings on Vercel
   - Symptoms: logs contain `Cannot load "@napi-rs/canvas"`, and polyfill warnings for `DOMMatrix`, `ImageData`, `Path2D`.
   - Cause: `pdfjs` tries to use native canvas bindings which are not available in serverless environments.
   - Fix: Production builds skip server-side `pdfjs` parsing and use the Google Vision async OCR fallback. Locally you can run the full pdfjs flow.

2. Google OAuth callback failing
   - Symptom: `[next-auth][error][OAUTH_CALLBACK_HANDLER_ERROR] Missing OWNER_EMAIL environment variable`
   - Fix: Add `OWNER_EMAIL` and other auth envs to Vercel (or your production host). Ensure `NEXTAUTH_URL` matches deployment domain and Google OAuth redirect URIs are configured.

3. GCS service account credentials
   - Use `GOOGLE_APPLICATION_CREDENTIALS_JSON` as single-line escaped JSON or store as base64 and decode on startup. Ensure the service account has `roles/storage.objectAdmin` on the OCR bucket and that the Vision API is enabled.

---

## How PDF → Question generation works (high level)
1. File uploaded via frontend.
2. Server attempts fast extraction (text PDFs with `pdfjs`) when running on Node with canvas available.
3. If the PDF is image-only or server environment lacks canvas, the file is uploaded to GCS and a Google Vision async job is submitted.
4. OCR results are read from GCS, extracted text is cleaned and paginated.
5. Text chunks are sent to an OpenAI generation pipeline which returns structured question objects.
6. Questions are stored via Prisma and surfaced in the UI.

See `src/server/services/uploadQuizGenerationService.ts` for the concrete implementation.

---

## Testing & Quality
- Unit & integration tests: Jest (run `npm run test`)
- E2E: Playwright (run `npx playwright test`)
- Linting: ESLint + Prettier
- Coverage: scripts produce coverage reports in `coverage/` and `coverage-frontend/`

---

## Contact
- Wael Louati — waelluati@gmail.com
- Portfolio: https://wael-louati-portfolio.vercel.app
- GitHub: https://github.com/wzwzDev

---

## Credits & Acknowledgements
This project is part of my Master’s thesis (TFM). Big thanks to:
- OpenAI — model for generating high-quality questions
- Google Cloud Vision — reliable OCR for scanned documents
- Next.js and the Vercel team for shaping the platform

---
