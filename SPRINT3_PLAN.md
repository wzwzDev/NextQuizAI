# SPRINT 3: Biblioteca de Cuestionarios Publicados

## PLAN - 8 Historias Técnicas

| # | HT | Descripción | Componentes Clave | Estado |
|---|----|-----------|--------------------|--------|
| 1 | **HT01** | **Modelo de Datos** - Entidades AdminQuiz, AdminQuizQuestion, UserQuizAttempt con relaciones cascade | Prisma schema, migraciones | ✅ LEÍDO |
| 2 | **HT02** | **Creación de Cuestionarios** - Servicio de validación y normalización de preguntas antes de persistencia | CreateAdminQuizUseCase, adminQuizService.createApprovedAdminQuiz | ✅ LEÍDO |
| 3 | **HT03** | **Biblioteca de Cuestionarios** - Recuperación de quizzes publicados con filtros, paginación y estadísticas de intentos del usuario | getPublishedQuizzesWithAttempts, GET /api/published-quizzes | ✅ LEÍDO |
| 4 | **HT04** | **Recuperación de Quiz Específico** - Cargar quiz completo con todas las preguntas para inicio de intento | getApprovedQuiz, GET /api/quiz/[quizId] | ✅ LEÍDO |
| 5 | **HT05** | **Inicio de Intento** - Crear o reutilizar pending attempt, validar límite de intentos permitidos | ensurePendingQuizAttempt, POST /api/quiz/[quizId]/start | ✅ LEÍDO |
| 6 | **HT06** | **Envío y Calificación** - Recibir respuestas, calificar en paralelo según tipo (MCQ binary, open-ended similarity), persistir resultado | submitAndGradeAdminQuizAttempt, AdminQuizGradingAdapter, POST /api/start-quiz | ✅ LEÍDO |
| 7 | **HT07** | **Historial de Intentos** - Recuperar lista de intentos previos del usuario para quiz específico, estados y scores | userQuizAttemptService, GET /api/quiz/[quizId]/attempts | ✅ LEÍDO |
| 8 | **HT08** | **Estadísticas Globales** - Agregación de intentos: total, completados, pending, promedio score, últimas fechas | getQuizStatisticsSummary, GET /api/(admin)/quiz-statistics | ✅ LEÍDO |

---

## ENDPOINTS IDENTIFICADOS

### User Endpoints (6)
| Método | Ruta | Descripción | Verificado |
|--------|------|-------------|-----------|
| GET | `/api/published-quizzes` | Lista quizzes con filtros + stats usuario | ✅ |
| GET | `/api/quiz/[quizId]` | Obtener quiz por ID | ✅ |
| POST | `/api/quiz/[quizId]/start` | Crear/obtener pending attempt | ✅ |
| GET | `/api/quiz/[quizId]/attempts` | Historial de intentos usuario | ✅ |
| GET | `/api/start-quiz?id=X` | Get quiz + questions previo a submit | ✅ |
| POST | `/api/start-quiz` | Submit + grade quiz attempt | ✅ |

### Admin Endpoints (9)
| Método | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| POST | `/api/(admin)/quizzes` | Crear quiz | ✅ Implementado |
| GET | `/api/(admin)/quizzes` | Listar quizzes con paginación | ✅ Implementado |
| GET | `/api/(admin)/quizzes/[quizId]` | Obtener quiz específico | ✅ Implementado |
| PUT | `/api/(admin)/quizzes/[quizId]` | Actualizar quiz | ❌ NOT IMPLEMENTED (501) |
| DELETE | `/api/(admin)/quizzes/[quizId]` | Eliminar quiz | ✅ Implementado |
| POST | `/api/(admin)/upload-and-generate` | Upload file + AI generation | ✅ Implementado |
| POST | `/api/(admin)/quiz-review` | Review + approve quiz | ✅ Implementado |
| POST | `/api/(admin)/ai-review` | AI analysis de quiz | ✅ Leído |
| GET | `/api/(admin)/quiz-statistics` | Estadísticas globales | ✅ Implementado |

---

## SERVICIOS & USE CASES

| Componente | Ubicación | Responsabilidad | HT |
|-----------|-----------|-----------------|-----|
| CreateAdminQuizUseCase | `src/application/use-cases/admin/` | Validar + normalizar preguntas | HT02 |
| GetAdminQuizzesUseCase | `src/application/use-cases/admin/` | Recuperar quizzes + stats | HT03 |
| SubmitAndGradeAdminQuizUseCase | `src/application/use-cases/admin/` | Calificar intento completo | HT06 |
| adminQuizService | `src/server/admin/services/` | Orchestration admin quiz ops | HT02, HT03, HT04 |
| userQuizAttemptService | `src/server/services/` | Lifecycle de intentos usuario | HT05, HT07 |
| AdminQuizGradingAdapter | `src/infrastructure/admin/` | Grading logic (MCQ + open-ended) | HT06 |
| AdminQuizAttemptLifecycleAdapter | `src/infrastructure/admin/` | Ports para pending/complete | HT06 |

---

## ADAPTADORES & PORTS

| Adapter | Puerto | Responsabilidad |
|---------|--------|-----------------|
| AdminQuizGradingAdapter | AdminQuizGradingPort | Graduar MCQ (binary) + open-ended (similarity) |
| AdminQuizAttemptLifecycleAdapter | AdminQuizAttemptLifecyclePort | Crear/completar pending attempts |
| AdminQuizQuestionMetadataAdapter | AdminQuizQuestionMetadataPort | Parsear + limpiar metadata AI de preguntas |

---

## DIAGRAMAS PREVIOS (A GENERAR)

- [ ] ER Diagram: AdminQuiz, AdminQuizQuestion, UserQuizAttempt, relaciones
- [ ] Sequence: Start Quiz → Get pending attempt → Get quiz + questions → Submit → Grade → Complete
- [ ] State Machine: Quiz attempt states (pending → completed)
- [ ] Grading Cascade: MCQ exact match vs Open-ended 5-level similarity
- [ ] Attempt Validation Flow: Check limits → Get/create pending → Validate state

---

## COMPONENTES UI ADMIN (A DOCUMENTAR)

- **AdminDashboardClient** - Container principal admin
- **QuizList** - Display quizzes con acciones (edit/delete)
- **QuizUpload** - File upload modal
- **QuizReview** - Quiz review interface antes de publish
- **QuizStatistics** - Dashboard de stats globales
- **OpenAIGenerator** - AI generation configuration
- **UserManagement** - Admin user controls

---

## PRÓXIMOS PASOS

1. ✅ Codebase reading completo
2. ⏳ Generar 8 Narrativas HT con código verificado
3. ⏳ Crear diagramas (ER, Sequence, State, Grading)
4. ⏳ Especificar endpoints con tablas request/response
5. ⏳ Decisiones arquitectónicas
6. ⏳ Retrospectiva sprint
7. ⏳ Impacto en sprints posteriores
8. ⏳ Conclusiones

