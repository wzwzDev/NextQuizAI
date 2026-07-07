# 🎓 GUÍA COMPLETA PARA DEFENSA - NextQuizAI

## PROYECTO: NextQuizAI - Plataforma Inteligente de Generación y Evaluación de Cuestionarios

**Tecnologías:** Next.js 14 | React 18 | TypeScript | OpenAI GPT-4 | Prisma | MySQL | NextAuth.js

---

# 📋 PREGUNTAS ESPERADAS EN LA DEFENSA

## 1️⃣ PREGUNTAS SOBRE EL PROYECTO Y MOTIVACIÓN

### P1: ¿Cuál es el propósito principal de NextQuizAI?

**R:** NextQuizAI es una plataforma web full-stack que permite a profesores y estudiantes generar y resolver cuestionarios de forma automática usando inteligencia artificial. Los objetivos principales son:

- **Automatizar la creación de preguntas**: Utilizando OpenAI GPT-4, reduce significativamente el tiempo que los profesores invierten en crear evaluaciones
- **Adaptar dificultad**: Soporta dificultades easy, medium, hard y mixed para diferentes niveles de aprendizaje
- **Múltiples formatos**: Preguntas de opción múltiple (MCQ) y preguntas abiertas con evaluación automática
- **Escalabilidad**: Arquitectura serverless en Vercel soporta múltiples usuarios simultáneamente
- **Seguridad**: Control de acceso robusto con autenticación OAuth y gestión de roles

**Beneficios:**
- Profesores: Ahorran ~70% del tiempo de creación de evaluaciones
- Estudiantes: Feedback inmediato en sus respuestas
- Institución: Reduce carga administrativa

---

### P2: ¿Cuál fue tu motivación personal para elegir este tema?

**R:** [Personaliza según tu contexto - Ejemplo:]

- Necesidad real en educación: Los profesores pierden demasiado tiempo creando evaluaciones
- Interés en IA aplicada: Usar GPT-4 para resoluciones del mundo real
- Full-stack moderno: Aplicar conceptos de arquitectura limpia en un proyecto real
- Escalabilidad: Aprender a diseñar sistemas que crecen con demanda

---

### P3: ¿Qué problema resuelve tu plataforma?

**R:** Resuelve tres problemas principales:

1. **Problema de tiempo**: Profesores gastan 3-4 horas semanales en crear evaluaciones
   - Solución: Generación automática en minutos

2. **Problema de variedad**: Reutilización de preguntas año tras año
   - Solución: Generación ilimitada de preguntas únicas

3. **Problema de feedback**: Evaluación manual de preguntas abiertas es lenta
   - Solución: Evaluación automática inmediata usando similitud de strings

---

## 2️⃣ PREGUNTAS SOBRE ARQUITECTURA

### P4: ¿Qué patrón de arquitectura utilizas?

**R:** Implemento **Clean Architecture** con cuatro capas bien definidas:

```
┌─────────────────────────────────────┐
│      CAPA DE PRESENTACIÓN           │
│  (React Components, Pages)          │
├─────────────────────────────────────┤
│      CAPA DE APLICACIÓN             │
│  (Use Cases, Orquestación)          │
├─────────────────────────────────────┤
│      CAPA DE DOMINIO                │
│  (Entidades, Lógica de Negocio)     │
├─────────────────────────────────────┤
│      CAPA DE INFRAESTRUCTURA        │
│  (Adaptadores, Repositorios, BD)    │
└─────────────────────────────────────┘
```

**Ubicaciones en proyecto:**
- **Domain**: `src/domain/` - Reglas de negocio puras
- **Application**: `src/application/use-cases/` - Casos de uso
- **Infrastructure**: `src/infrastructure/` - Adaptadores (OpenAI, BD)
- **Presentation**: `src/app/`, `src/components/` - UI

**Ventajas:**
- Independencia de frameworks
- Fácil de testear
- Cambios en BD no afectan lógica
- Cambios en UI no afectan casos de uso

---

### P5: ¿Cómo está organizado el flujo de datos en tu aplicación?

**R:** Flujo unidireccional de datos (similar a Redux):

```
Usuario (Frontend)
    ↓
React Component
    ↓
API Route (Next.js)
    ↓
Application Use Case (Orquestación)
    ↓
Domain Service (Lógica de Negocio)
    ↓
Infrastructure Repository (BD)
    ↓
Prisma ORM
    ↓
MySQL Database
    ↓
Respuesta vuelve hacia arriba
```

**Ejemplo: Generación de Preguntas**

1. Usuario hace submit en formulario
2. Frontend llama `POST /api/start-quiz`
3. Endpoint valida entrada con Zod
4. Use case `GenerateTopicQuestionsUseCase` orquesta
5. `OpenAiLlmAdapter` llama OpenAI
6. Respuesta se guarda vía `QuestionRepositoryAdapter`
7. Prisma inserta en base de datos
8. JSON se retorna al frontend

---

### P6: ¿Qué es el patrón Puerto-Adapter y cómo lo usas?

**R:** Es un patrón hexagonal que desacopla la lógica de negocio de detalles técnicos:

**Puerto:** Interfaz que define el contrato
```typescript
// src/infrastructure/ports/LlmPort.ts
export interface LlmPort {
  generateQuestions(topic: string, difficulty: string): Promise<QuestionGenerated[]>;
}
```

**Adaptador:** Implementación específica
```typescript
// src/infrastructure/llm/OpenAiLlmAdapter.ts
export class OpenAiLlmAdapter implements LlmPort {
  async generateQuestions(topic, difficulty) {
    // Implementación real con OpenAI
  }
}
```

**Casos de uso:**
- Si mañana cambio OpenAI por Claude, solo cambio el adaptador
- La lógica de negocio no conoce los detalles de OpenAI
- Fácil de testear: puedo crear un `MockLlmAdapter`

---

### P7: ¿Cómo maneja tu arquitectura la separación de responsabilidades?

**R:** Cada capa tiene responsabilidades claras:

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| **Domain** | Reglas de negocio | `OpenEndedGrader` evalúa respuestas |
| **Application** | Orquestar casos de uso | `GenerateTopicQuestionsUseCase` coordina |
| **Infrastructure** | Detalles técnicos | `OpenAiLlmAdapter` llama API |
| **Presentation** | UI | `MCQ.tsx` renderiza pregunta |

**Beneficio:** Si OpenAI falla, solo necesito cambiar el adaptador. La lógica de generación de preguntas sigue igual.

---

## 3️⃣ PREGUNTAS SOBRE AUTENTICACIÓN

### P8: ¿Cómo funciona tu sistema de autenticación?

**R:** Uso **NextAuth.js v5** con JWT y múltiples proveedores:

**Flujo de Login:**

1. Usuario hace click en "Sign in with Google"
2. Redirige a Google OAuth consent screen
3. Google retorna `idToken` y `accessToken`
4. NextAuth crea JWT con datos del usuario
5. JWT se guarda en HTTP-only cookie (seguro)
6. Cada request incluye automáticamente el JWT

**Archivos clave:**
- `src/server/core/auth.ts` - Configuración de NextAuth

**Callbacks:**

```typescript
// JWT Callback - Enriquece token
jwt({ token, user, account }) {
  if (user) {
    token.id = user.id;
    token.isAdmin = user.isAdmin;
    token.banned = user.banned;
  }
  return token;
}

// Session Callback - Agrega datos a sesión
session({ session, token }) {
  session.user.id = token.id;
  session.user.isAdmin = token.isAdmin;
  return session;
}
```

**Ventajas:**
- Stateless: No necesito almacenar sesiones en servidor
- Seguro: HTTP-only cookies
- Escalable: Funciona bien con Vercel serverless

---

### P9: ¿Cuáles son los roles y niveles de acceso en tu sistema?

**R:** Implemento cuatro niveles de acceso:

**1. Usuario Anónimo**
- Sin autenticación
- Solo ve páginas públicas
- Redirigido a login en rutas protegidas

**2. Usuario Regular**
- `isAdmin = false`, `banned = false`, `revoked = false`
- Puede crear quizzes personales
- Puede resolver quizzes publicados
- Acceso: `/dashboard`, `/home`, `/quiz`

**3. Usuario Revocado**
- `revoked = true`
- NO puede acceder a quizzes publicados
- Puede generar quizzes personales
- Redirigido a `/revoked` si intenta
- Caso de uso: Revoco acceso sin banear completamente

**4. Usuario Baneado**
- `banned = true`
- NO puede hacer login
- Bloqueado en capa de autenticación
- Caso de uso: Usuario con mal comportamiento

**5. Administrador**
- `isAdmin = true`
- Panel admin completo
- Crear quizzes publicados
- Banear/revocar otros usuarios

**6. Propietario (Owner)**
- Email específico: `waelwzwz@gmail.com`
- Control total del sistema
- Supervisión de admins

**Implementación:** `src/server/services/userReadService.ts`

---

### P10: ¿Cómo proteges rutas y endpoints?

**R:** Implemento protección en múltiples niveles:

**Nivel 1: Autenticación**
```typescript
const session = await getServerSession();
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**Nivel 2: Autorización**
```typescript
if (!session.user.isAdmin) {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

**Nivel 3: Validación de datos**
```typescript
const validated = CreateQuizSchema.parse(req.body);
```

**Nivel 4: Verificación de estado**
```typescript
if (user.banned) return Response.json({ error: "User banned" }, { status: 403 });
```

**Páginas protegidas:**
- `/dashboard` → Redirige a `/banned` si está baneado
- `/home` → Redirige a `/revoked` si está revocado
- `/admin/*` → Redirige a `/` si no es admin

---

## 4️⃣ PREGUNTAS SOBRE GENERACIÓN DE PREGUNTAS

### P11: ¿Cómo generas preguntas usando OpenAI?

**R:** Uso un prompt estructurado que especifica:

**1. Instrucciones claras**
```
Eres un profesor experto creando preguntas de evaluación.
Genera 5 preguntas sobre: [TEMA]
Tipo: [MCQ o OpenEnded]
Dificultad: [easy/medium/hard]
```

**2. Especificación de dificultad**

- **Easy**: Preguntas de recall directo (1-3 palabras)
- **Medium**: Mezcla recall + inferencia ligera (2-5 palabras)
- **Hard**: Razonamiento multi-paso (3-6 palabras)
- **Mixed**: Balance automático

**3. Validación de respuesta**
```typescript
// OpenAiLlmAdapter.ts
const response = await openai.createChatCompletion({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.7, // Variedad controlada
  max_tokens: 2000,
});
```

**4. Parseo y validación**
```typescript
// Extraigo JSON de respuesta
const parsed = JSON.parse(response.content);
// Valido estructura
validateQuestionStructure(parsed);
// Guardo en BD
await saveQuestions(parsed);
```

**Manejo de errores:**
- Rate limiting: Reintentos con exponential backoff
- Timeout: 30 segundos máximo
- Validación fallida: Reintentar con prompt más específico

---

### P12: ¿Cómo usas OCR para extraer texto de PDFs?

**R:** Integro Google Vision API para extraer contenido:

**Flujo:**
1. Usuario sube PDF
2. Conviero PDF a imágenes
3. Envío imágenes a Google Vision API
4. Vision retorna texto extraído (OCR)
5. Paso texto a OpenAI para generar preguntas

**Implementación:**
```typescript
// src/app/api/(admin)/upload-and-generate/route.ts
1. Recibir PDF
2. Convertir a imágenes (pdf-lib)
3. Subir a Google Cloud Storage
4. Llamar Vision API
5. Extraer texto
6. Generar preguntas con OpenAI
```

**Limitaciones:**
- Solo PDFs con texto (no imágenes escaneadas de baja calidad)
- Máximo 20 MB de archivo
- Máximo 10 páginas

---

### P13: ¿Cómo manejas la calidad de las preguntas generadas?

**R:** Implemento varias estrategias:

**1. Validación de estructura**
```typescript
const schema = z.object({
  question: z.string().min(10),
  answer: z.string().min(3),
  options: z.array(z.string()).length(4), // MCQ
  difficulty: z.enum(["easy", "medium", "hard"]),
});
```

**2. Filtrado de preguntas duplicadas**
```typescript
// Comparo similitud de preguntas generadas
const similarity = calculateStringSimilarity(q1, q2);
if (similarity > 0.8) filterDuplicate();
```

**3. Verificación de respuesta correcta**
```typescript
// Para MCQ: La respuesta debe estar en opciones
if (!options.includes(answer)) throw Error("Invalid answer");
```

**4. Revisión manual**
- Admin puede editar/rechazar preguntas antes de publicar
- Estado: `pending` → `approved` → `published`

---

## 5️⃣ PREGUNTAS SOBRE EVALUACIÓN

### P14: ¿Cómo evalúas respuestas en preguntas abiertas?

**R:** Uso algoritmos de similitud de strings que comparan la respuesta del usuario con la correcta:

**Algoritmos disponibles:**

1. **Exact Match** (Más estricto)
   - Comparación directa case-insensitive
   - Útil para respuestas cortas y precisas
   - Ejemplo: "Paris" vs "paris" → 100%

2. **Levenshtein Distance** (Medio)
   - Calcula número mínimo de ediciones (insert, delete, replace)
   - Tolera pequeños errores ortográficos
   - Ejemplo: "Barcelona" vs "Barcelonaa" → 95%

3. **Cosine Similarity** (Más flexible)
   - Vectoriza palabras y compara ángulo
   - Entiende sinónimos y paráfrasis
   - Ejemplo: "Es rojo" vs "Es de color rojo" → 85%

**Implementación:**
```typescript
// src/domain/services/OpenEndedGrader.ts
export class OpenEndedGrader {
  grade(studentAnswer: string, correctAnswer: string): number {
    const exact = calculateExactMatch(studentAnswer, correctAnswer);
    const levenshtein = calculateLevenshteinSimilarity(studentAnswer, correctAnswer);
    const cosine = calculateCosineSimilarity(studentAnswer, correctAnswer);
    
    // Promedio ponderado
    return (exact * 0.3) + (levenshtein * 0.4) + (cosine * 0.3);
  }
}
```

**Threshold de aprobación:** 70% de similitud = correcto

**Ventajas:**
- Tolera variaciones ortográficas menores
- Flexible con sinónimos
- Evita falsos negativos

**Limitaciones:**
- No entiende conceptos complejos
- Puede tener falsos positivos
- Por eso tengo validación manual del admin

---

### P15: ¿Cómo funcionan los intentos de quiz?

**R:** Implemento sistema de intentos limitados:

**Modelo de datos:**
```prisma
model UserQuizAttempt {
  id: String
  userId: String
  quizId: String
  attemptNumber: Int        // 1, 2, 3...
  answers: Json             // { q1: "respuesta1", q2: "respuesta2" }
  score: Float              // 0-100
  status: AttemptStatus     // pending | completed | abandoned
  startedAt: DateTime
  completedAt: DateTime?
}
```

**Reglas:**
- Admin define `allowedAttempts` por quiz (default: 2)
- Usuario no puede hacer más intentos que permitidos
- Cada intento se guarda completo (trazabilidad)
- Score es el promedio de aciertos

**Validación:**
```typescript
const attempts = await getUserAttempts(userId, quizId);
if (attempts.length >= quiz.allowedAttempts) {
  throw new Error("Max attempts exceeded");
}
```

---

## 6️⃣ PREGUNTAS SOBRE BASE DE DATOS

### P16: ¿Cuál es tu esquema de base de datos?

**R:** Uso MySQL con Prisma ORM. Modelos principales:

**User**
```prisma
model User {
  id: String @id @default(cuid())
  email: String @unique
  passwordHash: String?           // Para login con credenciales
  isAdmin: Boolean @default(false)
  banned: Boolean @default(false)
  revoked: Boolean @default(false)
  
  accounts: Account[]    // OAuth (Google)
  sessions: Session[]    // NextAuth
  games: Game[]         // Quizzes generados
}
```

**Game** (Quiz generado personalmente)
```prisma
model Game {
  id: String @id @default(cuid())
  userId: String
  topic: String
  gameType: GameType     // mcq | open_ended
  timeStarted: DateTime
  timeEnded: DateTime?
  
  user: User @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions: Question[]
}
```

**Question**
```prisma
model Question {
  id: String @id @default(cuid())
  gameId: String
  question: String @db.LongText    // Hasta 5000 chars
  answer: String @db.LongText
  options: Json?                    // Para MCQ
  userAnswer: String? @db.LongText
  isCorrect: Boolean?
  percentageCorrect: Float?         // Para open-ended
  
  game: Game @relation(fields: [gameId], references: [id], onDelete: Cascade)
}
```

**AdminQuiz** (Quiz publicado)
```prisma
model AdminQuiz {
  id: String @unique
  title: String
  category: String
  difficulty: String    // easy | medium | hard
  quizType: GameType
  status: String        // pending | approved | rejected
  allowedAttempts: Int @default(2)
  
  questions: AdminQuizQuestion[]
}
```

**UserQuizAttempt**
```prisma
model UserQuizAttempt {
  id: String @unique
  userId: String
  quizId: String
  attemptNumber: Int
  answers: Json
  score: Float
  status: UserQuizAttemptStatus    // pending | completed
  startedAt: DateTime
  completedAt: DateTime?
}
```

---

### P17: ¿Cómo manejas las relaciones y cascadas?

**R:** Uso `onDelete: Cascade` para mantener integridad referencial:

```prisma
model User {
  accounts: Account[] @relation(onDelete: Cascade)
  sessions: Session[] @relation(onDelete: Cascade)
  games: Game[] @relation(onDelete: Cascade)
}

model Game {
  questions: Question[] @relation(onDelete: Cascade)
}

model AdminQuiz {
  questions: AdminQuizQuestion[] @relation(onDelete: Cascade)
}
```

**Flujo cuando elimino un usuario:**
1. BD ejecuta `DELETE FROM users WHERE id = X`
2. Trigger cascade automático elimina:
   - Todas sus accounts
   - Todas sus sessions
   - Todos sus games
   - Todas las questions de esos games
3. Datos orfanados eliminados automáticamente

**Ventaja:** Garantiza base de datos limpia sin datos huérfanos

---

### P18: ¿Cómo migraste de bases de datos?

**R:** Usar Prisma Migrations:

**Crear migración:**
```bash
npx prisma migrate dev --name nombre_migracion
```

**Proceso:**
1. Cambio schema.prisma
2. Prisma genera SQL automático
3. Verifica seguridad de cambios
4. Aplica a BD de desarrollo
5. Genera archivo de migración

**Migración realizada:**
```sql
-- Extender campos de texto
ALTER TABLE Question 
ADD COLUMN questionExtended LONGTEXT,
ADD COLUMN answerExtended LONGTEXT;
```

**Ventajas:**
- Versionado de cambios (git control)
- Rollback fácil: `npx prisma migrate resolve`
- Documentación automática de cambios

---

## 7️⃣ PREGUNTAS SOBRE TESTING

### P19: ¿Cómo estructura tu estrategia de testing?

**R:** Implemento pirámide de testing:

```
           🔺 E2E (Playwright)
              ~10% de tests
              
         📊 Integración
              ~30% de tests
              
      ✅ Unitarios (Jest)
              ~60% de tests
```

**Configuración:**
- Backend config: `jest.backend.config.js` (Node.js environment)
- Frontend config: `jest.frontend.config.js` (jsdom environment)
- E2E config: `playwright.config.ts`

---

### P20: ¿Cómo testas la autenticación?

**R:** Tests específicos en `src/__tests__/api/services/nextauth.test.ts`:

```typescript
describe("Authentication Callbacks", () => {
  test("should allow regular user to sign in", async () => {
    const user = { id: "1", email: "test@example.com", banned: false };
    const result = await signInCallback(user);
    expect(result).toBe(true);
  });

  test("should block banned user", async () => {
    const user = { ...user, banned: true };
    const result = await signInCallback(user);
    expect(result).toBe(false);
  });

  test("should enrich JWT with admin flag", async () => {
    const token = await jwtCallback({ token: {}, user: { isAdmin: true } });
    expect(token.isAdmin).toBe(true);
  });
});
```

**Cobertura:** 100% de callbacks de auth

---

### P21: ¿Cómo testas la evaluación de respuestas?

**R:** Tests en `src/__tests__/api/services/checkAnswer.integration.test.ts`:

```typescript
describe("Answer Evaluation", () => {
  test("MCQ: exact match", () => {
    const result = evaluateMCQ("Paris", ["Paris", "Berlin", "Rome"]);
    expect(result).toBe(true);
  });

  test("Open-ended: similarity > 70%", () => {
    const result = gradeOpenEnded("Madrid", "Madrid");
    expect(result).toBeGreaterThan(70);
  });

  test("Open-ended: typo tolerance", () => {
    const result = gradeOpenEnded("Barcelonaa", "Barcelona");
    expect(result).toBeGreaterThan(85);
  });
});
```

**Cobertura:** 88.94% de statements, 80.63% de branches

---

### P22: ¿Cómo corres tus tests?

**R:** Comandos disponibles:

```bash
# Frontend tests
npm run test:frontend

# Backend tests  
npm run test:backend

# Ambos
npm test

# Con coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

**Resultados actuales:**
- Backend: 818/818 tests ✅
- Frontend: 129/129 tests ✅
- Coverage: 88.94% statements

---

## 8️⃣ PREGUNTAS SOBRE FRONTEND

### P23: ¿Cómo estructuras los componentes de React?

**R:** Componentes funcionales con hooks siguiendo Atomic Design:

**Estructura de carpetas:**
```
src/components/
├── atoms/              # Componentes básicos
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Badge.tsx
├── molecules/          # Combinaciones de atoms
│   ├── FormField.tsx
│   └── Card.tsx
├── organisms/          # Combinaciones de molecules
│   ├── QuestionForm.tsx
│   └── QuizBoard.tsx
├── templates/          # Layouts
│   └── MainLayout.tsx
└── pages/              # Next.js pages
    ├── dashboard/
    └── quiz/
```

**Ejemplo de componente:**
```typescript
// src/components/MCQ.tsx
export interface MCQProps {
  question: string;
  options: string[];
  onSubmit: (answer: string) => void;
}

export const MCQ: React.FC<MCQProps> = ({ question, options, onSubmit }) => {
  const [selected, setSelected] = useState<string>();

  return (
    <Card>
      <p className="text-lg font-semibold">{question}</p>
      <div className="space-y-2 mt-4">
        {options.map((opt) => (
          <Button
            key={opt}
            onClick={() => { setSelected(opt); onSubmit(opt); }}
            variant={selected === opt ? "default" : "outline"}
          >
            {opt}
          </Button>
        ))}
      </div>
    </Card>
  );
};
```

---

### P24: ¿Cómo manejas el estado en la aplicación?

**R:** Combinación de tecnologías según necesidad:

**1. React Query (TanStack)** - Cache de datos del servidor
```typescript
const { data: quizzes, isLoading } = useQuery({
  queryKey: ['quizzes'],
  queryFn: () => fetch('/api/published-quizzes').then(r => r.json()),
});
```

**2. React Hook Form** - Estado de formularios
```typescript
const { register, handleSubmit } = useForm({
  resolver: zodResolver(CreateQuizSchema),
});
```

**3. useState** - Estado local de componente
```typescript
const [selected, setSelected] = useState<string>();
```

**4. useContext** - Estado compartido
```typescript
const { user, logout } = useAuth();
```

**Decisión:** 
- Server state (datos BD) → React Query
- Form state → React Hook Form
- UI state → useState
- Auth state → Context + NextAuth

---

### P25: ¿Cómo validas datos en el frontend?

**R:** Uso Zod para validación declarativa:

```typescript
// src/schemas/CreateQuizSchema.ts
export const CreateQuizSchema = z.object({
  topic: z.string().min(3, "Mínimo 3 caracteres").max(50),
  difficulty: z.enum(["easy", "medium", "hard"]),
  quizType: z.enum(["mcq", "open_ended"]),
  numQuestions: z.number().min(1).max(20),
});

type CreateQuizInput = z.infer<typeof CreateQuizSchema>;

// En componente
const { register, formState: { errors } } = useForm<CreateQuizInput>({
  resolver: zodResolver(CreateQuizSchema),
});

// Validación al enviar
if (!CreateQuizSchema.safeParse(data).success) {
  showError("Datos inválidos");
}
```

**Ventajas:**
- Una única fuente de verdad (schema)
- Validación en frontend + backend
- Errores tipados y seguros

---

## 9️⃣ PREGUNTAS SOBRE BACKEND

### P26: ¿Cómo estructuras las rutas API?

**R:** Uso Next.js App Router con estructura clara:

```
src/app/api/
├── auth/
│   ├── register/
│   │   └── route.ts      # POST /api/auth/register
│   └── verify-email/
│       └── route.ts      # GET /api/auth/verify-email
├── game/
│   └── route.ts          # POST /api/game (crear juego)
├── checkAnswer/
│   └── route.ts          # POST /api/checkAnswer
├── published-quizzes/
│   └── route.ts          # GET /api/published-quizzes
├── quiz/
│   └── [quizId]/
│       └── start/
│           └── route.ts  # POST /api/quiz/[quizId]/start
└── (admin)/              # Grupo de rutas admin
    ├── quiz-create/
    │   └── route.ts
    └── users/
        └── route.ts
```

**Patrón de endpoint:**
```typescript
// src/app/api/game/route.ts
export async function POST(req: Request) {
  try {
    // 1. Validar sesión
    const session = await getServerSession();
    if (!session) return new Response("Unauthorized", { status: 401 });

    // 2. Validar entrada
    const body = GameStartSchema.parse(await req.json());

    // 3. Ejecutar lógica
    const game = await createGame(session.user.id, body);

    // 4. Retornar respuesta
    return Response.json(game);
  } catch (error) {
    // 5. Manejar errores
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

---

### P27: ¿Cómo maneja el error handling?

**R:** Implemento tratamiento de errores en múltiples capas:

**Nivel de endpoint:**
```typescript
export async function POST(req: Request) {
  try {
    // Lógica
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AuthenticationError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Nivel de servicio:**
```typescript
export async function checkAnswer(studentAnswer, correctAnswer) {
  if (!studentAnswer) throw new ValidationError("Answer required");
  if (!correctAnswer) throw new ValidationError("Correct answer not found");
  
  try {
    const score = gradeAnswer(studentAnswer, correctAnswer);
    return { score, isCorrect: score >= 70 };
  } catch (error) {
    throw new EvaluationError("Failed to evaluate answer");
  }
}
```

**Errores personalizados:**
```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
```

---

### P28: ¿Cómo optimiza tu backend?

**R:** Varias estrategias de optimización:

**1. Caching de consultas**
```typescript
// Caché de usuarios frecuentes
const userCache = new Map();
const getUser = (id) => userCache.get(id) ?? fetchFromDB(id);
```

**2. Lazy loading de relaciones**
```prisma
const user = await prisma.user.findUnique({
  where: { id },
  include: { games: { take: 10 } }, // Solo últimos 10 juegos
});
```

**3. Índices en BD**
```prisma
model Game {
  userId: String
  @@index([userId])  // Índice para búsquedas rápidas
}
```

**4. Validación temprana**
```typescript
// Validar antes de queries DB
const schema = z.object({ topic: z.string().min(3) });
schema.parse(input); // Falla antes de llegar a BD
```

**5. Retry logic con backoff**
```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

---

## 🔟 PREGUNTAS SOBRE DEPLOYMENT Y CI/CD

### P29: ¿Cómo despliegas tu aplicación?

**R:** Uso Vercel para hosting serverless:

**Ventajas de Vercel:**
- Deploy automático desde GitHub
- Serverless functions escalables
- Auto-scaling según demanda
- CDN global
- HTTPS automático
- Environment variables secretas

**Proceso de deploy:**
1. Push a rama `master` en GitHub
2. GitHub Actions ejecuta:
   - Tests
   - Build
   - Sync DB (Prisma)
3. SonarCloud analiza código
4. Vercel recibe señal de completado
5. Deploy automático en producción

**Comando de build:**
```bash
npm run build
```

**Variables de entorno en Vercel:**
```
NEXTAUTH_SECRET=xxx
OPENAI_API_KEY=xxx
DATABASE_URL=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

### P30: ¿Cómo configura tu CI/CD pipeline?

**R:** Uso GitHub Actions con dos workflows:

**.github/workflows/ci.yml:**
```yaml
name: CI Pipeline
on:
  push:
    branches: [master]
  pull_request:

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Para SonarCloud
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:frontend
      - run: npm run test:backend
      - run: npm run coverage:merge
      
      - uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Pasos principales:**
1. **Checkout**: Descarga código
2. **Setup Node**: Configura Node 20
3. **Dependencies**: `npm ci`
4. **Build**: Compila Next.js
5. **Tests**: Frontend + Backend
6. **Coverage**: Genera reportes
7. **SonarCloud**: Análisis de calidad

---

### P31: ¿Cómo integras SonarCloud?

**R:** SonarCloud analiza calidad de código automáticamente:

**Configuración: `sonar-project.properties`**
```properties
sonar.projectKey=wzwzDev_NextQuizAI
sonar.organization=wzwzdev
sonar.sources=src
sonar.tests=src/__tests__
sonar.coverage.exclusions=src/__tests__,node_modules
sonar.lcov.reportPaths=coverage/lcov.info
```

**Métricas analizadas:**
- Code coverage: 88.94% ✅
- Code smells: Complejidad
- Security hotspots: Vulnerabilidades potenciales
- Bugs: Errores detectados
- Duplicaciones: Código duplicado

**Integraciones:**
- PR checks: Bloquea merge si coverage baja
- Dashboard: Monitoreo continuo
- Notifications: Alertas en GitHub

---

## 1️⃣1️⃣ PREGUNTAS SOBRE SEGURIDAD

### P32: ¿Cuáles son las vulnerabilidades que proteges?

**R:** Implemento protecciones contra vulnerabilidades comunes:

**1. Injection (SQL/NoSQL)**
- Protección: Prisma ORM + validación Zod
- Prisma genera queries parametrizadas automáticamente

**2. Broken Authentication**
- Protección: NextAuth.js + JWT + HTTP-only cookies
- Validación de sesión en cada endpoint

**3. Sensitive Data Exposure**
- Protección: HTTPS obligatorio en Vercel
- Variables secretas nunca en código
- CORS restringido

**4. Cross-Site Scripting (XSS)**
- Protección: React escapa automáticamente
- Content-Type: application/json

**5. Broken Access Control**
- Protección: Verificación de permisos en cada ruta
- Roles y niveles de acceso

**6. Rate Limiting**
- Protección: Para OpenAI API
- Exponential backoff en reintentos

**7. CSRF (Cross-Site Request Forgery)**
- Protección: NextAuth maneja tokens CSRF
- SameSite cookies

---

### P33: ¿Cómo proteges contra ataques de fuerza bruta?

**R:** Implemento varias estrategias:

**1. Límite de intentos fallidos**
```typescript
const loginAttempts = new Map();

if (loginAttempts.get(email) > 5) {
  throw new Error("Too many failed attempts. Try again in 15 minutes.");
}
```

**2. Incremento de timeout**
```typescript
const lastAttempt = loginAttempts.get(email);
const timeout = Math.pow(2, attemptCount) * 60000; // Exponential
if (Date.now() - lastAttempt < timeout) {
  throw new Error(`Try again in ${timeout / 1000} seconds`);
}
```

**3. Hashing seguro de contraseña**
```typescript
// Usar bcrypt (nunca plaintext)
const hash = await bcrypt.hash(password, 10);
```

**4. Email verification requerida**
```typescript
if (!user.emailVerified) {
  throw new Error("Please verify your email first");
}
```

---

### P34: ¿Cómo manejas datos sensibles?

**R:** Uso principios de seguridad estrictos:

**Contraseñas:**
- Hash con bcrypt (nunca plaintext)
- Salt rounds: 10
- Almacenadas en `User.passwordHash`

**Tokens:**
- JWT con firma HMAC-SHA256
- Almacenado en HTTP-only cookies
- Expires en 24 horas

**API Keys:**
```env
OPENAI_API_KEY=sk-xxx...     # Nunca en código
NEXTAUTH_SECRET=xxx...       # Solo en .env.local
GOOGLE_CLIENT_SECRET=xxx...  # Solo en .env.local
```

**Datos de usuario:**
- Nunca exponemos en logs
- Encriptamos si es necesario
- Cumplimos GDPR (derecho al olvido)

---

## 1️⃣2️⃣ PREGUNTAS DE ESCALABILIDAD

### P35: ¿Cómo escala tu aplicación?

**R:** Arquitectura diseñada para crecer:

**1. Serverless scaling**
- Vercel auto-escala funciones
- Paralleliza requests
- Pay-per-execution (costo bajo)

**2. Database scaling**
- TiDB Cloud auto-escala
- Sharding automático
- Read replicas para consultas pesadas

**3. Caching**
- React Query en frontend
- Redis potencial en backend
- CDN global de Vercel

**4. Optimización de queries**
- Índices en BD
- Select solo campos necesarios
- Pagination de resultados

**Ejemplo de límites actuales:**
- ~1000 usuarios simultáneos
- ~10,000 preguntas generadas/día
- ~100,000 intentos de quiz/mes

**Mejoras futuras:**
- WebSocket para real-time
- Message queue (Bull/RabbitMQ)
- Microservicios si es necesario

---

### P36: ¿Cómo maneja la concurrencia?

**R:** Implemento mecanismos anti-race condition:

**1. Locks optimistas**
```typescript
model Game {
  version: Int @default(1)  // Incrementar en cada update
}

// Al actualizar:
const result = await prisma.game.updateMany({
  where: { id, version: currentVersion },
  data: { version: { increment: 1 }, status: "completed" },
});

if (result.count === 0) {
  throw new Error("Race condition detected");
}
```

**2. Transacciones**
```typescript
const result = await prisma.$transaction(async (tx) => {
  const game = await tx.game.findUnique({ where: { id } });
  if (game.status !== "playing") throw Error("Invalid state");
  
  const question = await tx.question.findUnique({ where: { id: qId } });
  await tx.game.update({
    where: { id },
    data: { lastAnsweredAt: new Date() },
  });
  
  return { game, question };
});
```

**3. Validación de estado**
```typescript
// Verificar estado antes de operación
if (game.status !== "playing") {
  throw new Error("Game already completed");
}
```

---

## 1️⃣3️⃣ PREGUNTAS SOBRE MEJORAS Y FUTUROS

### P37: ¿Qué mejoras planeas para el futuro?

**R:** Varias mejoras identificadas:

**Short-term (3-6 meses):**
- [ ] Evaluación semántica con embeddings
- [ ] Multi-idioma (Spanish, English, French)
- [ ] Export de resultados (PDF, Excel)
- [ ] Mobile app (React Native)

**Mid-term (6-12 meses):**
- [ ] Collaborativo: Profesores comparten quizzes
- [ ] Análisis predictivo: Detectar estudiantes en riesgo
- [ ] Gamificación: Badges, leaderboards
- [ ] Integración LMS: Canvas, Blackboard

**Long-term (12+ meses):**
- [ ] Multi-LLM: Soporte para Claude, Gemini
- [ ] AI tutor: Chat personizado para estudiantes
- [ ] Análisis video: Generar preguntas de videos
- [ ] Pruebas adaptativas: Dificultad dinámica

---

### P38: ¿Cuál fue tu mayor desafío durante el desarrollo?

**R:** [Personaliza según tu experiencia - Ejemplo:]

**Mayor desafío: Evaluación automática de preguntas abiertas**

- **Problema**: Necesitaba calificar respuestas sin ser 100% exactas
- **Solución inicial (fallida)**: Exact match solo → Demasiado estricto
- **Solución final**: Combinación de 3 algoritmos con pesos
  - Exact match: 30%
  - Levenshtein: 40%
  - Cosine similarity: 30%
- **Aprendizaje**: NLP es complejo, perfect es enemigo de good

**Otros desafíos:**
- Integración con OpenAI API: Rate limiting y costos
- Clean architecture: Curva de aprendizaje inicial
- Testing: Cobertura 88% requirió disciplina

---

### P39: ¿Qué no harías igual si empezaras de nuevo?

**R:** Lecciones aprendidas:

**1. TDD desde el inicio**
- Comenzaría escribiendo tests primero
- Habría ahorrado refactorización después

**2. Separación temprana de concerns**
- Hubiera separado servicios antes
- Clean architecture desde día 1

**3. Documentación inline**
- Habría documentado mientras desarrollaba
- No después de terminar

**4. Feature flags**
- Habría usado feature toggles para testing A/B
- Evitar branches largos

**5. Monitoreo desde inicio**
- Setup logging y error tracking (Sentry)
- No esperar hasta producción

---

## 1️⃣4️⃣ PREGUNTAS DE NEGOCIO

### P40: ¿Cuál es el modelo de negocio?

**R:** Propuesto como SaaS (Software as a Service):

**Tiers de pricingProposed:**
- **Free**: 5 quizzes/mes, 50 preguntas totales
- **Pro**: $9.99/mes - Ilimitados, analytics
- **Enterprise**: Custom - API, white-label

**Revenue streams:**
- Suscripciones mensuales
- Institutional licenses (universidades)
- Premium support

**Cost structure:**
- OpenAI API: ~$0.03 por quiz generado
- Database: ~$100/mes en TiDB
- Vercel: ~$50/mes
- Dominio/email: ~$30/año

**Break-even:** 
- 100 usuarios Pro @ $9.99 = $999/mes
- Costos operativos ~$200/mes
- Break-even: ~50 usuarios pagando

---

### P41: ¿Cuál es tu propuesta de valor?

**R:**

**Para Profesores:**
- Ahorro de tiempo: De 3 horas a 10 minutos
- Variedad: Preguntas únicas cada ciclo
- Escalabilidad: Crear quizzes para miles de estudiantes

**Para Estudiantes:**
- Feedback inmediato
- Práctica ilimitada
- Preparación personalizada

**Para Instituciones:**
- Reducción de carga docente
- Mejor preparación de estudiantes
- Datos/analytics

**Diferenciadores:**
- Evaluación automática de open-ended (raro)
- Integración con PDFs (OCR)
- Clean architecture (mantenible)

---

## 1️⃣5️⃣ PREGUNTAS TÉCNICAS PROFUNDAS

### P42: ¿Cómo implementas Dependency Injection?

**R:** Uso constructor injection y factory pattern:

```typescript
// Sin DI (acoplado):
class GenerateQuizUseCase {
  private openai = new OpenAiLlmAdapter(); // ❌ Acoplado
  
  async execute(topic: string) {
    return this.openai.generate(topic);
  }
}

// Con DI (desacoplado):
class GenerateQuizUseCase {
  constructor(private llmPort: LlmPort) {} // ✅ Desacoplado
  
  async execute(topic: string) {
    return this.llmPort.generate(topic);
  }
}

// Uso:
const openaiAdapter = new OpenAiLlmAdapter();
const useCase = new GenerateQuizUseCase(openaiAdapter);

// Para testing:
const mockAdapter = new MockLlmAdapter();
const useCaseTest = new GenerateQuizUseCase(mockAdapter);
```

**Ventajas:**
- Fácil testear con mocks
- Cambiar OpenAI por Claude sin tocar use case
- Código más mantenible

---

### P43: ¿Cómo validas sin repetir código?

**R:** Zod schemas compartidos entre frontend y backend:

```typescript
// src/schemas/CreateQuizSchema.ts (compartido)
export const CreateQuizSchema = z.object({
  topic: z.string().min(3).max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  quizType: z.enum(["mcq", "open_ended"]),
  numQuestions: z.number().min(1).max(20),
});

export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;

// En endpoint backend
export async function POST(req: Request) {
  const validated = CreateQuizSchema.parse(await req.json()); // ✅ Validación
  // ...
}

// En frontend
const { register } = useForm<CreateQuizInput>({
  resolver: zodResolver(CreateQuizSchema), // ✅ Misma validación
});
```

**Beneficio:** Una fuente de verdad, no duplicación

---

### P44: ¿Cómo maneja Next.js los archivos estáticos?

**R:** Next.js sirve estáticos desde carpeta `public/`:

```
public/
├── categories/           # Iconos de categorías
├── favicon.ico
└── robots.txt

// Acceso en HTML:
<img src="/categories/science.svg" />
```

**Optimización de imágenes:**
```typescript
import Image from 'next/image';

<Image
  src="/categories/science.svg"
  alt="Science"
  width={32}
  height={32}
  priority  // Cargar early
/>
```

**CDN global:** Vercel sirve automáticamente desde CDN global

---

### P45: ¿Cómo generas tipos TypeScript seguros?

**R:** Uso `z.infer` para tipos a partir de schemas:

```typescript
// Defino schema
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  isAdmin: z.boolean().default(false),
});

// Genero tipo automáticamente
type User = z.infer<typeof UserSchema>;

// Tipo resultante:
// type User = {
//   id: string;
//   email: string;
//   isAdmin: boolean;
// }

// Si cambio schema, tipo se actualiza automáticamente ✅
```

**Ventaja:** No repito definiciones, DRY principle

---

## 1️⃣6️⃣ PREGUNTAS FINALES

### P46: ¿Cuál es el tamaño de tu codebase?

**R:**

```
src/
├── app/              ~400 líneas
├── components/       ~2000 líneas
├── domain/          ~1500 líneas
├── application/     ~3000 líneas
├── infrastructure/  ~2500 líneas
├── server/          ~2000 líneas
├── schemas/         ~800 líneas
├── lib/             ~1000 líneas
├── types/           ~500 líneas
└── __tests__/       ~8000 líneas (tests)

Total: ~21,300 líneas de código
Total con tests: ~29,300 líneas
```

**Distribución:**
- Backend: ~40%
- Frontend: ~35%
- Tests: ~27%
- Config: ~5%

---

### P47: ¿Cuánto tiempo tomó el desarrollo?

**R:** [Personaliza según tu sprint]

- Sprint 1: 4 semanas
  - Setup inicial, autenticación, generación básica
- Sprint 2: 4 semanas
  - Panel admin, evaluación de respuestas
- Sprint 3: 2 semanas
  - Testing, documentación, despliegue

**Total: 10 semanas (3 sprints)**

---

### P48: ¿Recomendarías esta stack a otros desarrolladores?

**R:** Sí, con salvedades:

**Recomiendo para:**
- Startups que necesitan MVP rápido
- Equipos pequeños (5-10 personas)
- Proyectos con picos de tráfico variable
- Aplicaciones CRUD tradicionales

**Recomiendo evitar para:**
- Real-time heavy (chat, gaming)
- Procesamiento batch pesado
- Bajo-nivel (sistemas operativos)
- Constraints de latencia estrictos (<10ms)

**Alternativas consideradas:**
- Django (pero JavaScript mejor para fullstack)
- Go (pero overkill para startup)
- Rust (pero curva de aprendizaje)
- Java (pero demasiado enterprise)

---

### P49: ¿Qué consejo darías a futuros desarrolladores?

**R:**

1. **Arquitectura primero**: Diseña antes de codificar
2. **Tests desde inicio**: TDD es tu amigo
3. **Documentación mientras vas**: No después
4. **Simplicidad**: KISS (Keep It Simple, Stupid)
5. **DRY**: Don't Repeat Yourself
6. **YAGNI**: You Aren't Gonna Need It (no sobra-ingeniería)
7. **Comunidad**: Lee código de otros
8. **Security-first**: No lo agregues después

---

### P50: ¿Cuál es tu conclusión?

**R:** [Personaliza según reflectos]

**Logros:**
- ✅ Aplicación funcional y escalable
- ✅ 88.94% test coverage
- ✅ Clean architecture implementada
- ✅ Seguridad robusta

**Aprendizajes:**
- Arquitectura limpia es crucial para mantenibilidad
- Testing disciplinado desde inicio es crucial
- TypeScript salva bugs antes de producción
- Comunidad open-source es increíble

**Reflexión personal:**
NextQuizAI me enseñó que el verdadero desafío no es hacer funcionar el código, sino hacerlo mantenible, testeable y escalable. La arquitectura es lo que importa a largo plazo.

---

# 📚 REFERENCIAS Y RECURSOS

**Documentación oficial:**
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)

**Libros recomendados:**
- Clean Architecture - Robert C. Martin
- The Pragmatic Programmer
- Testing JavaScript - Kent C. Dodds

**Comunidades:**
- NextJS Discord
- TypeScript Community
- Dev.to
- GitHub Discussions

---

**Última actualización:** 2026-07-07
**Estado:** 🟢 Lista para defensa
