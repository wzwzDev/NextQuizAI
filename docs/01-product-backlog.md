---
title: "NextQuizAI - Product Backlog"
author: "Equipo de Desarrollo"
date: "Mayo 2026"
---

# CAPÍTULO 2: PRODUCT BACKLOG

## Backlog Completo (6 Sprints)

### Legend

- 🔴 P0 (Critical) - Blocker
- 🟡 P1 (High) - Important
- 🟢 P2 (Medium) - Nice to have
- 🔵 P3 (Low) - Future

---

## SPRINT 1: Autenticación e Infraestructura Base

### User Stories

| ID | Historia | Prioridad | Puntos | Status |
|---|----------|-----------|--------|--------|
| HU01 | Como usuario, quiero login con Google OAuth | 🔴 P0 | 8 | ✅ Planned |
| HU02 | Como admin, quiero login con credenciales | 🔴 P0 | 5 | ✅ Planned |
| HU03 | Como usuario, quiero cambiar tema visual | 🟡 P1 | 3 | ✅ Planned |
| HU04 | Como usuario, quiero ver mi sesión actual | 🟡 P1 | 3 | ✅ Planned |
| HU05 | Como admin, quiero bloquear usuarios baneados | 🔴 P0 | 5 | ✅ Planned |
| HU06 | Como admin, quiero ver logs de acceso | 🟢 P2 | 5 | ✅ Planned |
| HU07 | Como usuario, quiero persistencia de sesión | 🔴 P0 | 3 | ✅ Planned |

**Total Sprint 1: 39 puntos**

---

## SPRINT 2: Generación de Preguntas (IA)

### Features

- HU08: Upload documento PDF/DOCX
- HU09: Generar preguntas con IA
- HU10: Validar preguntas generadas
- HU11: Guardar quiz en BD

**Estimated: 40 puntos**

---

## SPRINT 3: Quiz Taking

### Features

- HU12: Render quiz interactivo
- HU13: Enviar respuestas
- HU14: Calcular score
- HU15: Mostrar resultados

**Estimated: 35 puntos**

---

## SPRINT 4: Análisis de Respuestas

### Features

- HU16: Análisis similitud respuestas abiertas
- HU17: Feedback automático
- HU18: Guardar intentos
- HU19: Revisión de respuestas abiertas

**Estimated: 38 puntos**

---

## SPRINT 5: Dashboard & Admin Panel

### Features

- HU20: Dashboard estadísticas usuario
- HU21: Gráficos de performance
- HU22: Panel admin - User management
- HU23: Reportes exportables

**Estimated: 42 puntos**

---

## SPRINT 6: Polish & Deployment

### Features

- HU24: Optimización performance
- HU25: Testing exhaustivo
- HU26: Deployment a producción
- HU27: Monitoreo y alertas

**Estimated: 30 puntos**

---

## Backlog Total

| Sprint | Puntos | Duración |
|--------|--------|----------|
| Sprint 1 | 39 | 2 sem |
| Sprint 2 | 40 | 2 sem |
| Sprint 3 | 35 | 2 sem |
| Sprint 4 | 38 | 2 sem |
| Sprint 5 | 42 | 2 sem |
| Sprint 6 | 30 | 2 sem |
| **TOTAL** | **224** | **12 sem** |

---

## Features Principales (Roadmap)

### Wave 1: MVP (Sprints 1-3)

- ✅ Autenticación robusta
- ✅ Generación IA
- ✅ Quiz taking básico

### Wave 2: Engagement (Sprints 4-5)

- 📊 Análisis inteligente
- 📈 Dashboard estadísticas
- 🎯 Recommendations

### Wave 3: Scale (Sprint 6+)

- 🚀 Optimización performance
- 🌍 Multi-lenguaje
- 🔗 Integraciones LMS

---

## Non-Functional Requirements

| Requisito | Target |
|-----------|--------|
| Performance | <2s page load |
| Uptime | 99.5% |
| Latencia API | <200ms p95 |
| Coverage | >90% |
| Security | OWASP A1-A10 |
| Scalability | 100k+ users |

---

**END OF PRODUCT BACKLOG**
