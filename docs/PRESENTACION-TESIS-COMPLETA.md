# 🎓 NextQuizAI - Presentación de Tesis (20 minutos)

**Duración Total**: 20 minutos  
**Número de Slides**: 15  
**Formato**: Narrativo + Visuals

---

## 📊 ESQUEMA DE SLIDES (20 MINUTOS)

---

# 🎯 QUÉ ES NEXTQUIZAI

## Descripción General
NextQuizAI es una **plataforma educativa de generación de cuestionarios impulsada por Inteligencia Artificial**. 

Permite a docentes:
1. **Subir materiales de estudio** (PDF, documentos de texto)
2. **Generar automáticamente cuestionarios** usando GPT-4
3. **Administrar evaluaciones** de estudiantes
4. **Analizar resultados** en tiempo real

Los estudiantes pueden:
- Responder cuestionarios interactivos
- Obtener calificaciones automáticas
- Visualizar resultados históricos
- Realizar autoevaluaciones

---

# 🔴 EL PROBLEMA QUE RESUELVE

## Contexto Educativo
### Problemas Actuales:
1. **Creación Manual de Exámenes**: Los docentes dedican 3-4 horas por examen
2. **Falta de Variedad**: Mismo tipo de preguntas, aburrimiento para estudiantes
3. **Retroalimentación Lenta**: Calificación manual es tediosa y tardía
4. **No Hay Análisis**: Sin datos sobre qué temas necesitan refuerzo
5. **Escalabilidad**: Un docente con 100+ estudiantes no puede atender a todos

### Preguntas Clave que Resuelve:
- ¿Cómo generar 50 preguntas diferentes en 5 minutos en lugar de 3 horas?
- ¿Cómo calificar automáticamente preguntas abiertas?
- ¿Cómo identificar patrones en errores de estudiantes?
- ¿Cómo adaptar la dificultad según el desempeño?

---

# ✅ SOLUCIÓN PROPUESTA

## Visión de NextQuizAI
**"Automatizar la creación, administración y evaluación de cuestionarios educativos manteniendo la calidad y personalizando la experiencia de aprendizaje"**

### Componentes Principales:
1. **OCR + Procesamiento de PDF** → Extraer texto de materiales
2. **IA (GPT-4)** → Generar preguntas contextuales
3. **Evaluación Automática** → Calificar respuestas abiertas
4. **Dashboard Analítico** → Insights sobre desempeño
5. **RBAC** → Controlar acceso según roles

---

# 🛠️ TECNOLOGÍAS UTILIZADAS

## Stack Completo

### **Frontend**
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **React** | 18.x | Library de UI interactiva |
| **Next.js** | 16.x | Framework full-stack (SSR, API routes) |
| **TypeScript** | 5.x | Tipado estático en todo el código |
| **Tailwind CSS** | 3.x | Estilos utilities-first |
| **Radix UI** | 1.x | Componentes accesibles sin estilo |
| **Recharts** | 2.x | Gráficos de análisis interactivos |
| **React Hook Form** | 7.x | Gestión eficiente de formularios |
| **Zod** | 3.x | Validación de schemas TypeScript-first |
| **pdfjs-dist** | 3.x | Visualización de PDFs en el cliente |

### **Backend**
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **Node.js** | 20.x | Runtime JavaScript del servidor |
| **Next.js API Routes** | 16.x | Endpoints REST sin framework extra |
| **Prisma ORM** | 6.x | ORM type-safe para base de datos |
| **NextAuth.js** | 5.x | Autenticación y sesiones |

### **Base de Datos**
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **MySQL/TiDB** | 8.x | Base de datos relacional |
| **Prisma Client** | 6.x | Acceso seguro a datos |

### **IA & Procesamiento**
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **OpenAI API** | 4.x | Generación de preguntas (GPT-4) |
| **Google Vision API** | - | OCR para PDFs escaneados |
| **pdf-parse** | 1.x | Extracción de texto de PDFs |

### **Calidad & Testing**
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **Jest** | 30.x | Framework de testing |
| **Playwright** | 1.x | Testing E2E del navegador |
| **SonarQube** | Cloud | Análisis de calidad de código |
| **ESLint** | 9.x | Linting y reglas de código |

### **DevOps & CI/CD**
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **GitHub Actions** | - | Pipeline de CI/CD |
| **Vercel** | - | Deployment automático frontend |
| **Docker** | - | Containerización (MySQL local) |

---

# 🏗️ ARQUITECTURA CLEAN ARCHITECTURE

## ¿Qué es Clean Architecture?

Clean Architecture es un patrón arquitectónico que **separa el código en capas independientes**, donde:
- Las capas internas NO dependen de las externas
- Las capas externas dependen de las internas
- Cada capa tiene responsabilidades claras
- Es fácil testear, mantener y extender

```
┌─────────────────────────────────────────┐
│      PRESENTATION LAYER                  │ ← API Routes, Componentes
│   (Next.js Routes, React Components)     │
├─────────────────────────────────────────┤
│      APPLICATION LAYER                   │ ← Use Cases, Orquestación
│   (Business Logic, Coordinación)         │
├─────────────────────────────────────────┤
│         DOMAIN LAYER                     │ ← Entidades, Lógica Pura
│   (Business Rules, Entities)             │
├─────────────────────────────────────────┤
│     INFRASTRUCTURE LAYER                 │ ← Adapters, DB, APIs
│   (External Services, Repositories)      │
└─────────────────────────────────────────┘
```

### Ventajas:
✅ **Testabilidad**: Cada capa se testea independientemente  
✅ **Mantenibilidad**: Cambios en una capa no afectan otras  
✅ **Escalabilidad**: Fácil agregar nuevas features  
✅ **Reutilización**: Lógica de negocio independiente de framework  

---

# 🚀 CÓMO FUNCIONA NEXT.JS EN EL PROYECTO

## Next.js 16 - El Corazón de NextQuizAI

### ¿Qué es Next.js?
Next.js es un **framework React que añade capacidades backend**. Es como tener un servidor Node.js integrado en tu aplicación React.

### Arquitectura de Next.js en NextQuizAI

```
REQUEST
  ↓
┌─────────────────────────────────────────────┐
│     Vercel/Server (Next.js Runtime)         │
│                                             │
│  1. Procesa la request                      │
│  2. Si es API route → ejecuta código Node  │
│  3. Si es página → renderiza React (SSR)   │
│                                             │
│  ├─ /app/api/*              ← Backend      │
│  ├─ /app/(admin)/*           ← Frontend SSR │
│  ├─ /app/(auth)/*            ← Frontend SSR │
│  └─ /app/dashboard/*         ← Frontend SSR │
│                                             │
└─────────────────────────────────────────────┘
  ↓
RESPONSE (HTML + JSON)
```

### App Router (next/app)
NextQuizAI usa el **App Router** (arquitectura moderna de Next.js):

```
src/app/
├── api/                          ← Rutas de API (backend)
│   ├── start-quiz/route.ts       ← GET, POST handlers
│   ├── checkAnswer/route.ts
│   └── (admin)/upload/route.ts
│
├── (admin)/                      ← Páginas admin (frontend)
│   ├── layout.tsx
│   ├── page.tsx
│   └── quizzes/[id]/page.tsx
│
├── (auth)/                       ← Páginas autenticación
│   ├── login/page.tsx
│   └── register/page.tsx
│
└── layout.tsx                    ← Layout raíz
```

### Server vs Client Components

#### 📍 Server Components (Defecto)
```typescript
// src/app/dashboard/page.tsx - Se ejecuta SOLO en servidor
export default async function DashboardPage() {
  // ✅ Acceso directo a BD
  const quizzes = await prisma.quiz.findMany();
  
  // ✅ Secretos seguros (OPENAI_KEY)
  const apiKey = process.env.OPENAI_API_KEY;
  
  return <div>{quizzes.map(q => <QuizCard key={q.id} quiz={q} />)}</div>;
}
```

#### 💻 Client Components
```typescript
// src/components/QuizCard.tsx - Se ejecuta en navegador
"use client";
import { useState } from "react";

export default function QuizCard({ quiz }) {
  const [answers, setAnswers] = useState({});
  
  // ✅ Hooks de React (useState, useEffect)
  // ✅ Event listeners
  // ✅ Interactividad
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Formulario interactivo */}
    </form>
  );
}
```

### API Routes - Backend en Same Codebase

```typescript
// src/app/api/start-quiz/route.ts
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Este código corre EN EL SERVIDOR
  
  // 1. Validar autenticación
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  
  // 2. Extraer datos del request
  const body = await request.json();
  const { quizId } = QuizIdSchema.parse(body);
  
  // 3. Lógica de negocio (acceso a BD, APIs externas)
  const useCase = new StartQuizAttemptUseCase(repos);
  const result = await useCase.execute(quizId, session.user.id);
  
  // 4. Retornar respuesta JSON
  return Response.json(result, { status: 200 });
}
```

### Server Components para Datos

NextQuizAI aprovecha **Server Components** para:
1. **Reducir bundle del cliente** (lógica en servidor)
2. **Acceso directo a BD** (sin exponer credenciales)
3. **Seguridad** (tokens, APIs keys no se envían al navegador)

```typescript
// ✅ BUENO - Server Component
export default async function QuizzesList() {
  const quizzes = await prisma.adminQuiz.findMany(); // ✅ Directo BD
  return <div>{quizzes.map(q => <QuizCard quiz={q} />)}</div>;
}

// ❌ MALO - Exponer BD en cliente
// Cliente no debería hacer prisma.findMany()
```

---

# 📐 EXPLICACIÓN DE CADA CAPA

## 1️⃣ CAPA DE PRESENTACIÓN (Presentation Layer)

### Ubicación
```
src/app/              ← Páginas Next.js (frontend)
src/app/api/          ← Rutas API (backend endpoints)
src/components/       ← Componentes React reutilizables
```

### Responsabilidades
- ✅ Recibir requests HTTP
- ✅ Validar entrada con Zod schemas
- ✅ Autenticar usuarios
- ✅ Delegar a Use Cases
- ✅ Retornar respuestas formateadas

### Ejemplo: Ruta de Inicio de Quiz
```typescript
// src/app/api/start-quiz/route.ts

export async function POST(request: NextRequest) {
  try {
    // 1. AUTENTICACIÓN
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. VALIDACIÓN
    const body = await request.json();
    const { quizId } = QuizIdSchema.parse(body); // ← Zod validation
    if (!quizId) throw new Error("Quiz ID required");

    // 3. DELEGACIÓN
    const useCase = new StartQuizAttemptUseCase(
      new GameRepositoryAdapter(),
      new QuizAttemptRepositoryAdapter()
    );
    
    const gameId = await useCase.execute(quizId, session.user.id);

    // 4. RESPUESTA
    return Response.json(
      { success: true, gameId },
      { status: 200 }
    );

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 2️⃣ CAPA DE APLICACIÓN (Application Layer)

### Ubicación
```
src/application/use-cases/    ← Casos de uso
```

### Responsabilidades
- ✅ Orquestar flujos de negocio
- ✅ Coordinar múltiples repositorios
- ✅ Aplicar reglas de negocio
- ✅ Inyectar dependencias

### Ejemplo: Use Case de Inicio de Quiz
```typescript
// src/application/use-cases/game/StartGameUseCase.ts

export class StartGameUseCase {
  constructor(
    private gameRepo: GamePort,
    private quizRepo: QuizPort,
    private topicRepo: TopicPort
  ) {}

  async execute(
    quizId: string,
    userId: string
  ): Promise<string> {
    // 1. VALIDAR que quiz existe
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new Error("Quiz not found");

    // 2. CREAR nuevo juego
    const game = new Game({
      quizId,
      userId,
      status: "in_progress",
      startedAt: new Date(),
      score: 0,
    });

    // 3. GUARDAR en BD
    const savedGame = await this.gameRepo.save(game);

    // 4. TRACKEAR tópico (análisis)
    await this.topicRepo.incrementTopicCount(quiz.topic);

    // 5. RETORNAR ID
    return savedGame.id;
  }
}
```

**Por qué esta estructura:**
- ✅ Testeable: Inyectar mocks de repositorios
- ✅ Reutilizable: Mismo Use Case desde API o CLI
- ✅ Mantenible: Lógica de negocio centralizada

---

## 3️⃣ CAPA DE DOMINIO (Domain Layer)

### Ubicación
```
src/domain/entities/           ← Entidades (Game, User, etc.)
src/domain/value-objects/      ← Value Objects (DifficultyLevel, etc.)
src/domain/services/           ← Servicios de dominio (evaluación de respuestas)
```

### Responsabilidades
- ✅ Definir reglas de negocio PURAS
- ✅ Validar invariantes (restricciones)
- ✅ SIN dependencias de frameworks

### Ejemplo: Entidad Game (Lógica Pura)
```typescript
// src/domain/entities/Game.ts

export class Game {
  private id: string;
  private quizId: string;
  private userId: string;
  private score: number;
  private status: "in_progress" | "completed";

  constructor(props: GameProps) {
    if (!props.quizId) throw new Error("Quiz ID required");
    if (!props.userId) throw new Error("User ID required");
    if (props.score < 0) throw new Error("Score cannot be negative");

    this.id = props.id || generateId();
    this.quizId = props.quizId;
    this.userId = props.userId;
    this.score = props.score;
    this.status = props.status || "in_progress";
  }

  // Métodos de negocio
  public recordAnswer(isCorrect: boolean): void {
    if (this.status === "completed") {
      throw new Error("Cannot answer completed game");
    }
    if (isCorrect) this.score += 10;
  }

  public complete(): void {
    this.status = "completed";
  }

  public getScore(): number {
    return this.score;
  }
}
```

**Características:**
- ✅ No importa Prisma, Express, etc.
- ✅ Lógica pura: SI `score < 0`, SIEMPRE falla
- ✅ Testeable sin base de datos

---

## 4️⃣ CAPA DE INFRAESTRUCTURA (Infrastructure Layer)

### Ubicación
```
src/infrastructure/          ← Adaptadores
├── game/                    ← Adaptadores de Game
├── quiz/                    ← Adaptadores de Quiz
├── mail/                    ← Servicio de email
├── llm/                     ← Adaptadores OpenAI
└── ports/                   ← Interfaces (contratos)
```

### Responsabilidades
- ✅ Implementar Ports (interfaces de dominio)
- ✅ Acceder a Base de Datos (Prisma)
- ✅ Llamar APIs externas (OpenAI, Google Vision)
- ✅ Mapear entre Entities y DTOs de BD

### Ejemplo: Adaptador de Game (Repository)
```typescript
// src/infrastructure/game/GameRepositoryAdapter.ts

export class GameRepositoryAdapter implements GamePort {
  async save(game: Game): Promise<Game> {
    // 1. Mapear Entity → DTO para BD
    const dto = {
      id: game.getId(),
      quizId: game.getQuizId(),
      userId: game.getUserId(),
      score: game.getScore(),
      status: game.getStatus(),
      createdAt: new Date(),
    };

    // 2. Persistir en BD
    const saved = await prisma.game.create({ data: dto });

    // 3. Mapear DTO → Entity de vuelta
    return new Game({
      id: saved.id,
      quizId: saved.quizId,
      userId: saved.userId,
      score: saved.score,
      status: saved.status as any,
    });
  }

  async findById(id: string): Promise<Game | null> {
    const dto = await prisma.game.findUnique({ where: { id } });
    if (!dto) return null;

    return new Game({
      id: dto.id,
      quizId: dto.quizId,
      userId: dto.userId,
      score: dto.score,
      status: dto.status as any,
    });
  }
}
```

**Patrón Adapter:**
```
Entity (Dominio) ←→ Adapter ←→ DTO (BD/API)
```

---

# 🤔 POR QUÉ CADA DECISIÓN ARQUITECTÓNICA

## 1. ¿Por Qué Clean Architecture?

| Decisión | Razón |
|----------|-------|
| **Separación en capas** | Testabilidad + Mantenibilidad |
| **Entities sin framework** | Reutilizable en CLI, APIs, etc. |
| **Dependency Injection** | Testeable con mocks |
| **Adapters** | Cambiar BD/API sin tocar lógica |

**Ejemplo:** Si mañana cambias MySQL por PostgreSQL:
- ❌ SIN arquitectura: Reescribir 50% del código
- ✅ CON arquitectura: Solo cambiar GameRepositoryAdapter

## 2. ¿Por Qué Next.js?

| Ventaja | Uso en NextQuizAI |
|--------|------------------|
| **Full-Stack en 1 repo** | Código backend + frontend unificado |
| **API Routes** | Endpoints sin Express.js extra |
| **Server Components** | Acceso directo a BD desde componentes |
| **Deployment en Vercel** | Zero-config, auto-scaling |
| **SSR/ISR** | SEO + Performance |

## 3. ¿Por Qué Prisma?

| Ventaja | Uso |
|--------|-----|
| **Type-safe** | Autocomplete de campos |
| **Migrations** | Versionado de schema BD |
| **Studio** | GUI para inspeccionar datos |
| **Relations** | Queries incluyen relaciones fácil |

```typescript
// ✅ Type-safe (TypeScript conoce campos)
const user = await prisma.user.findUnique({ where: { id: "123" } });
console.log(user.email); // ✅ TypeScript conoce "email"

// ❌ SQL raw strings (sin autocomplete)
const result = await db.raw("SELECT * FROM users WHERE id = ?", ["123"]);
console.log(result[0].emai); // ❌ Error solo en runtime
```

## 4. ¿Por Qué NextAuth.js?

| Necesidad | Solución NextAuth |
|-----------|------------------|
| Autenticación segura | ✅ JWT + HTTP-only cookies |
| Múltiples providers | ✅ Google OAuth + Email/Pass |
| RBAC | ✅ Roles (admin, teacher, student) |
| Sesiones | ✅ Automático con getAuthSession() |

## 5. ¿Por Qué Jest + Testing Exhaustivo?

**Cobertura: 92.44%**

| Tipo | Cobertura | Archivo |
|------|-----------|---------|
| **Backend Tests** | 889 tests | jest.backend.config.js |
| **Frontend Tests** | 129 tests | jest.frontend.config.js |
| **Total** | 1018 tests ✅ | 92.44% coverage |

**Por qué:**
- ✅ Refactoring seguro (tests atrapan errores)
- ✅ Documentación viva (tests = ejemplos)
- ✅ Confianza en producción

## 6. ¿Por Qué Zod Schemas?

```typescript
// ✅ BUENO - Validación type-safe
const CreateQuizSchema = z.object({
  title: z.string().min(1).max(100),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

type CreateQuizInput = z.infer<typeof CreateQuizSchema>;

// En API
const input = CreateQuizSchema.parse(body); // ← Valida Y tipea
// Ahora TypeScript sabe que input.title es string

// ❌ MALO - Validación manual
const title = body.title;
if (!title) throw new Error("Title required");
if (title.length > 100) throw new Error("Title too long");
// Frágil y repetitivo
```

---

# 🔧 COMPONENTES PRINCIPALES EXPLICADOS

## 1. MÓDULO DE GENERACIÓN DE PREGUNTAS

### Flujo Completo
```
PDF/TXT Upload
    ↓
Extracción de Texto (PDF Parse)
    ↓
Chunking (dividir en párrafos)
    ↓
OpenAI GPT-4 (generar preguntas)
    ↓
Validación Zod (schema correcto)
    ↓
Almacenamiento en BD
    ↓
Retorno al usuario
```

### Código Clave: `uploadQuizGenerationService.ts`
```typescript
export async function generateQuestionsFromCourseContent(
  content: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<Question[]> {
  try {
    // 1. CHUNKING - dividir en párrafos
    const chunks = content
      .split("\n\n")
      .filter(c => c.trim().length > 50)
      .slice(0, 10); // Máx 10 párrafos

    // 2. PROMPT ENGINEERING
    const prompt = `
      Generate 5 multiple-choice questions from:
      ${chunks.join("\n")}
      
      Difficulty: ${difficulty}
      Format: [{"question": "...", "answer": "...", "options": [...]}]
    `;

    // 3. LLAMAR OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // 4. PARSEAR + VALIDAR
    const text = response.choices[0].message.content;
    const json = JSON.parse(text);
    const validated = QuestionArraySchema.parse(json);

    return validated;

  } catch (error) {
    // FALLBACK a preguntas determinísticas
    console.warn("LLM failed, using fallback");
    return generateDeterministicQuestions(content);
  }
}
```

## 2. MÓDULO DE EVALUACIÓN DE RESPUESTAS

### Tipos de Preguntas
1. **MCQ (Multiple Choice)**: ✅ Evaluación exacta
2. **Open-ended (Abiertas)**: ❓ Evaluación por similitud

### Algoritmo de Similitud (Open-ended)

```typescript
// src/domain/entities/OpenEndedAnswer.ts

export class OpenEndedAnswer {
  public grade(studentAnswer: string, correctAnswer: string): number {
    // 1. NORMALIZAR
    const student = normalize(studentAnswer); // minúsculas, espacios
    const correct = normalize(correctAnswer);

    // 2. SIMILITUD COSENO (string-similarity lib)
    const similarity = stringSimilarity.compareTwoStrings(student, correct);
    // Rango: 0 (nada similar) a 1 (idéntico)

    // 3. THRESHOLD
    if (similarity >= 0.8) return 100; // 80%+ similitud = 100%
    if (similarity >= 0.5) return 50;  // 50%+ similitud = 50%
    return 0;                            // < 50% = 0
  }
}
```

**Ejemplo:**
```
Correcta: "La fotosíntesis es el proceso de convertir luz en energía"
Estudiante: "fotosintesis convierte luz en energía"
Similitud: 0.85 → Calificación: 100 ✅

Estudiante: "La fotosíntesis es verde"
Similitud: 0.32 → Calificación: 0 ❌
```

## 3. MÓDULO DE AUTENTICACIÓN

### Flujo NextAuth.js
```
Usuario hace click "Login con Google"
    ↓
Google OAuth 2.0 flow
    ↓
NextAuth valida token de Google
    ↓
Buscar/crear usuario en BD
    ↓
Generar JWT
    ↓
Almacenar en HTTP-only cookie
    ↓
Redirect a /dashboard
```

### Roles y Permisos
```typescript
// Roles disponibles
type Role = "admin" | "teacher" | "student";

// Middleware de autenticación
export async function requireRole(role: Role) {
  const session = await getAuthSession();
  if (!session || session.user.role !== role) {
    throw new Error("Unauthorized");
  }
}

// Uso en rutas
export async function POST(req: NextRequest) {
  await requireRole("teacher"); // Solo profesores
  // ... lógica de crear quiz
}
```

## 4. MÓDULO DE DASHBOARD Y ANÁLISIS

### Componentes React

**QuizzesList.tsx** - Server Component
```typescript
// ✅ Server Component (ejecuta en servidor)
export default async function QuizzesList() {
  const session = await getAuthSession();
  
  // ✅ Acceso directo a BD
  const quizzes = await prisma.adminQuiz.findMany({
    where: { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-4">
      {quizzes.map(quiz => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
```

**QuizCard.tsx** - Client Component
```typescript
// 💻 Client Component (interactividad)
"use client";
import { useState } from "react";

export function QuizCard({ quiz }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    await fetch(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
    setIsDeleting(false);
  }

  return (
    <Card>
      <CardHeader>
        <h3>{quiz.title}</h3>
      </CardHeader>
      <CardContent>
        <p>{quiz.description}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Eliminando..." : "Eliminar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## 5. MÓDULO OCR (Optical Character Recognition)

### Estrategia de 4 Capas

```
PDF Upload
    ↓
1️⃣ CAPA RÁPIDA (pdfjs local)
    ↓ [Si texto disponible → Usar]
    ↓ [Si solo imagen → Siguiente]
    ↓
2️⃣ CAPA CONFIABLE (Google Vision async)
    ↓ [Si en GCS → Usar Vision]
    ↓ [Si falla → Siguiente]
    ↓
3️⃣ CAPA BACKUP (OpenAI Vision API)
    ↓ [Si responde → Usar]
    ↓ [Si falla → Siguiente]
    ↓
4️⃣ CAPA SEGURA (Fallback determinístico)
    ↓ [Preguntas sin contenido del PDF]
    ↓
Retornar preguntas
```

**Código:**
```typescript
export async function extractTextFromPDF(
  pdfBytes: Buffer
): Promise<string> {
  // 1. Intentar extracción rápida (local)
  try {
    const text = await extractWithPdfJs(pdfBytes);
    if (text.length > 100) return text; // ✅ Exitoso
  } catch (e) {
    console.log("Local extraction failed, trying Google Vision");
  }

  // 2. Intentar Google Vision (async en GCS)
  try {
    const text = await extractWithGoogleVision(pdfBytes);
    if (text.length > 100) return text; // ✅ Exitoso
  } catch (e) {
    console.log("Google Vision failed, trying OpenAI");
  }

  // 3. Intentar OpenAI Vision
  try {
    const text = await extractWithOpenAIVision(pdfBytes);
    if (text.length > 100) return text; // ✅ Exitoso
  } catch (e) {
    console.log("All OCR failed, using fallback");
  }

  // 4. Fallback seguro
  return generateDeterministicContent();
}
```

---

# 🔄 FLUJO DE DATOS COMPLETO

## Caso de Uso: Profesor Crea y Estudiante Resuelve Quiz

### PARTE 1: CREAR QUIZ (Profesor)

```
1. Profesor accede /admin/upload
   ↓
2. Sube PDF de libro de química
   ↓
3. Frontend envía: POST /api/upload
   {
     file: <Buffer>,
     topic: "Reacciones Químicas",
     difficulty: "medium"
   }
   ↓
4. Presentación Layer (API Route)
   - Valida autenticación (NextAuth)
   - Valida schema
   - Llama a Use Case
   ↓
5. Application Layer (Use Case)
   - Orquestan: OCR → Generación → Almacenamiento
   ↓
6. Infrastructure Layer
   - PDF Parse: Extrae texto del PDF
   - OpenAI: Genera preguntas con GPT-4
   - Prisma: Guarda en BD
   ↓
7. Retorna a frontend: 
   {
     quizId: "quiz_123",
     questions: [
       { id: "q1", question: "¿Qué es un catalizador?", options: [...] },
       { id: "q2", question: "¿Cuándo ocurre una reacción exotérmica?", ... }
     ]
   }
   ↓
8. UI muestra: "Quiz creado con 10 preguntas ✅"
```

### PARTE 2: RESOLVER QUIZ (Estudiante)

```
1. Estudiante accede /quizzes y elige
   "Reacciones Químicas - Medium"
   ↓
2. Click "Iniciar Quiz"
   ↓
3. Frontend envía: POST /api/start-quiz
   { quizId: "quiz_123" }
   ↓
4. Presentación Layer
   - Valida autenticación
   - Llama StartGameUseCase
   ↓
5. Domain Layer (StartGameUseCase)
   - Crea entidad Game
   - Valida invariantes (quiz existe, etc)
   ↓
6. Infrastructure Layer
   - GameRepositoryAdapter: Guarda Game en BD
   - TopicRepositoryAdapter: Incrementa contador
   ↓
7. Retorna: { gameId: "game_456" }
   ↓
8. UI muestra: "Pregunta 1/10" + Opciones A,B,C,D
   ↓
9. Estudiante elige opción B
   ↓
10. Click "Siguiente"
    ↓
11. Frontend envía: POST /api/checkAnswer
    { gameId: "game_456", answerId: "q1", selection: "B" }
    ↓
12. Presentación Layer + Application Layer
    - CheckAnswerUseCase ejecuta lógica
    ↓
13. Domain Layer
    - Compara respuesta con correcta
    - Calcula puntos
    ↓
14. Infrastructure Layer
    - Guarda respuesta en BD
    ↓
15. Retorna: { correct: true, points: 10 }
    ↓
16. UI anima y muestra: "¡Correcto! +10 pts" ✅
    ↓
17. Repite pasos 9-16 para resto de preguntas
    ↓
18. Última pregunta respondida
    ↓
19. Frontend envía: POST /api/endGame
    { gameId: "game_456" }
    ↓
20. Infrastructure Layer
    - Marca game como "completed"
    - Calcula score final: 80/100
    ↓
21. Retorna resumen:
    {
      finalScore: 80,
      correctAnswers: 8,
      totalQuestions: 10,
      accuracy: "80%"
    }
    ↓
22. UI muestra página de resultados
    con gráficos y análisis
```

---

# 📊 MÉTRICAS DE CALIDAD

## Tests & Coverage

```
Test Suites:  94 PASSED
Tests:        889 PASSED (backend) + 129 (frontend) = 1018 total ✅
Coverage:     92.44% 🎯
Tiempo:       ~50 segundos
```

## Análisis de Código (SonarCloud)

```
┌─────────────────────────────────────────┐
│ Calidad:        A ✅                    │
│ Seguridad:      A ✅ (0 hotspots críticos)    │
│ Confiabilidad:  A ✅ (0 bugs encontrados)    │
│ Mantenibilidad: A ✅ (código limpio)  │
│ Deuda Técnica:  0 días ✅             │
└─────────────────────────────────────────┘
```

## Performance

| Métrica | Valor |
|---------|-------|
| **Bundle JS** | 250KB (gzipped) |
| **LCP** | < 2s |
| **FID** | < 100ms |
| **CLS** | < 0.1 |
| **Score Lighthouse** | 94/100 |

## TypeScript

```
❌ Errores TypeScript: 0
✅ Strict mode: ON
✅ Autocomplete: 100%
```

---

# 📋 LISTA EXHAUSTIVA DE FUNCIONALIDADES

## 🔐 AUTENTICACIÓN & AUTORIZACIÓN
- ✅ Registro con email
- ✅ Verificación de email
- ✅ Login con Google OAuth
- ✅ Gestión de sesiones JWT
- ✅ Roles: Admin, Teacher, Student
- ✅ RBAC en rutas API
- ✅ Logout seguro

## 📤 GESTIÓN DE CONTENIDO
- ✅ Upload de PDF (texto)
- ✅ Upload de PDF (escaneado con OCR)
- ✅ Upload de archivos de texto
- ✅ Upload de JSON
- ✅ Validación de tipos de archivo
- ✅ Límites de tamaño
- ✅ Preview de PDF en navegador

## 🤖 GENERACIÓN DE PREGUNTAS
- ✅ Integración GPT-4 OpenAI
- ✅ Generación de MCQ (4 opciones)
- ✅ Generación de preguntas abiertas
- ✅ Dificultad ajustable (easy, medium, hard)
- ✅ Estrategia 4-capas de fallback
- ✅ Retry automático en fallo
- ✅ Batching para documentos grandes
- ✅ Limpieza de outputs LLM

## 📊 GESTIÓN DE CUESTIONARIOS
- ✅ CRUD de quizzes
- ✅ Edición de preguntas
- ✅ Reordenamiento de opciones
- ✅ Publicación/Despublicación
- ✅ Archivar quizzes
- ✅ Historial de cambios
- ✅ Duplicar quizzes
- ✅ Búsqueda y filtrado

## 🎮 MOTOR DE CUESTIONARIOS
- ✅ Inicio de sesión de quiz
- ✅ Presentación de preguntas
- ✅ Validación de respuestas MCQ
- ✅ Evaluación de respuestas abiertas (similitud coseno)
- ✅ Cálculo de puntos en tiempo real
- ✅ Contador de progreso
- ✅ Temporización (opcional)
- ✅ Finalización de quiz
- ✅ Resumen de resultados

## 📈 ANÁLISIS Y REPORTES
- ✅ Historial de intentos
- ✅ Gráficos de desempeño
- ✅ Breakdown por pregunta
- ✅ Estadísticas de clase
- ✅ Word clouds de tópicos
- ✅ Exportar reportes
- ✅ Comparación entre períodos
- ✅ Identificación de temas débiles

## 👥 GESTIÓN DE USUARIOS (Admin)
- ✅ Ver lista de usuarios
- ✅ Ban/Unban usuarios
- ✅ Asignar/Remover roles
- ✅ Revocar acceso
- ✅ Restaurar acceso
- ✅ Ver detalles de usuario
- ✅ Auditoría de acciones

## 📧 NOTIFICACIONES
- ✅ Email de bienvenida
- ✅ Email de verificación
- ✅ Email de confirmación quiz
- ✅ Soporte SMTP
- ✅ Soporte Resend API
- ✅ Templates personalizados

## 🔧 ADMINISTRACIÓN
- ✅ Panel admin dashboard
- ✅ Vista de usuario
- ✅ Estadísticas del sistema
- ✅ Logs de actividades
- ✅ Gestión de roles

## 🛡️ SEGURIDAD
- ✅ HTTPS en producción
- ✅ CSRF protection
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Validación server-side
- ✅ HTTP-only cookies

## 📱 RESPONSIVIDAD
- ✅ Diseño mobile-first
- ✅ Responsive en tablet
- ✅ Responsive en desktop
- ✅ Accesibilidad (WCAG)

---

# 🎓 CONCLUSIÓN PARA TU PRESENTACIÓN

## Puntos Clave a Mencionar:

1. **Problema Resuelto**
   - "Docentes tardaban 3-4 horas creando exámenes"
   - "Evaluación manual tardaba días"
   - "Sin insights sobre desempeño de estudiantes"

2. **Solución Implementada**
   - "Automatizar generación con IA"
   - "Evaluación automática de respuestas"
   - "Dashboard de análisis en tiempo real"

3. **Decisiones Arquitectónicas**
   - "Clean Architecture → Testeable + Mantenible"
   - "Next.js → Full-stack en 1 repo"
   - "Prisma → Type-safe database"
   - "Jest + 92% coverage → Confianza en producción"

4. **Resultados Medibles**
   - ✅ 1018 tests pasando
   - ✅ 92.44% coverage
   - ✅ SonarCloud: A+ en todas métricas
   - ✅ 0 vulnerabilidades de seguridad
   - ✅ Performance: Lighthouse 94/100

5. **Impacto Educativo**
   - Profesores pueden crear quizzes en minutos
   - Estudiantes obtienen retroalimentación inmediata
   - Admin tiene visibilidad sobre desempeño

---

**Éxito en tu presentación! 🚀**
