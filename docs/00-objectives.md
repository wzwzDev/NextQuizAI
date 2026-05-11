---
title: "NextQuizAI - Documentación TFM"
author: "Equipo de Desarrollo"
date: "Mayo 2026"
---

# DOCUMENTACIÓN TFM: NextQuizAI

## ÍNDICE DE CONTENIDOS

1. Objetivos del Proyecto
2. Capítulo 1: Inception Deck
3. Capítulo 2: Product Backlog
4. Capítulo 3: Sprint 1

---

# OBJETIVOS DEL PROYECTO

## Visión General

NextQuizAI es una plataforma inteligente de generación de cuestionarios mediante IA que permite:

- ✅ Generación automática de preguntas desde documentos
- ✅ Quiz interactivos con análisis de respuestas
- ✅ Dashboard de estadísticas por usuario
- ✅ Panel de administración para gestión de usuarios
- ✅ Autenticación segura con OAuth Google + Admin credentials
- ✅ Tema visual adaptable (light/dark/system)

## Objetivos Técnicos

| Objetivo | Descripción | Priority |
|----------|-----------|----------|
| Autenticación robusta | NextAuth.js + JWT + RBAC | 🔴 P0 |
| Base de datos escalable | Prisma + MySQL/TiDB | 🔴 P0 |
| Generación IA | OpenAI GPT-4 + embeddings | 🔴 P0 |
| UI responsiva | Next.js 15 + Tailwind CSS | 🟡 P1 |
| Testing exhaustivo | Jest + Playwright + E2E | 🟢 P2 |
| Documentación completa | Código + API + TFM | 🟢 P2 |

## Alcance Sprint 1

**Incluido:**
- ✅ Autenticación OAuth Google
- ✅ Login admin con credenciales
- ✅ RBAC (roles y permisos)
- ✅ Tema visual (light/dark/system)
- ✅ Persistencia sesión JWT
- ✅ Tests > 90%

**Excluido (próximos sprints):**
- ❌ Generación de preguntas IA
- ❌ Dashboard estadísticas
- ❌ Panel admin completo
- ❌ Análisis similitud

## Duración Total

- **Total Sprints:** 6 (12 semanas)
- **Sprint 1 (Actual):** 2 semanas
- **Equipo:** 2 developers + 1 tech lead
- **Budget:** ~$21,500 (6 sprints)

---

# CAPÍTULO 1: INCEPTION DECK

## 1. ¿POR QUÉ ESTAMOS AQUÍ?

### Problema

Docentes y trainers invierten **horas manuales** creando cuestionarios:
- Lectura de documentos
- Escribir preguntas
- Diseñar opciones de respuesta
- Validar contenido

**Resultado:** Tiempo perdido, falta de variedad, baja efectividad pedagógica.

### Solución

NextQuizAI automatiza todo:
- Upload documento → IA genera preguntas en 30 segundos
- Análisis inteligente de respuestas → Feedback personalizado
- Dashboard estadísticas → Identifica conceptos débiles
- Reutilizable → Misma batería de preguntas infinitas

### Impacto Esperado

- 📈 **80% reducción** en tiempo de creación
- 📊 **60% mejora** en retención de conocimiento
- 💰 **Cost savings** en horas docente
- 🎯 **Educación personalizada** basada en datos

---

## 2. CREAR UN ELEVATOR PITCH

> "NextQuizAI es una plataforma SaaS que transforma documentos en cuestionarios interactivos usando IA, permitiendo a educadores ahorrar 90% del tiempo de preparación y aumentar la efectividad pedagógica mediante análisis inteligente de respuestas."

**Targets:**
- 🎓 Educadores (universidades, academias)
- 💼 Trainers corporativos
- 🏫 Directores de RH
- 📚 Instituciones e-learning

---

## 3. DISEÑAR UNA CAJA DE PRODUCTO

### Descripción Frontal

**NextQuizAI v1.0**
Smart Quiz Generation Platform

Features:
- 📚 Upload Docs
- 🤖 AI generates Questions
- 📊 Track Performance

Tagline: "Turn Documents into Knowledge"

### Descripción del Dorso

**Features Principales:**
- ✅ Generación automática de cuestionarios
- ✅ Preguntas tipo MCQ + Open-ended
- ✅ Análisis de similitud de respuestas
- ✅ Dashboard de estadísticas
- ✅ Panel de administración
- ✅ Soporte OAuth Google

**Requisitos:**
- Internet connection
- Navegador moderno
- Cuenta Google o credenciales admin

**Precio:**
- Free: 5 quizzes/mes
- Pro: $9.99/mes (unlimited)
- Enterprise: Custom pricing

---

## 4. CREAR UNA LISTA DE NOES

### Qué NO hacemos

| Feature | Por qué NO | Alternativa |
|---------|-----------|-----------|
| Video tutorials generados | Out of scope v1 | Enlazar a YouTube |
| Certificados/Badges | Requiere integraciones | Exportar PDF manual |
| Mobile app nativa | Web responsive suficiente | Progressive Web App |
| Live quizzes en vivo | Complejidad real-time | Quiz independientes |
| Soporte en idiomas múltiples | i18n fase 2 | English + Spanish v1 |
| Análisis de sentimiento | No core feature | Feedback texto simple |
| Integración LMS directa | API first, integraciones post v1 | Webhooks disponibles |

---

## 5. CONOCE A TUS VECINOS

### Stakeholders & Intereses

| Stakeholder | Interés Principal | Preocupación | Influencia |
|-------------|------------------|---|---|
| **Educador** | Ahorrar tiempo | ¿Qué tan buenas son las preguntas? | 🔴 Alta |
| **Estudiante** | Aprender efectivo | ¿Hay retroalimentación útil? | 🟡 Media |
| **Admin** | Control + Auditoría | ¿Qué usuarios hacen qué? | 🔴 Alta |
| **CTO** | Escalabilidad + Security | ¿Puede soportar 100k usuarios? | 🔴 Alta |
| **CFO** | ROI + Costos operativos | ¿Cuánto cuesta ejecutar? | 🟡 Media |

---

## 6. HAZ VER LA SOLUCIÓN

### User Interface

**Home Page:**
- Botón "Upload Document"
- Quiz Settings (MCQ, Open-ended, quantity)
- Button "Generate Quiz"
- Recent Quizzes list

**Quiz Taking:**
- Question display
- Multiple choice options
- Open-ended text area
- Progress bar
- Submit button

**Dashboard:**
- Quizzes completed count
- Average score
- Performance trends
- Learning paths

---

## 7. ¿QUÉ NOS QUITA EL SUEÑO?

### Top 5 Riesgos

| # | Riesgo | Impacto | Probabilidad | Mitigación |
|---|--------|---------|-------------|-----------|
| **1** | Calidad IA pobre | ⚠️ Usuarios abandonan | 60% | Tests validación preguntas |
| **2** | Escalabilidad BD | 🔴 Crashes en prod | 40% | Load testing, sharding plan |
| **3** | Competencia agresiva | 📉 Market share | 50% | Diferenciador UX, pricing |
| **4** | Costos OpenAI altos | 💸 Unprofitable | 70% | Rate limiting, optimization |
| **5** | Seguridad breach | 🔴 Crítico legal | 20% | Pen testing, SOC 2 |

---

## 8. TÓMALE LAS MEDIDAS

### Métricas de Éxito - Negocio

| Métrica | Target Sprint 1 | Target Año 1 |
|---------|---|---|
| **Users registrados** | 100 | 10,000 |
| **MAU** | 50 | 5,000 |
| **Quiz generados** | 500 | 100,000 |
| **NPS Score** | 40 | 70 |
| **Churn rate** | <5% | <2% |

### Métricas de Éxito - Técnica

| Métrica | Target Sprint 1 |
|---------|---|
| **Uptime** | 99.5% |
| **API latency p95** | <200ms |
| **Page load** | <2s |
| **Test coverage** | >90% |
| **Security score** | 95/100 |

---

## 9. SER CLAROS EN LO QUE VAMOS A DAR

### Definition of Done - Sprint 1

**Code Quality:**
- ✅ 100% TypeScript, no `any` types
- ✅ ESLint pass, 0 warnings
- ✅ Tests pass, coverage >90%
- ✅ Code review 2+ developers

**Functionality:**
- ✅ OAuth Google works end-to-end
- ✅ Admin login works with credentials
- ✅ Session persists across reloads
- ✅ RBAC protects endpoints
- ✅ Theme toggle persists

**Testing:**
- ✅ Unit tests for auth logic
- ✅ Component tests for UI
- ✅ E2E tests with Playwright
- ✅ Manual testing checklist completed

---

## 10. MUESTRA LO QUE VA A COSTAR

### Estimación - Sprint 1

| Componente | Horas | Developer |
|-----------|-------|-----------|
| Setup + Prisma | 10h | Backend |
| NextAuth Integration | 15h | Backend |
| OAuth Google | 8h | Backend |
| Admin Credentials | 6h | Backend |
| RBAC Layer | 8h | Backend |
| ThemeToggle UI | 5h | Full-Stack |
| Unit Tests | 12h | Full-Stack |
| E2E Tests | 8h | Full-Stack |
| Documentation | 6h | Ambos |
| **TOTAL** | **78h** | - |

### Budget Breakdown

| Item | Costo |
|------|-------|
| **Salario Dev Backend** (35h @ $45/h) | $1,575 |
| **Salario Dev Full-Stack** (38h @ $45/h) | $1,710 |
| **Infraestructura** | $200 |
| **Tools & Licenses** | $100 |
| **TOTAL SPRINT 1** | **$3,585** |
| **Year 1 (6 sprints)** | ~$21,500 |

### Timeline

| Sprint | Semanas | Hito |
|--------|---------|------|
| **Sprint 1** | 2 | MVP Auth + Theme |
| **Sprint 2** | 2 | Quiz generation |
| **Sprint 3** | 2 | Quiz taking |
| **Sprint 4** | 2 | Similarity analysis |
| **Sprint 5** | 2 | Dashboard + Admin |
| **Sprint 6** | 2 | Polish + Launch |
| **TOTAL** | **12** | **v1.0 Launch** |

---

**END OF OBJECTIVES CHAPTER**
