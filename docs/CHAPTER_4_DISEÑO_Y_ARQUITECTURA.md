# CAPÍTULO 4: DISEÑO Y ARQUITECTURA

## 4.1 Introducción

NextQuizAI implementa una arquitectura de software robusta basada en **Clean Architecture** con separación clara de responsabilidades. El sistema está diseñado como una aplicación full-stack moderna que integra Next.js 16 en el frontend y backend, con persistencia en PostgreSQL a través de Prisma ORM.

Esta arquitectura facilita la testabilidad, mantenibilidad y escalabilidad del código, permitiendo que componentes independientes puedan ser desarrollados, testeados y modificados sin afectar otras partes del sistema.

---

## 4.2 Visión General de la Arquitectura

### 4.2.1 Capas Arquitectónicas

NextQuizAI implementa **Clean Architecture** con cuatro capas bien definidas:

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                   │
│    (Next.js Pages, API Routes)               │
├─────────────────────────────────────────────┤
│      APPLICATION LAYER                       │
│    (Use Cases, Services, Business Logic)     │
├─────────────────────────────────────────────┤
│         DOMAIN LAYER                         │
│    (Entities, Value Objects, DTOs)           │
├─────────────────────────────────────────────┤
│     INFRASTRUCTURE LAYER                     │
│  (Repositories, Database, External APIs)     │
└─────────────────────────────────────────────┘
```

### 4.2.2 Estructura de Directorios

```
src/
├── app/                              # Next.js App Router (Frontend + API Routes)
│   ├── api/                          # API Routes Backend
│   │   ├── (admin)/                  # Admin-only endpoints
│   │   ├── published-quizzes/        # User quiz browsing
│   │   ├── start-quiz/               # Quiz attempt management
│   │   ├── user-quiz-stats/          # User statistics
│   │   ├── auth/                     # Authentication routes
│   │   ├── checkAnswer/              # Answer grading
│   │   └── ...                       # Other routes
│   ├── (admin)/                      # Admin pages
│   ├── (auth)/                       # Auth pages
│   ├── dashboard/                    # User dashboard
│   ├── mystats/                      # User statistics page
│   └── ...                           # Other frontend pages
│
├── application/                      # Application Layer (Use Cases)
│   ├── use-cases/
│   │   ├── quiz/
│   │   ├── user/
│   │   ├── auth/
│   │   └── ...
│   └── dto/                          # Data Transfer Objects
│
├── domain/                           # Domain Layer (Entities)
│   ├── entities/
│   ├── value-objects/
│   └── ...
│
├── infrastructure/                   # Infrastructure Layer
│   ├── adapters/
│   │   ├── repositories/
│   │   └── services/
│   ├── persistance/
│   └── external-services/
│
├── server/                           # Backend Services
│   ├── services/
│   │   ├── answerEvaluationService.ts
│   │   ├── gameService.ts
│   │   ├── uploadQuizGenerationService.ts
│   │   └── ...
│   ├── repositories/
│   │   ├── gameRepository.ts
│   │   ├── questionRepository.ts
│   │   └── ...
│   └── admin/
│       ├── services/
│       └── repositories/
│
├── components/                       # React Components (Frontend)
│   ├── auth/
│   ├── quiz/
│   ├── admin/
│   └── ...
│
├── lib/                              # Utilities & Helpers
├── schemas/                          # Zod Validation Schemas
├── types/                            # TypeScript Type Definitions
└── __tests__/                        # Test Suite
    ├── api/
    ├── services/
    ├── repositories/
    └── ...
```

---

## 4.3 Capas Arquitectónicas Detalladas

### 4.3.1 Capa de Presentación (Presentation Layer)

#### Frontend (React Components)
- **Ubicación**: `src/components/`, `src/app/`
- **Responsabilidades**: Renderizar UI, capturar eventos de usuario, validar entrada
- **Características**:
  - Server Components (Next.js App Router)
  - Client Components para interactividad
  - Componentes reutilizables
  - Manejo de estado local con hooks

#### API Routes (Backend Endpoints)
- **Ubicación**: `src/app/api/`
- **Responsabilidades**: Recibir requests HTTP, validar autenticación, delegación a servicios
- **Características**:
  - Validación de schema con Zod
  - Middleware de autenticación
  - Manejo de errores HTTP
  - CORS y seguridad

**Ejemplo - API Route: `src/app/api/start-quiz/route.ts`**
```typescript
export async function GET(request: NextRequest) {
  // 1. Validar autenticación
  const session = await getAuthSession();
  if (!session) return Response.json({error: "Unauthorized"}, {status: 401});
  
  // 2. Validar parámetros
  const quizId = searchParams.get("id");
  if (!quizId) return Response.json({error: "Quiz ID required"}, {status: 400});
  
  // 3. Delegar a use case
  const useCase = new StartQuizAttemptUseCase(...);
  const result = await useCase.execute(quizId, session.user.id);
  
  // 4. Retornar respuesta
  return Response.json(result, {status: 200});
}
```

### 4.3.2 Capa de Aplicación (Application Layer)

#### Use Cases
- **Ubicación**: `src/application/use-cases/`
- **Responsabilidades**: Orquestar lógica de negocio, coordinar repositorios
- **Características**:
  - Cada use case representa una operación de negocio discreta
  - Independencia de frameworks
  - Fácil de testear
  - Reutilizables entre endpoints

**Ejemplo - Use Case: `StartQuizAttemptUseCase`**
```typescript
export class StartQuizAttemptUseCase {
  constructor(
    private quizRepository: QuizRepository,
    private attemptRepository: AttemptRepository
  ) {}

  async execute(quizId: string, userId: string): Promise<StartQuizResult> {
    // 1. Validar quiz existe
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");
    
    // 2. Validar intentos restantes
    const completedAttempts = await this.attemptRepository
      .countCompletedByUserAndQuiz(userId, quizId);
    if (completedAttempts >= quiz.maxAttempts) {
      throw new LimitExceededError("Attempt limit reached");
    }
    
    // 3. Crear o reutilizar intento pending
    let attempt = await this.attemptRepository
      .findPendingByUserAndQuiz(userId, quizId);
    if (!attempt) {
      attempt = await this.attemptRepository.create({
        userId,
        quizId,
        status: "pending"
      });
    }
    
    // 4. Retornar quiz con preguntas
    return {
      attemptId: attempt.id,
      quiz: this.normalizeQuiz(quiz),
      attempts: { /* metadata */ }
    };
  }
}
```

#### Services
- **Ubicación**: `src/server/services/`
- **Responsabilidades**: Lógica compartida entre use cases
- **Ejemplos**:
  - `answerEvaluationService`: Grading de respuestas (MCQ + open-ended)
  - `gameService`: Orquestación de juegos
  - `uploadQuizGenerationService`: Generación de preguntas desde archivos
  - `userQuizAttemptService`: Gestión de intentos del usuario

### 4.3.3 Capa de Dominio (Domain Layer)

#### Entities
- **Ubicación**: `src/domain/entities/`
- **Responsabilidades**: Representar conceptos principales del negocio
- **Características**:
  - Objetos de valor (Value Objects)
  - Lógica de negocio relacionada
  - Independencia de persistencia

**Principales Entities:**

1. **User**
   ```typescript
   {
     id: string (CUID)
     email: string
     emailVerified: Date | null
     name: string | null
     image: string | null
     isAdmin: boolean
     isBanned: boolean
     isRevoked: boolean
     createdAt: Date
     updatedAt: Date
   }
   ```

2. **Quiz (AdminQuiz)**
   ```typescript
   {
     id: string (UUID)
     title: string
     category: string
     difficulty: "easy" | "medium" | "hard"
     quizType: "mcq" | "open_ended"
     questions: Question[]
     status: "approved"
     createdAt: Date
     updatedAt: Date
   }
   ```

3. **Question**
   ```typescript
   {
     id: string
     question: string
     answer: string
     options: string[] (for MCQ)
     citation: Citation
     quizId: string
   }
   ```

4. **UserQuizAttempt**
   ```typescript
   {
     id: string
     userId: string
     quizId: string
     score: number | null
     status: "pending" | "completed"
     startedAt: Date
     completedAt: Date | null
     answers: Answer[]
   }
   ```

5. **Answer**
   ```typescript
   {
     id: string
     questionId: string
     userInput: string
     isCorrect: boolean
     percentageSimilar: number (0-100)
     gradingMethod: "exact_match" | "typo_tolerant"
     confidence: number (0-1)
   }
   ```

### 4.3.4 Capa de Infraestructura (Infrastructure Layer)

#### Repositories
- **Ubicación**: `src/server/repositories/`, `src/infrastructure/adapters/repositories/`
- **Responsabilidades**: Abstraer acceso a datos, mapeo de Entities a modelos Prisma
- **Características**:
  - Interfaz consistente
  - Aislamiento de detalles de BD
  - Transacciones ACID
  - Cascading deletes

**Ejemplo - Repository: `userRepository.ts`**
```typescript
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { sessions: true }
    });
  }

  async updateFlags(userId: string, flags: {
    banned?: boolean,
    revoked?: boolean,
    isAdmin?: boolean
  }): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: flags
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      // Delete related data
      this.prisma.userQuizAttempt.deleteMany({
        where: { userId }
      }),
      // Delete user
      this.prisma.user.delete({
        where: { id: userId }
      })
    ]);
  }
}
```

#### Database (Prisma + PostgreSQL)
- **Ubicación**: `prisma/schema.prisma`
- **Características**:
  - ORM type-safe
  - Migraciones versionadas
  - Relaciones bien definidas
  - Cascading deletes automáticos

**Schema Principal:**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  isAdmin       Boolean   @default(false)
  banned        Boolean   @default(false)
  revoked       Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  quizAttempts  UserQuizAttempt[]
}

model Quiz {
  id            String    @id @default(uuid())
  title         String
  category      String
  difficulty    String
  quizType      String
  questions     Question[]
  status        String    @default("approved")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  attempts      UserQuizAttempt[]
}

model Question {
  id            String    @id @default(cuid())
  quizId        String
  question      String    @db.Text
  answer        String    @db.Text
  options       String[]  // JSON array for MCQ
  citation      Json?     // {source, snippet, confidence}
  createdAt     DateTime  @default(now())

  quiz          Quiz      @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers       Answer[]
}

model UserQuizAttempt {
  id            String    @id @default(cuid())
  userId        String
  quizId        String
  score         Float?
  status        String    @default("pending")
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz          Quiz      @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers       Answer[]

  @@unique([userId, quizId, status]) // Only one pending attempt per user-quiz
}

model Answer {
  id              String    @id @default(cuid())
  attemptId       String
  questionId      String
  userInput       String    @db.Text
  isCorrect       Boolean
  percentageSimilar Int     @default(0)
  gradingMethod   String    @default("exact_match")
  confidence      Float     @default(0)
  createdAt       DateTime  @default(now())

  attempt         UserQuizAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question        Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

#### Integración con Servicios Externos
- **OpenAI API**: Generación de preguntas, evaluación de respuestas open-ended
- **NextAuth.js**: Autenticación, gestión de sesiones
- **Tesseract OCR**: Extracción de texto de PDFs

---

## 4.4 Flujos de Datos Principales

### 4.4.1 Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. NextAuth.js valida contra BD
   ↓
3. JWT token generado (24h inactivity)
   ↓
4. Cookie HTTP-only almacenada
   ↓
5. Sesión disponible en endpoints
```

**Verificación en endpoints:**
```typescript
const session = await getAuthSession(); // from NextAuth
if (!session) return 401 Unauthorized;
if (session.user.isBanned) return 403 Forbidden;
if (session.user.isRevoked) return 403 Forbidden;
```

### 4.4.2 Flujo de Creación de Cuestionario

```
1. Admin carga archivo (JSON/PDF/TXT)
   ↓
2. uploadQuizGenerationService extrae contenido
   ├─ PDF: Tesseract OCR si es necesario
   ├─ JSON: Parse y validación
   └─ TXT: Lectura directa
   ↓
3. Validación de longitud de contenido
   ├─ Mínimo: 50 caracteres
   └─ Máximo: 16000 caracteres
   ↓
4. OpenAI generate preguntas
   ├─ Prompt incluye: tema, tipo (MCQ/open-ended), cantidad
   └─ Rate limiting: 429 si límite excedido
   ↓
5. Fallback local si OpenAI falla
   ↓
6. adminQuizService valida y normaliza
   ├─ Title fallback: fileName → default "Untitled"
   ├─ MCQ: Validar opciones (mín 2)
   └─ Normalizar formato
   ↓
7. adminQuizRepository persiste en BD
   ├─ Quiz + Questions + Citations
   └─ Transaction atómica
   ↓
8. Retornar 201 con quiz.id
```

### 4.4.3 Flujo de Intento de Cuestionario

```
FASE 1: Iniciar Intento
─────────────────────
1. Usuario selecciona quiz de /published-quizzes
   ↓
2. GET /api/start-quiz?id={quizId}
   ├─ Validar autenticación (401)
   ├─ Validar quiz existe (404)
   └─ Validar intentos restantes (403)
   ↓
3. StartQuizAttemptUseCase.execute()
   ├─ Buscar intento pending existente
   ├─ Si no existe, crear uno nuevo
   └─ Cargar preguntas normalizadas
   ↓
4. Retornar 200 con quiz + metadata de intento

FASE 2: Enviar Respuestas
─────────────────────
1. Usuario completa quiz, hace clic "Submit"
   ↓
2. POST /api/start-quiz
   ├─ Body: { quizId, answers: ["answer1", "answer2"] }
   ├─ Validar autenticación (401)
   └─ Validar schema JSON (400)
   ↓
3. AdminQuizAttemptService.grade()
   ├─ Para cada pregunta:
   │  ├─ Si MCQ: exact_match (case-insensitive)
   │  ├─ Si open-ended: cosine similarity (threshold 0.8)
   │  ├─ Calcular confidence (0-1)
   │  └─ Determinar gradingMethod
   │
   └─ Calcular score final: SUM(isCorrect) / totalQuestions * 100
   ↓
4. Persistir respuestas en BD
   ├─ Marcar intento como "completed"
   ├─ Guardar fecha completedAt
   └─ Almacenar score
   ↓
5. Retornar 200 con:
   ├─ score (0-100)
   ├─ questionResults (con detalles de cada respuesta)
   └─ attempts (metadata)
```

### 4.4.4 Flujo de Estadísticas

```
1. Usuario navega a /mystats
   ↓
2. Frontend GET /api/user-quiz-stats
   ├─ Validar autenticación
   └─ Graceful fallback si no autenticado (retorna [])
   ↓
3. userQuizAttemptService.getUserQuizStats(userId)
   ├─ SELECT todos UserQuizAttempt.status="completed"
   ├─ GROUP BY quizId
   ├─ Para cada quiz:
   │  ├─ COUNT attempts
   │  ├─ AVG score
   │  └─ MAX (completedAt) como lastAttempt
   └─ ORDER BY lastAttempt DESC
   ↓
4. Retornar array de estadísticas
   ↓
5. Frontend renderiza:
   ├─ 3 cards resumen (recent attempt, total attempts, quizzes completed)
   ├─ Bar chart (attempts por quiz)
   ├─ Top 2 recientes (2 columnas)
   └─ Tabla detallada (sin paginación)
```

---

## 4.5 Patrones de Diseño Implementados

### 4.5.1 Repository Pattern
Abstrae la persistencia de datos, permitiendo cambiar la BD sin afectar la lógica de negocio.

```typescript
// Interface (Contrato)
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  updateFlags(id: string, flags: any): Promise<User>;
  delete(id: string): Promise<void>;
}

// Implementación
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  // ...
}
```

### 4.5.2 Use Case Pattern
Cada caso de uso es una clase independiente que encapsula la lógica de negocio.

```typescript
export class StartQuizAttemptUseCase {
  constructor(private repos: RepositoryDependencies) {}
  
  async execute(input: StartQuizInput): Promise<StartQuizOutput> {
    // Lógica de negocio clara y testeable
  }
}
```

### 4.5.3 Dependency Injection
Los servicios reciben sus dependencias en el constructor, facilitando testing.

```typescript
export class AdminQuizService {
  constructor(
    private adminQuizRepository: AdminQuizRepository,
    private uploadQuizGenerationService: UploadQuizGenerationService
  ) {}
}
```

### 4.5.4 Strategy Pattern
Diferentes algoritmos de grading según el tipo de pregunta.

```typescript
export class AdminQuizAttemptService {
  gradeAnswer(question: Question, userAnswer: string): GradeResult {
    if (question.type === "mcq") {
      return this.gradeMCQ(question, userAnswer);
    } else {
      return this.gradeOpenEnded(question, userAnswer);
    }
  }
}
```

### 4.5.5 Factory Pattern
Creación de objetos complejos centralizada.

```typescript
export class RepositoryFactory {
  static createUserRepository(prisma: PrismaClient): UserRepository {
    return new UserRepository(prisma);
  }
}
```

---

## 4.6 Validación y Seguridad

### 4.6.1 Validación con Zod

Todos los inputs se validan usando schemas Zod:

```typescript
// Schema Definition
export const quizCreationSchema = z.object({
  topic: z.string().min(1).max(50),
  type: z.enum(["mcq", "open_ended"]),
  amount: z.number().min(1).max(10)
});

// En endpoint
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = quizCreationSchema.safeParse(body);
  
  if (!validation.success) {
    return Response.json(
      { error: "Invalid payload", details: validation.error },
      { status: 400 }
    );
  }
  
  const validatedData = validation.data;
  // Proceder con datos validados
}
```

### 4.6.2 Autenticación y Autorización

```typescript
// Verificar autenticación
const session = await getAuthSession();
if (!session) return 401;

// Verificar roles
if (session.user.isAdmin !== true) return 401;

// Verificar estado del usuario
if (session.user.isBanned) return 403;
if (session.user.isRevoked) return 403;

// Verificar permisos específicos
if (userId !== session.user.id && !session.user.isAdmin) return 403;
```

### 4.6.3 Rate Limiting

```typescript
export async function generateQuestionsFromContent(content: string) {
  try {
    const response = await openai.chat.completions.create({
      // ...
    });
  } catch (error) {
    if (error.status === 429) {
      // Rate limit alcanzado
      return {
        success: false,
        questions: fallbackQuestions,
        rateLimited: true
      };
    }
  }
}
```

---

## 4.7 Manejo de Errores

### 4.7.1 Errores de Negocio

```typescript
export class ValidationError extends Error {
  constructor(message: string, public details?: Record<string, any>) {
    super(message);
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Access denied") {
    super(message);
  }
}
```

### 4.7.2 Mapeo de Errores a HTTP

```typescript
export function errorToHttpResponse(error: Error) {
  if (error instanceof ValidationError) {
    return Response.json(
      { error: error.message, details: error.details },
      { status: 400 }
    );
  }
  
  if (error instanceof NotFoundError) {
    return Response.json(
      { error: error.message },
      { status: 404 }
    );
  }
  
  if (error instanceof ForbiddenError) {
    return Response.json(
      { error: error.message },
      { status: 403 }
    );
  }
  
  // Error inesperado
  return Response.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

---

## 4.8 Testabilidad

### 4.8.1 Estructura de Tests

```
src/__tests__/
├── api/
│   ├── integration/              # Integration tests de endpoints
│   ├── services/                 # Unit tests de servicios
│   ├── repositories/             # Unit tests de repositorios
│   └── (admin)/
│       ├── integration/
│       ├── services/
│       └── repositories/
├── application/                  # Unit tests de use cases
└── components/                   # Component tests (React)
```

### 4.8.2 Mocking y Fixtures

```typescript
// Mock de repositorio
const mockUserRepository = {
  findById: jest.fn(),
  updateFlags: jest.fn(),
  delete: jest.fn()
};

// Fixture de datos
const mockUser = {
  id: "test-user-1",
  email: "test@example.com",
  isAdmin: true
};

// Test
describe("UserService", () => {
  it("should ban a user", async () => {
    mockUserRepository.updateFlags.mockResolvedValue({
      ...mockUser,
      banned: true
    });
    
    const service = new UserService(mockUserRepository);
    const result = await service.banUser("test-user-1");
    
    expect(result.banned).toBe(true);
  });
});
```

---

## 4.9 Performance y Optimizaciones

### 4.9.1 Índices en BD

```prisma
model User {
  // ...
  @@index([email])
  @@index([isAdmin])
}

model UserQuizAttempt {
  // ...
  @@index([userId])
  @@index([quizId])
  @@index([status])
  @@unique([userId, quizId, status])
}
```

### 4.9.2 Caching Strategies

- **NextAuth Sessions**: JWT-based, 24 horas inactivity timeout
- **DB Queries**: Minimizar N+1 problems con includes/select
- **API Responses**: Stateless, no necesita cache server

### 4.9.3 Algoritmos Optimizados

**Cosine Similarity para Grading:**
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}
// O(n) donde n = dimensiones del vector
// En prácticaO(token_count * embeddings_size)
```

---

## 4.10 Escalabilidad

### 4.10.1 Diseño preparado para escala

- **Stateless API**: Cada request es independiente
- **Transactions ACID**: Garantizar consistencia en operaciones complejas
- **Índices DB**: Optimizar queries frecuentes
- **Separación de concerns**: Servicios independientes testeable

### 4.10.2 Áreas de escalabilidad futura

1. **Caché distribuido** (Redis) para sesiones y queries frecuentes
2. **Queue de trabajos** (Bull/RabbitMQ) para generación de preguntas asincrónica
3. **Búsqueda full-text** (Elasticsearch) para quizzes
4. **CDN** para assets estáticos
5. **Microservicios** separando admin de user-facing features

---

## 4.11 Conclusión

La arquitectura de NextQuizAI implementa **Clean Architecture** con separación clara entre capas, facilitando:

✅ **Testabilidad**: Componentes aislados y fácil de mockar
✅ **Mantenibilidad**: Código organizado y responsabilidades claras
✅ **Escalabilidad**: Diseño preparado para crecimiento
✅ **Seguridad**: Validación, autenticación, autorización en todas las capas
✅ **Robustez**: Manejo de errores, transacciones, fallbacks

El resultado es una plataforma educativa moderna, segura y profesional que puede soportar miles de usuarios concurrentes y evolucionar fácilmente para nuevas características.
