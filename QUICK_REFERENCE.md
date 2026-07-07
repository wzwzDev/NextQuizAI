# 🔍 GUÍA RÁPIDA - EXPLICACIONES TÉCNICAS CLAVE

## Para usar en la defensa cuando pregunten por detalles técnicos

---

## 1. ¿Cómo funciona la autenticación?

**Explicación simple:**
```
Usuario → Google OAuth → JWT Token → HTTP-only Cookie
                                     ↓
                          Cada request incluye token
                                     ↓
                          Verifico token en servidor
```

**Código clave:**
```typescript
// NextAuth crea JWT automáticamente
const session = await getServerSession(); // Obtiene sesión segura
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**Ventaja:** Stateless, seguro, escalable

---

## 2. ¿Cómo generas preguntas?

**Flujo visual:**
```
Usuario (tema + dificultad)
    ↓
Validar entrada (Zod)
    ↓
Crear prompt para OpenAI
    ↓
Llamar OpenAI GPT-4
    ↓
Parsear JSON de respuesta
    ↓
Validar estructura
    ↓
Guardar en BD (Prisma)
    ↓
Retornar al usuario
```

**Prompt ejemplo:**
```
"Eres profesor. Genera 5 preguntas sobre Python Programming.
Dificultad: Medium (2-5 palabras por respuesta).
Tipo: MCQ.
Formato JSON: {questions: [{question, answer, options}]}"
```

---

## 3. ¿Cómo evalúas respuestas abiertas?

**3 algoritmos combinados:**

| Algoritmo | Caso de uso | Ejemplo |
|-----------|-------------|---------|
| **Exact** | Respuestas cortas | "Paris" vs "paris" → 100% |
| **Levenshtein** | Tolera typos | "Barcelona" vs "Barcelonaa" → 95% |
| **Cosine** | Paráfrasis | "Es rojo" vs "Color rojo" → 85% |

**Fórmula final:**
```
Puntuación = (Exact × 0.3) + (Levenshtein × 0.4) + (Cosine × 0.3)
```

**Threshold:** ≥70% = Correcto

---

## 4. ¿Cómo funciona el control de acceso?

**4 estados de usuario:**

```
┌─────────────┐
│  Usuario    │
└─────┬───────┘
      │
      ├─→ banned=true → No puede loguear
      │
      ├─→ revoked=true → Puede loguear pero:
      │                  - NO quiz publicados
      │                  - SÍ quiz generados
      │
      ├─→ isAdmin=true → Panel admin
      │
      └─→ Normal → Acceso completo
```

**Validación en endpoint:**
```typescript
if (user.banned) throw Error("You are banned");
if (user.revoked && isAccessingPublishedQuiz) throw Error("Access revoked");
```

---

## 5. ¿Por qué Clean Architecture?

**Problema sin arquitectura:**
```
❌ Código monolítico
❌ Todo mezclado (UI, BD, lógica)
❌ Cambiar BD = reescribir todo
❌ Imposible testear
```

**Solución con Clean Architecture:**
```
✅ Capas separadas
✅ Responsabilidades claras
✅ Cambiar OpenAI por Claude = solo cambiar adaptador
✅ Fácil testear con mocks
```

**Las 4 capas:**
```
           PRESENTACIÓN (React Components)
                ↓
          APLICACIÓN (Use Cases)
                ↓
            DOMINIO (Lógica pura)
                ↓
       INFRAESTRUCTURA (BD, APIs)
```

---

## 6. ¿Por qué Prisma ORM?

**Alternativas consideradas:**
- Raw SQL: Error-prone, sql injection risk
- Query builder: Mucho boilerplate
- ORM pesado (TypeORM): Lento, complejo

**Prisma es ideal porque:**
- ✅ Type-safe queries
- ✅ Migraciones automáticas
- ✅ Generación automática de tipos
- ✅ Sintaxis limpia
- ✅ Excelente performance

**Ejemplo:**
```typescript
// Type-safe, no strings mágicos
const user = await prisma.user.findUnique({
  where: { email: "test@example.com" },
  include: { games: true },
});
// TypeScript conoce propiedades de user ✅
```

---

## 7. ¿Por qué Next.js?

**Alternativas consideradas:**
- React solo: Tendría que setup backend, server, etc
- Express: Más control pero más código
- Django: Menos JavaScript fullstack
- Rails: No JavaScript

**Next.js es ideal porque:**
- ✅ Fullstack en una herramienta
- ✅ Routing automático
- ✅ API Routes built-in
- ✅ SSR cuando necesario
- ✅ Deploy fácil en Vercel

**Arquitectura:**
```
src/app/
├── page.tsx          → / (ruta)
├── dashboard/
│   └── page.tsx      → /dashboard
└── api/
    └── quiz/
        └── route.ts  → POST /api/quiz
```

---

## 8. ¿Por qué Vercel?

**Alternativas consideradas:**
- AWS EC2: Overkill, caro, debo administrar
- DigitalOcean: Mejor que EC2 pero aún management
- Heroku: Más simple pero deprecated
- Railway: Bueno pero menos maduro

**Vercel es ideal porque:**
- ✅ Diseñado específicamente para Next.js
- ✅ Auto-scaling sin configuración
- ✅ Deploy desde GitHub automático
- ✅ Environment variables seguras
- ✅ CDN global
- ✅ Free tier generoso

---

## 9. Testing Strategy

**Pirámide de testing:**
```
        🔺 E2E (Playwright)
           ~10 tests
           
      📊 Integración
         ~30 tests
         
   ✅ Unitarios (Jest)
      ~900 tests
```

**Por qué esta distribución:**
- Unitarios son rápidos, fácil escribir
- Integración verifican flujos
- E2E verifican usuario real

**Ejemplo unitario:**
```typescript
test("gradeOpenEnded: exact match", () => {
  expect(gradeOpenEnded("Paris", "Paris")).toBe(100);
});
```

**Ejemplo integración:**
```typescript
test("POST /api/checkAnswer: evalúa y guarda", async () => {
  const response = await fetch("/api/checkAnswer", {
    method: "POST",
    body: JSON.stringify({ answer: "Paris" }),
  });
  expect(response.status).toBe(200);
  const saved = await prisma.question.findUnique(...);
  expect(saved.isCorrect).toBe(true);
});
```

---

## 10. Seguridad

**Amenazas que proteges:**

| Amenaza | Protección |
|---------|-----------|
| SQL Injection | Prisma ORM + parameterized queries |
| XSS | React escapa automáticamente |
| CSRF | NextAuth CSRF tokens |
| Brute force | Rate limiting, exponential backoff |
| Data exposure | HTTPS, environment variables |
| Unauthorized access | JWT validation, role checking |

---

## 11. Escalabilidad

**¿Qué pasa si tienes 100,000 usuarios?**

```
Nivel 1: Vercel
- Auto-escalado de funciones
- CDN global

Nivel 2: Database
- TiDB auto-escala
- Read replicas para queries

Nivel 3: Cache
- React Query en frontend
- Redis en backend (futuro)

Nivel 4: Optimize
- Índices en BD
- Pagination
- Lazy loading
```

---

## 12. Error Handling

**Estrategia:**
```
              Error ocurre
                    ↓
           Try-catch en endpoint
                    ↓
          ├─ Validation error → 400
          ├─ Auth error → 401
          ├─ Permission error → 403
          ├─ Not found → 404
          └─ Server error → 500
                    ↓
              Log al servidor
                    ↓
          Retornar JSON amigable
```

---

## 13. Performance

**Optimizaciones implementadas:**

1. **Lazy loading**: Solo cargar datos que se ven
   ```typescript
   include: { games: { take: 10 } } // Solo últimos 10
   ```

2. **Índices en BD**: Queries rápidas
   ```prisma
   @@index([userId])
   ```

3. **React Query**: Cache automático
   ```typescript
   useQuery({ queryKey: ['quizzes'], queryFn: fetch })
   ```

4. **Compression**: Gzip automático en Vercel

5. **Code splitting**: Next.js automático

---

## 14. Deployment Process

**Cuando hago push a GitHub:**

```
1. GitHub Actions se activa
    ↓
2. Checkout código
    ↓
3. npm ci (install)
    ↓
4. npm run build
    ↓
5. npm test (Jest)
    ↓
6. npx prisma migrate deploy
    ↓
7. SonarCloud scan
    ↓
8. Si todo OK → Vercel deploy
    ↓
9. Live en producción
```

---

## 15. Cost Analysis

**Gastos mensuales:**

| Servicio | Costo | Volumen |
|----------|-------|---------|
| Vercel | $0 (free tier) | Hasta 100GB |
| TiDB Cloud | $100 | 10GB + compute |
| OpenAI API | Variable | ~$0.03/quiz |
| Dominio | $10 | 1 dominio |
| Email (Resend) | ~$10 | 1000 emails |
| **TOTAL** | **~$120** | Viable |

**Break-even:** 50+ usuarios pagando $9.99/mes

---

## RESPUESTAS CORTAS (Para cuando pregunten rápido)

**P: ¿Cuál es tu tech stack?**
R: Next.js 14, TypeScript, Prisma, MySQL, NextAuth.js, Jest, Playwright

**P: ¿Cómo generas preguntas?**
R: Validar entrada → Crear prompt → OpenAI GPT-4 → Parsear JSON → Guardar

**P: ¿Cómo evalúas abiertas?**
R: 3 algoritmos (Exact, Levenshtein, Cosine) combinados con pesos

**P: ¿Cómo proteges datos?**
R: JWT + HTTP-only cookies + Zod validation + role-based access control

**P: ¿Cómo testas?**
R: Jest (908 tests) + Playwright E2E + 88.94% coverage

**P: ¿Cómo escalas?**
R: Serverless en Vercel + TiDB auto-scaling + React Query caching

**P: ¿Por qué Clean Architecture?**
R: Independencia de frameworks, fácil testear, cambios aislados

**P: ¿Cómo verificas calidad?**
R: SonarCloud + GitHub Actions + linting + type checking

**P: ¿Cuál es tu diferenciador?**
R: Evaluación automática de open-ended + integración OCR + Clean Architecture

**P: ¿Futuro del proyecto?**
R: Multi-idioma, mobile app, evaluación semántica, integración LMS

---

**Imprime o guarda para rápida consulta durante defensa** 📋
