# Layered Architecture, Tests, and UML

This document summarizes the project architecture and the verification strategy used for TFM.

## Folder Organization

The backend logic is now organized under a dedicated server tree:

```text
src/
  server/
    core/
      auth.ts
      db.ts
    ai/
      gpt.ts
      gptadmin.ts
      openaiClient.ts
      experimental/
        gpttest.ts
        gptadmintest.ts
    repositories/
      adminQuizRepository.ts
      gameRepository.ts
      questionRepository.ts
      topicRepository.ts
      userQuizAttemptRepository.ts
      userRepository.ts
    services/
      adminQuizService.ts
      answerEvaluationService.ts
      gameService.ts
      questionGenerationService.ts
      uploadQuizGenerationService.ts
      userQuizAttemptService.ts
      userService.ts
    question-generation/
      generateQuestions.ts
      parseAndGenerateQuestions.ts
```

Compatibility shim files remain in src/lib so existing imports keep working while migration is completed.

## Layered Architecture

```mermaid
flowchart LR
  subgraph Presentation[Presentation Layer]
    UI[React Components and Pages]
  end

  subgraph Api[API Layer]
    Routes[Next.js Route Handlers]
    Auth[NextAuth]
  end

  subgraph Application[Application Layer]
    GameService[GameService]
    UserService[UserService]
    AdminQuizService[AdminQuizService]
    AttemptService[UserQuizAttemptService]
    QuestionGenService[QuestionGenerationService]
    UploadGenService[UploadQuizGenerationService]
    AnswerService[AnswerEvaluationService]
  end

  subgraph Data[Data Access Layer]
    GameRepo[GameRepository]
    UserRepo[UserRepository]
    AdminQuizRepo[AdminQuizRepository]
    AttemptRepo[UserQuizAttemptRepository]
    QuestionRepo[QuestionRepository]
    TopicRepo[TopicRepository]
  end

  subgraph Infra[Infrastructure Layer]
    Prisma[(Prisma Client)]
    Mysql[(MySQL)]
    OpenAI[OpenAI Gateway]
  end

  UI --> Routes
  UI --> Auth
  Routes --> GameService
  Routes --> UserService
  Routes --> AdminQuizService
  Routes --> AttemptService
  Routes --> QuestionGenService
  Routes --> UploadGenService
  Routes --> AnswerService

  GameService --> GameRepo
  GameService --> TopicRepo
  UserService --> UserRepo
  AdminQuizService --> AdminQuizRepo
  AttemptService --> AttemptRepo
  AnswerService --> QuestionRepo

  GameRepo --> Prisma
  UserRepo --> Prisma
  AdminQuizRepo --> Prisma
  AttemptRepo --> Prisma
  QuestionRepo --> Prisma
  TopicRepo --> Prisma

  QuestionGenService --> OpenAI
  UploadGenService --> OpenAI
  AnswerService --> OpenAI

  Prisma --> Mysql
```

## Sequence Diagram: Quiz Creation

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant APIG as /api/game
  participant GS as GameService
  participant GR as GameRepository
  participant TR as TopicRepository
  participant APIQ as /api/questions
  participant QGS as QuestionGenerationService
  participant GPT as OpenAI Gateway
  participant DB as MySQL

  U->>FE: Start quiz(topic, type, amount)
  FE->>APIG: POST /api/game
  APIG->>GS: createGameWithTopicCount(...)
  GS->>GR: createGame(...)
  GR->>DB: INSERT game
  GS->>TR: incrementTopicCount(topic)
  TR->>DB: UPSERT topicCount

  APIG->>APIQ: POST /api/questions
  APIQ->>QGS: generateQuestionsByTopic(...)
  QGS->>GPT: strict_output(...)
  GPT-->>QGS: generated questions
  APIQ-->>APIG: questions

  APIG->>GS: saveGeneratedQuestionsForGame(...)
  GS->>GR: createQuestionsForGame(...)
  GR->>DB: INSERT many questions
  APIG-->>FE: 200 { gameId }
  FE-->>U: Navigate to quiz
```

## Sequence Diagram: Answer Evaluation

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant APIA as /api/checkAnswer
  participant AES as AnswerEvaluationService
  participant QR as QuestionRepository
  participant GPT as OpenAI Embeddings
  participant DB as MySQL

  U->>FE: Submit answer
  FE->>APIA: POST /api/checkAnswer
  APIA->>AES: gradeAndSaveAnswer(questionId, userInput)
  AES->>QR: findQuestionById(questionId)
  QR->>DB: SELECT question
  AES->>QR: saveUserAnswer(questionId, userInput)
  QR->>DB: UPDATE userAnswer

  alt MCQ question
    AES->>QR: saveMcqResult(questionId, isCorrect)
    QR->>DB: UPDATE isCorrect
    AES-->>APIA: {status:200, body:{isCorrect}}
  else Open-ended question
    AES->>GPT: getEmbedding(expected and input)
    GPT-->>AES: vectors
    AES->>QR: saveOpenEndedResult(questionId, percentage)
    QR->>DB: UPDATE percentageCorrect
    AES-->>APIA: {status:200, body:{percentageSimilar, gradingMethod}}
  end

  APIA-->>FE: JSON response
  FE-->>U: Feedback displayed
```

## ER Diagram

```mermaid
erDiagram
  USER ||--o{ ACCOUNT : owns
  USER ||--o{ SESSION : owns
  USER ||--o{ GAME : plays
  GAME ||--o{ QUESTION : contains
  ADMIN_QUIZ ||--o{ ADMIN_QUIZ_QUESTION : contains
  USER ||--o{ USER_QUIZ_ATTEMPT : submits

  USER {
    string id PK
    string email UK
    string name
    boolean banned
    boolean revoked
    boolean isAdmin
    boolean isOnline
    datetime lastSeen
  }

  ACCOUNT {
    string id PK
    string userId FK
    string provider
    string providerAccountId
  }

  SESSION {
    string id PK
    string userId FK
    string sessionToken UK
    datetime expires
  }

  GAME {
    string id PK
    string userId FK
    string topic
    string gameType
    datetime timeStarted
    datetime timeEnded
  }

  QUESTION {
    string id PK
    string gameId FK
    string question
    string answer
    string questionType
    json options
    float percentageCorrect
    boolean isCorrect
    string userAnswer
  }

  TOPIC_COUNT {
    string id PK
    string topic UK
    int count
  }

  ADMIN_QUIZ {
    string id PK
    string title
    string category
    string difficulty
    string status
    datetime createdAt
    datetime updatedAt
  }

  ADMIN_QUIZ_QUESTION {
    string id PK
    string quizId FK
    string question
    string answer
  }

  USER_QUIZ_ATTEMPT {
    string id PK
    string userId FK
    string quizId
    string quizTitle
    json answers
    float score
    datetime createdAt
  }
```

## Test Strategy by Layer

1. API route tests: Validate auth, validation, status codes, and response payload shape.
2. Service tests: Validate orchestration, business rules, and aggregation logic.
3. Repository tests: Validate Prisma query shape and persistence contracts.
4. Architecture tests: Enforce layer boundaries to prevent direct route->db and service->db coupling.

## Current Test Files Added

1. Route tests: endGame, setAdmin, auth route wrapper.
2. Service tests: adminQuizService, gameService, userService, userQuizAttemptService, questionGenerationService, uploadQuizGenerationService.
3. Repository tests: adminQuizRepository, gameRepository, questionRepository, topicRepository, userRepository, userQuizAttemptRepository.
4. Architecture test: layering import rules.
