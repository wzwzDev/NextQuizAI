# COMPREHENSIVE API REFACTORING - FULL ANALYSIS

**Date**: June 25, 2026  
**Goal**: Break down complex endpoints into single-responsibility endpoints with proper layering and tests  
**Strategy**: No breaking changes - create new endpoints, keep old ones, deprecate gradually

---

## 📊 COMPLEX ENDPOINTS IDENTIFIED

### 1. ❌ POST /api/game (110 lines) - Does 3 Things
```typescript
Current: 1 endpoint doing 3 operations
- Create game record
- Generate questions from topic
- Save questions to game

Problem: Too many responsibilities
```

**Should be split into:**
```typescript
// 1. Create game
POST /api/quiz/create
  Input: { topic, type }
  Output: { gameId }
  Action: Create game, return ID

// 2. Generate questions
POST /api/quiz/generate
  Input: { topic, type, amount }
  Output: { questions: [] }
  Action: Generate questions from topic

// 3. Save questions to game (Optional - could be implicit)
POST /api/quiz/[gameId]/questions
  Input: { questions: [] }
  Output: { saved: true }
  Action: Save questions to existing game

// Keep /api/game for backward compatibility (calls all 3 internally)
```

---

### 2. ❌ GET /api/start-quiz (147 lines) - Does 3+ Things
```typescript
Current: 1 endpoint doing 3+ operations
- Get quiz details
- Create/ensure pending attempt
- Get completed attempt counts

Problem: Mixed read + write operations
```

**Should be split into:**
```typescript
// 1. Get quiz details
GET /api/quiz/[quizId]
  Input: quizId
  Output: { quiz, questions, allowedAttempts, completedAttempts }
  Action: Fetch quiz metadata

// 2. Start quiz attempt
POST /api/quiz/[quizId]/start
  Input: quizId
  Output: { attemptId, quiz, questions }
  Action: Create pending attempt

// 3. Get user attempts history
GET /api/quiz/[quizId]/attempts
  Input: quizId
  Output: { attempts: [{ id, status, score }] }
  Action: Get user's attempt history

// Keep /api/start-quiz for backward compatibility (calls all 3 internally)
```

---

### 3. ❌ POST /(admin)/upload-and-generate (119 lines) - Does 5+ Things
```typescript
Current: 1 endpoint doing 5+ operations
1. Parse multipart form data
2. Validate file (JSON, TXT, PDF)
3. Extract content (OCR for PDF)
4. Generate questions via OpenAI
5. Format and return response

Problem: Too many concerns (I/O + validation + parsing + generation)
```

**Should be split into:**
```typescript
// 1. Upload file
POST /(admin)/quizzes/upload
  Input: FormData { file }
  Output: { fileId, fileName, size, type }
  Action: Store file, return reference

// 2. Validate file
POST /(admin)/quizzes/validate
  Input: { fileId or file }
  Output: { valid: true, extractedText: "...", fileType: "pdf|json|txt" }
  Action: Validate and extract content

// 3. Generate from file
POST /(admin)/quizzes/generate-from-file
  Input: { fileId or extractedText, category?, difficulty?, quizType?, questionCount? }
  Output: { questions: [] }
  Action: Generate questions from content

// 4. Save as quiz
POST /(admin)/quizzes
  Input: { title, questions: [], category?, difficulty?, quizType? }
  Output: { quizId, quiz }
  Action: Save generated questions as quiz

// Keep /api/(admin)/upload-and-generate as convenience endpoint
// But orchestrate with proper error handling
```

---

### 4. ❌ POST /(admin)/quiz-review (115 lines) - Does 4 Operations
```typescript
Current: 1 endpoint doing 4 operations
- POST: Create quiz (save after review)
- GET: List quizzes (filtered + paginated)
- DELETE: Remove quiz

Problem: Multiple operations in one endpoint (RESTful violation)
```

**Should be split into:**
```typescript
// 1. Create/Save quiz
POST /(admin)/quizzes
  Input: { title, questions, category?, difficulty?, quizType? }
  Output: { quizId, quiz }
  Action: Save quiz

// 2. Get all quizzes
GET /(admin)/quizzes
  Input: query: { category?, difficulty?, page?, limit? }
  Output: { quizzes: [], total }
  Action: List quizzes (filtered, paginated)

// 3. Get single quiz
GET /(admin)/quizzes/[quizId]
  Input: quizId
  Output: { quiz }
  Action: Get quiz details

// 4. Update quiz (NEW)
PUT /(admin)/quizzes/[quizId]
  Input: { title?, questions?, category?, difficulty? }
  Output: { quiz }
  Action: Update quiz

// 5. Delete quiz
DELETE /(admin)/quizzes/[quizId]
  Input: quizId
  Output: { deleted: true }
  Action: Delete quiz
```

---

## 🎯 NEW ORGANIZED STRUCTURE

```
src/app/api/
│
├── auth/                      ← AUTH FLOW
│   ├── register/              (POST)
│   ├── signin/                (POST)
│   ├── verify-email/          (POST)
│   ├── signout/               (POST)
│   └── [...nextauth]/
│
├── quiz/                      ← QUIZ PLAY FLOW (REFACTORED)
│   ├── route.ts               (GET /api/quiz - list library)
│   ├── create/                (POST - create game) ✨ NEW
│   ├── generate/              (POST - generate questions) ✨ NEW
│   ├── library/               (GET - quiz library) ✨ NEW
│   ├── questions/             (UNCHANGED)
│   ├── start/                 (GET - start quiz) ✨ NEW
│   ├── check-answer/          (POST - check answer)
│   ├── end/                   (POST - end game)
│   ├── [quizId]/
│   │   ├── route.ts           (GET - quiz details) ✨ NEW
│   │   ├── start/             (POST - start attempt) ✨ NEW
│   │   ├── attempts/          (GET - user attempts) ✨ NEW
│   │   └── stats/             (GET - stats)
│   └── [attemptId]/
│       └── stats/             (GET - attempt stats)
│
├── (admin)/                   ← ADMIN FLOW (REFACTORED)
│   ├── quizzes/               (NEW - central quiz management)
│   │   ├── route.ts           (POST - create, GET - list)
│   │   ├── upload/            (POST - upload file) ✨ NEW
│   │   ├── validate/          (POST - validate file) ✨ NEW
│   │   ├── generate-from-file/ (POST - generate) ✨ NEW
│   │   └── [quizId]/
│   │       ├── route.ts       (GET, PUT, DELETE) ✨ NEW
│   │       └── (other subresources)
│   │
│   ├── upload-and-generate/   (KEEP for backward compat)
│   │   └── route.ts           (calls new endpoints internally)
│   │
│   ├── quiz-review/           (DEPRECATED - redirects to /quizzes)
│   ├── quiz-statistics/       (GET - stats)
│   ├── adjust-questions-difficulty/ (POST - adjust)
│   ├── ai-review/             (POST - review questions)
│   ├── ai-metrics/            (GET - metrics)
│   └── users/                 (user management)
│
└── user/                      ← USER PROFILE
    ├── profile/
    └── [userId]/
        ├── stats/
        ├── attempts/
        └── preferences/
```

---

## 🏗️ LAYERING STRATEGY (CLEAN ARCHITECTURE)

### For Each New Endpoint:

**1. Domain Layer** (`src/domain/`)
```typescript
// Define business entities and rules
export interface Quiz {
  id: string
  title: string
  questions: Question[]
  category: string
  difficulty: DifficultyLevel
}

// Define use case ports (interfaces)
export interface IQuizRepository {
  createQuiz(quiz: Quiz): Promise<Quiz>
  getQuiz(id: string): Promise<Quiz | null>
  updateQuiz(id: string, quiz: Partial<Quiz>): Promise<Quiz>
  deleteQuiz(id: string): Promise<void>
}
```

**2. Application Layer** (`src/application/usecases/`)
```typescript
// Define use cases with dependency injection
export class CreateQuizUseCase {
  constructor(private quizRepository: IQuizRepository) {}

  async execute(quizData: CreateQuizInput): Promise<Quiz> {
    // Business logic here
    const quiz = Quiz.create(quizData)
    return this.quizRepository.createQuiz(quiz)
  }
}

export class GenerateQuestionsUseCase {
  constructor(
    private questionGenerator: IQuestionGenerator,
    private quizRepository: IQuizRepository,
  ) {}

  async execute(input: GenerateInput): Promise<Question[]> {
    // Generate and validate questions
    const questions = await this.questionGenerator.generate(input)
    return questions
  }
}
```

**3. Infrastructure Layer** (`src/infrastructure/`)
```typescript
// Implement concrete adapters
export class PrismaQuizRepository implements IQuizRepository {
  async createQuiz(quiz: Quiz): Promise<Quiz> {
    const saved = await db.adminQuiz.create({
      data: quiz.toPrisma(),
    })
    return Quiz.fromPrisma(saved)
  }
}
```

**4. Server Layer** (`src/server/`)
```typescript
// Create service instances with dependency injection
export const createQuizUseCase = new CreateQuizUseCase(
  new PrismaQuizRepository(),
)

export const generateQuestionsUseCase = new GenerateQuestionsUseCase(
  new OpenAIQuestionGenerator(),
  new PrismaQuizRepository(),
)
```

**5. API Route** (`src/app/api/`)
```typescript
// Use injected use cases
export async function POST(req: NextRequest) {
  const session = await getAuthSession(req)
  if (!session?.user?.isAdmin) {
    return error(401, "Unauthorized")
  }

  const body = await req.json()
  const input = CreateQuizSchema.parse(body)

  try {
    const quiz = await createQuizUseCase.execute({
      ...input,
      userId: session.user.id,
    })
    return success(201, { quiz })
  } catch (error) {
    return handleError(error)
  }
}
```

---

## ✅ TESTING STRATEGY

### 1. Domain Layer Tests
```typescript
// test/domain/quiz.test.ts
describe('Quiz Entity', () => {
  it('creates quiz with valid data', () => {
    const quiz = Quiz.create({
      title: 'Test Quiz',
      questions: [],
      difficulty: DifficultyLevel.MEDIUM,
    })
    expect(quiz.title).toBe('Test Quiz')
  })

  it('validates quiz before creation', () => {
    expect(() => {
      Quiz.create({ title: '', questions: [] })
    }).toThrow('Title required')
  })
})
```

### 2. Application Layer Tests
```typescript
// test/application/usecases/createQuiz.test.ts
describe('CreateQuizUseCase', () => {
  let useCase: CreateQuizUseCase
  let mockRepository: MockQuizRepository

  beforeEach(() => {
    mockRepository = new MockQuizRepository()
    useCase = new CreateQuizUseCase(mockRepository)
  })

  it('creates quiz through repository', async () => {
    const quiz = await useCase.execute({
      title: 'Test',
      questions: [],
    })
    expect(quiz.id).toBeDefined()
    expect(mockRepository.createCalled).toBe(true)
  })
})
```

### 3. Infrastructure Layer Tests
```typescript
// test/infrastructure/quiz.repository.test.ts
describe('PrismaQuizRepository', () => {
  it('persists quiz to database', async () => {
    const repo = new PrismaQuizRepository()
    const quiz = await repo.createQuiz(testQuiz)
    
    const retrieved = await repo.getQuiz(quiz.id)
    expect(retrieved?.id).toBe(quiz.id)
  })
})
```

### 4. Integration Tests (Route Tests)
```typescript
// test/api/quiz.route.test.ts
describe('POST /api/(admin)/quizzes', () => {
  it('creates quiz through HTTP', async () => {
    const response = await POST(createRequest({
      title: 'Test Quiz',
      questions: [],
      category: 'Math',
    }))

    expect(response.status).toBe(201)
    const { quiz } = await response.json()
    expect(quiz.id).toBeDefined()
  })

  it('returns 400 for invalid input', async () => {
    const response = await POST(createRequest({
      title: '', // Invalid - empty
      questions: [],
    }))

    expect(response.status).toBe(400)
  })
})
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Create New Endpoints (Week 1)
```
✅ Create Domain Layer Use Cases
✅ Create Application Use Cases
✅ Create Infrastructure Adapters
✅ Create New Route Files
✅ Add Comprehensive Tests (60+ new tests)
✅ Verify all 433 tests still pass
✅ New routes available, old ones still work
```

### Phase 2: Update Clients (Week 2-3)
```
✅ Update frontend to use new endpoints
✅ Update client tests
✅ All 433 tests pass
✅ Backward compatibility maintained
```

### Phase 3: Deprecation (Week 4)
```
✅ Add deprecation headers to old endpoints
✅ 4-week notice given
✅ All old routes still work
```

### Phase 4: Cleanup (Week 5+)
```
✅ Remove old endpoints after migration
✅ Keep new organized structure
```

---

## 📊 ENDPOINT REFACTORING SUMMARY

| Old Endpoint | Operations | New Endpoints | Benefit |
|---|---|---|---|
| `POST /api/game` | 3 | `POST /api/quiz/create`, `POST /api/quiz/generate` | Single responsibility |
| `GET /api/start-quiz` | 3 | `POST /api/quiz/[quizId]/start`, `GET /api/quiz/[quizId]/attempts` | Proper HTTP methods |
| `POST /(admin)/upload-and-generate` | 5 | `POST /(admin)/quizzes/upload`, `POST /(admin)/quizzes/validate`, `POST /(admin)/quizzes/generate-from-file` | Separated concerns |
| `POST /(admin)/quiz-review` | 4 | `POST /(admin)/quizzes`, `GET /(admin)/quizzes`, `GET /(admin)/quizzes/[quizId]`, `DELETE /(admin)/quizzes/[quizId]` | RESTful design |

---

## ✨ BENEFITS

### Code Quality
✅ Single responsibility per endpoint
✅ Easier to test (smaller functions)
✅ Easier to maintain (clear concerns)
✅ Easier to document (obvious purpose)

### API Quality
✅ RESTful design (proper HTTP methods)
✅ Clear endpoints (obvious what they do)
✅ Composable (can combine as needed)
✅ Evolvable (easy to add new features)

### Scalability
✅ New endpoints don't affect old ones
✅ Services can be extracted later
✅ Caching easier (separate concerns)
✅ Rate limiting easier (specific endpoints)

### Testing
✅ 60+ new unit tests
✅ 100% coverage of new logic
✅ Integration tests for each route
✅ All 433 existing tests still pass

---

## 🔄 NO BREAKING CHANGES STRATEGY

### Keep Old Endpoints (4 weeks)
```typescript
// Old endpoint still works
POST /api/game
  Calls new endpoints internally:
  1. POST /api/quiz/create
  2. POST /api/quiz/generate
  3. Save results
```

### Add Deprecation Headers
```typescript
response.headers.set('Deprecation', 'true')
response.headers.set('Sunset', 'Wed, 25 Jul 2026 00:00:00 GMT')
response.headers.set('X-Use-Instead', '/api/quiz/create')
```

### Migrate Gradually
- Week 1-2: New endpoints available
- Week 2-3: Clients start using new endpoints
- Week 3-4: Old endpoints deprecated
- Week 4+: Old endpoints removed

---

## 🎯 NEXT STEPS

1. **Approve Structure**: Review proposed endpoint organization
2. **Create Domain Layer**: Define entities and use case interfaces
3. **Create Use Cases**: Implement application logic with DI
4. **Create Repositories**: Implement Prisma adapters
5. **Create Routes**: New organized endpoints
6. **Add Tests**: Comprehensive test coverage
7. **Verify**: All 433 tests pass + new tests pass
8. **Deploy**: New endpoints available
9. **Migrate**: Update clients gradually
10. **Deprecate**: Add headers to old endpoints
11. **Cleanup**: Remove old endpoints after 4 weeks

---

**Status**: Ready to implement  
**Estimated Time**: 2-3 weeks for Phase 1  
**Risk**: Very Low (backward compatible)  
**Recommendation**: ✅ PROCEED
