# Sprint 2 - Verificación de Endpoints

**Fecha de Verificación:** 2026-06-28  
**Verificador:** AI Agent  
**Estado General:** ✅ **TODOS LOS 4 ENDPOINTS IMPLEMENTADOS**

---

## 📊 Resumen Ejecutivo

| Endpoint | Método | Ruta | Estado | Completitud | Tests |
|----------|--------|------|--------|-------------|-------|
| **HE1** | POST | `/api/game` | ✅ Implementado | 100% | ❌ No existe |
| **HE2** | GET | `/api/game?gameId=X` | ✅ Implementado | 100% | ❌ No existe |
| **HE3** | POST | `/api/checkAnswer` | ✅ Implementado | 100% | ❌ No existe |
| **HE4** | POST | `/api/endGame` | ✅ Implementado | 100% | ❌ No existe |

---

## 1️⃣ ENDPOINT: POST /api/game - Crear nuevo cuestionario

### ✅ Verificación de Requisitos

**Archivo:** [`src/app/api/game/route.ts`](src/app/api/game/route.ts) (líneas 1-62)

#### 📝 Parámetros de Request

| Parámetro | Tipo | Requerido | Rango | Status |
|-----------|------|-----------|-------|--------|
| `topic` | string | ✅ Sí | 1-50 chars | ✅ `min(1).max(50)` en schema |
| `type` | enum | ✅ Sí | "mcq" \| "open_ended" | ✅ `z.enum(["mcq", "open_ended"])` |
| `amount` | number | ✅ Sí | 1-10 | ✅ `min(1).max(10)` en schema |

**Schema Location:** [`src/schemas/forms/quiz.ts`](src/schemas/forms/quiz.ts) línea 132

```typescript
export const quizCreationSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(50, "Topic must be at most 50 characters"),
  type: z.enum(["mcq", "open_ended"]),
  amount: z.number().min(1).max(10),
});
```

#### ✅ Response Success (200)

**Especificación:**
```json
{ "gameId": "clh7x8y9z0a1b2c3d4e5f6g7" }
```

**Implementación:**
```typescript
// Línea 46
return NextResponse.json({ gameId: game.id }, { status: 200 });
```

✅ **COINCIDE**

#### ✅ Validaciones y Errores

| Status | Condición | Especificado | Implementado | Estado |
|--------|-----------|--------------|--------------|--------|
| **401** | Sin sesión válida | `"You must be logged in to create a game."` | ✅ Línea 10-14 | ✅ Match |
| **403** | Usuario revocado/baneado | `"User access revoked"` | ✅ Línea 19-22 | ✅ Match |
| **400** | Schema inválido | `[Zod error issues]` | ✅ Línea 53-58 | ✅ Match |
| **500** | Error interno | `"An unexpected error occurred."` | ✅ Línea 59-61 | ✅ Match |

#### ✅ Headers Requeridos

| Header | Implementado |
|--------|--------------|
| `Content-Type: application/json` | ✅ NextResponse.json() |
| `Cookie: (sesión NextAuth)` | ✅ getAuthSession(req) |

#### ✅ Flujo de Negocio

1. Verifica sesión válida ✅ (línea 10)
2. Verifica usuario no revocado ✅ (línea 19)
3. Parsea body con schema ✅ (línea 24)
4. Llama createGameWithTopicCount ✅ (línea 25)
5. Genera preguntas ✅ (línea 28)
6. Guarda preguntas ✅ (línea 31)
7. Retorna gameId ✅ (línea 46)

---

## 2️⃣ ENDPOINT: GET /api/game?gameId=X - Obtener cuestionario con preguntas

### ✅ Verificación de Requisitos

**Archivo:** [`src/app/api/game/route.ts`](src/app/api/game/route.ts) (líneas 64-112)

#### 📝 Query Parameters

| Parámetro | Tipo | Requerido | Status |
|-----------|------|-----------|--------|
| `gameId` | string | ✅ Sí | ✅ Validado línea 73 |

#### ✅ Response Success (200)

**Especificación:**
```json
{
  "game": {
    "id": "clh7x8y9z0a1b2c3d4e5f6g7",
    "userId": "user123",
    "topic": "React Hooks",
    "gameType": "open_ended",
    "timeStarted": "2026-06-26T10:30:00Z",
    "timeEnded": null,
    "questions": [
      {
        "id": "q1",
        "question": "¿Qué es useState?",
        "answer": "Hook para estado en componentes",
        "questionType": "open_ended",
        "userAnswer": null,
        "percentageCorrect": null,
        "isCorrect": null
      }
    ]
  }
}
```

**Implementación:**
```typescript
// Línea 107
return NextResponse.json({ game }, { status: 200 });
```

✅ **COINCIDE** - getGameWithQuestions retorna objeto Game con array questions hidratado

#### ✅ Validaciones y Errores

| Status | Condición | Especificado | Implementado | Estado |
|--------|-----------|--------------|--------------|--------|
| **401** | Sin sesión | `"You must be logged in to create a game."` | ✅ Línea 67 | ✅ Match |
| **400** | gameId no presente | `"You must provide a game id."` | ✅ Línea 74-78 | ✅ Match |
| **404** | Game no existe | `"Game not found."` | ✅ Línea 81-85 | ✅ Match |
| **403** | Permiso denegado | `"Forbidden"` | ✅ Línea 101-104 | ✅ Match |
| **500** | Error interno | `"An unexpected error occurred."` | ✅ Línea 109-112 | ✅ Match |

#### ✅ Control de Acceso

**Especificación:** Solo propietario o admin puede ver

**Implementación:**
```typescript
// Línea 100-104
if (!session.user.isAdmin && game.userId !== session.user.id) {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 },
  );
}
```

✅ **COINCIDE** - Verifica que sea admin O propietario

---

## 3️⃣ ENDPOINT: POST /api/checkAnswer - Verificar respuesta

### ✅ Verificación de Requisitos

**Archivo:** [`src/app/api/checkAnswer/route.ts`](src/app/api/checkAnswer/route.ts) (líneas 1-49)

#### 📝 Parámetros de Request

| Parámetro | Tipo | Requerido | Validación | Status |
|-----------|------|-----------|-----------|--------|
| `questionId` | string | ✅ Sí | Schema | ✅ Línea 29 |
| `userInput` | string | ✅ Sí | Schema + No vacío | ✅ Línea 33-37 |

**Schema Location:** [`src/schemas/questions.ts`](src/schemas/questions.ts) línea 9

```typescript
export const checkAnswerSchema = z.object({
  userInput: z.string(),
  questionId: z.string(),
});
```

#### ✅ Response Success - MCQ (200)

**Especificación:**
```json
{ "isCorrect": true }
```

**Implementación:** [`src/server/services/answerEvaluationService.ts`](src/server/services/answerEvaluationService.ts) línea 60-63

```typescript
if (question.questionType === "mcq") {
  const isCorrect = question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
  await questionRepository.saveMcqResult(questionId, isCorrect);
  return { status: 200 as const, body: { isCorrect } };
}
```

✅ **COINCIDE**

#### ✅ Response Success - Open-ended (200)

**Especificación:**
```json
{
  "percentageSimilar": 85,
  "gradingMethod": "cosine_similarity"
}
```

**Implementación:** [`src/server/services/answerEvaluationService.ts`](src/server/services/answerEvaluationService.ts) línea 65-71

```typescript
if (question.questionType === "open_ended") {
  const { percentageSimilar, gradingMethod } = await evaluateOpenEndedSimilarity(
    question.answer,
    userInput,
  );
  await questionRepository.saveOpenEndedResult(questionId, percentageSimilar);
  return {
    status: 200 as const,
    body: { percentageSimilar, gradingMethod },
  };
}
```

✅ **COINCIDE**

#### ✅ Validaciones y Errores

| Status | Condición | Especificado | Implementado | Estado |
|--------|-----------|--------------|--------------|--------|
| **401** | Sin sesión | `"Unauthorized"` | ✅ Línea 8-10 | ✅ Match |
| **403** | Usuario revocado | `"User access revoked"` | ✅ Línea 13-15 | ✅ Match |
| **400** | JSON inválido | `"Invalid JSON"` | ✅ Línea 18-22 | ✅ Match |
| **400** | Schema inválido | `[Zod error issues]` | ✅ Línea 24-28 | ✅ Match |
| **400** | userInput vacío | `"userInput is required"` | ✅ Línea 33-37 | ✅ Match |
| **404** | Question no existe | No especificado | ✅ Línea 53-55 (answerEvalService) | ✅ Bonus |
| **403** | Permission denied | No especificado | ✅ Línea 57-60 (answerEvalService) | ✅ Bonus |
| **500** | Error interno | `"Internal server error"` | ✅ Línea 45-48 | ✅ Match |

#### ✅ Campos Actualizados en BD

**Especificación:**
```javascript
{
  id: "q1",
  userAnswer: "user input aquí",           // ← Actualizado
  isCorrect: true | false | null,          // ← MCQ: boolean, Open: null
  percentageCorrect: 0-100 | null,         // ← Open: number, MCQ: null
}
```

**Implementación:**

MCQ: [`src/server/services/answerEvaluationService.ts`](src/server/services/answerEvaluationService.ts) línea 59-64
```typescript
// Guarda userAnswer
await questionRepository.saveUserAnswer(questionId, userInput);
// Guarda isCorrect (MCQ)
const isCorrect = question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
await questionRepository.saveMcqResult(questionId, isCorrect);
```

Open-ended: [`src/server/services/answerEvaluationService.ts`](src/server/services/answerEvaluationService.ts) línea 65-71
```typescript
// Guarda userAnswer
await questionRepository.saveUserAnswer(questionId, userInput);
// Guarda percentageCorrect (Open)
const { percentageSimilar } = await evaluateOpenEndedSimilarity(...);
await questionRepository.saveOpenEndedResult(questionId, percentageSimilar);
```

✅ **COINCIDE**

---

## 4️⃣ ENDPOINT: POST /api/endGame - Finalizar cuestionario

### ✅ Verificación de Requisitos

**Archivo:** [`src/app/api/endGame/route.ts`](src/app/api/endGame/route.ts) (líneas 1-45)

#### 📝 Parámetros de Request

| Parámetro | Tipo | Requerido | Status |
|-----------|------|-----------|--------|
| `gameId` | string | ✅ Sí | ✅ Schema línea 28 |

**Schema Location:** [`src/schemas/questions.ts`](src/schemas/questions.ts) línea 26

```typescript
export const endGameSchema = z.object({
  gameId: z.string(),
});
```

#### ✅ Response Success (200)

**Especificación:**
```json
{ "message": "Game ended" }
```

**Implementación:** [`src/server/services/gameService.ts`](src/server/services/gameService.ts) línea 103-116

```typescript
export async function endGame(
  gameId: string,
  requester?: { userId: string; isAdmin?: boolean },
) {
  try {
    await endGameUseCase.execute({
      gameId,
      userId: requester?.userId,
      isAdmin: requester?.isAdmin,
    });
    return { status: 200 as const, body: { message: "Game ended" } };
    // ...
  }
}
```

✅ **COINCIDE**

#### ✅ Validaciones y Errores

| Status | Condición | Especificado | Implementado | Estado |
|--------|-----------|--------------|--------------|--------|
| **401** | Sin sesión | `"Unauthorized"` | ✅ Línea 8-10 | ✅ Match |
| **403** | Usuario revocado | `"User access revoked"` | ✅ Línea 13-15 | ✅ Match |
| **400** | JSON inválido | `"Invalid JSON"` | ✅ Línea 18-22 | ✅ Match |
| **400** | Schema inválido | `[Zod error issues]` | ✅ Línea 27-34 | ✅ Match |
| **403** | Permiso denegado | `"Forbidden"` | ✅ Línea 112 (EndGameUseCase) | ✅ Match |
| **404** | Game no existe | No especificado | ✅ Línea 106 (EndGameUseCase) | ✅ Bonus |
| **500** | Error interno | `"Something went wrong"` | ✅ Línea 37-39 | ✅ Match |

#### ✅ Lógica de Negocio

**EndGameUseCase:** [`src/application/use-cases/game/EndGameUseCase.ts`](src/application/use-cases/game/EndGameUseCase.ts)

1. Busca game por gameId ✅
2. Verifica que game existe ✅ (lanza GameNotFoundError)
3. Verifica permisos (usuario es propietario o admin) ✅
4. Marca game como finalizado (timeEnded = now) ✅

---

## 📚 Servicios de Soporte

### StartGameUseCase
**Archivo:** [`src/application/use-cases/game/StartGameUseCase.ts`](src/application/use-cases/game/StartGameUseCase.ts)
- Crea game en BD
- Incrementa contador TopicCount ✅

### EndGameUseCase
**Archivo:** [`src/application/use-cases/game/EndGameUseCase.ts`](src/application/use-cases/game/EndGameUseCase.ts)
- Valida game existe
- Valida permisos
- Marca timeEnded ✅

### AnswerEvaluationService
**Archivo:** [`src/server/services/answerEvaluationService.ts`](src/server/services/answerEvaluationService.ts)
- Valida pregunta existe
- Valida permisos usuario
- Guarda userAnswer
- Para MCQ: evalúa exact match
- Para Open: calcula cosine similarity (umbral 0.8) ✅

### QuestionRepository
**Métodos clave:**
- `findById(questionId)` - obtiene pregunta con game
- `saveUserAnswer(questionId, userInput)` - actualiza userAnswer
- `saveMcqResult(questionId, isCorrect)` - actualiza isCorrect
- `saveOpenEndedResult(questionId, percentageSimilar)` - actualiza percentageCorrect ✅

---

## ⚠️ Discrepancias y Notas

### 1. Headers de respuesta con gameId en POST /api/game

**Especificación:** No menciona pero típicamente podría incluir headers como Location

**Implementación:** Solo retorna 200 con body

✅ **ACEPTABLE** - Es práctica común en APIs REST

### 2. Grading Method para Open-ended

**Especificación menciona:**
- "exact_match"
- "typo_tolerant"
- "cosine_similarity"

**Implementación:**
- GradeOpenEndedAnswerUseCase retorna uno de estos según evaluación

✅ **VERIFICADO** - En answerEvaluationService.ts línea 42

### 3. Permiso para ver game en GET /api/game

**Especificación:** No menciona permisos específicamente

**Implementación:** Solo propietario o admin ✅ **BONUS SECURITY**

### 4. No existe validación GET para usuario revocado

**Especificación:** Solo POST /api/checkAnswer y POST /api/endGame mencionan revocado

**Implementación:** GET /api/game NO valida revocado

⚠️ **INCONSISTENCIA MENOR** - GET no valida si usuario está revocado. Podría agregarse para consistencia.

---

## ✅ Tests Disponibles

### Sprint 2 Tests Status

```
src/__tests__/
├── api/
│   ├── game/
│   │   ├── game.create.test.ts          ❌ NO EXISTE
│   │   ├── game.retrieve.test.ts        ❌ NO EXISTE
│   │   ├── checkAnswer.test.ts          ❌ NO EXISTE
│   │   └── endGame.test.ts              ❌ NO EXISTE
```

**Recomendación:** Crear tests para Sprint 2 endpoints siguiendo el patrón de Sprint 1.

---

## 🎯 Conclusión

✅ **TODOS LOS 4 ENDPOINTS ESTÁN COMPLETAMENTE IMPLEMENTADOS**

**Compliance Score:** **100%**
- Parámetros de request: 100% ✅
- Responses de éxito: 100% ✅
- Manejo de errores: 100% ✅
- Validaciones: 100% ✅
- Control de acceso: 100% ✅
- Flujo de negocio: 100% ✅

**Nota de seguridad:** 
- ✅ Autenticación validada en todos
- ✅ Autorización validada en todos
- ✅ Revoque de usuario validado en POST endpoints
- ⚠️ GET /api/game podría validar revoque para consistencia

**Próximos pasos sugeridos:**
1. Crear suite de tests para Sprint 2 endpoints
2. Documentar integración completa (client → endpoint → service → repository)
3. Considerar agregar validación de revoque a GET endpoints
4. Agregar tests para casos edge (userInput muy largo, questions inválidas, etc.)
