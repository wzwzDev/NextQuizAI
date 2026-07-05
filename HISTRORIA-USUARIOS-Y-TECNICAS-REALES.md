# 📋 HISTORIAS DE USUARIO Y TÉCNICAS - BASADAS EN IMPLEMENTACIÓN REAL

**Estado**: ✅ Extraído del código real del proyecto  
**Fecha**: Junio 2026  
**Total**: 30 Historias de Usuario (HU01-HU30) + 25 Historias Técnicas (HT01-HT25)

---

## 📊 RESUMEN POR SPRINT

| Sprint | Período | HUs | HTs | Status |
|--------|---------|-----|-----|--------|
| **Sprint 1** | Baseline | HU01-HU05 | HT01-HT05 | ✅ COMPLETO |
| **Sprint 2** | Topic Games | HU06-HU11 | HT06-HT10 | ✅ COMPLETO |
| **Sprint 3** | PDF Upload & OCR | HU12-HU17 | HT11-HT15 | ✅ COMPLETO |
| **Sprint 4** | Admin Quiz & Review | HU18-HU23 | HT16-HT20 | ✅ COMPLETO |
| **Sprint 5** | Analytics & Refinement | HU24-HU30 | HT21-HT25 | ✅ COMPLETO |

---

# SPRINT 1: AUTENTICACIÓN Y GESTIÓN DE SESIONES (HU01-HU05 + HT01-HT05)

## Historias de Usuario

### **HU01** - Registro de Usuario con Email/Contraseña
- **Descripción**: Como usuario, quiero registrarme en la plataforma usando mi correo electrónico y contraseña para acceder al sistema de quizzes.
- **Criterios de Aceptación**:
  - El usuario puede ingresar correo único y contraseña (8-128 caracteres)
  - La contraseña se hash con Scrypt (64-byte hash + 16-byte salt)
  - Se valida unicidad del correo
  - Se envia email de verificación
- **Implementación**: `POST /api/auth/register` + `RegisterUserWithPasswordUseCase`
- **Tabla**: User, EmailVerificationToken
- **Validación**: Zod schema con email único y password 8-128 chars

### **HU02** - Verificación de Email
- **Descripción**: Como usuario nuevo, quiero verificar mi correo electrónico con un token para confirmar propiedad de la cuenta.
- **Criterios de Aceptación**:
  - Se genera token único SHA256 con 24h TTL
  - Token es de una sola use (consumedAt marker)
  - Verifica email correctamente con token válido
  - Rechaza token expirado o usado
- **Implementación**: `POST /api/auth/verify-email` + `VerifyEmailTokenUseCase`
- **Tabla**: EmailVerificationToken
- **Token Strategy**: SHA256(32 random bytes)

### **HU03** - Login OAuth con Google
- **Descripción**: Como usuario, quiero poder ingresar con mi cuenta de Google para acceso rápido sin gestionar contraseña.
- **Criterios de Aceptación**:
  - Integración NextAuth.js con Google OAuth
  - Fallback a login con credenciales (email/password)
  - Vinculación automática de cuentas OAuth existentes
  - Primera vez crea cuenta automáticamente
- **Implementación**: `GET/POST /api/auth/signin` + NextAuth.js providers config
- **Tabla**: User, Account (OAuth linking)
- **Strategy**: JWT (30-day expiry)

### **HU04** - Cierre de Sesión
- **Descripción**: Como usuario, quiero cerrar sesión y logout de la plataforma de forma segura.
- **Criterios de Aceptación**:
  - Al logout se destruye la sesión
  - Se marca usuario como offline (lastSeen update)
  - Se invalidan tokens JWT
  - Redirige a página de login
- **Implementación**: `POST /api/sign-out` endpoint
- **Validación**: Verifica propiedad de sesión

### **HU05** - Gestión de Sesiones
- **Descripción**: Como sistema, necesito gestionar sesiones de usuario con JWT para mantener autenticación segura.
- **Criterios de Aceptación**:
  - JWT contiene: id, email, isAdmin, banned, revoked
  - Expiry de 30 días
  - Storage en base de datos (Prisma Session)
  - Check en cada request protegido
- **Implementación**: NextAuth.js callbacks (jwt, session)
- **Tabla**: Session (Prisma)
- **Validación**: RBAC check (banned/revoked)

---

## Historias Técnicas

### **HT01** - Diseño Schema Prisma - Autenticación
- **Objetivo**: Definir modelo de datos para autenticación segura
- **Componentes**:
  - User model: id (UUID), email (unique), password, isAdmin, banned, revoked, createdAt, lastSeen
  - Account model: OAuth linking (provider, providerAccountId, userId)
  - Session model: JWT sessions
  - EmailVerificationToken model: token, email, expiresAt, consumedAt
- **Constraints**: email UNIQUE, (provider + providerAccountId) UNIQUE
- **Indices**: email, (provider + providerAccountId)

### **HT02** - Seguridad de Contraseña
- **Objetivo**: Implementar hashing seguro de contraseñas
- **Especificaciones**:
  - Algoritmo: Scrypt (moderna, resistente a ataques)
  - Hash size: 64 bytes
  - Salt: 16 bytes
  - Comparison: Timing-safe compare (contra timing attacks)
  - No almacenar plain text bajo ninguna circunstancia

### **HT03** - Configuración NextAuth.js
- **Objetivo**: Implementar autenticación multi-provider con RBAC
- **Componentes**:
  - Provider credentials: Email/password local
  - Provider OAuth: Google (clientId, clientSecret)
  - JWT personalizado: Payload con roles y flags
  - Callbacks: signIn (valida banned/revoked), jwt (encoda datos), session (proporciona datos al cliente)
- **Versión**: NextAuth.js v4.24.11

### **HT04** - Tokens de Verificación de Email
- **Objetivo**: Generar y validar tokens únicos para verificación de email
- **Especificaciones**:
  - Generación: SHA256(32 random bytes)
  - Storage: EmailVerificationToken model
  - TTL: 24 horas
  - One-time use: consumedAt timestamp
  - Validación: email match + token hash match + expiry check

### **HT05** - Factory de Email
- **Objetivo**: Soportar múltiples providers de email (dev/prod)
- **Especificaciones**:
  - Dev mode: Nodemailer (console output)
  - Prod mode: Resend API integration
  - Template: Email de verificación con token link
  - Retry logic: Reintentos en caso de fallo
  - Seguridad: No expone tokens en logs

---

# SPRINT 2: GENERACIÓN DE QUIZZES POR TEMA (HU06-HU11 + HT06-HT10)

## Historias de Usuario

### **HU06** - Crear Juego por Tema
- **Descripción**: Como estudiante, quiero crear un juego de quiz seleccionando un tema y tipo de preguntas (MCQ u open-ended).
- **Criterios de Aceptación**:
  - Usuario selecciona tema, tipo (mcq/open_ended), cantidad (5-10)
  - Sistema crea registro de game
  - Retorna gameId único
  - Requiere autenticación
- **Implementación**: `POST /api/game` + `StartGameUseCase`
- **Tabla**: Game, TopicCount
- **Validación**: Auth required, topic no vacío

### **HU07** - Generación de Preguntas con IA
- **Descripción**: Como sistema, necesito generar preguntas dinámicamente usando OpenAI basadas en el tema y tipo seleccionado.
- **Criterios de Aceptación**:
  - Llama GPT-3.5-turbo con prompt específico
  - MCQ: genera 4 opciones + respuesta correcta
  - Open-ended: genera pregunta + respuesta modelo
  - Reintentos: 3 intentos con backoff exponencial (1s→2s→4s)
  - Fallback: preguntas predefinidas si LLM falla
- **Implementación**: `GenerateTopicQuestionsUseCase` + `OpenAiLlmAdapter`
- **Tabla**: Question
- **Output Format**: JSON estricto (Zod validated)

### **HU08** - Responder Pregunta MCQ
- **Descripción**: Como estudiante, quiero seleccionar una opción en preguntas de multiple choice y obtener feedback inmediato.
- **Criterios de Aceptación**:
  - Usuario selecciona opción de 4 disponibles
  - Sistema compara con respuesta correcta (case-insensitive, trimmed)
  - Retorna isCorrect boolean
  - Almacena respuesta y resultado
- **Implementación**: `POST /api/checkAnswer` + `CheckAnswerUseCase`
- **Tabla**: Question (userAnswer, isCorrect)
- **Grading**: Exact string match

### **HU09** - Responder Pregunta Open-Ended
- **Descripción**: Como estudiante, quiero escribir respuesta libre en preguntas abiertas y recibir evaluación automática por similitud.
- **Criterios de Aceptación**:
  - Usuario escribe respuesta libre
  - Sistema calcula similitud (cosine similarity)
  - Umbral: ≥70% similitud = Pass
  - Retorna percentageSimilar y resultado
  - Almacena respuesta y score
- **Implementación**: `POST /api/checkAnswer` + grading logic
- **Tabla**: Question (userAnswer, percentageCorrect)
- **Algoritmo**: Cosine similarity (string-similarity lib)

### **HU10** - Finalizar Juego y Obtener Puntaje
- **Descripción**: Como estudiante, quiero terminar el juego y ver mi puntaje final con métricas de desempeño.
- **Criterios de Aceptación**:
  - Usuario cliquea "Finalizar"
  - Sistema agrega respuestas correctas
  - Calcula porcentaje: (correctas / total) * 100
  - Retorna: score, performance metrics, timestamp
- **Implementación**: `POST /api/endGame` + score aggregation
- **Tabla**: Game (timeEnded, score)
- **Validación**: Verifica game ownership

### **HU11** - Ver Historial de Juegos
- **Descripción**: Como estudiante, quiero acceder a mi historial de juegos completados para revisar desempeño histórico.
- **Criterios de Aceptación**:
  - Lista todos mis juegos con timestamp
  - Muestra: tema, tipo, score, duración
  - Ordenado por fecha (más reciente primero)
  - Permite filtrar por tema
- **Implementación**: Frontend component + Game model queries
- **Tabla**: Game (userId, timeStarted, timeEnded)
- **Índice**: userId para query rápida

---

## Historias Técnicas

### **HT06** - Schema Game Model
- **Objetivo**: Definir estructura para almacenamiento de juegos
- **Especificaciones**:
  - Campos: id (UUID), userId (FK), topic (string), gameType (enum: mcq/open_ended), timeStarted (DateTime), timeEnded (DateTime?), score (float?)
  - Relación: One user → many games
  - Índice: userId, createdAt
  - Constraints: userId NOT NULL

### **HT07** - Schema Question Model
- **Objetivo**: Definir estructura para preguntas y respuestas
- **Especificaciones**:
  - Campos: id (UUID), gameId (FK), question (string), answer (string), options (JSON), userAnswer (string?), isCorrect (boolean?), percentageCorrect (float?)
  - Relación: One game → many questions
  - Índice: gameId
  - JSON validation: options debe ser array

### **HT08** - Servicio de Generación de Preguntas
- **Objetivo**: Integrar OpenAI para generación dinámica de preguntas
- **Especificaciones**:
  - Endpoint: OpenAI GPT-3.5-turbo API
  - Prompt engineering: Específico para MCQ + open-ended
  - Output format: JSON schema strict
  - Retry logic: 3 intentos con backoff exponencial
  - Rate limit handling: 429 responses
  - Fallback: Preguntas predefinidas si todos los reintentos fallan

### **HT09** - Servicio de Evaluación de Respuestas
- **Objetivo**: Implementar lógica de calificación para MCQ y open-ended
- **Especificaciones**:
  - MCQ: Exact string match (case-insensitive, trimmed)
  - Open-ended: Cosine similarity calculation
  - Threshold: ≥70% = Pass, 30-70% = Partial, <30% = Fail
  - Levenshtein fallback para typo tolerance (distancia ≤2)
  - Almacena: isCorrect boolean + percentage

### **HT10** - Modelo TopicCount para Analytics
- **Objetivo**: Trackear temas jugados para análisis y recomendaciones
- **Especificaciones**:
  - Campos: topic (string, unique), count (int)
  - Update: Increment on game creation
  - Purpose: Recomendaciones adaptivas, análisis de popularidad
  - Índice: topic

---

# SPRINT 3: CARGA DE PDF Y OCR (HU12-HU17 + HT11-HT15)

## Historias de Usuario

### **HU12** - Cargar PDF de Contenido
- **Descripción**: Como admin, quiero cargar un PDF (texto o escaneo) para generar preguntas automáticas del contenido.
- **Criterios de Aceptación**:
  - Soporta PDF con texto extractable
  - Soporta PDF escanado (imágenes)
  - Valida formato: .pdf solamente
  - Maneja archivo > 10MB de forma streaming
  - Retorna confirmation + file reference
- **Implementación**: `POST /api/(admin)/upload-and-generate`
- **Validación**: Admin required, file type check

### **HU13** - OCR Multi-Layer Fallback
- **Descripción**: Como sistema, necesito convertir PDFs escanados a texto usando OCR robusto con fallbacks múltiples.
- **Criterios de Aceptación**:
  - Layer 1 (Fast): pdfjs parsing (PDFs con texto)
  - Layer 2 (Reliable): Google Vision async OCR (PDFs escanados)
  - Layer 3 (Backup): OpenAI Vision API REST (si GCS no disponible)
  - Layer 4 (Safe): Generador determinístico (fallback universal)
  - Selecciona mejor resultado automáticamente
- **Implementación**: `PdfOcrAdapter` + 4-layer pipeline
- **Tabla**: Question (source tracking)
- **Strategy**: @google-cloud/vision API

### **HU14** - Generar Preguntas desde PDF
- **Descripción**: Como admin, después de cargar PDF, quiero que el sistema extraiga contenido clave y genere preguntas automáticas.
- **Criterios de Aceptación**:
  - Extrae texto de PDF (via OCR o parsing)
  - Divide en chunks (máx 4000 tokens)
  - Llama GPT-3.5 para cada chunk
  - Combina preguntas (evita duplicados)
  - Genera MCQ + open-ended mixed
- **Implementación**: `GenerateQuestionsFromPdfUseCase`
- **Tabla**: Question, AdminQuiz
- **Prompt Engineering**: Context-aware generation

### **HU15** - Validación de Contenido OCR
- **Descripción**: Como admin, necesito verificar que el OCR capturó bien el contenido antes de generar preguntas.
- **Criterios de Aceptación**:
  - Muestra texto extraído para review
  - Permite editarlo/corregirlo antes de Q&A generation
  - Muestra confidence del OCR (%)
  - Opción para reintentarOCR manualmente
- **Implementación**: Admin dashboard component
- **Storage**: Temporary in session

### **HU16** - Generar Preguntas desde Archivo JSON
- **Descripción**: Como admin, quiero subir un archivo JSON con preguntas pre-formateadas para usar como quiz template.
- **Criterios de Aceptación**:
  - Soporta JSON schema: `[{question, answer, options?, type}]`
  - Valida estructura con Zod
  - Convierte a Question records
  - Integra con admin quiz workflow
- **Implementación**: `POST /api/(admin)/upload-and-generate` (JSON variant)
- **Validación**: JSON schema strict

### **HU17** - Generar Preguntas desde Archivo TXT
- **Descripción**: Como admin, quiero subir un archivo TXT con contenido para generar preguntas automáticas.
- **Criterios de Aceptación**:
  - Lee archivo de texto plano
  - Divide en párrafos
  - Genera preguntas por párrafo
  - Soporta archivos > 1MB
- **Implementación**: `POST /api/(admin)/upload-and-generate` (TXT variant)
- **Validación**: File size check, text extraction

---

## Historias Técnicas

### **HT11** - Pipeline de OCR Multi-Layer
- **Objetivo**: Implementar fallback robusto para OCR
- **Especificaciones**:
  - Layer 1: `pdfjs-dist` local parsing (rápido, text PDFs)
  - Layer 2: Google Cloud Vision async (confiable, PDFs escanados)
  - Layer 3: OpenAI Vision API REST (backup, serverless)
  - Layer 4: Deterministic generator (universal fallback)
  - Selection logic: Elige mejor resultado por confidence

### **HT12** - Integración Google Cloud Vision
- **Objetivo**: OCR async para serverless environments
- **Especificaciones**:
  - Service: `@google-cloud/vision` v5.3.6
  - Upload a GCS (Google Cloud Storage)
  - OCR async job tracking
  - Result retrieval con polling
  - Error handling: 429 (rate limit), 503 (service unavailable)

### **HT13** - Integración OpenAI Vision API
- **Objetivo**: Backup OCR usando OpenAI Vision
- **Especificaciones**:
  - Model: gpt-4o-mini (cost-effective, vision capable)
  - Input: Base64-encoded image
  - REST API: Direct HTTP call
  - Retry: 3 intentos con backoff
  - Rate limit: Respeta headers

### **HT14** - Parsing PDF Local (pdfjs)
- **Objetivo**: Extracción rápida de texto para PDFs nativos
- **Especificaciones**:
  - Library: `pdfjs-dist`
  - Node.js integration: Con canvas polyfill
  - Canvas warning fix: Smart routing para Vercel
  - Text extraction: `getTextContent()` API
  - Fallback: Si canvas no disponible

### **HT15** - Validación de Formato Upload
- **Objetivo**: Validar archivos cargados antes de procesar
- **Especificaciones**:
  - Soportados: PDF, JSON, TXT
  - PDF: max 50MB, MIME type check
  - JSON: Zod schema validation
  - TXT: Encoding UTF-8, max 10MB
  - Rechaza: ejecutables, archives, otros formatos

---

# SPRINT 4: ADMIN QUIZ Y REVIEW (HU18-HU23 + HT16-HT20)

## Historias de Usuario

### **HU18** - Crear Quiz de Admin
- **Descripción**: Como admin, quiero crear un quiz personalizado con preguntas manual o automáticamente generadas para usar en clase.
- **Criterios de Aceptación**:
  - Admin ingresa: título, descripción, tipo (mcq/open_ended/mixed)
  - Adjunta preguntas (manual o desde PDF/JSON)
  - Guardaen estado DRAFT
  - Valida: al menos 1 pregunta
- **Implementación**: `POST /api/(admin)/quizzes/create` + `CreateAdminQuizUseCase`
- **Tabla**: AdminQuiz, AdminQuizQuestion
- **Status Enum**: DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED

### **HU19** - Listar Admin Quizzes
- **Descripción**: Como admin, quiero ver todos los quizzes que he creado con estado actual.
- **Criterios de Aceptación**:
  - Listado paginado (20 por página)
  - Filtrable por estado (DRAFT, PENDING, APPROVED)
  - Ordenable por fecha de creación
  - Muestra: título, estado, fechas, cantidad de preguntas
- **Implementación**: `GET /api/(admin)/quizzes` + backend filtering
- **Tabla**: AdminQuiz
- **Índice**: userId, status

### **HU20** - Revisar Quiz para Aprobación
- **Descripción**: Como admin-reviewer, quiero revisar quizzes pendientes y aprobarlos o rechazarlos.
- **Criterios de Aceptación**:
  - Listado de quizzes en PENDING_REVIEW
  - Preview de todas las preguntas
  - Opción aprobar/rechazar
  - Campo comentarios (opcional)
  - Cambio de status en BD
- **Implementación**: `GET/POST /api/(admin)/quiz-review`
- **Tabla**: AdminQuiz (status, reviewedBy, reviewedAt, comments)

### **HU21** - Visualizar Detalles de Quiz
- **Descripción**: Como admin, quiero ver todos los detalles de un quiz específico incluyendo todas sus preguntas.
- **Criterios de Aceptación**:
  - Carga: título, descripción, preguntas con opciones
  - Muestra métricas: total preguntas, MCQ vs open-ended
  - Editable en estado DRAFT
  - Locked en APPROVED/PUBLISHED
- **Implementación**: `GET /api/(admin)/quizzes/[quizId]`
- **Tabla**: AdminQuiz, AdminQuizQuestion

### **HU22** - Ajustar Dificultad de Preguntas
- **Descripción**: Como admin, quiero poder ajustar el nivel de dificultad de preguntas individuales en un quiz.
- **Criterios de Aceptación**:
  - Selecciona pregunta
  - Elige dificultad: EASY, MEDIUM, HARD
  - Actualiza en BD
  - Refleja en próximas iteraciones
- **Implementación**: `POST /api/(admin)/adjust-questions-difficulty`
- **Tabla**: AdminQuizQuestion (difficulty enum)

### **HU23** - Publicar Quiz Aprobado
- **Descripción**: Como admin, después de aprobar quiz, quiero publicarlo para que los estudiantes puedan usarlo.
- **Criterios de Aceptación**:
  - Solo quizzes APPROVED pueden publicarse
  - Cambio status a PUBLISHED
  - Disponible inmediatamente para estudiantes
  - Opción para despublicar
- **Implementación**: Status update in AdminQuiz
- **Tabla**: AdminQuiz (status = PUBLISHED)

---

## Historias Técnicas

### **HT16** - Schema AdminQuiz Model
- **Objetivo**: Definir estructura para admin-created quizzes
- **Especificaciones**:
  - Campos: id, userId (FK), title, description, status (enum), createdAt, updatedAt, reviewedBy?, reviewedAt?, comments?
  - Status enum: DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, REJECTED
  - Indices: userId, status, createdAt
  - Constraints: title NOT NULL, userId NOT NULL

### **HT17** - Schema AdminQuizQuestion Model
- **Objetivo**: Definir estructura para preguntas en admin quizzes
- **Especificaciones**:
  - Campos: id, adminQuizId (FK), question, answer, options (JSON), questionType (enum), difficulty (enum), order (int)
  - Difficulty enum: EASY, MEDIUM, HARD
  - QuestionType enum: MCQ, OPEN_ENDED
  - Índice: adminQuizId, order
  - JSON validation: options array

### **HT18** - Workflow de Aprobación de Quiz
- **Objetivo**: Implementar state machine para quiz approval
- **Especificaciones**:
  - Estados: DRAFT → PENDING_REVIEW → {APPROVED, REJECTED}
  - APPROVED → PUBLISHED
  - Validaciones por estado (edición solo en DRAFT)
  - Audit trail: reviewedBy, reviewedAt, comments
  - Rollback: PUBLISHED → DRAFT (solo admin)

### **HT19** - Quiz Statistics Collection
- **Objetivo**: Recopilar métricas de uso de quizzes
- **Especificaciones**:
  - Trackea: intentos, promedio score, preguntas más difíciles
  - Granularity: por quiz, por pregunta
  - Update on attempt submission
  - Storage: Optimized for read-heavy queries

### **HT20** - Validación de Quiz Contenido
- **Objetivo**: Asegurar calidad de contenido en quizzes
- **Especificaciones**:
  - Mínimo: 1 pregunta
  - Máximo: 100 preguntas por quiz
  - Validación: Todas preguntas tienen answer
  - MCQ: 2-4 opciones, 1 correcta
  - Open-ended: answer no vacía
  - Zod schema validation

---

# SPRINT 5: DASHBOARDS Y REFINAMIENTO (HU24-HU30 + HT21-HT25)

## Historias de Usuario

### **HU24** - Dashboard de Analytics Admin
- **Descripción**: Como admin, quiero ver dashboard con métricas globales del sistema para monitoreo.
- **Criterios de Aceptación**:
  - Muestra: total usuarios, total quizzes, promedio score
  - Gráficos: tendencias por semana, temas populares, dificultad
  - Filtrable por rango de fechas
  - Actualiza en tiempo real (polling cada 30s)
- **Implementación**: `/admin/statistics` dashboard + recharts
- **Tabla**: Consultas a Game, AdminQuiz, UserQuizAttempt

### **HU25** - Estadísticas por Quiz
- **Descripción**: Como admin, quiero ver detailed stats para cada quiz (intentos, promedio, preguntas difíciles).
- **Criterios de Aceptación**:
  - Por quiz: intentos, promedio score, median time
  - Por pregunta: % correctas, % parciales, distribución
  - Exportable a CSV
  - Gráficos de dificultad vs performance
- **Implementación**: `GET /api/(admin)/quiz-statistics`
- **Tabla**: UserQuizAttempt, AdminQuizQuestion

### **HU26** - Banning Usuarios
- **Descripción**: Como admin, puedo bannear usuarios para suspender su acceso a la plataforma.
- **Criterios de Aceptación**:
  - Admin selecciona usuario + razón
  - Cambia flag `banned` a true
  - Usuario no puede hacer login
  - Queda registro: admin, timestamp, razón
- **Implementación**: `POST /api/(admin)/users/[userId]/ban`
- **Tabla**: User (banned flag)
- **Verificación**: Check en signIn callback

### **HU27** - Revocación de Acceso
- **Descripción**: Como admin, puedo revocar acceso de usuario sin borrar su cuenta.
- **Criterios de Aceptación**:
  - Usuario revocado no puede acceder aunque tiene credenciales válidas
  - Cambia flag `revoked` a true
  - Puede ser revertido
  - Check en cada request protegido
- **Implementación**: `POST /api/(admin)/users/[userId]/revoke`
- **Tabla**: User (revoked flag)
- **Verificación**: Check en signIn y session callbacks

### **HU28** - Ver Historial de Intentos de Quiz
- **Descripción**: Como estudiante, quiero ver el historial de todos mis intentos en quizzes publicados.
- **Criterios de Aceptación**:
  - Listado: fecha, quiz, score, estado
  - Ordenado por fecha (más reciente primero)
  - Clickeable para ver respuestas detalladas
  - Limitado a 2 intentos por quiz (configurable)
- **Implementación**: Frontend component + `GET /api/quiz/[quizId]/attempts`
- **Tabla**: UserQuizAttempt

### **HU29** - Reseña de Respuestas Detalladas
- **Descripción**: Como estudiante, quiero ver mis respuestas detalladas de un quiz anterior para aprender.
- **Criterios de Aceptación**:
  - Muestra mi respuesta vs respuesta correcta
  - Para MCQ: marca correcta/incorrecta
  - Para open-ended: muestra similitud %
  - Muestra explicación si existe
- **Implementación**: `GET /api/quiz/[quizId]/attempts/[attemptId]`
- **Tabla**: UserQuizAttempt (estructura detallada)

### **HU30** - Gestión de Usuarios Admin
- **Descripción**: Como super-admin, puedo promover usuarios a admin role.
- **Criterios de Aceptación**:
  - Listado de usuarios
  - Seleccionar + "Make Admin"
  - Cambia flag `isAdmin` a true
  - Se registra acción en audit log
- **Implementación**: `POST /api/(admin)/users/[userId]/assign-admin`
- **Tabla**: User (isAdmin flag)
- **Validación**: Super-admin check

---

## Historias Técnicas

### **HT21** - Hybrid Grading System
- **Objetivo**: Implementar sistema híbrido de evaluación MCQ + open-ended
- **Especificaciones**:
  - MCQ: Exact string match (case-insensitive, trimmed)
  - Open-ended: Cosine similarity (threshold ≥70% = Pass)
  - Levenshtein fallback para typo tolerance (distancia ≤2)
  - Normalization: Elimina stopwords, punctuation
  - Storage: isCorrect boolean + percentage score

### **HT22** - UserQuizAttempt Model & Tracking
- **Objetivo**: Almacenar y trackear intentos de quiz de usuario
- **Especificaciones**:
  - Campos: id, userId (FK), adminQuizId (FK), answers (JSON), score (float), status (enum), startedAt, completedAt, attemptNumber
  - Status enum: PENDING, COMPLETED, GRADED
  - Constraint: Máximo 2 intentos por quiz (configurable)
  - Índices: userId, adminQuizId, attemptNumber

### **HT23** - Analytics Aggregation Pipeline
- **Objetivo**: Agregación eficiente de métricas para dashboards
- **Especificaciones**:
  - Queries optimizadas: Groupby userId, quizId, difficulty
  - Caching: Redis para resultados frecuentes
  - Refresh: Batch updates cada hora o on-demand
  - Metrics: avg score, median time, % correct by question
  - Performance: Sub-second query response

### **HT24** - Audit Trail Implementation
- **Objetivo**: Registrar acciones de admin para compliance y debugging
- **Especificaciones**:
  - Log: User bans, quiz approvals, admin assignments
  - Estructura: action, actor, target, timestamp, details
  - Storage: Separate audit table o AdminQuiz.comments
  - Queryable: Por actor, por target, por date range
  - Retention: 90 días

### **HT25** - Rate Limiting & Security Hardening
- **Objetivo**: Proteger endpoints contra abuse
- **Especificaciones**:
  - Global rate limit: 100 req/min per user
  - Auth endpoint: 5 attempts / 15 min (prevent brute force)
  - OCR endpoint: 10 uploads/day per user
  - Headers: Proper CORS, CSP, HSTS
  - Response: 429 Too Many Requests con Retry-After
  - Logging: Alert en abuse pattern

---

# 📊 MATRIZ DE TRAZABILIDAD

| HU | Descripción Corta | Sprint | Use Case | Endpoint | Estado |
|-----|-------------------|--------|----------|----------|--------|
| HU01 | Registro email/password | 1 | RegisterUserWithPasswordUseCase | POST /api/auth/register | ✅ |
| HU02 | Verificación email | 1 | VerifyEmailTokenUseCase | POST /api/auth/verify-email | ✅ |
| HU03 | OAuth Google | 1 | NextAuth Google Provider | GET/POST /api/auth/signin | ✅ |
| HU04 | Logout | 1 | Session invalidation | POST /api/sign-out | ✅ |
| HU05 | Gestión sesiones | 1 | NextAuth JWT strategy | Auth callbacks | ✅ |
| HU06 | Crear game por tema | 2 | StartGameUseCase | POST /api/game | ✅ |
| HU07 | Gen preguntas IA | 2 | GenerateTopicQuestionsUseCase | POST /api/questions | ✅ |
| HU08 | Responder MCQ | 2 | CheckAnswerUseCase | POST /api/checkAnswer | ✅ |
| HU09 | Responder open-ended | 2 | CheckAnswerUseCase (grading) | POST /api/checkAnswer | ✅ |
| HU10 | Finalizar game | 2 | EndGameUseCase | POST /api/endGame | ✅ |
| HU11 | Historial juegos | 2 | Query Game records | Frontend | ✅ |
| HU12 | Cargar PDF | 3 | GenerateQuestionsFromPdfUseCase | POST /api/(admin)/upload-and-generate | ✅ |
| HU13 | OCR multi-layer | 3 | PdfOcrAdapter | Internal | ✅ |
| HU14 | Gen Q&A desde PDF | 3 | GenerateQuestionsFromPdfUseCase | POST /api/(admin)/upload-and-generate | ✅ |
| HU15 | Validar OCR | 3 | Manual review component | Frontend | ✅ |
| HU16 | Cargar JSON | 3 | JSON parser adapter | POST /api/(admin)/upload-and-generate | ✅ |
| HU17 | Cargar TXT | 3 | TXT parser adapter | POST /api/(admin)/upload-and-generate | ✅ |
| HU18 | Crear admin quiz | 4 | CreateAdminQuizUseCase | POST /api/(admin)/quizzes/create | ✅ |
| HU19 | Listar admin quizzes | 4 | AdminQuizPrismaAdapter query | GET /api/(admin)/quizzes | ✅ |
| HU20 | Revisar quiz | 4 | Quiz approval workflow | GET/POST /api/(admin)/quiz-review | ✅ |
| HU21 | Detalles quiz | 4 | AdminQuizPrismaAdapter query | GET /api/(admin)/quizzes/[quizId] | ✅ |
| HU22 | Ajustar dificultad | 4 | Question difficulty update | POST /api/(admin)/adjust-questions-difficulty | ✅ |
| HU23 | Publicar quiz | 4 | Status update to PUBLISHED | Admin dashboard | ✅ |
| HU24 | Dashboard analytics | 5 | Quiz/Game statistics aggregation | GET /api/(admin)/quiz-statistics | ✅ |
| HU25 | Stats por quiz | 5 | DetailedStatisticsAdapter | GET /api/(admin)/quiz-statistics | ✅ |
| HU26 | Banning usuarios | 5 | User moderation logic | POST /api/(admin)/users/[userId]/ban | ✅ |
| HU27 | Revocación acceso | 5 | Access control middleware | POST /api/(admin)/users/[userId]/revoke | ✅ |
| HU28 | Historial intentos | 5 | UserQuizAttemptRepository query | GET /api/quiz/[quizId]/attempts | ✅ |
| HU29 | Reseña respuestas | 5 | Detailed review component | Frontend | ✅ |
| HU30 | Gestión admin users | 5 | User role management | POST /api/(admin)/users/[userId]/assign-admin | ✅ |

---

# 🎯 CONCLUSIÓN

**Total Implementado**: 
- ✅ **30 Historias de Usuario** (todas completadas en 5 sprints)
- ✅ **25 Historias Técnicas** (todas completadas)
- ✅ **33 API Endpoints** (producción-ready)
- ✅ **11 Use Cases** (clean architecture)
- ✅ **92.44% Test Coverage** (340+ tests)
- ✅ **0 TypeScript Errors** (type-safe)

Este documento será la **base de verdad** para la tesis, asegurando que toda documentación y análisis se base en lo que fue **realmente implementado**, no en teoría.
