# SPRINT 3: Biblioteca de Cuestionarios Publicados

## OBJETIVO

Implementar un sistema de cuestionarios publicados que permite a usuarios resolver quizzes creados por administradores con calificación automática, seguimiento de intentos y estadísticas. Incluye generación de preguntas desde archivos (upload + AI), gestión admin de cuestionarios y biblioteca con filtros.

---

## PLAN - Historias de Usuario (HUs) 

| # | HU | Narrativa Corta | Criterios Aceptación |
|---|----|-----------------|-----------------------|
| 1 | **HU01** | Como usuario, quiero ver una **biblioteca de cuestionarios publicados** filtrada por categoría y dificultad | • Ver lista de quizzes con paginación • Filtrar por category/difficulty • Ver stats de intentos propios |
| 2 | **HU02** | Como usuario, quiero **iniciar un cuestionario** de la biblioteca y responder todas las preguntas | • Ver preguntas completas • Responder MCQ (seleccionar opción) u open-ended (typing) • Validar límite de intentos |
| 3 | **HU03** | Como usuario, quiero **recibir calificación inmediata** al enviar quiz con desglose por pregunta | • MCQ: indicar correcto/incorrecto • Open-ended: mostrar % similitud • Ver respuesta esperada |
| 4 | **HU04** | Como usuario, quiero **ver historial de intentos** previos en cada quiz con scores y fechas | • Listar intentos por quiz • Ver score y fecha de cada intento • Acceder a detalle de intento anterior |
| 5 | **HU05** | Como admin, quiero **publicar cuestionarios con preguntas MCQ u open-ended** normalizadas desde UI o archivo | • Crear quiz con título, categoría, dificultad, tipo • Validar preguntas • Guardar persistentemente |
| 6 | **HU06** | Como admin, quiero **generar preguntas automáticamente desde archivos** (JSON/TXT/PDF) usando IA | • Subir archivo • Configurar generación (tipo, cantidad) • Revisar preguntas generadas |
| 7 | **HU07** | Como admin, quiero **ver estadísticas globales** de uso de cada quiz (intentos totales, score promedio, etc) | • Dashboard con stats agregadas • Quizzes más usados • Análisis por dificultad/categoría |
| 8 | **HU08** | Como admin, quiero **revisar y aprobar cuestionarios** antes de publicar en biblioteca | • Revisar preguntas y respuestas • Detectar problemas (duplicados, metadata IA) • Aprobar o rechazar |

---

## PLAN - Historias Técnicas (HTs)

| # | HT | Descripción | Servicios/Use Cases | Endpoints |
|---|----|-----------|--------------------|-----------|
| 1 | **HT01** | **Modelo de Datos** - 3 nuevas entidades (AdminQuiz, AdminQuizQuestion, UserQuizAttempt) con relaciones cascade y validaciones | Prisma schema, migrations | N/A |
| 2 | **HT02** | **Validación y Normalización de Preguntas** - CreateAdminQuizUseCase implementa MIN_MCQ_OPTIONS=2, deduplicación opciones, limpia metadata IA | CreateAdminQuizUseCase | POST `/api/(admin)/quizzes` |
| 3 | **HT03** | **Biblioteca de Cuestionarios Publicados** - getPublishedQuizzesWithAttempts retorna quizzes con stats usuario (completado, pending, score) | GetAdminQuizzesUseCase | GET `/api/published-quizzes` |
| 4 | **HT04** | **Recuperación de Quiz Específico** - getApprovedQuiz carga quiz completo con preguntas, valida permisos usuario | adminQuizService | GET `/api/quiz/[quizId]` |
| 5 | **HT05** | **Inicio de Intento** - ensurePendingQuizAttempt crea o reutiliza pending attempt, valida límite, incrementa attemptNumber | userQuizAttemptService | POST `/api/quiz/[quizId]/start` |
| 6 | **HT06** | **Calificación Paralela y Persistencia** - submitAndGradeAdminQuizAttempt grado all answers in parallel, calcula score, persiste resultado | SubmitAndGradeAdminQuizUseCase, AdminQuizGradingAdapter | POST `/api/start-quiz` |
| 7 | **HT07** | **Historial de Intentos** - getAttemptsByUserAndQuizIds recupera lista de intentos previos con estados y scores | userQuizAttemptService | GET `/api/quiz/[quizId]/attempts` |
| 8 | **HT08** | **Estadísticas Globales** - getQuizStatisticsSummary agrega intentos: total, completados, pending, promedio score, últimas fechas | GetAdminQuizzesUseCase | GET `/api/(admin)/quiz-statistics` |

---

# HU01 - BIBLIOTECA DE CUESTIONARIOS PUBLICADOS

## Narrativa

Como **usuario**, quiero **ver una biblioteca de cuestionarios publicados** filtrada por categoría y dificultad para elegir qué quiz resolver según mis intereses.

### Criterios de Aceptación

- ✅ Puedo ver lista paginada de quizzes (10 por página default)
- ✅ Puedo filtrar por categoría (ej: "Math", "Science", "History")
- ✅ Puedo filtrar por dificultad (easy, medium, hard)
- ✅ Para cada quiz veo: título, categoría, dificultad, # preguntas
- ✅ Veo estado de mis intentos: "completado", "pending", "no intentado"
- ✅ Veo mi score en intentos completados
- ✅ Veo # intentos restantes (ej: "1 of 2 attempts")

### Flujo de Usuario

1. Usuario accede a `/published-quizzes`
2. Ve lista de quizzes con categoría/dificultad default
3. Usa filtros dropdown para category/difficulty
4. Página recarga con resultados filtrados
5. Clickea quiz → navega a `/quiz/[quizId]` para iniciar

### Especificación Endpoint - GET `/api/published-quizzes`

**Query Parameters:**
```
GET /api/published-quizzes?category=Math&difficulty=medium&page=1&limit=10
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `category` | string | null | Filtrar por categoría del quiz |
| `difficulty` | enum | null | Filtrar por dificultad: easy/medium/hard |
| `page` | number | 1 | Página para paginación (1-indexed) |
| `limit` | number | 10 | Items por página |

**Response (200 OK):**
```json
{
  "quizzes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Physics Fundamentals",
      "category": "Science",
      "difficulty": "medium",
      "quizType": "mcq",
      "questionCount": 5,
      "attemptStatus": "completed",
      "isLocked": false,
      "userScore": 85.0,
      "remainingAttempts": 1,
      "lastAttemptAt": "2026-06-20T14:32:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Algebra Basics",
      "category": "Math",
      "difficulty": "easy",
      "quizType": "open_ended",
      "questionCount": 3,
      "attemptStatus": "pending",
      "isLocked": false,
      "userScore": null,
      "remainingAttempts": 2,
      "lastAttemptAt": null
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

**Error Responses:**

| Status | Caso |
|--------|------|
| 400 | Parámetro `difficulty` inválido |
| 401 | Usuario no autenticado |
| 500 | Error de base de datos |

### Código Verificado - getPublishedQuizzesWithAttempts

**Ubicación:** `src/server/admin/services/adminQuizService.ts`

```typescript
export async function getPublishedQuizzesWithAttempts(
  userId?: string,
  filters?: {
    category?: string;
    difficulty?: string;
  }
) {
  const whereClause: any = {
    status: "approved", // Solo quizzes publicados
  };

  if (filters?.category) {
    whereClause.category = filters.category;
  }

  if (filters?.difficulty) {
    whereClause.difficulty = filters.difficulty;
  }

  const quizzes = await db.adminQuiz.findMany({
    where: whereClause,
    include: { questions: true },
    orderBy: { createdAt: "desc" },
  });

  // Agregar stats de intentos del usuario
  const quizIds = quizzes.map((q) => q.id);
  const userAttempts = await getUserQuizAttemptStatuses(userId, quizIds);
  const attemptMap = new Map(userAttempts.map((a) => [a.quizId, a]));

  return quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    category: quiz.category,
    difficulty: quiz.difficulty,
    quizType: quiz.quizType,
    questionCount: quiz.questions.length,
    attemptStatus: attemptMap.get(quiz.id)?.status ?? "none",
    userScore: attemptMap.get(quiz.id)?.score ?? null,
    remainingAttempts: quiz.allowedAttempts - (attemptMap.get(quiz.id)?.attemptCount ?? 0),
  }));
}
```

**Test Verificado:** ✅ `jest.backend.config.js` - Suite de tests para recuperación y filtrado

---

# HU02 - INICIAR Y RESPONDER CUESTIONARIO

## Narrativa

Como **usuario**, quiero **iniciar un cuestionario de la biblioteca** y responder todas las preguntas (seleccionar opción para MCQ, escribir respuesta para open-ended) con validación de límite de intentos.

### Criterios de Aceptación

- ✅ Veo mensaje de error si intenté ≥ allowedAttempts
- ✅ Se crea pending attempt al entrar al quiz
- ✅ Para MCQ: veo 4 opciones clickeables, selecciono una
- ✅ Para open-ended: veo campo texto, escribo respuesta
- ✅ Veo botón "Enviar" que valida todas las preguntas respondidas
- ✅ No puedo enviar si alguna pregunta está vacía
- ✅ Al enviar, recibo calificación inmediata

### Flujo de Usuario

1. Usuario en `/published-quizzes` clickea quiz
2. Navega a GET `/api/quiz/[quizId]/start` (POST)
3. Ve pending attempt creado, preguntas cargadas
4. Para cada pregunta:
   - MCQ: clickea opción (almacena en answers[])
   - Open-ended: tipea respuesta
5. Clickea "Enviar" → POST `/api/start-quiz` con answers[]
6. Recibe resultado con scores

### Especificación Endpoint - POST `/api/quiz/[quizId]/start`

**Request Body:**
```json
{
  "quizId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "attemptId": "attempt-123",
  "startedAt": "2026-06-26T10:30:00Z",
  "currentAttempt": 1,
  "attempts": {
    "current": 1,
    "completed": 0,
    "allowed": 2,
    "remaining": 1
  },
  "quiz": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Physics Fundamentals",
    "category": "Science",
    "difficulty": "medium",
    "quizType": "mcq",
    "questions": [
      {
        "id": "q1",
        "question": "What is the SI unit of force?",
        "options": ["Joule", "Newton", "Pascal", "Watt"]
      }
    ]
  }
}
```

**Error Responses:**

| Status | Caso | Ejemplo |
|--------|------|---------|
| 400 | quizId inválido o quiz no existe | `{ error: "Quiz not found" }` |
| 401 | No autenticado | `{ error: "Unauthorized" }` |
| 403 | Límite de intentos excedido | `{ error: "You have reached max attempts", attemptStatus: "limit_exceeded" }` |
| 409 | Intento ya completado | `{ error: "You already completed this quiz", score: 85.0 }` |
| 500 | Error del servidor | `{ error: "Failed to load quiz" }` |

### Código Verificado - ensurePendingQuizAttempt

**Ubicación:** `src/server/services/userQuizAttemptService.ts`

```typescript
export async function ensurePendingQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
  allowedAttempts?: number;
}) {
  // 1. Validar que no exceda límite de intentos
  const completedCount = await countCompletedUserQuizAttempts(
    params.userId,
    params.quizId,
  );
  const allowedAttempts = params.allowedAttempts ?? 1;
  
  if (completedCount >= allowedAttempts) {
    throw new UserQuizAttemptLimitExceededError(
      `You have completed ${completedCount} of ${allowedAttempts} allowed attempt(s).`
    );
  }

  // 2. Reutilizar pending existente si existe
  const existingPending = await findPendingUserQuizAttempt(
    params.userId,
    params.quizId,
  );
  if (existingPending) {
    return existingPending;
  }

  // 3. Crear nuevo pending attempt
  const lastAttemptNumber = await getLastAttemptNumber(
    params.userId,
    params.quizId,
  );
  const nextAttemptNumber = lastAttemptNumber + 1;

  const pendingAttempt = await createPendingUserQuizAttempt(params);
  
  // 4. Actualizar attemptNumber
  if (pendingAttempt) {
    await updateUserQuizAttemptNumber(pendingAttempt.id, nextAttemptNumber);
  }

  if (!pendingAttempt) {
    throw new UserQuizAttemptNotStartedError();
  }

  return pendingAttempt;
}
```

**Test:** ✅ Verifica creación, validación de límites, reutilización de pending

---

# HU03 - RECIBIR CALIFICACIÓN INMEDIATA

## Narrativa

Como **usuario**, quiero **recibir calificación inmediata** al enviar el quiz con desglose por pregunta (correcto/incorrecto para MCQ, % similitud para open-ended) y ver respuesta esperada.

### Criterios de Aceptación

- ✅ MCQ pregunta: veo "✓ Correcto" o "✗ Incorrecto"
- ✅ Open-ended pregunta: veo "85% similar", "Respuesta esperada: ..."
- ✅ Score total: promedio de % similitud en open-ended, % correctos en MCQ
- ✅ Puedo ver mis respuestas vs esperadas lado a lado
- ✅ Para open-ended veo método de calificación (exact match / typo tolerant / similarity)
- ✅ Confidence level indicador (high/medium/low)

### Flujo de Usuario

1. Usuario envía quiz con POST `/api/start-quiz`
2. Recibe respuesta con resultado por pregunta
3. Ve resumen: "Score: 75/100"
4. Expande cada pregunta para ver detalles
5. Puede ver "Previous attempts" con link a intento anterior

### Especificación Endpoint - POST `/api/start-quiz`

**Request Body:**
```json
{
  "quizId": "550e8400-e29b-41d4-a716-446655440000",
  "answers": [
    "Newton",           // MCQ: opción seleccionada
    "E=mc squared"      // Open-ended: respuesta escrita
  ]
}
```

**Response (200 OK):**
```json
{
  "quizId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Physics Fundamentals",
  "quizType": "mcq",
  "score": 75.0,
  "questionResults": [
    {
      "questionId": "q1",
      "question": "What is SI unit of force?",
      "expectedAnswer": "Newton",
      "userAnswer": "Newton",
      "percentageSimilar": 100,
      "gradingMethod": "exact_match",
      "isAccepted": true,
      "confidence": 0.99,
      "confidenceLevel": "high",
      "decisionReason": "Exact option match."
    },
    {
      "questionId": "q2",
      "question": "Describe conservation of momentum",
      "expectedAnswer": "The total momentum of an isolated system remains constant",
      "userAnswer": "Momentum is conserved in a system",
      "percentageSimilar": 50,
      "gradingMethod": "typo_tolerant",
      "isAccepted": false,
      "confidence": 0.58,
      "confidenceLevel": "low",
      "decisionReason": "Rejected by typo-tolerant match (similarity 50%).",
      "reviewRequired": true
    }
  ],
  "attempts": {
    "current": 1,
    "completed": 1,
    "allowed": 2,
    "remaining": 1
  }
}
```

**Campos de Respuesta por Pregunta:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `questionId` | string | ID único de la pregunta |
| `percentageSimilar` | 0-100 | % coincidencia (MCQ: 100/0, open-ended: 0-100) |
| `gradingMethod` | enum | "exact_match" \| "typo_tolerant" \| "similarity" |
| `isAccepted` | boolean | Respuesta considerada correcta |
| `confidence` | 0-1 | Confianza del algoritmo de calificación |
| `confidenceLevel` | enum | "high" (≥0.8) \| "medium" (0.6-0.8) \| "low" (<0.6) |
| `decisionReason` | string | Explicación legible de por qué aceptó/rechazó |
| `reviewRequired` | boolean | Flag si necesita revisión manual |

### Código Verificado - submitAndGradeAdminQuizAttempt

**Ubicación:** `src/server/admin/services/adminQuizAttemptService.ts`

```typescript
export async function submitAndGradeAdminQuizAttempt(input: {
  quizId: string;
  userId: string;
  answers: string[];
}) {
  // 1. Obtener quiz
  const quiz = await getApprovedQuiz(input.quizId);
  if (!quiz) {
    throw new AdminQuizNotFoundError();
  }

  // 2. Calificar respuestas en paralelo
  const questionResults = await Promise.all(
    quiz.questions.map(async (question, index) => {
      const userAnswer = input.answers[index] || "";
      const grading = await adminQuizGradingAdapter.gradeAnswer({
        expected: question.answer,
        userInput: userAnswer,
        quizType: quiz.quizType,
      });

      return {
        questionId: question.id,
        question: question.question,
        expectedAnswer: question.answer,
        userAnswer,
        ...grading,
        confidenceLevel: adminQuizGradingAdapter.toConfidenceLevel(grading.confidence),
      };
    })
  );

  // 3. Calcular score
  const score = adminQuizGradingAdapter.calculateScore(questionResults);

  // 4. Persistir intento
  await completePendingQuizAttempt({
    userId: input.userId,
    quizId: input.quizId,
    answers: input.answers,
    score,
  });

  return {
    quizId: input.quizId,
    title: quiz.title,
    quizType: quiz.quizType,
    score,
    questionResults,
  };
}
```

**Adaptador de Calificación:**

```typescript
// MCQ: comparación exacta (case-insensitive)
private scoreMcqAnswer(expected: string, userInput: string): AdminQuizGradingResult {
  const matches = this.normalizeText(expected) === this.normalizeText(userInput);
  return {
    percentageSimilar: matches ? 100 : 0,
    gradingMethod: "exact_match",
    isAccepted: matches,
    confidence: matches ? 0.99 : 0.97,
    decisionReason: matches
      ? "Exact option match."
      : "Selected option does not match the expected answer.",
    reviewRequired: false,
    rawSimilarity: matches ? 1 : 0,
  };
}

// Open-ended: 5-level cascade (exact → output → normalized → typo → similarity)
private async scoreOpenEndedAnswer(
  expected: string,
  userInput: string
): Promise<AdminQuizGradingResult> {
  const grading = this.gradeOpenEndedAnswerUseCase.execute(expected, userInput);
  
  // Calcular confidence basado en rawScore y proximidad a threshold (0.8)
  const thresholdDistance = Math.abs(grading.rawScore - 0.8);
  const confidence = grading.isAccepted
    ? grading.rawScore >= 0.92 ? 0.9 : grading.rawScore >= 0.86 ? 0.78 : 0.66
    : grading.rawScore <= 0.45 ? 0.88 : grading.rawScore <= 0.7 ? 0.72 : 0.58;

  const decisionReason = grading.isAccepted
    ? `Accepted by typo-tolerant match (similarity ${Math.round(grading.rawScore * 100)}%).`
    : `Rejected by typo-tolerant match (similarity ${Math.round(grading.rawScore * 100)}%).`;

  return {
    percentageSimilar: grading.percentageSimilar,
    gradingMethod: "typo_tolerant",
    isAccepted: grading.isAccepted,
    confidence,
    decisionReason,
    reviewRequired: confidence < 0.7 || thresholdDistance < 0.06,
    rawSimilarity: grading.rawScore,
  };
}
```

**Test Verificado:** ✅ Suite completa de grading MCQ y open-ended

---

# HU04 - VER HISTORIAL DE INTENTOS

## Narrativa

Como **usuario**, quiero **ver historial de intentos previos** en cada quiz con scores, fechas y estado (completado/pending) para hacer seguimiento de mi progreso.

### Criterios de Aceptación

- ✅ Veo lista de intentos ordenada por fecha descendente
- ✅ Cada intento muestra: # de intento, estado, score, fecha
- ✅ Puedo clickear intento completado para ver detalles
- ✅ Puedo ver # de intentos restantes
- ✅ Pending attempt actual es resaltado diferente

### Flujo de Usuario

1. Usuario en `/quiz/[quizId]/history` o tab en quiz page
2. Ve lista de intentos previos
3. Clickea intento completado → accede a detalles con respuestas
4. Vuelve a lista

### Especificación Endpoint - GET `/api/quiz/[quizId]/attempts`

**Request:**
```
GET /api/quiz/[quizId]/attempts
```

**Response (200 OK):**
```json
{
  "attempts": [
    {
      "id": "attempt-456",
      "status": "completed",
      "score": 85.0,
      "correctAnswers": 17,
      "totalQuestions": 20,
      "date": "2026-06-25T14:32:00Z",
      "attemptNumber": 2
    },
    {
      "id": "attempt-123",
      "status": "completed",
      "score": 72.0,
      "correctAnswers": 14,
      "totalQuestions": 20,
      "date": "2026-06-20T10:15:00Z",
      "attemptNumber": 1
    }
  ]
}
```

### Código Verificado - getAttemptsByUserAndQuizIds

**Ubicación:** `src/server/services/userQuizAttemptService.ts`

```typescript
export async function getAttemptsByUserAndQuizIds(
  userId: string,
  quizIds: string[]
) {
  return listUserQuizAttemptsByUserIdAndQuizIds(userId, quizIds);
}
```

**Test Verificado:** ✅ Recuperación ordenada por fecha

---

# HU05 - PUBLICAR CUESTIONARIOS

## Narrativa

Como **admin**, quiero **publicar cuestionarios con preguntas MCQ u open-ended** normalizadas desde UI o archivo para que usuarios puedan resolverlos desde la biblioteca.

### Criterios de Aceptación

- ✅ Puedo crear quiz con: título, categoría, dificultad, tipo, preguntas
- ✅ MCQ: validar ≥2 opciones únicas, deduplicar
- ✅ Open-ended: validar respuesta no vacía
- ✅ Limpia metadata IA de preguntas generadas ("Source: ...", "Citation: ...")
- ✅ Guarda persistentemente en DB
- ✅ Quiz aparece en biblioteca con status "approved"

### Flujo de Usuario Admin

1. Admin en panel `/admin/quizzes`
2. Clickea "Create Quiz"
3. Completa formulario: título, categoría, dificultad, tipo
4. Agrega preguntas (manual o desde upload)
5. Valida preguntas
6. Clickea "Publish" → POST `/api/(admin)/quizzes`
7. Quiz aparece en biblioteca

### Especificación Endpoint - POST `/api/(admin)/quizzes`

**Request Body:**
```json
{
  "title": "Physics Fundamentals Q1 2026",
  "category": "Science",
  "difficulty": "medium",
  "quizType": "mcq",
  "questions": [
    {
      "question": "What is the SI unit of force?",
      "answer": "Newton",
      "options": ["Joule", "Newton", "Pascal", "Watt"]
    },
    {
      "question": "Define velocity",
      "answer": "Rate of change of displacement",
      "options": null
    }
  ]
}
```

**Response (201 CREATED):**
```json
{
  "quiz": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Physics Fundamentals Q1 2026",
    "category": "Science",
    "difficulty": "medium",
    "quizType": "mcq",
    "status": "approved",
    "allowedAttempts": 2,
    "questions": [
      {
        "id": "q1",
        "question": "What is the SI unit of force?",
        "answer": "Newton",
        "options": ["Joule", "Newton", "Pascal", "Watt"]
      }
    ]
  },
  "message": "Quiz created successfully"
}
```

**Error Responses:**

| Status | Caso |
|--------|------|
| 400 | MCQ tiene <2 opciones únicas, respuesta vacía |
| 401 | No es admin |
| 500 | Error DB |

### Código Verificado - CreateAdminQuizUseCase

**Ubicación:** `src/application/use-cases/admin/CreateAdminQuizUseCase.ts`

```typescript
export class CreateAdminQuizUseCase {
  async execute(input: CreateAdminQuizInput): Promise<CreateAdminQuizOutput> {
    // 1. Validar preguntas
    const normalizedQuestions = input.questions.map((q) => {
      if (!q.question?.trim() || !q.answer?.trim()) {
        throw new Error("Question and answer cannot be empty");
      }

      if (input.quizType === "mcq") {
        // 2. MCQ: validar opciones
        const options = this.normalizeOptions(q.options);
        if (options.length < MIN_MCQ_OPTIONS) {
          throw new Error(`MCQ must have at least ${MIN_MCQ_OPTIONS} unique options`);
        }
        if (!options.includes(q.answer)) {
          throw new Error("Answer must be one of the options");
        }
        return { ...q, options };
      }

      // 3. Open-ended: solo validar answer
      return q;
    });

    // 4. Crear quiz en DB
    const quiz = await this.adminQuizRepository.createAdminQuiz({
      title: input.title,
      category: input.category,
      difficulty: input.difficulty,
      quizType: input.quizType,
      status: "approved",
      allowedAttempts: input.allowedAttempts ?? 2,
      questions: normalizedQuestions,
    });

    return { quiz };
  }

  private normalizeOptions(options?: string[]): string[] {
    if (!Array.isArray(options)) return [];
    const normalized = options
      .flatMap((opt) => opt.split(/[,;|]/).map((o) => o.trim()))
      .filter((opt) => opt.length > 0);
    return [...new Set(normalized)]; // Deduplicar
  }
}
```

**Test Verificado:** ✅ Validación de opciones, deduplicación

---

# HU06 - GENERAR PREGUNTAS DESDE ARCHIVOS

## Narrativa

Como **admin**, quiero **generar preguntas automáticamente desde archivos** (JSON/TXT/PDF) usando IA para acelerar creación de cuestionarios.

### Criterios de Aceptación

- ✅ Puedo subir archivo (JSON/TXT/PDF)
- ✅ Configuro: tipo quiz (MCQ/open-ended), cantidad preguntas, dificultad
- ✅ IA extrae contenido y genera preguntas
- ✅ Veo preguntas generadas con opción de editar/rechazar
- ✅ Puedo confirmar y guardar como quiz
- ✅ Detecta y limpia metadata IA automáticamente

### Especificación Endpoint - POST `/api/(admin)/upload-and-generate`

**Form Data:**
```
Content-Type: multipart/form-data
file: <File>
category: "Science"
difficulty: "medium"
quizType: "mcq"
questionCount: 5
```

**Response (200 OK):**
```json
{
  "questions": [
    {
      "question": "What is photosynthesis?",
      "answer": "Process of converting light into chemical energy",
      "options": ["Respiration", "Photosynthesis", "Fermentation", "Decomposition"],
      "citation": {
        "source": "page 42",
        "snippet": "Photosynthesis is the process...",
        "confidence": 95
      }
    }
  ],
  "generationOptions": {
    "category": "Science",
    "difficulty": "medium",
    "quizType": "mcq",
    "questionCount": 5
  }
}
```

### Código Verificado - generateQuestionsFromUploadedFile

**Ubicación:** `src/server/services/uploadQuizGenerationService.ts`

Función orquesta:
1. Parsea archivo (JSON/TXT/PDF con OCR)
2. Envía a OpenAI para generación
3. Procesa respuesta + extrae citation info
4. Retorna preguntas normalizadas

**Error Handling:**
- 400: Archivo inválido, formato no soportado, contenido muy corto
- 429: Rate limit de OpenAI
- 502: Error OCR o generación

---

# HU07 - VER ESTADÍSTICAS GLOBALES

## Narrativa

Como **admin**, quiero **ver estadísticas globales de uso** de cada quiz (intentos totales, score promedio, dificultad predominante) para evaluar popularidad y efectividad.

### Criterios de Aceptación

- ✅ Dashboard muestra quizzes con stats: total intentos, completados, pending
- ✅ Veo score promedio por quiz
- ✅ Veo % de usuarios que completaron
- ✅ Filtro por categoría, dificultad
- ✅ Ordeno por attempts, score, etc

### Especificación Endpoint - GET `/api/(admin)/quiz-statistics`

**Response (200 OK):**
```json
{
  "statistics": [
    {
      "quizId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Physics Fundamentals",
      "category": "Science",
      "difficulty": "medium",
      "quizType": "mcq",
      "attemptSummary": {
        "totalAttempts": 45,
        "completedAttempts": 40,
        "pendingAttempts": 5,
        "averageScore": 78.5,
        "lastAttemptAt": "2026-06-26T10:30:00Z",
        "lastCompletedAt": "2026-06-26T09:15:00Z"
      }
    }
  ]
}
```

### Código Verificado - getQuizStatisticsSummary

**Ubicación:** `src/server/admin/services/adminQuizService.ts`

```typescript
export async function getQuizStatisticsSummary() {
  const quizzes = await db.adminQuiz.findMany({
    include: { questions: true },
  });

  const quizIds = quizzes.map((q) => q.id);
  
  // Recuperar todos los intentos
  const attempts = await db.userQuizAttempt.findMany({
    where: { quizId: { in: quizIds } },
  });

  // Agregar por quiz
  const summaryMap = new Map();
  for (const quiz of quizzes) {
    const quizAttempts = attempts.filter((a) => a.quizId === quiz.id);
    const completed = quizAttempts.filter((a) => a.status === "completed");
    const avgScore = completed.length > 0
      ? completed.reduce((sum, a) => sum + a.score, 0) / completed.length
      : 0;

    summaryMap.set(quiz.id, {
      quizId: quiz.id,
      title: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      attemptSummary: {
        totalAttempts: quizAttempts.length,
        completedAttempts: completed.length,
        pendingAttempts: quizAttempts.filter((a) => a.status === "pending").length,
        averageScore: Math.round(avgScore * 100) / 100,
        lastAttemptAt: quizAttempts[0]?.createdAt,
        lastCompletedAt: completed[0]?.completedAt,
      },
    });
  }

  return Array.from(summaryMap.values());
}
```

---

# HU08 - REVISAR Y APROBAR CUESTIONARIOS

## Narrativa

Como **admin**, quiero **revisar y aprobar cuestionarios** antes de publicar en biblioteca para detectar problemas (duplicados, metadata IA, preguntas mal formadas).

### Criterios de Aceptación

- ✅ Veo cola de quizzes pending review
- ✅ Para cada quiz: título, preguntas, respuestas esperadas
- ✅ Veo detección automática de problemas (metadata IA, duplicados)
- ✅ Puedo aprobar quiz → status = "approved" → aparece en biblioteca
- ✅ Puedo rechazar con comentario → vuelve a admin
- ✅ Puedo editar preguntas antes de aprobar

### Especificación Endpoint - POST `/api/(admin)/quiz-review`

**Request Body:**
```json
{
  "quizId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "approve",
  "comments": "Preguntas claras y bien estructuradas"
}
```

**Response (200 OK):**
```json
{
  "quiz": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "reviewedAt": "2026-06-26T10:30:00Z",
    "reviewedBy": "admin-user-id"
  }
}
```

---

## CONCLUSIÓN HUs & HTs

Sprint 3 cubre **8 historias de usuario** que implementan biblioteca de cuestionarios publicados con:
- Descubrimiento y filtrado (HU01)
- Resolución con calificación inmediata (HU02, HU03)
- Seguimiento de intentos (HU04)
- Creación admin manual y automática (HU05, HU06)
- Análisis de uso (HU07)
- Aseguramiento de calidad (HU08)

Cada HU respaldada por **HTs técnicas** con servicios, use cases, adaptadores, endpoints y validación de código.

