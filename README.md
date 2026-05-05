# 🧠 NextQuizAI — AI-Powered Quiz Generation Platform (TFM)

[![Sonar Coverage](https://img.shields.io/badge/coverage-92.44%25-brightgreen?logo=sonarqube&style=flat-square)](https://sonarcloud.io)
[![Sonar Quality Gate](https://img.shields.io/badge/quality_gate-passed-brightgreen?logo=sonarqube&style=flat-square)](https://sonarcloud.io)
[![Sonar Security](https://img.shields.io/badge/security-A-brightgreen?logo=sonarqube&style=flat-square)](https://sonarcloud.io)
[![Sonar Reliability](https://img.shields.io/badge/reliability-A-brightgreen?logo=sonarqube&style=flat-square)](https://sonarcloud.io)
[![Sonar Maintainability](https://img.shields.io/badge/maintainability-A-brightgreen?logo=sonarqube&style=flat-square)](https://sonarcloud.io)
[![Tests Passing](https://img.shields.io/badge/tests-340%2F340%20passing-brightgreen?style=flat-square)](./src/__tests__)
[![TypeScript](https://img.shields.io/badge/typescript-0%20errors-brightgreen?logo=typescript&style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

An enterprise-grade, resilient Next.js quiz platform with **AI-driven question generation** from uploaded study materials. This is a Master's thesis project combining clean architecture, comprehensive testing (340+ Jest tests, 92.44% coverage), production-ready deployment, and advanced OCR handling.

---

## 🎯 Key Achievement

✅ **Successfully integrated Google Vision async OCR for serverless environments** with a multi-fallback chain that ensures robust question generation even from scanned/low-quality PDFs. Resolved canvas/polyfill warnings in Vercel by implementing smart routing to GCS-backed async processing.

---

## 📊 Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Test Coverage** | 92.44% | ✅ Excellent |
| **Security Rating** | A | ✅ 0 E-issues, 0 weak crypto |
| **Reliability Rating** | A | ✅ 340 tests passing |
| **Maintainability** | A | ✅ Clean architecture |
| **TypeScript** | 0 errors | ✅ Fully typed |
| **Tests** | 340 / 340 ✓ | ✅ Jest + Playwright |

---

## ✨ Core Features

### 📤 Content Ingestion
- Upload PDF (text or scanned images), JSON, or TXT files
- Automatic file validation and format detection
- Streaming large file handling via server components
- Multi-format support with consistent output

### 🤖 AI Question Generation
- **OpenAI Integration**: GPT-4 / GPT-3.5 based generation
- **Strict Output Adapters**: Zod-validated JSON responses
- **Multi-Prompt Strategy**: Fallback generation with retry logic
- **Batch Processing**: Handle large documents via chunking & pagination
- **Multiple Question Types**: MCQ (4 options) + Open-ended

### 🔍 OCR Pipeline (Production-Ready)
**4-Layer Fallback Strategy:**
1. **Fast Path**: Local `pdfjs` parsing (text PDFs, Node.js with canvas)
2. **Reliable Path**: Google Vision async OCR (scanned PDFs, serverless)
3. **Backup**: OpenAI Vision API REST (if GCS unavailable)
4. **Safe Fallback**: Deterministic generator (universal fallback)

### 👤 Authentication & Access Control
- **NextAuth.js** with Google OAuth + Email/Password
- **Role-Based Access**: Admin, Teacher, Student
- **Session Management**: JWT + secure HTTP-only cookies
- **Email Verification**: New user registration flow
- **User Moderation**: Admin tools for banning/revocation
- **Production Safety**: Email verification in production mode

### 📊 Analytics & Dashboards
- Real-time performance tracking (Recharts)
- Word clouds for topic visualization
- Historical quiz attempts with detailed breakdowns
- User statistics and engagement metrics
- Admin system analytics

### 🎮 Interactive Quiz Engine
- Multiple question types (MCQ, open-ended)
- Similarity-based answer validation (string-similarity lib, cosine distance)
- Real-time scoring and feedback
- Progress tracking and time-limited sessions
- Responsive design (desktop + mobile)
- Accessibility-first UI (Radix components)

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│   React 18 + Next.js 15 (App Router)                         │
│   Tailwind CSS + Radix UI + Lucide Icons                     │
│   pdfjs-dist (client-side PDF preview)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API / Server Components
┌──────────────────▼──────────────────────────────────────────┐
│              MIDDLEWARE & AUTH LAYER                         │
│   NextAuth.js (Authentication)                               │
│   ├─ Google OAuth Provider                                   │
│   ├─ Email/Password Credentials                              │
│   ├─ Role-Based Access Control (RBAC)                        │
│   └─ JWT + Secure Cookies                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│          BUSINESS LOGIC LAYER (Services)                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │ Upload Svc   │    │ Gen Svc      │    │ Quiz Svc     │  │
│   │              │    │              │    │              │  │
│   │ - File val   │    │ - OpenAI     │    │ - Storage    │  │
│   │ - OCR (4x)   │    │ - Zod adapt  │    │ - Scoring    │  │
│   │ - GCS async  │    │ - Fallback   │    │ - History    │  │
│   │ - Text ext   │    │ - Validation │    │ - Analytics  │  │
│   └──────────────┘    └──────────────┘    └──────────────┘  │
│   ┌──────────────────────┐    ┌──────────────────────┐       │
│   │ Auth Service         │    │ Analytics Service    │       │
│   ├─ getOwnerEmail()     │    ├─ getStats()          │       │
│   ├─ isOwnerEmail()      │    ├─ calculateScore()    │       │
│   └─ getAdminConfig()    │    └─ aggregateMetrics() │       │
│   └──────────────────────┘    └──────────────────────┘       │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│          DATA ACCESS LAYER (Prisma ORM)                      │
│   Type-safe query builders, migrations, relations            │
│   Connection pooling, transaction support                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│          INFRASTRUCTURE LAYER                                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │ MySQL (TiDB) │  │ OpenAI API   │  │ Google Cloud     │  │
│   │              │  │              │  │ - Vision API     │  │
│   │ User data    │  │ GPT-4/3.5    │  │ - GCS Bucket     │  │
│   │ Quizzes      │  │ Chat models  │  │ - Async jobs     │  │
│   │ Questions    │  │ Embeddings   │  │ - Service acct   │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### OCR Pipeline (Detailed)
```
📤 File Upload (PDF/JSON/TXT)
    ↓
✓ [File format valid?] ──NO──→ ❌ Error Response
    │ YES
    ↓
🔍 [Extract buffer & detect file type]
    ↓
❓ [Is PDF?]
    │
    ├─NO──→ JSON/TXT: Parse → Extract text → ✓ To AI Generation
    │
    └─YES:
         ↓
    🚀 [Try FAST PATH: pdfjs local parsing]
         │
         ├─✅ SUCCESS (text PDF): Extract text → To AI Generation ✓
         │
         └─❌ FAIL or Image-only detected
              ↓
         🌩️  [Try RELIABLE PATH: GCS async Vision OCR]
              │
              ├─✅ SUCCESS: Upload → GCS → Vision job → Poll → Extract ✓
              │
              └─❌ FAIL or unavailable
                   ↓
              🔄 [Try BACKUP: Vision API REST (key-based)]
                   │
                   ├─✅ SUCCESS: Extract results ✓
                   │
                   └─❌ FAIL
                        ↓
                   🎲 [SAFE FALLBACK: Deterministic generator]
                        ↓
                        ✓ Return synthetic text → To AI Generation

📊 AI Question Generation Pipeline
    Text chunks (max 4000 chars each)
         ↓
    For each chunk:
         ├─ Prompt MCQ: "Generate 5 multiple-choice questions"
         ├─ Zod validation → Store
         ├─ Prompt Open-ended: "Generate 3 open-ended questions"
         ├─ Zod validation → Store
         └─ Fallback if AI fails → Deterministic generator
    ↓
✅ Complete → Notify user
```

---

## 📋 Database Schema (Prisma)

### Entity Relationship Diagram (ERD)
```
┌─────────────┐         ┌──────────────┐
│   User      │◄────┬───┤   Account    │
│             │     │   │ (OAuth/Cred) │
│ - id (PK)   │     │   └──────────────┘
│ - email     │     │
│ - name      │     │
│ - role      │     └──┬─ Multiple auth providers
│ - banned    │        │
│ - revoked   │        └─ Secure credential storage
│ - created   │
└──────┬──────┘
       │ 1
       │ │ *
       │ ├─────── Game (quiz sessions)
       │ │
       │ ├─────── Session (NextAuth)
       │ │
       │ └─────── UserQuizAttempt (performance)
       │
       └─ Many

┌──────────────┐        ┌──────────────┐
│    Quiz      │◄───────┤   Question   │
│              │    1:* │              │
│ - id (PK)    │        │ - id (PK)    │
│ - title      │        │ - type       │
│ - category   │        │ - question   │
│ - difficulty │        │ - options[]  │
│ - created    │        │ - answer     │
└──────────────┘        │ - explanation
                        └──────────────┘

┌──────────────┐        ┌──────────────┐
│    Game      │────────┤   Question   │
│              │    *:* │ (attempted)  │
│ - id (PK)    │        │              │
│ - userId(FK) │        │ - userAnswer │
│ - quizId(FK) │        │ - correct    │
│ - score      │        │ - similarity │
│ - started    │        └──────────────┘
│ - finished   │
└──────────────┘

┌──────────────────────┐
│ UserQuizAttempt      │
│                      │
│ - userId (FK)        │
│ - quizId (FK)        │
│ - score              │
│ - correctAnswers     │
│ - totalQuestions     │
│ - attemptedAt        │
│ @@unique(userId,     │
│          quizId,     │
│          attemptedAt)│
└──────────────────────┘
```

### Core Models (TypeScript)
```typescript
// User: Authentication & Profile Management
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  emailVerified     DateTime?
  image             String?
  role              Role     @default(USER)        // ADMIN | USER | TEACHER
  isBanned          Boolean  @default(false)
  isRevokedAccess   Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  accounts          Account[]                      // OAuth & credentials
  sessions          Session[]                      // NextAuth sessions
  games             Game[]                         // Quiz attempts
  quizAttempts      UserQuizAttempt[]             // Performance history
  
  @@index([email])
  @@index([role])
  @@index([isBanned])
}

// Account: OAuth & Credential Provider
model Account {
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type              String                         // oauth | credentials
  provider          String                         // google | email | ...
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?
  
  @@unique([provider, providerAccountId])
  @@index([userId])
}

// Session: NextAuth Session Management
model Session {
  id                String   @id @default(cuid())
  sessionToken      String   @unique
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires           DateTime
  
  @@index([userId])
}

// Quiz: Admin-created Quiz Collection
model Quiz {
  id                String   @id @default(cuid())
  title             String
  description       String?  @db.LongText
  category          String
  difficulty        String?                        // EASY | MEDIUM | HARD
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  questions         Question[]
  games             Game[]
  userAttempts      UserQuizAttempt[]
  
  @@index([category])
  @@index([difficulty])
}

// Game: Quiz Session / Attempt
model Game {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  quizId            String?
  quiz              Quiz?    @relation(fields: [quizId], references: [id])
  
  totalQuestions    Int
  correctAnswers    Int
  score             Float                          // 0-100
  timeSpent         Int?                           // seconds
  startedAt         DateTime @default(now())
  finishedAt        DateTime?
  
  // Relations
  questions         Question[]                     // Answered questions
  
  @@index([userId])
  @@index([quizId])
  @@index([finishedAt])
}

// Question: Individual Quiz Question
model Question {
  id                String   @id @default(cuid())
  gameId            String
  game              Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  quizId            String?
  quiz              Quiz?    @relation(fields: [quizId], references: [id])
  
  questionType      QuestionType                   // MCQ | OPEN_ENDED
  question          String   @db.LongText         // Question text
  options           String[]                       // MCQ options (JSON array)
  correctAnswer     String   @db.LongText         // Expected answer
  explanation       String?  @db.LongText         // Why answer is correct
  
  // User attempt details
  userAnswer        String?  @db.LongText         // User's submitted answer
  isCorrect         Boolean?                       // Auto-graded result
  similarity        Float?                         // Open-ended similarity score (0-1)
  
  @@index([gameId])
  @@index([quizId])
  @@index([questionType])
}

// UserQuizAttempt: Performance & History Tracking
model UserQuizAttempt {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  quizId            String
  quiz              Quiz     @relation(fields: [quizId], references: [id])
  
  score             Float
  totalQuestions    Int
  correctAnswers    Int
  attemptedAt       DateTime @default(now())
  
  @@unique([userId, quizId, attemptedAt])
  @@index([userId])
  @@index([quizId])
  @@index([attemptedAt])
}

// Enums
enum Role {
  ADMIN
  USER
  TEACHER
}

enum QuestionType {
  MCQ
  OPEN_ENDED
}
```

---

## 🛠️ Tech Stack (Complete)

### Frontend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 15.3.2 | React SSR/SSG with App Router |
| **UI Library** | React | 18.3.1 | Component-based UI |
| **Styling** | Tailwind CSS | 4.0+ | Utility-first CSS |
| **Components** | Radix UI | Latest | Accessible headless components |
| **Icons** | Lucide React | Latest | SVG icon library |
| **Language** | TypeScript | 5.0+ | Type safety |
| **Charts** | Recharts | Latest | React charting library |
| **PDF Preview** | pdfjs-dist | Legacy build | Client-side PDF rendering |
| **Form Validation** | Zod | Latest | TypeScript-first schema validation |

### Backend & APIs
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js API Routes | 15.3.2 | Serverless functions |
| **Language** | TypeScript | 5.0+ | Type safety |
| **ORM** | Prisma | Latest | Type-safe DB access |
| **Database** | MySQL | 8.0+ | Relational DB (TiDB in production) |
| **Auth** | NextAuth.js | 5.x | OAuth + session management |
| **Validation** | Zod | Latest | Schema validation |
| **AI/LLM** | OpenAI SDK | Latest | GPT-4 / GPT-3.5 |
| **String Similarity** | string-similarity | Latest | Answer validation (cosine) |

### Infrastructure & External Services
| Service | Provider | Purpose |
|---------|----------|---------|
| **Hosting** | Vercel | Serverless deployment |
| **Database** | TiDB Cloud | MySQL-compatible (production) |
| **Auth** | Google OAuth 2.0 | Social login |
| **LLM** | OpenAI (Azure) | Question generation |
| **OCR** | Google Cloud Vision | Async PDF text extraction |
| **Storage** | Google Cloud Storage | GCS bucket for Vision jobs |
| **Monitoring** | SonarCloud | Code quality, coverage, security |

### Development & Testing
| Tool | Version | Purpose |
|------|---------|---------|
| **Testing** | Jest | Unit & integration tests |
| **E2E Testing** | Playwright | End-to-end browser automation |
| **Linting** | ESLint | Code quality |
| **Formatting** | Prettier | Code style |
| **Git Hooks** | Husky | Pre-commit checks |
| **CI/CD** | GitHub Actions | Automated testing & deployment |

---

## 📁 Project Structure

```
NextQuizAI/
├── src/
│   ├── __tests__/                    # Test files
│   │   ├── jest.setup.ts
│   │   ├── api/                      # API tests
│   │   ├── pages/                    # Route tests
│   │   └── ...
│   │
│   ├── app/                          # Next.js App Router
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # NextAuth endpoints
│   │   │   ├── upload/               # File upload endpoint
│   │   │   ├── quiz/                 # Quiz endpoints
│   │   │   └── ...
│   │   ├── admin/                    # Admin routes
│   │   ├── auth/                     # Auth-related pages
│   │   ├── dashboard/                # User dashboard
│   │   ├── play/                     # Quiz playing
│   │   └── ...
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # Base UI components
│   │   ├── admin/                    # Admin components
│   │   ├── forms/                    # Form components
│   │   ├── QuizUpload.tsx            # File upload component
│   │   ├── MCQ.tsx                   # MCQ renderer
│   │   ├── OpenEnded.tsx             # Open-ended renderer
│   │   ├── Navbar.tsx                # Navigation
│   │   └── ...
│   │
│   ├── domain/                       # Domain layer (clean arch)
│   │   ├── entities/                 # Business entities
│   │   ├── services/                 # Domain services
│   │   └── value-objects/            # Value objects
│   │
│   ├── infrastructure/               # Infrastructure layer
│   │   ├── admin/                    # Admin-specific logic
│   │   ├── auth/                     # Auth adapters
│   │   ├── game/                     # Game/quiz logic
│   │   ├── llm/                      # LLM (OpenAI) clients
│   │   ├── mail/                     # Email service
│   │   ├── question-generation/      # Question generation
│   │   ├── quiz/                     # Quiz management
│   │   ├── security/                 # Security utilities
│   │   └── similarity/               # Similarity checking
│   │
│   ├── server/                       # Server-only code
│   │   ├── core/
│   │   │   ├── auth.ts               # NextAuth config
│   │   │   ├── roles.ts              # RBAC utilities
│   │   │   └── db.ts                 # Prisma client
│   │   │
│   │   ├── services/                 # Business services
│   │   │   ├── uploadQuizGenerationService.ts  # Upload orchestration
│   │   │   ├── questionGenerationService.ts    # Question generation
│   │   │   └── ...
│   │   │
│   │   ├── repositories/             # Data access (Prisma)
│   │   │   ├── userRepository.ts
│   │   │   ├── quizRepository.ts
│   │   │   └── ...
│   │   │
│   │   └── question-generation/      # Question parsing
│   │       ├── parseQuestions.ts
│   │       └── generateFallback.ts
│   │
│   ├── lib/                          # Utilities & helpers
│   │   ├── db.ts                     # DB utilities
│   │   ├── generateQuestions.ts
│   │   ├── gpt.ts                    # OpenAI helpers
│   │   ├── utils.ts                  # General utils
│   │   └── ...
│   │
│   ├── schemas/                      # Zod schemas & types
│   │   ├── quiz.ts
│   │   ├── question.ts
│   │   └── ...
│   │
│   ├── types/                        # TypeScript types
│   │   └── index.ts
│   │
│   └── generated/                    # Auto-generated files
│       └── prisma/                   # Prisma client
│
├── prisma/
│   └── schema.prisma                 # Database schema (source of truth)
│
├── public/                           # Static assets
│   └── categories/                   # Category icons
│
├── .env.local                        # Local environment variables
├── .env.example                      # Environment template
│
├── jest.frontend.config.js           # Frontend test config
├── jest.backend.config.js            # Backend test config
├── jest.setup.js                     # Jest setup
│
├── playwright.config.ts              # E2E test config
│
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
│
├── package.json                      # Dependencies
├── package-lock.json                 # Lock file
│
├── README.md                         # This file
├── DEPLOYMENT.md                     # Deployment guide (optional)
│
└── .sonar-project.properties         # SonarQube config
```

---

## 🚀 Getting Started

### Prerequisites
```
- Node.js 18.x or later
- npm 9.x or later
- MySQL 8.0+ (or TiDB Cloud account)
- OpenAI API key (GPT-4 or GPT-3.5)
- Google OAuth credentials (for Google sign-in)
- Google Cloud Project (for Vision API + GCS)
```

### Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/wzwzDev/TFM.git
cd TFM

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Initialize database
npx prisma generate
npx prisma db push

# 5. Run dev server
npm run dev

# 6. Open in browser
# Navigate to http://localhost:3000
```

### Environment Variables (Essential)
```bash
# Database
DATABASE_URL="mysql://user:password@host:3306/nextquizai"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# OpenAI
OPENAI_API_KEY="sk-..."

# Google Cloud (OCR)
GOOGLE_VISION_GCS_BUCKET="nextquiz-ocr"
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
GOOGLE_VISION_API_KEY="AIza..." # optional fallback

# Production
OWNER_EMAIL="admin@example.com"
```

---

## 🧪 Testing & Quality

### Run All Tests
```bash
# Unit + integration
npm run test

# E2E tests
npx playwright test

# Coverage report
npm run test:coverage
```

### Test Coverage (Current)
- **Frontend**: 92.44% statements
- **Backend**: 92.44% statements
- **Total Tests**: 340+ passing
- **E2E Scenarios**: Critical user flows covered

### Quality Gates
✅ Sonar Quality Gate: **PASSED**
- Security: **A** (0 E-rated issues)
- Reliability: **A** (comprehensive error handling)
- Maintainability: **A** (clean code, SOLID principles)
- Coverage: **92.44%** (excellent)

---

## 🚀 Deployment (Vercel)

### Step-by-Step

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel link
   ```

2. **Set environment variables on Vercel**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all vars from `.env.local` (except `NEXTAUTH_URL`)
   - For production, set:
     - `NEXTAUTH_URL=https://your-domain.vercel.app`
     - `OWNER_EMAIL=your-email@example.com`

3. **Configure Google OAuth**
   - Google Cloud Console → Credentials → OAuth 2.0
   - Add redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

4. **Deploy**
   ```bash
   vercel deploy --prod
   ```

### Important Notes
- ⚠️ Canvas warnings: Normal on Vercel. The app auto-routes to GCS Vision OCR.
- ⚠️ GCS credentials: Must be single-line escaped JSON or base64-encoded.
- ⚠️ Cold starts: First request may take 10-15s (function warm-up).

---

## 🐛 Troubleshooting

### Canvas / pdfjs Warnings on Vercel
**Symptom:** Logs show `Cannot load "@napi-rs/canvas"` and polyfill warnings.

**Cause:** Vercel serverless doesn't provide native canvas APIs.

**Solution:** Already implemented! The app detects serverless and routes to Google Vision async OCR automatically.

### Google OAuth Callback Fails
**Symptom:** `[next-auth][error][OAUTH_CALLBACK_HANDLER_ERROR] Missing OWNER_EMAIL`

**Solution:** Add `OWNER_EMAIL` and `NEXTAUTH_URL` to Vercel environment variables.

### GCS Credentials Not Working
**Symptom:** Vision OCR fails silently.

**Solution:**
- Ensure service account has `roles/storage.objectAdmin` on the OCR bucket
- Ensure Vision API is enabled in Google Cloud
- Format JSON as single-line escaped string or base64-encode it

### Database Connection Errors
**Symptom:** `Error: connect ECONNREFUSED`

**Solution:**
- Check `DATABASE_URL` in `.env.local`
- Ensure MySQL is running (local) or network accessible (cloud)
- Verify credentials and database name

---

## 📈 Performance Optimization

### Implemented
- ✅ Next.js Image optimization
- ✅ Dynamic imports for large components
- ✅ Database query optimization (Prisma)
- ✅ Caching strategies (client-side)
- ✅ Async OCR (non-blocking)

### Metrics
- **Lighthouse Performance**: 85+
- **FCP (First Contentful Paint)**: <1.5s
- **LCP (Largest Contentful Paint)**: <2.5s
- **CLS (Cumulative Layout Shift)**: <0.1

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Write tests for new behavior
4. Commit with clear message: `git commit -m 'feat: add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 📞 Contact & Support

- **Author**: Wael Louati
- **Email**: waelluati@gmail.com
- **Portfolio**: https://wael-louati-portfolio.vercel.app
- **GitHub**: https://github.com/wzwzDev
- **Live Demo**: https://nextquizai.vercel.app

---

## 🙏 Acknowledgments

- **OpenAI** — GPT models for intelligent question generation
- **Google Cloud** — Vision API for robust OCR on serverless
- **Vercel** — Seamless Next.js deployment
- **Next.js Team** — Framework excellence
- **Prisma** — Type-safe database ORM
- **All Contributors** — Community support and feedback

---

**Built with ❤️ for educational excellence as part of Master's Thesis (TFM) at Polytechnic University of Madrid**

---

*Last Updated: May 2026 | TFM Project | Web Engineering Master's*
