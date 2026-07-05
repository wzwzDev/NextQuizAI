# NextQuizAI - Architecture & Sprint Diagrams

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph Presentation["Presentation Layer"]
        Routes["API Routes<br/>(33 endpoints)"]
        Controllers["HTTP Handlers<br/>(Next.js Routes)"]
    end

    subgraph Application["Application Layer"]
        UseCases["Use Cases<br/>(11 business logic)"]
        Ports["Port Interfaces<br/>(Dependency Injection)"]
        DTOs["DTOs & Schemas<br/>(Zod Validation)"]
    end

    subgraph Domain["Domain Layer"]
        Entities["Domain Entities<br/>(13 total)"]
        ValueObjects["Value Objects<br/>(Enums)"]
        DomainServices["Domain Services"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Services["Services<br/>(15+ implementations)"]
        Repositories["Repositories<br/>(Ports Implementation)"]
        Database["Prisma ORM<br/>(MySQL)"]
        ExternalAPIs["External APIs<br/>(OpenAI, Google Vision,<br/>Resend, NextAuth)"]
    end

    Routes --> Controllers
    Controllers --> UseCases
    UseCases --> Ports
    Ports --> Repositories
    UseCases --> DTOs
    DTOs --> Ports
    Repositories --> Database
    Repositories --> ExternalAPIs
    UseCases --> Entities
    Entities --> ValueObjects
    Domain --> DomainServices
    Services --> ExternalAPIs
    
    style Presentation fill:#4A90E2,color:#fff
    style Application fill:#7B68EE,color:#fff
    style Domain fill:#50C878,color:#fff
    style Infrastructure fill:#FF6B6B,color:#fff
```

---

## 2. Database Entity Relationships

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : has
    USER ||--o{ SESSION : has
    USER ||--o{ GAME : creates
    USER ||--o{ USERQUIZATTEMPT : attempts
    
    ACCOUNT }o--|| USER : belongs_to
    SESSION }o--|| USER : belongs_to
    
    EMAILVERIFICATIONTOKEN }o--|| USER : for
    
    GAME ||--|{ QUESTION : contains
    GAME }o--|| USER : belongs_to
    
    QUESTION }o--|| GAME : part_of
    
    ADMINQUIZ ||--|{ ADMINQUIZQUESTION : contains
    ADMINQUIZ }o--o{ USERQUIZATTEMPT : attempts
    
    ADMINQUIZQUESTION }o--|| ADMINQUIZ : part_of
    
    USERQUIZATTEMPT }o--|| USER : attempts_by
    USERQUIZATTEMPT }o--|| ADMINQUIZ : for
    
    TOPICCOUNT : tracks_popularity
    
    USER : id PK
    USER : email UK
    USER : banned
    USER : revoked
    USER : isAdmin
    USER : lastSeen
    
    GAME : id PK
    GAME : topic
    GAME : gameType
    GAME : timeStarted
    GAME : timeEnded
    
    QUESTION : id PK
    QUESTION : isCorrect
    QUESTION : percentageCorrect
    QUESTION : questionType
    
    ADMINQUIZ : id PK
    ADMINQUIZ : title
    ADMINQUIZ : status
    ADMINQUIZ : allowedAttempts
    
    USERQUIZATTEMPT : id PK
    USERQUIZATTEMPT : score
    USERQUIZATTEMPT : status
    USERQUIZATTEMPT : attemptNumber
```

---

## 3. API Routes Taxonomy

```mermaid
graph TD
    API["API Routes<br/>(33 Total)"]
    
    Auth["🔐 Authentication<br/>(4)"]
    Game["🎮 Game<br/>(3)"]
    Quiz["📋 Quiz<br/>(7)"]
    Question["❓ Questions<br/>(2)"]
    User["👤 User<br/>(2)"]
    Admin["🔑 Admin<br/>(17)"]
    Util["🔄 Utility<br/>(1)"]
    
    Auth1["POST /api/auth/register"]
    Auth2["POST /api/auth/verify-email"]
    Auth3["GET /api/auth/signin"]
    Auth4["POST /api/sign-out"]
    
    Game1["POST /api/game"]
    Game2["POST /api/checkAnswer"]
    Game3["POST /api/endGame"]
    
    Quiz1["POST /api/quiz/create"]
    Quiz2["POST /api/quiz/generate"]
    Quiz3["POST /api/quiz/[quizId]/start"]
    Quiz4["GET /api/quiz/[quizId]"]
    Quiz5["GET /api/published-quizzes"]
    Quiz6["GET /api/quiz/[quizId]/attempts"]
    Quiz7["POST /api/start-quiz"]
    
    Question1["POST /api/questions"]
    Question2["GET /api/questions"]
    
    User1["POST /api/user-quiz-stats"]
    User2["GET /api/user-quiz-stats"]
    
    AdminUser["User Mgmt<br/>(7)"]
    AdminQuiz["Quiz Mgmt<br/>(7)"]
    AdminStats["Statistics<br/>(3)"]
    
    AdminU1["GET /api/(admin)/users"]
    AdminU2["POST /api/(admin)/users/[id]/ban"]
    AdminU3["POST /api/(admin)/users/[id]/unban"]
    AdminU4["POST /api/(admin)/users/[id]/revoke"]
    AdminU5["POST /api/(admin)/users/[id]/unrevoke"]
    AdminU6["POST /api/(admin)/users/[id]/assign-admin"]
    AdminU7["GET /api/(admin)/users/[id]"]
    
    AdminQ1["POST /api/(admin)/upload-and-generate"]
    AdminQ2["GET /api/(admin)/quiz-review"]
    AdminQ3["POST /api/(admin)/quiz-review"]
    AdminQ4["GET /api/(admin)/quizzes"]
    AdminQ5["GET /api/(admin)/quizzes/[id]"]
    AdminQ6["POST /api/(admin)/quizzes/create"]
    AdminQ7["POST /api/(admin)/quizzes/upload"]
    
    AdminS1["GET /api/(admin)/quiz-statistics"]
    AdminS2["POST /api/(admin)/adjust-questions-difficulty"]
    AdminS3["POST /api/(admin)/setAdmin"]
    
    Util1["POST /api/auth/[...nextauth]"]
    
    API --> Auth
    API --> Game
    API --> Quiz
    API --> Question
    API --> User
    API --> Admin
    API --> Util
    
    Auth --> Auth1
    Auth --> Auth2
    Auth --> Auth3
    Auth --> Auth4
    
    Game --> Game1
    Game --> Game2
    Game --> Game3
    
    Quiz --> Quiz1
    Quiz --> Quiz2
    Quiz --> Quiz3
    Quiz --> Quiz4
    Quiz --> Quiz5
    Quiz --> Quiz6
    Quiz --> Quiz7
    
    Question --> Question1
    Question --> Question2
    
    User --> User1
    User --> User2
    
    Admin --> AdminUser
    Admin --> AdminQuiz
    Admin --> AdminStats
    
    AdminUser --> AdminU1
    AdminUser --> AdminU2
    AdminUser --> AdminU3
    AdminUser --> AdminU4
    AdminUser --> AdminU5
    AdminUser --> AdminU6
    AdminUser --> AdminU7
    
    AdminQuiz --> AdminQ1
    AdminQuiz --> AdminQ2
    AdminQuiz --> AdminQ3
    AdminQuiz --> AdminQ4
    AdminQuiz --> AdminQ5
    AdminQuiz --> AdminQ6
    AdminQuiz --> AdminQ7
    
    AdminStats --> AdminS1
    AdminStats --> AdminS2
    AdminStats --> AdminS3
    
    Util --> Util1
    
    style API fill:#FF6B6B,color:#fff,stroke:#333,stroke-width:3px
    style Auth fill:#4A90E2,color:#fff
    style Game fill:#7B68EE,color:#fff
    style Quiz fill:#50C878,color:#fff
    style Question fill:#FFB84D,color:#fff
    style User fill:#E94B3C,color:#fff
    style Admin fill:#9B59B6,color:#fff
    style Util fill:#95A5A6,color:#fff
    style AdminUser fill:#34495E,color:#fff
    style AdminQuiz fill:#34495E,color:#fff
    style AdminStats fill:#34495E,color:#fff
```

---

## 4. Sprint Implementation Timeline

```mermaid
gantt
    title NextQuizAI Implementation Across 5 Sprints
    dateFormat YYYY-MM-DD
    
    section Sprint 1
    Auth & Email Verification           :s1a, 2026-01-01, 30d
    Password & JWT Setup                :s1b, after s1a, 30d
    NextAuth Integration                :s1c, after s1b, 30d
    
    section Sprint 2
    Topic-Based Game Creation           :s2a, after s1c, 30d
    AI Question Generation              :s2b, after s2a, 30d
    Answer Grading (MCQ & Open-ended)   :s2c, after s2b, 30d
    
    section Sprint 3
    PDF Upload & Storage                :s3a, after s2c, 25d
    OCR 4-Layer Pipeline                :s3b, after s3a, 30d
    Question Generation from PDF        :s3c, after s3b, 25d
    
    section Sprint 4
    Quiz Review Interface               :s4a, after s3c, 20d
    Approval Workflow                   :s4b, after s4a, 20d
    Statistics Dashboard                :s4c, after s4b, 20d
    
    section Sprint 5
    User Quiz Attempts                  :s5a, after s4c, 25d
    Admin User Management               :s5b, after s5a, 25d
    Analytics & Recommendations         :s5c, after s5b, 25d
    
    section Testing
    Unit & Integration Tests            :test, after s1c, 150d
    Coverage: 92.44%                    :crit, s5c, 5d
```

---

## 5. Use Case Architecture

```mermaid
graph TD
    subgraph Auth["Authentication Use Cases"]
        UC1["RegisterUserWithPasswordUseCase<br/>Input: name, email, password<br/>Output: User created"]
        UC2["VerifyEmailTokenUseCase<br/>Input: email, token<br/>Output: verified boolean"]
    end
    
    subgraph Game["Game Use Cases"]
        UC3["StartGameUseCase<br/>Input: userId, topic, type<br/>Output: Game object"]
        UC4["CheckAnswerUseCase<br/>Input: questionId, userAnswer<br/>Output: score, method"]
        UC5["EndGameUseCase<br/>Input: gameId, userId<br/>Output: Final score"]
    end
    
    subgraph Quiz["Quiz Use Cases"]
        UC6["StartQuizAttemptUseCase<br/>Input: userId, quizId<br/>Output: attempt ID"]
        UC7["SubmitQuizAttemptUseCase<br/>Input: attemptId, answers<br/>Output: score, status"]
        UC8["GradeOpenEndedAnswerUseCase<br/>Input: answer, expected<br/>Output: score, confidence"]
        UC9["ReviewQuizAttemptUseCase<br/>Input: attemptId<br/>Output: detailed results"]
    end
    
    subgraph QuestionGen["Question Generation Use Cases"]
        UC10["GenerateTopicQuestionsUseCase<br/>Input: topic, type, amount<br/>Output: Questions[]"]
        UC11["GenerateQuestionsFromPdfUseCase<br/>Input: pdfContent, category<br/>Output: Questions + Citations"]
    end
    
    subgraph Admin["Admin Use Cases"]
        UC12["CreateAdminQuizUseCase<br/>Input: questions, metadata<br/>Output: AdminQuiz"]
        UC13["GetAdminQuizzesUseCase<br/>Input: filters<br/>Output: Quizzes[]"]
        UC14["SubmitAndGradeAdminQuizUseCase<br/>Input: quiz, answers<br/>Output: score, status"]
    end
    
    style Auth fill:#4A90E2,color:#fff
    style Game fill:#7B68EE,color:#fff
    style Quiz fill:#50C878,color:#fff
    style QuestionGen fill:#FFB84D,color:#fff
    style Admin fill:#9B59B6,color:#fff
```

---

## 6. Data Flow: User Takes Quiz

```mermaid
sequenceDiagram
    participant User as User<br/>Frontend
    participant API as API<br/>Route Handler
    participant UseCase as Use Case<br/>Logic
    participant Repo as Repository<br/>
    participant DB as Database<br/>Prisma
    participant LLM as LLM/Grader<br/>Service
    
    User->>API: POST /api/start-quiz<br/>{quizId}
    activate API
    API->>UseCase: StartQuizAttemptUseCase
    activate UseCase
    UseCase->>Repo: findAttemptByUserAndQuiz()
    activate Repo
    Repo->>DB: Query UserQuizAttempt
    activate DB
    DB-->>Repo: attempt data
    deactivate DB
    Repo-->>UseCase: attempt result
    deactivate Repo
    
    UseCase->>UseCase: Check if completed
    UseCase->>Repo: ensurePending()
    activate Repo
    Repo->>DB: Create/Get pending attempt
    activate DB
    DB-->>Repo: new/existing attempt
    deactivate DB
    Repo-->>UseCase: pending attempt
    deactivate Repo
    
    UseCase-->>API: {attemptId, quiz, questions}
    deactivate UseCase
    API-->>User: 200 OK
    deactivate API
    
    User->>User: Answer questions
    
    User->>API: POST /api/user-quiz-stats<br/>{attemptId, answers}
    activate API
    API->>UseCase: SubmitQuizAttemptUseCase
    activate UseCase
    
    loop For each answer
        UseCase->>LLM: GradeOpenEndedAnswerUseCase
        activate LLM
        LLM->>LLM: Cosine similarity check
        LLM-->>UseCase: {score, confidence}
        deactivate LLM
    end
    
    UseCase->>Repo: calculateTotalScore()
    UseCase->>Repo: saveAttemptResults()
    activate Repo
    Repo->>DB: Update UserQuizAttempt
    Repo->>DB: Save answers JSON
    DB-->>Repo: success
    deactivate Repo
    
    UseCase-->>API: {score, status:completed}
    deactivate UseCase
    API-->>User: 200 OK
    deactivate API
    
    User->>API: GET /api/user-quiz-stats<br/>{quizId}
    activate API
    API->>Repo: getUserQuizStats()
    Repo->>DB: Query all attempts
    DB-->>Repo: attempts data
    Repo-->>API: formatted stats
    API-->>User: 200 OK with history
    deactivate API
```

---

## 7. OCR Pipeline Flow (Sprint 3)

```mermaid
flowchart TD
    Start["User uploads PDF<br/>POST /api/admin/upload-and-generate"] --> Validate["Validate<br/>- File type<br/>- File size<br/>- Format"]
    
    Validate -->|Valid| Layer1["Layer 1: pdfjs<br/>Extract text from PDF"]
    Validate -->|Invalid| Error1["Reject with<br/>400 Bad Request"]
    
    Layer1 -->|Success| Extract1["Text extracted"]
    Layer1 -->|Fail| Layer2["Layer 2: Google Vision API<br/>OCR on images"]
    
    Layer2 -->|Success| Extract2["Text extracted"]
    Layer2 -->|Fail/Rate-Limit| Layer3["Layer 3: OpenAI Vision API<br/>Vision model OCR"]
    
    Layer3 -->|Success| Extract3["Text extracted"]
    Layer3 -->|Fail| Layer4["Layer 4: Tesseract.js<br/>Client-side OCR"]
    
    Layer4 -->|Success| Extract4["Text extracted"]
    Layer4 -->|Fail| Error2["No text could be extracted<br/>500 Server Error"]
    
    Extract1 --> Validate2["Validate extracted text<br/>- Min 50 words<br/>- Max 50k chars"]
    Extract2 --> Validate2
    Extract3 --> Validate2
    Extract4 --> Validate2
    
    Validate2 -->|Valid| GenerateQ["Call GPT-4o<br/>Generate Questions"]
    Validate2 -->|Invalid| Error3["Invalid text<br/>400 Bad Request"]
    
    GenerateQ -->|Success| SaveQ["Save to AdminQuiz<br/>AdminQuizQuestion"]
    GenerateQ -->|Fail| Fallback["Use fallback questions<br/>from predefined set"]
    
    Fallback --> SaveQ
    SaveQ --> Extract5["Extract citations<br/>- Source<br/>- Snippet<br/>- Confidence"]
    
    Extract5 --> Return["Return generated quiz<br/>with metadata"]
    Return --> End["User can review<br/>and approve"]
    
    Error1 --> ErrorEnd["Return error"]
    Error2 --> ErrorEnd
    Error3 --> ErrorEnd
    
    style Start fill:#4A90E2,color:#fff
    style Layer1 fill:#50C878,color:#fff
    style Layer2 fill:#7B68EE,color:#fff
    style Layer3 fill:#FFB84D,color:#fff
    style Layer4 fill:#E94B3C,color:#fff
    style GenerateQ fill:#FF6B6B,color:#fff
    style End fill:#95A5A6,color:#fff
    style Error1 fill:#E74C3C,color:#fff
    style Error2 fill:#E74C3C,color:#fff
    style Error3 fill:#E74C3C,color:#fff
```

---

## 8. Feature Completion Matrix

```mermaid
graph LR
    Sprint1["Sprint 1<br/>Auth"]
    Sprint2["Sprint 2<br/>Game Gen"]
    Sprint3["Sprint 3<br/>PDF Upload"]
    Sprint4["Sprint 4<br/>Review"]
    Sprint5["Sprint 5<br/>Admin+Stats"]
    
    S1A["Register/Login<br/>✅"]
    S1B["Email Verify<br/>✅"]
    S1C["OAuth<br/>✅"]
    
    S2A["Game Creation<br/>✅"]
    S2B["AI Generation<br/>✅"]
    S2C["Grading<br/>✅"]
    
    S3A["PDF Upload<br/>✅"]
    S3B["OCR Pipeline<br/>✅"]
    S3C["Q Generation<br/>✅"]
    
    S4A["Quiz Review<br/>✅"]
    S4B["Approval WF<br/>✅"]
    S4C["Statistics<br/>✅"]
    
    S5A["User Attempts<br/>✅"]
    S5B["Admin Mgmt<br/>✅"]
    S5C["Dashboard<br/>✅"]
    
    Sprint1 --> S1A
    Sprint1 --> S1B
    Sprint1 --> S1C
    
    Sprint2 --> S2A
    Sprint2 --> S2B
    Sprint2 --> S2C
    
    Sprint3 --> S3A
    Sprint3 --> S3B
    Sprint3 --> S3C
    
    Sprint4 --> S4A
    Sprint4 --> S4B
    Sprint4 --> S4C
    
    Sprint5 --> S5A
    Sprint5 --> S5B
    Sprint5 --> S5C
    
    style Sprint1 fill:#4A90E2,color:#fff,stroke:#333,stroke-width:2px
    style Sprint2 fill:#7B68EE,color:#fff,stroke:#333,stroke-width:2px
    style Sprint3 fill:#50C878,color:#fff,stroke:#333,stroke-width:2px
    style Sprint4 fill:#FFB84D,color:#fff,stroke:#333,stroke-width:2px
    style Sprint5 fill:#E94B3C,color:#fff,stroke:#333,stroke-width:2px
    
    style S1A fill:#2E7D32,color:#fff
    style S1B fill:#2E7D32,color:#fff
    style S1C fill:#2E7D32,color:#fff
    style S2A fill:#2E7D32,color:#fff
    style S2B fill:#2E7D32,color:#fff
    style S2C fill:#2E7D32,color:#fff
    style S3A fill:#2E7D32,color:#fff
    style S3B fill:#2E7D32,color:#fff
    style S3C fill:#2E7D32,color:#fff
    style S4A fill:#2E7D32,color:#fff
    style S4B fill:#2E7D32,color:#fff
    style S4C fill:#2E7D32,color:#fff
    style S5A fill:#2E7D32,color:#fff
    style S5B fill:#2E7D32,color:#fff
    style S5C fill:#2E7D32,color:#fff
```

---

## 9. Technology Stack Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend"]
        Next["Next.js 14<br/>React"]
        TypeScript["TypeScript<br/>Type Safety"]
        Playwright["Playwright<br/>E2E Testing"]
    end
    
    subgraph Backend["Backend"]
        NextAPI["Next.js API Routes<br/>33 Endpoints"]
        Services["Services Layer<br/>15+ Services"]
        UseCases["Use Cases<br/>11 Business Logic"]
    end
    
    subgraph Database["Database Layer"]
        Prisma["Prisma ORM<br/>Type-Safe"]
        MySQL["MySQL<br/>Relational DB"]
    end
    
    subgraph ExternalServices["External Services"]
        OpenAI["OpenAI API<br/>GPT-3.5/4"]
        GoogleVision["Google Vision<br/>OCR"]
        Resend["Resend<br/>Email"]
        NextAuth["NextAuth<br/>Auth"]
    end
    
    subgraph Testing["Testing & Quality"]
        Jest["Jest<br/>Unit Tests"]
        Coverage["Code Coverage<br/>92.44%"]
        SonarQube["SonarQube<br/>Quality Gates"]
    end
    
    Frontend --> Backend
    NextAPI --> Services
    Services --> UseCases
    UseCases --> Prisma
    Prisma --> MySQL
    Services --> ExternalServices
    Frontend --> Testing
    Backend --> Testing
    Database --> Testing
    
    style Frontend fill:#4A90E2,color:#fff
    style Backend fill:#7B68EE,color:#fff
    style Database fill:#50C878,color:#fff
    style ExternalServices fill:#FFB84D,color:#fff
    style Testing fill:#E94B3C,color:#fff
```

---

## 10. Admin Dashboard Flow

```mermaid
graph TD
    AdminDash["Admin Dashboard<br/>Home"]
    
    AdminDash -->|Users| UserMgmt["User Management"]
    AdminDash -->|Quizzes| QuizMgmt["Quiz Management"]
    AdminDash -->|Statistics| StatView["Statistics View"]
    
    UserMgmt --> ListUsers["List Users<br/>GET /api/admin/users"]
    ListUsers --> SearchFilter["Search & Filter<br/>by email, role"]
    SearchFilter --> UserActions["User Actions"]
    
    UserActions --> Ban["Ban/Unban<br/>POST /admin/users/[id]/ban"]
    UserActions --> Revoke["Revoke/Unrevoke<br/>POST /admin/users/[id]/revoke"]
    UserActions --> Admin["Make Admin<br/>POST /admin/users/[id]/assign-admin"]
    
    QuizMgmt --> Upload["Upload PDF<br/>POST /admin/upload-and-generate"]
    QuizMgmt --> Review["Review Questions<br/>GET /admin/quiz-review"]
    QuizMgmt --> List["List All Quizzes<br/>GET /admin/quizzes"]
    
    Upload --> Generate["Auto-Generate Q&A<br/>via OCR + GPT"]
    Generate --> ReviewList["Added to Review Queue"]
    ReviewList --> Approve["Approve/Reject<br/>POST /admin/quiz-review"]
    Approve --> Publish["Publish to Users"]
    
    StatView --> QuizStats["Quiz Statistics<br/>GET /admin/quiz-statistics"]
    StatView --> UserStats["User Performance"]
    
    QuizStats --> Attempts["Total Attempts<br/>by Quiz"]
    QuizStats --> AvgScore["Average Score<br/>Distribution"]
    QuizStats --> Difficulty["Difficulty<br/>Performance"]
    
    UserStats --> UserAttempts["User Attempts<br/>History"]
    UserStats --> Progress["Performance<br/>Trends"]
    
    style AdminDash fill:#FF6B6B,color:#fff,stroke:#333,stroke-width:3px
    style UserMgmt fill:#7B68EE,color:#fff
    style QuizMgmt fill:#50C878,color:#fff
    style StatView fill:#FFB84D,color:#fff
    style Ban fill:#E94B3C,color:#fff
    style Revoke fill:#E94B3C,color:#fff
    style Admin fill:#E94B3C,color:#fff
```

---

**All diagrams represent the actual implementation across the 5 sprints.**
