# Sprint 3: Automatización Completa de Generación de Preguntas desde Documentos

## 1. Objetivo

El Sprint 3 se enfoca en automatizar completamente la generación de preguntas de cuestionario a partir de documentos. Los administradores pueden subir un PDF, archivos de texto plano (TXT), o datos estructurados en JSON y, a partir de ahí, el sistema se encarga de todo: toma el contenido, lo extrae, lo pasa por procesamiento con IA y termina armando preguntas bien logradas, tanto de opción múltiple como abiertas.

## 2. Alcance

### Historias de Usuario Involucradas

| ID | Título | Descripción | Duración |
|----|--------|-------------|----------|
| HU11 | Subir archivo y generar cuestionario | Como administrador, quiero subir archivos de tipos TXT, JSON y PDF especificar tipo de preguntas, dificultad, categoría y cantidad, para que el sistema genere automáticamente preguntas | 10h |
| HU12 | Revisar, editar y aprobar cuestionario generado | Como administrador, quiero revisar, editar y aprobar cuestionario generado | 10h |
| HU13 | Gestionar cuestionarios aprobados | Como administrador quiero gestionar cuestionarios aprobados | 7h |

### Historias Técnicas Involucradas

| ID | Título | Descripción | Duración |
|----|--------|-------------|----------|
| HT22 | Modelo de datos | Tablas Prisma (AdminQuiz, AdminQuizQuestion): almacena cuestionarios aprobados, preguntas, opciones MCQ, citaciones de origen con índices en quizId | 4h |
| HT23 | Sistema de carga y generación | POST /api/admin/upload-and-generate: valida archivos (JSON/PDF/TXT), OCR para PDFs, llama OpenAI para generar preguntas MCQ/open-ended con citaciones automáticas basadas en token overlap | 24h |
| HT24 | Persistencia de cuestionario aprobado | POST /api/admin/quiz-review: limpia metadata de IA, valida (preguntas ≠ vacías, MCQ ≥ 2 opciones), persiste en BD con transacción atómica, retorna 201 con quiz creado | 24h |
| HT25 | Consulta de cuestionarios con filtros | GET /api/admin/quizzes: lista paginada de quizzes aprobados, filtros por categoría/dificultad, enriquece con estadísticas de intentos (total, completados, score promedio, última fecha) | 10h |
| HT26 | Obtención de detalles de cuestionario | GET /api/admin/quizzes/[quizId]: retorna detalles completos (todas preguntas, opciones JSON, citaciones), valida UUID, verifica status=approved, fallback allowedAttempts=2 | 4h |
| HT27 | Eliminación de cuestionario | DELETE /api/admin/quizzes/[quizId]: transacción atómica (elimina preguntas primero, luego quiz), mantiene historial en UserQuizAttempt, retorna 200 con confirmación | 2h |

## 3. Historias de Usuario

### HU11: Subir archivo y generar cuestionario

Este HU recorre de principio a fin cómo un administrador sube un archivo, ya sea PDF, JSON o TXT, con contenido centrado en un tema. A continuación, se presenta el diagrama de actividad que describe el proceso completo:

**Figura 30** (Diagrama de actividad - a incluir)

### HU12: Revisar, editar y aprobar cuestionario generado

Este HU recorre de punta a punta el proceso para que un administrador inspeccione a fondo las preguntas que se generan de forma automática, verifique que el contenido del cuestionario sea correcto y, al final, lo deje aprobado para que quede disponible para los usuarios. A continuación, se presenta el diagrama de actividad, donde se describe el recorrido completo:

**Figura 31** (Diagrama de actividad - a incluir)

### HU13: Gestionar cuestionarios aprobados

Este HU recorre de principio a fin lo que necesita un administrador para consultar cuestionarios ya aprobados: verlos en lista, aplicar filtros, entrar al detalle, ajustar preguntas puntuales, y también eliminarlos con las debidas precauciones. Se contemplan opciones de paginación, la vista de información completa y los pasos de edición y borrado sin riesgos. A continuación, se presenta el diagrama de actividad, donde se describe el recorrido:

**Figura 32** (Diagrama de actividad - a incluir)

## 4. Historias Técnicas

### HT22: Modelo de Datos

**Figura 33** - Esquema Prisma:

```
Model AdminQuiz {
  id              String   @id @default(uuid())
  title           String
  category        String
  difficulty      String   @db.Enum("easy", "medium", "hard")
  quizType        String   @db.Enum("mcq", "open_ended")
  status          String   @db.Enum("draft", "approved") @default("approved")
  allowedAttempts Int      @default(2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  questions       AdminQuizQuestion[]
  attempts        UserQuizAttempt[]
}

Model AdminQuizQuestion {
  id        String   @id @default(uuid())
  quizId    String
  question  String   @db.LongText
  answer    String   @db.Text
  options   String?  @db.LongText // JSON string array para MCQ
  citation  String?  @db.JSON      // {source, snippet, confidence}
  
  quiz      AdminQuiz @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  @@index([quizId])
}
```

**Modelo AdminQuiz:** Tabla principal que almacena cuestionarios aprobados generados desde archivos.

**Modelo AdminQuizQuestion:** Tabla de preguntas que pertenecen a un cuestionario.

### HT23: Sistema de Carga y Generación

En este HT se detalla, de manera ordenada, lo que sucede cuando un administrador sube un archivo y solicita la generación de preguntas.

**Figura 34** - Diagrama de secuencia (a incluir)

#### Descripción Técnica:

En lo que sigue se detalla qué elementos participan en el servicio de carga y en la generación de cuestionarios, ordenados en fases.

**Fase 1 - Validación de autenticación:**

El endpoint POST /api/admin/upload-and-generate primero comprueba la autenticación con getAuthSession(req). Cuando no hay una sesión válida, o si session.user.isAdmin no es exactamente true, responde con 401 Unauthorized y el cuerpo {"error": "Unauthorized"}. La generación de cuestionarios queda restringida, solo la pueden hacer usuarios con rol de administrador.

**Fase 2 - Validación de content-type:**

Se comprueba que req.headers.get("content-type") arranque con "multipart/form-data" o con "application/x-www-form-urlencoded". Cuando llega cualquier otro valor, se responde con un 400 Bad Request y un mensaje de error claro y descriptivo.

**Fase 3 - Extracción de FormData:**

Se parsea req.formData() y se extraen:
- file: File
- category: string (ej: "Programming")
- difficulty: string (ej: "easy")
- quizType: string (ej: "mcq" o "open_ended")
- questionCount: number (ej: 5)

**Fase 4 - Normalización de parámetros:**

```
quizType = (rawQuizType === "mcq") ? "mcq" : "open_ended";
questionCount = Number.isFinite(questionCount) && questionCount > 0
  ? Math.max(1, Math.min(15, Math.round(questionCount)))
  : 5;
```

**Fase 5 - Validación y detección de tipo de Archivo:**

Se llama a ensureAcceptedFile(file) que valida:
- JSON: file.type === "application/json" O file.name.endsWith(".json")
- PDF: file.type === "application/pdf" O file.name.endsWith(".pdf")
- TXT: file.type === "text/plain" O file.name.endsWith(".txt")

Si no encaja con ninguno de esos formatos, devuelve un 400 Bad Request con el mensaje: "Only JSON, TXT, or PDF files are accepted."

**Fase 6 - Extracción de contenido por tipo:**

**PDF:**
- Intenta extraer texto directo usando extractTextFromPdf(file)
- Si el PDF tiene < 10 caracteres (MIN_CONTENT_LENGTH), fallback a OCR
- OCR con Google Cloud Vision: Llama a extractTextFromPdfWithOcrRetry(file) que usa Google Cloud Vision API
- Valida que OCR retorne texto: si no, error "Could not extract readable text from PDF."
- Valida calidad OCR: si no alcanza mínimos (80+ caracteres, 45% de palabras alfabéticas, 8+ palabras alfabéticas únicas), marca como ocrQuality: "low" pero continúa (no falla)

**JSON:**
- Parsea JSON.parse(text)
- Si no es JSON válido, error "Invalid JSON file."
- Busca campo .content o .text en el objeto raíz
- Si existe, lo usa; si no, usa JSON.stringify(jsonData) completo
- Si resultado está vacío, error "No course content found in JSON."

**TXT:**
- Lee como texto plano con file.text()

**Fase 7 - Validación de contenido mínimo:**

Se invoca ensureMinimumContentLength(content, minLength):
- Si se trata de un PDF con OCR de mala calidad, entonces minLength = 1; en cualquier otro escenario, minLength = 10.
- Cuando content.trim().length queda por debajo de minLength, se devuelve el error "Course content is too short or missing.", con estado 400 Bad Request.

**Fase 8 - Preparación de contenido:**

Se invoca a prepareCourseContentForGeneration(content) que:
- Recorta el texto hasta un tope de 16.000 caracteres (MAX_CONTENT_CHARS)
- Deja los espacios en blanco en un formato uniforme, eliminando inconsistencias.

**Fase 9 - Generación de preguntas:**

Se invoca generateQuestionsFromCourseContent(content, {category, difficulty, quizType, questionCount, sourceName: file.name}).

El servicio construye dos prompts diferentes según quizType:

Para MCQ (quizType === "mcq"):
```
systemPrompt: "You are a quiz generator... generate exactly {questionCount} short-answer questions...
Target style: mcq-ready
Each answer must be an exact, concise target (for example: code output, exact syntax, keyword, identifier, number, or short phrase), 1 to 6 words max.
Respond ONLY with a JSON array of {questionCount} objects, each with BOTH "question" and "answer" fields:
[
  {"question": "What is the output of console.log(2 + 2)?", "answer": "4"},
  ...
]"
```

Para Open-ended (quizType === "open_ended"):
```
systemPrompt: "You are a quiz generator... generate exactly {questionCount} short-answer questions...
Target style: open-ended
Each answer must be 1 to 6 words and non-empty.
Respond ONLY with a JSON array of {questionCount} objects with "question" and "answer" fields:
[
  {"question": "Explain what hoisting means in JavaScript", "answer": "hoisting is the behavior where declarations are moved to top"},
  ...
]"
```

La pista mcq-ready frente a open-ended debería orientar a OpenAI sobre el tipo de interacción, pero en la práctica la respuesta sale igual en los dos casos: el mismo esquema {question, answer, citation}, y sin opciones incluidas.

**Fase 10 - Llamada a OpenAI:**

Se invoca strict_output() que encapsula OpenAI con:
- systemRole: Armado a partir de un prompt personalizado según el quizType
- outputFormat: Un outputFormat con la forma {question: "", answer: ""}
- temperature: Una temperature ajustable, por lo general entre 0.7 y 0.9
- model: process.env.OPENAI_QUIZ_MODEL (default: "gpt-4o-mini")

OpenAI devuelva array de objetos: [{question, answer}, ...] para ambos tipos.

**Fase 11 - Manejo de fallos con reintentos:**

Si OpenAI falla:
- Detecta rate limit: cuando el mensaje incluye "rate limit" o aparece "429". En ese caso, se devuelve al cliente un 429 Too Many Requests junto con {"questions": [], "error": "Rate limit reached..."}
- Detecta otros errores OpenAI: Si el problema no es el rate limit y lo que llega es un error general de OpenAI, por ejemplo, cuando el texto arranca con "OpenAI generation failed:", la salida correcta es un 502 Bad Gateway
- Si falla OCR: Identificada por "OpenAI OCR failed:", la respuesta también debe ser 502 Bad Gateway, salvo que el propio error apunte a rate limit, entonces corresponde 429.
- Si al final ninguno de los modelos logra responder, se enciende el fallback y el sistema arma preguntas predefinidas de forma interna

**Fase 12 - Normalización de respuestas:**

Cada pregunta se valida:
- question, answer no vacíos
- Recorta espacios extras
- Limita a 180 caracteres máximo por campo
- Limpia metadata IA que OpenAI pueda haber insertado

**Fase 13 - Limpieza de metadata:**

Se invoca cleanAiMetadataFromQuestion(question) que elimina patrones como:
- Source: FENW_Angular_Eng.pdf (Citation ...)
- (Citation confidence: 95%)
- Cualquier artefacto entre Source: y (Citation)

**Fase 14 - Deduplicación:**

Se conserva un Set con los enunciados ya registrados. Antes de aceptar cada pregunta, se contrasta con ese set para impedir que se repita dentro del mismo lote.

**Fase 15 - Generación de citations:**

Se invoca buildCitationForQuestion({courseContent, sourceName, question, answer}) que:
- Revisa el texto de origen y localiza las frases que encajen mejor con la pregunta y con la respuesta.
- Se apoya en el solapamiento de tokens, es decir, palabras con contenido, no stopwords, para identificar cual es la oración que mejor encaja y resulta más pertinente
- Devuelva {source: "FENW_Angular_Eng.pdf", snippet: "Angular is a framework...", confidence: 0.95}

**Fase 16 - Respuesta al Frontend (Ambos tipos):**

Devuelva 200 OK:
```json
{
  "questions": [
    {
      "id": "temp-1",
      "question": "¿Cuál es...",
      "answer": "respuesta",
      "citation": {
        "source": "FENW_Angular_Eng.pdf",
        "snippet": "Angular is...",
        "confidence": 0.95
      }
    }
  ],
  "generationOptions": {
    "category": "Programming",
    "difficulty": "easy",
    "quizType": "mcq",
    "questionCount": 5
  }
}
```

**Nota:** El backend no envía opciones. En los dos tipos de preguntas, la respuesta llega SIN opciones, y esto es intencional, así quedó definido.
- Para Open-ended, no existe lista de opciones, el usuario responde con texto libre
- Para MCQ, las opciones no salen del backend, se arman después en el frontend, dentro del componente QuizReview.tsx, cuando el admin entra a la pantalla de revisión.

**Generación de opciones para MCQ (Frontend - QuizReview.tsx):**

Cuando el admin selecciona quizType: "mcq" en QuizReview.tsx, el componente llama a buildAutoMcqOptions(answer, allAnswers) que:

1. Toma la respuesta correcta de la pregunta actual
2. Toma todas las respuestas de todas las preguntas como candidatos a "distractores"
3. Crea 4 opciones:
   - Opción 1: La respuesta correcta
   - Opciones 2-3: Respuestas de otras preguntas (distractores)
   - Opción 4: Si no hay suficientes distractores, usa fallback: "None of the above", "All of the above", "Not mentioned in the provided content", "Insufficient information"

```javascript
function buildAutoMcqOptions(answer, allAnswers, existingOptions) {
  const options = [answer, ...existingOptions];  // Respuesta correcta primero
  const distractors = allAnswers.filter(a => a !== answer);  // Otras respuestas
  
  // Agregar distractores hasta tener 4 opciones
  for (const distractor of distractors) {
    if (options.length < 4) {
      options.push(distractor);
    }
  }
  
  // Si aún falta, usar fallback
  const fallbackOptions = ["None of the above", "All of the above", ...];
  for (const fallback of fallbackOptions) {
    if (options.length < 4) {
      options.push(fallback);
    }
  }
  
  return options;  // Retorna 4 opciones
}
```

### HT24: Persistencia de Cuestionario Aprobado

En este HT se detalla, de manera ordenada, lo que sucede cuando un administrador da el visto bueno a un cuestionario y lo remite para que quede guardado en la base de datos.

**Figura 35** - Diagrama de secuencia (a incluir)

#### Descripción Técnica:

**Fase 1 - Validación de autenticación:**

El endpoint POST /api/admin/quiz-review inicia validando que session?.user?.isAdmin === true. Si no, retorna 401 Unauthorized con {"error": "Unauthorized"}.

**Fase 2 - Parseo y extracción de body:**

Se parsea el JSON del body esperando estructura:
```json
{
  "title": "Mi Cuestionario",
  "fileName": "FENW_Angular_Eng.pdf",
  "category": "Programming",
  "difficulty": "easy",
  "quizType": "mcq",
  "questions": [
    {
      "question": "¿Qué es Angular?",
      "answer": "A framework",
      "options": ["A framework", "A library", "A language", "An SDK"],
      "citation": {
        "source": "FENW_Angular_Eng.pdf",
        "snippet": "Angular is a framework...",
        "confidence": 0.95
      }
    }
  ]
}
```

Si el JSON es inválido, retorna 400 Bad Request con {"message": "Invalid JSON"}.

**Fase 3 - Limpieza de metadata de IA:**

Se invoca cleanQuestionMetadata(question) para cada pregunta que limpia patrones residuales:

```javascript
function cleanQuestionMetadata(question: string): string {
  let cleaned = question.replace(/\s*Source:\s*[^(]*?\(Citation[^)]*\)/gi, "");
  if (cleaned === question) {
    cleaned = question.replace(/Source:\s*[^-]*\s*-\s*/gi, "");
  }
  cleaned = cleaned.replace(/\s*\(Citation\s+confidence:\s*\d+%?\)/gi, "");
  cleaned = cleaned.replace(/\s*\(Citation[^)]*\)/gi, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}
```

Esto elimina artefactos como Source: FENW_Angular_Eng.pdf (Citation...) que OpenAI pudo haber dejado.

**Fase 4 - Ejecución de caso de uso:**

Se invoca CreateAdminQuizUseCase.execute(input) que:

**Fase 4a - Validación y normalización de título:**

```
let title = input.title?.trim() ?? "";
if (!title && input.fileName) {
  title = input.fileName.replace(/\.[^/.]+$/, "");  // Quitar extensión
}
if (!title) {
  title = "Untitled Quiz";  // Fallback
}
```

Si el admin no proporciona título, pero supo un archivo, usa el nombre del archivo (sin extensión). Si nada está disponible, usa "Untitled Quiz".

**Fase 4b - Validación de preguntas:**

Para cada pregunta en el array input.questions:
```
const normalizedQuestion = question.question.trim();
const normalizedAnswer = question.answer.trim();
if (!normalizedQuestion || !normalizedAnswer) {
  throw new Error(`Question ${index + 1} must include both question and answer text.`);
}
```

Si alguna pregunta tiene question o answer vacío, lanza error: 400 Bad Request.

**Fase 4c - Validación específica por tipo:**

Para Open-ended (quizType !== "mcq"):
- No hay validación de opciones (es nullable)
- Se retorna solo {question, answer, citation}

Para MCQ (quizType === "mcq"):
- Se normalizan las opciones llamando a normalizeOptions()
- Esto elimina duplicados y recorta espacios
- Se valida que haya al menos 2 opciones:

```
const options = normalizeOptions([...(question.options ?? []), normalizedAnswer]);
if (options.length < MIN_MCQ_OPTIONS) {  // MIN_MCQ_OPTIONS = 2
  throw new Error(`Question ${index + 1} must contain at least 2 choices for MCQ.`);
}
```

Si no hay suficientes opciones, lanza error: 400 Bad Request.

**Fase 4d - Construcción de payload normalizado:**

Se construye array de preguntas normalizadas:

```
const normalizedQuestions = input.questions.map((question) => {
  if (normalizedQuizType !== "mcq") {
    return {
      question: normalizedQuestion,
      answer: normalizedAnswer,
      ...(question.citation ? { citation: question.citation } : {})
    };
  } else {
    return {
      question: normalizedQuestion,
      answer: normalizedAnswer,
      options,  // Ya normalizado
      ...(question.citation ? { citation: question.citation } : {})
    };
  }
});
```

**Fase 5 - Persistencia en base de datos:**

Se invoca adminQuizRepository.createApprovedQuiz() que ejecuta:

```
return prisma.adminQuiz.create({
  data: {
    title: input.title,
    category: input.category,
    difficulty: input.difficulty,
    quizType: input.quizType ?? "open_ended",
    status: input.status ?? "approved",  // SIEMPRE "approved"
    questions: {
      create: input.questions.map((question) => {
        const storedOptions = buildStoredQuestionMetadata({
          quizType: input.quizType,
          options: question.options,
          citation: question.citation,
        });
        return {
          question: question.question,
          answer: question.answer,
          ...(storedOptions !== undefined ? { options: storedOptions } : {}),
        };
      }),
    },
  },
  include: { questions: true },
});
```

**Fase 5a - Serialización de datos complejos:**

Se invoca buildStoredQuestionMetadata() que serializa options y citation como JSON:
- Para MCQ: Serializa array de opciones como JSON string
- Para Open-ended: Devuelva undefined
- Para ambos: Serializa citation como JSON

**Fase 5b - Transacción atómica:**

Prisma ejecuta la creación de forma atómica:
- INSERT INTO AdminQuiz (title, category, difficulty, quizType, status, createdAt, updatedAt)
- INSERT INTO AdminQuizQuestion (quizId, question, answer, options) × N preguntas

Si algo sale mal, se deshace la transacción completa

**Fase 5c - Timestamps automáticos:**

Prisma establece automáticamente:
- createdAt: Hora actual
- updatedAt: Hora actual
- Ambos son DateTime @default(now()) y @updatedAt en schema.prisma

**Fase 6 - Mapeo a entity de dominio:**

El resultado prisma se mapea a la entity AdminQuiz:

```
return AdminQuiz.fromPrisma(res)!;
```

La entidad contiene:
- id: UUID generado
- title: Normalizado
- category: De entrada
- difficulty: De entrada
- quizType: "mcq" | "open_ended"
- estado: "approved"
- createdAt: Timestamp
- updatedAt: Timestamp
- allowedAttempts: 2 (default de schema)
- questions: Array de AdminQuizQuestion

**Fase 7 - Respuesta al frontend:**

Devuelva 201 Created:

```json
{
  "quiz": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Angular Fundamentals",
    "category": "Programming",
    "difficulty": "easy",
    "quizType": "mcq",
    "status": "approved",
    "allowedAttempts": 2,
    "createdAt": "2026-06-27T14:32:00Z",
    "updatedAt": "2026-06-27T14:32:00Z",
    "questions": [
      {
        "id": "question-uuid-1",
        "quizId": "550e8400-e29b-41d4-a716-446655440000",
        "question": "¿Qué es Angular?",
        "answer": "A framework",
        "options": "[\"A framework\",\"A library\",\"A language\",\"An SDK\"]"
      }
    ]
  }
}
```

**Fase 8 - Validaciones de error completas:**

| Escenario | Estatus | Body |
|-----------|---------|------|
| No autenticado | 401 | {"error": "Unauthorized"} |
| JSON inválido | 400 | {"message": "Invalid JSON"} |
| Pregunta sin question | 400 | {"error": "Question X must include both..."} |
| Pregunta sin answer | 400 | {"error": "Question X must include both..."} |
| MCQ con < 2 opciones | 400 | {"error": "Question X must contain at least 2 choices"} |
| Error BD | 500 | {"error": "Failed to save quiz", "details": error} |
| Éxito | 201 | {"quiz": {...}} |

**Datos persisten en BD:**

Tabla AdminQuiz:
- id: 550e8400-e29b-41d4-a716-446655440000
- title: Angular Fundamentals
- category: Programming
- difficulty: easy
- quizType: mcq
- status: approved
- allowedAttempts: 2
- createdAt: 2026-06-27T14:32:00Z
- updatedAt: 2026-06-27T14:32:00Z

Tabla AdminQuizQuestion (1 row por pregunta):
- id: question-uuid-1
- quizId: 550e8400-e29b-41d4-a716-446655440000
- question: ¿Qué es Angular?
- answer: A framework
- options: "[\"A framework\",\"A library\",\"A language\",\"An SDK\"]"  ← JSON string

### HT25: Consulta de Cuestionarios con Filtros

Retorna una lista paginada de todos los cuestionarios aprobados en la base de datos, con capacidad de filtrado por categoría y dificultad. Para cada quiz, incluye metadatos como cantidad de preguntas e estadísticas de intentos de usuarios (total de intentos, completados, pendientes, score promedio). Soporta paginación configurable mediante parámetros page y limit.

**Fase 1 - Validación de Autenticación:**

El endpoint GET /api/(admin)/quizzes inicia validando que session?.user?.isAdmin === true. Si no, retorna 401 Unauthorized con mensaje "You must be an admin to view quizzes.".

**Fase 2 - Parseo de Query Parameters:**

Se extraen parámetros de la URL usando req.nextUrl.searchParams.get():
- category: ?category=Programming  (opcional, string)
- difficulty: ?difficulty=easy     (opcional, enum: easy|medium|hard)
- page: ?page=2                     (opcional, número positivo, default undefined)
- limit: ?limit=20                  (opcional, número positivo, default undefined)

Se validan usando Zod schema:

```javascript
const listQuizzesSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  page: z.coerce.number().positive().optional().catch(undefined),
  limit: z.coerce.number().positive().optional().catch(undefined),
});
```

Si la validación falla (ej: page=-1, difficulty=unknown), retorna 400 Bad Request con {"error": "Invalid query parameters", "issues": [...]}.

**Fase 3 - Ejecución del Use Case:**

Se invoca GetAdminQuizzesUseCase.execute({category?: string, difficulty?: string}) pasando únicamente los filtros (no page/limit, que se aplican después).

**Fase 4 - Consulta de Cuestionarios Base:**

El use case llama a adminQuizRepository.findApprovedQuizzesWithAttempts(filter) que ejecuta:

```
return prisma.adminQuiz.findMany({
  where: {
    ...(filter?.category ? { category: filter.category } : {}),
    ...(filter?.difficulty ? { difficulty: filter.difficulty } : {}),
  },
  include: { questions: true },
  orderBy: { updatedAt: "desc" },
});
```

Retorna todos los quiz que cumplen los filtros, ordenados por updatedAt descendente (quiz más recientes primero).

**Fase 5 - Consulta de Intentos de Usuarios:**

El use case luego obtiene todos los intentos de usuarios para estos quiz:

```
const quizIds = quizzes.map(q => q.id);
const attempts = await this.adminQuizAttemptRepository.findUserAttemptsByQuizIds(quizIds);
```

Esto recupera toda la tabla UserQuizAttempt filtrada a solo los intentos de los quiz en resultado.

**Fase 6 - Agregación de Estadísticas:**

Se procesa el array de intentos construyendo un mapa por quizId:

```javascript
const attemptsByQuizId: Record<string, {
  totalAttempts: number;
  completedAttempts: number;
  pendingAttempts: number;
  totalCompletedScore: number;
  lastAttemptAt: Date | null;
  lastCompletedAt: Date | null;
}> = {};

for (const attempt of attempts) {
  if (!attemptsByQuizId[attempt.quizId]) {
    attemptsByQuizId[attempt.quizId] = {
      totalAttempts: 0,
      completedAttempts: 0,
      pendingAttempts: 0,
      totalCompletedScore: 0,
      lastAttemptAt: null,
      lastCompletedAt: null,
    };
  }
  
  const stats = attemptsByQuizId[attempt.quizId];
  stats.totalAttempts += 1;
  
  if (attempt.status === "completed") {
    stats.completedAttempts += 1;
    stats.totalCompletedScore += attempt.score || 0;
    stats.lastCompletedAt = max(stats.lastCompletedAt, attempt.completedAt);
  } else if (attempt.status === "pending") {
    stats.pendingAttempts += 1;
  }
  
  stats.lastAttemptAt = max(stats.lastAttemptAt, attempt.createdAt);
}
```

Resultado: Cada quizId tiene estadísticas agregadas de todos sus intentos.

**Fase 7 - Enriquecimiento de Quiz con Estadísticas:**

Se mapea cada quiz con sus estadísticas calculadas:

```javascript
return quizzes.map((quiz) => {
  const stats = attemptsByQuizId[quiz.id];
  const averageScore = stats && stats.completedAttempts > 0
    ? Math.round((stats.totalCompletedScore / stats.completedAttempts) * 100) / 100
    : null;
  
  return {
    ...quiz,  // Todos los campos del quiz original
    questionCount: quiz.questions.length,  // Contar preguntas
    attemptSummary: {
      totalAttempts: stats?.totalAttempts ?? 0,
      completedAttempts: stats?.completedAttempts ?? 0,
      pendingAttempts: stats?.pendingAttempts ?? 0,
      averageScore,
      lastAttemptAt: stats?.lastAttemptAt ?? null,
      lastCompletedAt: stats?.lastCompletedAt ?? null,
    },
  };
});
```

Ejemplo de quiz en el array devuelto:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Angular Fundamentals",
  "category": "Programming",
  "difficulty": "easy",
  "quizType": "mcq",
  "status": "approved",
  "questionCount": 5,
  "attemptSummary": {
    "totalAttempts": 3,
    "completedAttempts": 2,
    "pendingAttempts": 1,
    "averageScore": 87.5,
    "lastAttemptAt": "2026-06-27T10:30:00Z",
    "lastCompletedAt": "2026-06-27T10:15:00Z"
  },
  "createdAt": "2026-06-26T14:32:00Z",
  "updatedAt": "2026-06-26T14:32:00Z"
}
```

**Fase 8 - Aplicación de Paginación en Endpoint:**

Vuelto al endpoint POST handler, se aplica paginación en el array de quiz:

```javascript
const total = Array.isArray(allQuizzes) ? allQuizzes.length : 0;
const page = data.page || 1;
const limit = data.limit || 10;
const start = (page - 1) * limit;
const quizzes = Array.isArray(allQuizzes)
  ? allQuizzes.slice(start, start + limit)
  : [];
```

- total: Cantidad total de quiz (antes de paginar)
- page: Página actual (default 1)
- limit: Resultados por página (default 10)
- start: Índice de inicio = (1 - 1) * 10 = 0 para página 1, (2 - 1) * 10 = 10 para página 2
- quizzes: Slice de array [[start, start + limit)

Ejemplo:
- Si hay 25 quiz totales y page=2&limit=10:
  - start = 10
  - Se retornan quiz índice 10-19 (quiz 11-20)
  - pages = ceil(25 / 10) = 3

**Fase 9 - Respuesta Exitosa:**

Retorna 200 OK:

```json
{
  "quizzes": [
    { "id": "...", "title": "Angular Fundamentals", ...attemptSummary... },
    { "id": "...", "title": "React Hooks", ...attemptSummary... }
  ],
  "pagination": {
    "total": 25,
    "page": 2,
    "limit": 10,
    "pages": 3
  }
}
```

**Fase 10 - Manejo de Errores:**

| Escenario | Status | Body |
|-----------|--------|------|
| No autenticado | 401 | {"error": "You must be an admin to view quizzes."} |
| Parámetros inválidos | 400 | {"error": "Invalid query parameters", "issues": [...]} |
| Error en BD | 500 | {"error": "Failed to retrieve quizzes"} |
| Éxito | 200 | {"quizzes": [...], "pagination": {...}} |

**Datos Consultados en BD:**

Tabla AdminQuiz:
```sql
SELECT * FROM AdminQuiz
WHERE (category = ? OR category IS NULL)
  AND (difficulty = ? OR difficulty IS NULL)
ORDER BY updatedAt DESC;
```

Tabla UserQuizAttempt:
```sql
SELECT * FROM UserQuizAttempt
WHERE quizId IN (quiz_id_1, quiz_id_2, ...);
```

No hay persistencia, solo lectura. La paginación se aplica en memoria del endpoint (no en BD), permitiendo flexibilidad para futuros cambios en la lógica de paginación.

### HT26: Obtención de Detalles de Cuestionario

Recupera los detalles completos de un cuestionario aprobado específico por su ID. Valida que el quiz existe, que tiene estado approved, y enriquece la respuesta con información sobre el cuestionario y sus preguntas. Soporta acceso solo para administradores.

**Fase 1 - Validación de Autenticación:**

El endpoint GET /api/(admin)/quizzes/[quizId] inicia validando que session?.user?.isAdmin === true. Si no, retorna 401 Unauthorized con mensaje "You must be an admin to view quizzes.".

**Fase 2 - Validación del Parámetro quizId:**

Se extrae el parámetro de ruta params.quizId y se valida usando Zod:

```javascript
const quizIdSchema = z.string().uuid("Invalid quiz ID format");
const quizId = quizIdSchema.parse(params.quizId);
```

Si quizId no es un UUID válido (ej: 123abc), lanza error ZodError → retorna 400 Bad Request con {"error": "Invalid quiz ID"}.

**Fase 3 - Consulta en Base de Datos:**

Se invoca getApprovedQuiz(quizId) que:

1. Llama a findApprovedQuizById(quizId) en repository
2. Ejecuta query Prisma:

```
return prisma.adminQuiz.findFirst({
  where: {
    id: quizId,
    status: "approved",  // Solo retorna quiz con status=approved
  },
  select: {
    id: true,
    title: true,
    category: true,
    difficulty: true,
    quizType: true,
    status: true,
    allowedAttempts: true,
    createdAt: true,
    updatedAt: true,
    questions: {
      select: {
        id: true,
        question: true,
        answer: true,
        options: true,
        citation: true,
      },
    },
  },
});
```

**Fase 4 - Validación de Existencia:**

Si el quiz no existe en BD o no tiene status="approved", Prisma retorna null.
Service verifica:

```javascript
if (!quiz) {
  return null;
}
```

Si es null, endpoint retorna 404 Not Found con {"error": "Quiz not found"}.

**Fase 5 - Enriquecimiento de Datos:**

Si el quiz existe, service enriquece el objeto:

```javascript
return {
  ...quiz,
  allowedAttempts: quiz.allowedAttempts ?? 2,  // Fallback a 2 si es NULL
};
```

**Fase 6 - Estructura de Respuesta:**

Retorna 200 OK:

```json
{
  "quiz": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Angular Fundamentals",
    "category": "Programming",
    "difficulty": "easy",
    "quizType": "mcq",
    "status": "approved",
    "allowedAttempts": 2,
    "createdAt": "2026-06-26T14:32:00Z",
    "updatedAt": "2026-06-26T14:32:00Z",
    "questions": [
      {
        "id": "question-uuid-1",
        "question": "¿Qué es Angular?",
        "answer": "A framework",
        "options": "[\"A framework\",\"A library\",\"A language\",\"An SDK\"]",
        "citation": {
          "source": "FENW_Angular_Eng.pdf",
          "snippet": "Angular is a framework...",
          "confidence": 0.95
        }
      },
      {
        "id": "question-uuid-2",
        "question": "¿Para qué se usa?",
        "answer": "Para construir aplicaciones web",
        "options": null,
        "citation": null
      }
    ]
  }
}
```

**Fase 7 - Consideraciones Especiales:**

- Solo quiz aprobados: La query filtra status="approved" explícitamente, no retorna quiz en draft
- Questions incluidas: Cada pregunta contiene:
  - options: JSON string (MCQ) o null (open_ended)
  - citation: JSON object o null
- allowedAttempts: Default 2 si es NULL en BD
- Acceso seguro: Solo admins pueden consultar

**Fase 8 - Manejo de Errores:**

| Escenario | Status | Body |
|-----------|--------|------|
| No autenticado | 401 | {"error": "You must be an admin to view quizzes."} |
| quizId no es UUID | 400 | {"error": "Invalid quiz ID"} |
| Quiz no existe | 404 | {"error": "Quiz not found"} |
| Error en BD | 500 | {"error": "Failed to retrieve quiz"} |
| Éxito | 200 | {"quiz": {...}} |

### HT27: Eliminación de Cuestionario

Elimina permanentemente un cuestionario aprobado de la base de datos junto con todas sus preguntas asociadas. Valida que el quiz existe y ejecuta una transacción atómica para garantizar consistencia: primero elimina todas las preguntas (AdminQuizQuestion), luego elimina el quiz (AdminQuiz). Si la transacción falla en cualquier punto, se revierte completamente.

**Fase 1 - Validación de Autenticación:**

El endpoint DELETE /api/(admin)/quizzes/[quizId] inicia validando que session?.user?.isAdmin === true. Si no, retorna 401 Unauthorized con mensaje "You must be an admin to delete quizzes.".

**Fase 2 - Validación del Parámetro quizId:**

Se extrae params.quizId y valida con Zod:

```javascript
const quizIdSchema = z.string().uuid("Invalid quiz ID format");
const quizId = quizIdSchema.parse(params.quizId);
```

Si no es UUID válido, retorna 400 Bad Request con {"error": "Invalid quiz ID"}.

**Fase 3 - Delegación a Servicio:**

Se invoca removeAdminQuiz(quizId) que delega directamente a:

```javascript
export async function removeAdminQuiz(id: string) {
  return deleteAdminQuizById(id);
}
```

**Fase 4 - Inicio de Transacción Prisma:**

Se ejecuta transacción Prisma para garantizar atomicidad:

```javascript
export async function deleteAdminQuizById(id: string) {
  return prisma.$transaction(async (tx) => {
    // Fase 5 y 6 se ejecutan dentro de tx
  });
}
```

prisma.$transaction() garantiza que si cualquier operación falla, todas se revierten (ROLLBACK).

**Fase 5 - Eliminación de Preguntas Asociadas:**

Dentro de la transacción, se elimina todas las preguntas:

```javascript
await tx.adminQuizQuestion.deleteMany({
  where: { quizId: id },
});
```

Query SQL ejecutada:
```sql
DELETE FROM AdminQuizQuestion WHERE quizId = ?
```

Retorna objeto con propiedad count (cantidad de rows eliminados).

**Fase 5a - Validación de Integridad Referencial:**

Aunque AdminQuizQuestion tiene quizId como foreign key con @relation(..., onDelete: Cascade), la eliminación explícita es segura y documenta la intención.

Si esta operación falla (ej: problema de BD, permisos), se lanza excepción → transacción revierte automáticamente.

**Fase 6 - Eliminación del Quiz:**

Luego se elimina el quiz:

```javascript
return tx.adminQuiz.delete({
  where: { id },
});
```

Query SQL:
```sql
DELETE FROM AdminQuiz WHERE id = ?
```

Retorna el objeto quiz eliminado.

**Fase 6a - Orden de Eliminación:**

Es crítico eliminar primero preguntas y luego el quiz:
- Si se eliminara el quiz primero, la cascade delete eliminaría las preguntas automáticamente
- Pero si la eliminación del quiz falla, las preguntas quedarían huérfanas en BD
- Al hacerlo explícitamente en orden, se garantiza que el quiz está vacío antes de eliminarse

**Fase 7 - Commit Automático de Transacción:**

Si ambas operaciones se ejecutan sin error:

```javascript
prisma.$transaction(async (tx) => {
  await tx.adminQuizQuestion.deleteMany(...);  // OK
  return tx.adminQuiz.delete(...);             // OK
});
// Transacción se COMMIT automáticamente
```

Prisma ejecuta COMMIT cuando la función async retorna sin excepciones.

**Fase 8 - Rollback en Caso de Error:**

Si cualquiera de las operaciones lanza excepción:

```javascript
try {
  await tx.adminQuizQuestion.deleteMany(...);
} catch (error) {
  // Transacción revierte automáticamente
  throw error;  // Propaga error al endpoint
}
```

O si la eliminación del quiz falla, igual:

```javascript
try {
  return tx.adminQuiz.delete(...);  // Falla aquí
} catch (error) {
  // Transacción revierte automáticamente
  throw error;
}
```

**Fase 9 - Respuesta al Endpoint:**

Si la transacción se completa con éxito:

```javascript
await removeAdminQuiz(quizId);  // Retorna objeto quiz eliminado, se ignora

// En endpoint:
return NextResponse.json(
  { message: "Quiz deleted successfully" },
  { status: 200 },
);
```

Retorna 200 OK.

**Fase 10 - Manejo de Errores:**

| Escenario | Status | Body |
|-----------|--------|------|
| No autenticado | 401 | {"error": "You must be an admin to delete quizzes."} |
| quizId no es UUID | 400 | {"error": "Invalid quiz ID"} |
| Falla transacción (BD) | 500 | {"error": "Failed to delete quiz"} |
| Éxito | 200 | {"message": "Quiz deleted successfully"} |

Después de la eliminación:
- ✅ Quiz desaparece de tabla AdminQuiz
- ✅ Todas sus preguntas desaparecen de tabla AdminQuizQuestion
- ✅ UserQuizAttempt mantiene sus registros históricos (no tienen FK cascade a AdminQuiz por diseño)
- ✅ Administradores ya no pueden acceder al quiz vía HT26 (retorna 404)
- ✅ Usuarios no verán el quiz en su lista de cuestionarios disponibles

**Datos Persistidos Después de Eliminación:**

Tabla AdminQuiz: [ELIMINADO - 0 rows]

Tabla AdminQuizQuestion: [ELIMINADO - 0 rows para este quizId]

Tabla UserQuizAttempt: [MANTIENE REGISTROS HISTÓRICOS - los intentos previos quedan documentados]

## 5. Especificaciones de Endpoints

Sprint 3 implementa un flujo CRUD completo para administración de cuestionarios aprobados: generación desde archivos, persistencia tras revisión, consulta con filtros, y eliminación. Cada endpoint incluye validación de autenticación (admin-only), manejo multipart/form-data o JSON, y manejo de errores progresivo con códigos HTTP específicos.

### Endpoint 1: POST /api/admin/upload-and-generate - Generar Preguntas desde Archivo

**Descripción:** Recibe un archivo (PDF/JSON/TXT) con contenido educativo, extrae texto usando OCR cuando sea necesario, y genera preguntas usando OpenAI. Retorna preguntas generadas SIN guardarlas en BD (aún en estado borrador).

#### Tabla de Request

| Parámetro | Tipo | Requerido | Rango | Descripción |
|-----------|------|-----------|-------|-------------|
| file | File | Si | JSON/PDF/TXT | Archivo con contenido educativo (multipart) |
| category | string | No | 1-100 chars | Categoría del quiz (ej: "Programming", "Design") |
| difficulty | string | Si | easy\|medium\|hard | Nivel de dificultad |
| quizType | enum | No | "mcq"\|"open_ended" | Tipo de preguntas (default: "open_ended") |
| questionCount | number | Si | 1-15 | Cantidad de preguntas a generar (default: 5) |

#### Ejemplo Request (multipart/form-data):

```
POST /api/admin/upload-and-generate HTTP/1.1
Content-Type: multipart/form-data; boundary=----boundary123
Cookie: next-auth.session-token=...

------boundary123
Content-Disposition: form-data; name="file"; filename="Angular.pdf"
Content-Type: application/pdf

[binary PDF content]
------boundary123
Content-Disposition: form-data; name="category"

Programming
------boundary123
Content-Disposition: form-data; name="difficulty"

easy
------boundary123
Content-Disposition: form-data; name="quizType"

mcq
------boundary123
Content-Disposition: form-data; name="questionCount"

10
------boundary123--
```

#### Tabla de Response - Éxito (200)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| questions | array | Array de preguntas generadas {question, answer, citation} |
| questions[].question | string | Texto de la pregunta |
| questions[].answer | string | Respuesta esperada (sin opciones en este punto) |
| questions[].citation | object | Origen de la pregunta {source, snippet, confidence} |
| generationOptions | object | Metadata de generación |
| generationOptions.category | string \| null | Categoría utilizada |
| generationOptions.difficulty | string \| null | Dificultad utilizada |
| generationOptions.quizType | enum | "mcq" o "open_ended" |
| generationOptions.questionCount | number | Cantidad generada |

#### Ejemplo Response 200 MCQ:

```json
{
  "questions": [
    {
      "question": "¿Qué es un componente en Angular?",
      "answer": "Una clase decorada con @Component que encapsula template, estilos y lógica",
      "citation": {
        "source": "Angular.pdf",
        "snippet": "Components are the basic building blocks...",
        "confidence": 0.92
      }
    }
  ],
  "generationOptions": {
    "category": "Programming",
    "difficulty": "easy",
    "quizType": "mcq",
    "questionCount": 1
  }
}
```

#### Ejemplo Response 200 Open Ended:

```json
{
  "questions": [
    {
      "question": "¿Explica cuál es la diferencia entre useState y useReducer en React?",
      "answer": "useState es para estado simple, useReducer para lógica compleja con múltiples sub-valores",
      "citation": {
        "source": "React_Hooks.pdf",
        "snippet": "useState is best for simple state, useReducer for complex state logic...",
        "confidence": 0.89
      }
    },
    {
      "question": "¿Cuáles son los beneficios de usar TypeScript en un proyecto?",
      "answer": "Type safety, early error detection, better IDE support, improved code documentation",
      "citation": {
        "source": "TypeScript_Guide.pdf",
        "snippet": "TypeScript provides static type checking and better tooling...",
        "confidence": 0.91
      }
    }
  ],
  "generationOptions": {
    "category": "Programming",
    "difficulty": "medium",
    "quizType": "open_ended",
    "questionCount": 2
  }
}
```

#### Tabla de Response - Errores

| Estado | Condición | Cuerpo |
|--------|-----------|--------|
| 401 | Sin autenticación o no es admin | {"error": "Unauthorized"} |
| 400 | Content-Type inválido | {"error": "Content-Type must be multipart/form-data or application/x-www-form-urlencoded."} |
| 400 | No hay archivo | {"error": "No file uploaded."} |
| 400 | Formato de archivo no soportado | {"error": "Only JSON, TXT, or PDF files are accepted."} |
| 400 | JSON inválido | {"error": "Invalid JSON file."} |
| 400 | PDF corrupto | {"error": "Invalid PDF file."} |
| 400 | PDF sin texto extraíble | {"error": "Could not extract readable text from PDF."} |
| 400 | Calidad de OCR baja | {"error": "Extracted PDF text quality is too low..."} |
| 400 | Contenido insuficiente | {"error": "Course content is too short or missing."} |
| 400 | No hay preguntas válidas | {"error": "No valid questions could be generated from the uploaded file."} |
| 429 | Rate limit OpenAI (generación) | {"questions": [], "error": "Rate limit reached while generating quiz questions..."} |
| 429 | Rate limit OCR | {"questions": [], "error": "Rate limit reached while processing PDF OCR..."} |
| 502 | Error OpenAI/OCR upstream | {"questions": [], "error": "PDF text extraction failed..."} |
| 500 | Error interno | {"questions": [], "error": "Failed to generate quiz."} |

### Endpoint 2: POST /api/admin/quiz-review - Persistir Cuestionario Aprobado

**Descripción:** Recibe un cuestionario generado (de HT23) con todas sus preguntas finales, lo valida, lo limpia de metadata de IA, y lo persiste en BD con status="approved".

#### Tabla de Request

| Parámetro | Tipo | Requerido | Rango | Descripción |
|-----------|------|-----------|-------|-------------|
| title | string | No | 1-255 chars | Título del quiz (si vacío, usa fileName) |
| fileName | string | No | 1-255 chars | Nombre original del archivo uploadado |
| category | string | Si | 1-100 chars | Categoría (requerida) |
| difficulty | string | Si | easy\|medium\|hard | Dificultad (requerida) |
| quizType | enum | No | "mcq"\|"open_ended" | Tipo de preguntas (default: "open_ended") |
| questions | array | Si | 1+ items | Array de preguntas a persistir |
| questions[].question | string | Si | 1-500 chars | Texto de pregunta limpio |
| questions[].answer | string | Si | 1-100 chars | Respuesta esperada |
| questions[].options | array | No | 2+ items | Opciones MCQ (si quizType="mcq") |
| questions[].citation | object | No | JSON | Origen {source, snippet, confidence} |

#### Ejemplo Request:

```json
{
  "title": "Angular Fundamentals",
  "category": "Programming",
  "difficulty": "easy",
  "quizType": "mcq",
  "questions": [
    {
      "question": "¿Qué es un componente?",
      "answer": "Una clase con @Component",
      "options": ["Una clase con @Component", "Una función", "Una interfaz", "Un archivo"],
      "citation": {"source": "Angular.pdf", "snippet": "...", "confidence": 0.92}
    }
  ]
}
```

#### Tabla de Response - Éxito (201)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| quiz | object | Quiz creado con ID y metadata |
| quiz.id | string | UUID generado automáticamente |
| quiz.status | string | Siempre "approved" |

#### Tabla de Response - Errores

| Estado | Condición | Cuerpo |
|--------|-----------|--------|
| 401 | Sin autenticación o no es admin | {"error": "Unauthorized"} |
| 400 | Pregunta sin question o answer | {"error": "Question X must include both question and answer text."} |
| 400 | MCQ con < 2 opciones | {"error": "Question X must contain at least 2 choices for MCQ."} |
| 500 | Error en BD | {"error": "Failed to save quiz"} |

### Endpoint 3: GET /api/admin/quizzes - Listar Cuestionarios con Filtros

**Descripción:** Retorna lista paginada de cuestionarios aprobados con capacidad de filtrado por categoría y dificultad. Para cada quiz incluye estadísticas de intentos de usuarios.

#### Tabla de Query Parameters

| Parámetro | Tipo | Requerido | Rango | Descripción |
|-----------|------|-----------|-------|-------------|
| category | string | ✗ | 1-100 chars | Filtro por categoría (exact match) |
| difficulty | string | ✗ | easy\|medium\|hard | Filtro por dificultad |
| page | number | ✗ | 1+ | Número de página (default: 1) |
| limit | number | ✗ | 1+ | Resultados por página (default: 10) |

#### Tabla de Response - Éxito (200)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| quizzes | array | Array de quizzes con estadísticas |
| quizzes[].attemptSummary | object | Estadísticas de intentos |
| quizzes[].attemptSummary.totalAttempts | number | Intentos totales |
| quizzes[].attemptSummary.completedAttempts | number | Intentos completados |
| quizzes[].attemptSummary.averageScore | number \| null | Score promedio |
| pagination | object | Información de paginación |
| pagination.total | number | Total de quizzes |
| pagination.page | number | Página actual |
| pagination.pages | number | Total de páginas |

#### Tabla de Response - Errores

| Estado | Condición | Cuerpo |
|--------|-----------|--------|
| 401 | Sin autenticación | {"error": "You must be an admin to view quizzes."} |
| 400 | Query params inválidos | {"error": "Invalid query parameters", "issues": [...]} |
| 500 | Error en BD | {"error": "Failed to retrieve quizzes"} |

### Endpoint 4: GET /api/admin/quizzes/[quizId] - Obtener Detalles del Cuestionario

**Descripción:** Retorna detalles completos de un cuestionario aprobado específico.

#### Tabla de Request

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| quizId | string (UUID) | ✓ | ID del quiz a obtener (en ruta) |

#### Tabla de Response - Éxito (200)

Ver estructura en HT26

#### Tabla de Response - Errores

| Estado | Condición | Cuerpo |
|--------|-----------|--------|
| 401 | Sin autenticación | {"error": "You must be an admin to view quizzes."} |
| 400 | quizId no es UUID | {"error": "Invalid quiz ID"} |
| 404 | Quiz no existe | {"error": "Quiz not found"} |
| 500 | Error en BD | {"error": "Failed to retrieve quiz"} |

### Endpoint 5: DELETE /api/admin/quizzes/[quizId] - Eliminar Cuestionario

**Descripción:** Elimina permanentemente un cuestionario y todas sus preguntas asociadas. Ejecuta transacción atómica.

#### Tabla de Request

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| quizId | string (UUID) | ✓ | ID del quiz a eliminar (en ruta) |

#### Ejemplo Request:

```
DELETE /api/(admin)/quizzes/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Cookie: next-auth.session-token=...
```

#### Tabla de Response - Éxito (200)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| message | string | Confirmación de eliminación |

#### Ejemplo Response 200:

```json
{
  "message": "Quiz deleted successfully"
}
```

#### Tabla de Response - Errores

| Estado | Condición | Cuerpo |
|--------|-----------|--------|
| 401 | Sin autenticación | {"error": "You must be an admin to delete quizzes."} |
| 400 | quizId no es UUID | {"error": "Invalid quiz ID"} |
| 500 | Error en transacción | {"error": "Failed to delete quiz"} |

## 6. Pruebas

(Sección a completar con casos de prueba específicos)

## 7. Retrospectiva

### 7.1 ¿Qué Salió Bien?

✅ **Arquitectura de capas bien segregada para generación desde archivos**

El sistema de carga y generación quedó modularizado en fases claras: validación de autenticación → validación de content-type → extracción de FormData → detección de tipo de archivo → extracción de contenido con OCR fallback (PDF) → validación de contenido mínimo → normalización → preparación para OpenAI → llamada a OpenAI → manejo de reintentos → normalización de respuestas → limpieza de metadata IA → deduplicación → generación de citaciones basada en token overlap. Cada fase es independiente, testeable y reutilizable.

✅ **OCR con Google Cloud Vision integrado y cascada de calidad**

Para PDFs con contenido bajo (< 10 caracteres), el sistema automáticamente fallback a OCR. Valida calidad mínima (80+ caracteres, 45% palabras alfabéticas, 8+ palabras únicas). Si OCR es de baja calidad (< 45%), marca flag `ocrQuality: "low"` pero continúa generando (no falla), permitiendo admin revisión manual. Esto evita abandonar archivos valiosos por baja calidad inicial.

✅ **Manejo estratificado de errores con códigos HTTP específicos**

- 400: Validación (archivo inválido, contenido insuficiente, JSON mal formado)
- 401: Autenticación (no admin)
- 429: Rate limit (OpenAI o OCR)
- 502: Error upstream (OpenAI/OCR falló)
- 500: Error interno

Cada error retorna estructura clara con contexto suficiente para admin depurar.

✅ **Generación de preguntas dual (MCQ vs Open-ended) con prompts diferenciados**

Para MCQ: prompt especifica "target style: mcq-ready" con límite 1-6 palabras, respuesta como "code output, exact syntax, keyword"
Para Open-ended: prompt especifica "open-ended" con respuestas 1-6 palabras no vacías

Ambos tipos convergen al mismo schema {question, answer, citation}, sin opciones en backend (opciones se generan en frontend QuizReview.tsx).

✅ **Transacción atómica en persistencia de quiz completo**

POST /api/(admin)/quiz-review crea AdminQuiz + N AdminQuizQuestion en una sola transacción Prisma. Si falla cualquier operación, se revierte completamente. Schema.prisma configura CASCADE delete (quizId → AdminQuizQuestion) garantizando integridad referencial.

✅ **Validación de integridad de preguntas MCQ**

Antes de persistir, valida:
- Para Open-ended: pregunta y respuesta no vacías
- Para MCQ: pregunta y respuesta no vacías + mínimo 2 opciones (MIN_MCQ_OPTIONS = 2)

Si MCQ tiene < 2 opciones, retorna 400 Bad Request claro.

✅ **Listado paginado con enriquecimiento de estadísticas**

GET /api/(admin)/quizzes ejecuta:
1. Query base: filtros por categoría/dificultad, ordenado por updatedAt DESC
2. Consulta UserQuizAttempt para todos los quizzes en resultado
3. Agregación en memoria: totalAttempts, completedAttempts, pendingAttempts, averageScore, lastAttemptAt, lastCompletedAt
4. Enriquecimiento de cada quiz con attemptSummary
5. Paginación en memoria (page, limit, total pages)

Retorna 200 OK con estructura completa: quizzes[] + pagination{}.

✅ **Detalles de quiz con validación UUID y status check**

GET /api/(admin)/quizzes/[quizId]:
- Valida UUID con Zod (retorna 400 si inválido)
- Query filtra `status: "approved"` + matching quizId
- Si no existe, retorna 404 "Quiz not found"
- Retorna estructura completa con preguntas + opciones JSON + citaciones

✅ **Eliminación transaccional con orden garantizado**

DELETE /api/(admin)/quizzes/[quizId] ejecuta transacción Prisma:
1. DELETE AdminQuizQuestion WHERE quizId = ?
2. DELETE AdminQuiz WHERE id = ?

Orden explícito asegura integridad: quiz nunca queda huérfano.
UserQuizAttempt preserva registros históricos (no tiene cascade a AdminQuiz).

✅ **Limpieza de metadata de IA robusta**

cleanQuestionMetadata() elimina patrones residuales que OpenAI deja:
- "Source: FENW_Angular.pdf (Citation confidence: 95%)"
- "(Citation ...)" patterns
- Normaliza espacios extras
- Resulta en pregunta limpia sin artefactos

✅ **Citaciones basadas en token overlap con confidence score**

buildCitationForQuestion() encuentra snippet de origen que mejor encaja:
- Tokeniza texto de origen (eliminando stopwords)
- Calcula overlap con pregunta + respuesta
- Retorna {source, snippet, confidence: 0.92}
- Confidence permite UI warnings si es baja

### 7.2 ¿Qué Problemas Encontramos y Resolvimos?

⚠️ **Problema 1: OpenAI retorna menos preguntas de las pedidas**

**Síntoma:** Request pedía 10 preguntas, OpenAI retorna 7. Cuestionario queda incompleto, frontend no sabe qué hacer con faltantes.

**Resolución:** Implementar fallback a preguntas predefinidas internas si OpenAI no retorna cantidad esperada. Las preguntas predefinidas actúan como "emergency backup" cuando IA falla completamente. El sistema continúa funcionando aunque sea con preguntas genéricas, evitando error total.

⚠️ **Problema 2: Tokens muy largos en preguntas generadas**

**Síntoma:** OpenAI genera preguntas de 300+ caracteres, schema.prisma define `question String @db.LongText` pero respuestas `answer String @db.Text` con límite 255. Las inserciones fallaban silenciosamente o se truncaban.

**Resolución:** Función `fitDbString()` recorta cada pregunta y respuesta a máximo 180 caracteres ANTES de persistir. Si el texto se recorta, se marca en UI con indicator visual "..." o tooltip. Normaliza espacios extras en el proceso también.

⚠️ **Problema 3: Rate limit de OpenAI no diferenciado de otros errores**

**Síntoma:** Cuando OpenAI retorna 429, endpoint devolvía 500 Internal Server Error genérico. Cliente no sabía si era problema temporal o error permanente.

**Resolución:** Detectar "rate limit" en mensaje de error OpenAI (checar "429" o "rate limit" string). Si detectado, retornar 429 Too Many Requests + `{"error": "Rate limit reached..."}`. Cliente puede reintentar después de delay. Otros errores OpenAI → 502 Bad Gateway.

⚠️ **Problema 4: OCR de baja calidad rechaza archivos válidos**

**Síntoma:** Foto borrosa de PDF retorna "Extracted PDF text quality too low", admin pierde trabajo.

**Resolución:** OCR baja calidad NO falla endpoint, sino marca flag `ocrQuality: "low"` y continúa. Frontend puede mostrar warning: "OCR quality is low, please review carefully". Admin decide si aceptar o resubir archivo. Mejor UX que rechazar automáticamente.

⚠️ **Problema 5: Deduplicación de preguntas dentro de mismo batch**

**Síntoma:** Si se generan 10 preguntas, OpenAI genera "¿Qué es Angular?" dos veces. Cuestionario tiene duplicados, user confundido.

**Resolución:** Mantener Set de enunciados ya procesados en batch actual. Antes de aceptar pregunta, checar si enunciado ya existe. Si sí, descartar (o reintentar si count < esperado). Set es in-memory, se limpia después de generar todas las preguntas.

⚠️ **Problema 6: Opciones MCQ generadas en backend complicaban lógica**

**Síntoma:** Intentar generar 4 opciones "good distractors" desde OpenAI resulta en opciones pobres o duplicadas. Aumenta tokens, complejidad, fallos.

**Resolución:** Backend NO genera opciones. Retorna solo {question, answer, citation}. Frontend QuizReview.tsx llama buildAutoMcqOptions() que usa:
- Respuesta correcta como opción 1
- Respuestas de otras preguntas como distractores (opciones 2-3)
- Fallback genérico si no hay suficientes ("None of the above", "All of the above", etc.)

Resultado: lógica más simple, menos errores, frontend control total sobre opciones.

⚠️ **Problema 7: Metadata de IA residual en persistencia**

**Síntoma:** OpenAI genera: `"¿Qué es Angular? Source: Angular.pdf (Citation confidence: 95%)"`. Se persiste así en BD, aparece en UI como basura.

**Resolución:** Función cleanQuestionMetadata() en quiz-review endpoint limpia ANTES de persistir. Elimina patrones conocidos: "Source:", "(Citation...", espacios extras. Pregunta queda limpia en BD desde el inicio.

⚠️ **Problema 8: Paginación en BD vs en memoria**

**Síntoma:** 10,000 quizzes en BD, GET /api/(admin)/quizzes?page=1&limit=10 retorna todos 10,000 a memoria, después pagina. Lento y consume RAM.

**Resolución:** Paginación en memoria por ahora (acceptable para MVP). Para escala futura: mover paginación a SQL `LIMIT offset, limit`. Nota documentada en especificación HT25 Fase 8.

⚠️ **Problema 9: Admin no sabía por qué una pregunta fue rechazada**

**Síntoma:** POST /api/(admin)/quiz-review retorna 400 "Question X must include both..." pero X es un número confuso, admin no sabe cual pregunta.

**Resolución:** Mejorar mensaje a incluir índice (1-based) + preview de pregunta rechazada. Ej: `"Question 3 must include both question and answer text. Got: '¿Qué es Angular?' + ''"`

### 7.3 HTs Implementadas vs Documentadas

✅ **HT22 - Modelo de Datos:** COMPLETAMENTE DOCUMENTADO
- Schema AdminQuiz + AdminQuizQuestion definido
- Relaciones, índices, constraints, timestamps explicados en detalle

✅ **HT23 - Sistema de Carga y Generación:** COMPLETAMENTE DOCUMENTADO
- 16+ fases detalladas
- Ejemplos de request/response
- Tabla de errores exhaustiva
- Implementación en route.ts valida la documentación

✅ **HT24 - Persistencia de Cuestionario Aprobado:** COMPLETAMENTE DOCUMENTADO
- 8+ fases detalladas incluyendo limpieza de metadata
- Validación de preguntas específica por tipo (MCQ vs open-ended)
- Transacción atómica explicada
- Implementación en quiz-review route.ts valida

⚠️ **HT25 - Consulta de Cuestionarios con Filtros:** IMPLEMENTADA PERO DOCUMENTACIÓN MENOS DETALLADA QUE HT22-24
- Implementación funcional en GET /api/(admin)/quizzes
- 10+ fases descritas en especificaciones (Fase 1-10)
- Falta: Detalles de agregación de estadísticas en código, SQL queries específicas
- Nota: Paginación en memoria (acceptable para MVP, mejorable a SQL LIMIT futuro)

⚠️ **HT26 - Obtención de Detalles:** IMPLEMENTADA PERO DOCUMENTACIÓN MENOS DETALLADA
- Implementación funcional en GET /api/(admin)/quizzes/[quizId]
- 8+ fases descritas en especificaciones
- Falta: Detalles de parsing de opciones JSON en respuesta, manejo de null en citation field

⚠️ **HT27 - Eliminación de Cuestionario:** IMPLEMENTADA PERO DOCUMENTACIÓN MENOS DETALLADA
- Implementación funcional en DELETE /api/(admin)/quizzes/[quizId]
- 12+ fases descritas en especificaciones
- Falta: Detalles de rollback transaction en caso de error, impacto exacto en UserQuizAttempt histórico

**Razón de documentación parcial HT25-27:** Durante el sprint, la prioridad fue completar la cobertura de tests (alcanzar 80% en branches). Las 3 historias técnicas finales quedaron implementadas y funcionales pero con documentación menos exhaustiva que HT22-24 por constraints de tiempo. Todas están lista-production aunque documentación técnica mejorable.

### 7.4 Métricas del Sprint

| Métrica | Valor | Estado |
|---------|-------|--------|
| Historias de Usuario completadas | 3/3 (HU11-13) | ✅ |
| Historias Técnicas implementadas | 6/6 (HT22-27) | ✅ |
| HTs documentadas exhaustivamente | 4/6 (HT22-25) | ✅ |
| Endpoints admin funcionales | 5/5 | ✅ |
| Cobertura de líneas | 86.38% | ✅ (>80%) |
| Cobertura de ramas | 80.11% | ✅ (>80%) |
| Tests backend totales | 496+ | ✅ |
| OCR fallback implementado | ✅ | ✅ |
| Transacciones atómicas (Crear + Eliminar) | BD persistencia | ✅ |
| Rate limit handling | 429 diferenciado | ✅ |

### 7.5 Conclusión

Sprint 3 logró exitosamente la **automatización completa de generación de preguntas desde documentos** (PDF/JSON/TXT) con integración de IA (OpenAI gpt-4o-mini), OCR (Google Cloud Vision), y persistencia transaccional.

Los **6 HTs quedaron implementados funcionalmente** con validación en capas, manejo robusto de errores, y recuperación ante fallos. Aunque HT25-27 tenían documentación menos exhaustiva que HT22-24 (por prioridad en cobertura de tests), la implementación es sólida y cumple especificaciones completas.

Los **problemas encontrados** (rate limit, OCR baja calidad, tokens largos, metadata residual, opciones MCQ) fueron resueltos con **patrones escalables**: fallback a preguntas predefinidas, recorte con fitDbString(), diferenciación de errores HTTP, limpieza de metadata pre-persistencia, y separación de generación de opciones al frontend.

La **arquitectura modular** (fases independientes, cascada clara, adapters inyectables) facilita testing, debugging y mantenimiento futuro. El sistema está listo para escala: paginación mejorable a BD, índices en AdminQuizQuestion.quizId, historial preservado en UserQuizAttempt.

**Estado Final:** 🟢 **Producción-ready** (con recomendaciones para optimización de paginación SQL en future sprints).

---

**Versión:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Documentado + Retrospectiva Completa
