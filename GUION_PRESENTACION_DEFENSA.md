# GUION DE PRESENTACION - NextQuizAI
## Defensa de Tesis - 2026

---

## 1. INTRODUCCION Y FLUJO GENERAL (30 segundos)

**Lo que dices:**

> "NextQuizAI es una plataforma de evaluación adaptativa basada en inteligencia artificial que permite a usuarios crear cuestionarios dinámicos sobre cualquier tema, mientras que administradores pueden subir quizzes preconstruidos y gestionar el sistema. La aplicación implementa Clean Architecture en backend y React en frontend para garantizar mantenibilidad, escalabilidad y separación de responsabilidades.
>
> Voy a mostrar tres flujos principales: primero, cómo un estudiante crea y resuelve un quiz dinámico generado por IA; segundo, cómo un administrador carga un quiz desde un PDF; y tercero, cómo el sistema evalúa respuestas con tolerancia a errores de tipeo."

---

## 2. FLUJO DE ESTUDIANTE - AUTENTICACION
### Paso 1: Página de login

**Antes de hacer click:**
> "Comenzamos en la página de login. El sistema usa NextAuth para autenticación segura. Aquí un usuario registrado puede iniciar sesión."

**Haz click en:**
- Campo email → ingresa: `tutormiw@gmail.com`
- Campo password → ingresa: `admin`
- Botón "Sign In"

**Lo que dices mientras se carga:**
> "El servidor valida las credenciales contra la base de datos. Si el usuario está revocado o baneado, será rechazado en este punto. Esto es parte de nuestro control de acceso a nivel de seguridad."

**Cuando entra al Home:**
> "Genial. Hemos ingresado al Dashboard. Aquí vemos varios componentes: la tarjeta 'Quiz me' para crear cuestionarios dinámicos, el historial de intentos, los temas más populares, y estadísticas de actividad reciente."

---

## 3. FLUJO DE CREAR QUIZ DINAMICO
### Paso 2: Click en "Quiz me"

**Lo que dices:**
> "Vamos a crear un quiz dinámico. El usuario hace click en 'Quiz me' y accede al formulario de creación de cuestionarios."

**Cuando se abre el formulario de Quiz Creation:**
> "Aquí tenemos tres parámetros:
> 1. **Tema**: El usuario elige cualquier tema (programación, historia, ciencia, etc.)
> 2. **Cantidad de preguntas**: Entre 1 y 10 preguntas
> 3. **Tipo de quiz**: MCQ (opción múltiple) u Open Ended (respuesta libre)
>
> El sistema incluye validación inteligente: si detecta que el tema parece 'basura' (caracteres inválidos, gibberish), ofrece temas sugeridos o permite continuar de todas formas."

**Ingresa datos de prueba:**
- Tema: `Python`
- Cantidad: `3`
- Tipo: `Open Ended` (presiona el botón derecho)

**Haz click en "Submit"**

**Lo que dices mientras el loader aparece:**
> "Cuando hace submit, el cliente envía los datos al servidor. En backend:
> 1. Se valida la sesión del usuario
> 2. Se verifica que el usuario no esté revocado
> 3. Se crea un registro de 'Game' (sesión de juego) con timestamp de inicio
> 4. Se contacta al modelo de IA (GPT) para generar preguntas
> 5. Se guardan las preguntas en la base de datos asociadas al Game
>
> Todo esto sucede en segundos. El frontend muestra un indicador de carga amigable."

**Cuando redirige a /play/open-ended/[gameId]:**

---

## 4. FLUJO DE JUEGO - OPEN ENDED
### Paso 3: Interfaz de juego

**Lo que dices:**
> "Perfecto. El quiz está listo. Aquí vemos la interfaz de juego para preguntas Open Ended. En la esquina superior izquierda está el tema (Python), el cronómetro de tiempo transcurrido, y a la derecha el porcentaje de respuestas promediadas.
>
> Abajo está la pregunta actual (1 de 3). Dependiendo del tipo de pregunta:
> - Si es de código con output: campo de textarea para que escriba el resultado
> - Si es de fill-in-the-blank: componente especial de detección de código
> - Si es de pregunta general: input normal de texto"

**Lee la primera pregunta en voz alta:**
- Si es código: explica qué hace
- Si es general: explica el contexto

**Ingresa una respuesta:**
> "Ahora escribo una respuesta. Esta será evaluada por nuestro motor de corrección que maneja tres capas:
> 1. Coincidencia exacta
> 2. Similitud por palabra (stopwords filtradas)
> 3. Similaridad de strings con umbral de tolerancia al 80%
>
> Esto permite que respuestas con pequeños typos sean aceptadas sin ser demasiado permisivo."

**Haz click en "Next"**

**Lo que dices mientras se procesa:**
> "Se envía la respuesta al endpoint `/api/checkAnswer`. El servidor:
> 1. Valida la sesión
> 2. Busca la pregunta por ID
> 3. Ejecuta el grader de open-ended
> 4. Calcula el porcentaje de similaridad
> 5. Guarda el resultado (evidencia)
> 6. Devuelve feedback al cliente
>
> El usuario ve un toast mostrando si fue correcto o incorrecto, y el porcentaje promedio se actualiza."

**Repite para la 2da y 3ra pregunta:**
- Ingresa respuestas (correctas, parciales, o incorrectas para variar)
- Explica lo que pasa en cada una

**Cuando se completan las 3 preguntas:**
> "Al terminar el último 'Next', el sistema cierra el juego y redirige a estadísticas."

---

## 5. ESTADISTICAS Y RESULTADOS
### Paso 4: Página de resultados

**Lo que dices:**
> "Aquí vemos la página de estadísticas del juego. Muestra:
> - El score final (porcentaje promedio de respuestas correctas)
> - Tiempo total de juego
> - Un desglose de cada pregunta con respuesta esperada, respuesta del usuario, porcentaje de match, y método de grading usado
>
> Esta información se persiste en la base de datos como un registro de 'Game' completado. El usuario puede volver a intentar si así lo desea, o volver al home."

**Click en "Ver más estadísticas" (si existe botón a dashboard):**
> "El sistema también mantiene un historial global donde el usuario puede ver todos sus intentos, promedios por tema, tendencias, etc."

---

## 6. FLUJO DE ADMINISTRADOR - UPLOAD DE QUIZ
### Paso 5: Ir al Admin Panel

**Navega a /admin (o /dashboard/admin):**
> "Ahora vamos al lado administrativo. Aquí solo usuarios con rol 'admin' o 'owner' pueden acceder. El sistema implementa control de acceso a nivel de página y en cada endpoint de API."

**En Admin, click en "Upload Quiz":**

**Lo que dices:**
> "Esta sección permite a administradores cargar quizzes desde archivos PDF. El flujo es:
> 1. Selecciona un PDF (que puede ser material de clase, examen, etc.)
> 2. El sistema usa OCR (Google Vision) para extraer texto
> 3. Usa IA (GPT) para parsear preguntas y respuestas
> 4. Extrae fuentes/citas para trazabilidad
> 5. El admin revisa y aprueba antes de publicar"

**Selecciona un PDF de ejemplo (o muestra el upload input):**
> "Una vez cargado, el PDF se procesa. El backend:
> - Lee el contenido del PDF
> - Lo envía a Google Vision para OCR si es necesario
> - Contacta a GPT para estructurar las preguntas
> - Devuelve un borrador que el admin puede editar
> - Guarda con estado 'draft' hasta aprobación"

---

## 7. FLUJO DE ADMINISTRADOR - APROBACION DE QUIZ
### Paso 6: Quiz Review (Lista de Quizzes Cargados)

**Si está en la sección de review/lista de quizzes:**

**Lo que dices:**
> "Aquí vemos todos los quizzes cargados por administradores. Cada uno muestra:
> - Título (derivado del PDF)
> - Categoría y dificultad
> - Tipo (MCQ u Open Ended)
> - Número de preguntas
> - Fecha de creación/actualización
> - Resumen de intentos (total, completados, pendientes, score promedio)
>
> El admin puede hacer click para ver detalles, editar, aprobar, rechazar o eliminar."

**Click en un quiz:**

**Lo que dices:**
> "Al abrir detalles del quiz:
> - Se ve metadata completa (título, categoría, dificultad)
> - Resumen de intentos de estudiantes (si aplica)
> - Lista de preguntas con sus fuentes (de dónde se extrajeron del PDF)
> - Respuestas correctas esperadas
> - La información viene con confianza de la IA (confidence scores)
>
> Todo está trazable: sabemos exactamente dónde vino cada pregunta en el documento original."

**Si hay botón de "Approve":**
> "Cuando el admin aprueba, el quiz pasa a estado 'approved' y es visible en la biblioteca de estudiantes. Si rechaza, se guarda con estado 'rejected' junto con comentarios del por qué."

---

## 8. FLUJO DE BIBLIOTECA DE QUIZZES PUBLICADOS
### Paso 7: Volver a Home → Ver Quizzes Publicados

**Si presiona "Back to Home" o navega a /home:**

**Lo que dices:**
> "Aquí están todos los quizzes aprobados por administradores. Son diferentes a los quizzes dinámicos por IA:
> - Tienen contenido revisado y validado por humano
> - Pueden tener límite de intentos (ej: 2 intentos)
> - Pueden estar limitados a ciertos grupos de estudiantes
> - Tienen un sistema de seguimiento de intentos
>
> Un estudiante puede:
> - Hacer clic en 'Start Quiz' para comenzar
> - Si dejó un intento 'pending', puede 'Resume'
> - Si terminó pero le quedan intentos, puede 'Retry'
> - Si usó todos sus intentos, ve 'No Attempts Left'"

**Click en un quiz:**
> "Se abre la interfaz de quiz publicado. Es similar a QuizMe pero con preguntas predefinidas. Al terminar, recibe un score, y ese intento se registra en su historial."

---

## 9. GESTION DE USUARIOS (Admin)
### Paso 8: Ir a Admin → User Management

**Lo que dices:**
> "En la sección de gestión de usuarios, administradores pueden:
> - Ver lista de todos los usuarios del sistema
> - Ver estado (banned, revoked, active)
> - Ver última conexión
> - Ver role (admin, user, owner)
>
> El admin puede ejecutar acciones:
> - Ban: Bloquea el acceso al usuario
> - Revoke: Revoca permisos (más severo)
> - Assign Admin: Promover a administrador
> - Delete: Eliminar cuenta"

**Muestra la tabla (sin hacer cambios destructivos):**
> "Aquí vemos al usuario 'owner' (waelwzwz@gmail.com) y admin (tutormiw@gmail.com). El sistema distingue entre:
> - **Owner**: Control total del sistema
> - **Admin**: Puede gestionar quizzes, usuarios, ver estadísticas
> - **User**: Solo puede tomar quizzes
>
> Cada acción genera un log de auditoría para trazabilidad."

---

## 10. ARQUITECTURA INTERNA (EXPLICACION SIN MOSTRAR CODIGO)
### Paso 9: Vuelve a la app y explica la arquitectura

**Lo que dices:**
> "Ahora bien, detrás de escenas, la aplicación implementa Clean Architecture. Esto significa:
>
> **Capa de Presentación (Frontend):**
> - React components en `/src/components`
> - Pages dinámicas en `/src/app`
> - Manejo de estado con React Query
> - Validación de formas con Zod + React Hook Form
>
> **Capa de Aplicación (Use Cases):**
> - Lógica de negocio pura en `/src/application/use-cases`
> - Cada caso de uso es una clase que orquesta el flujo
> - Ej: StartGameUseCase, EndGameUseCase, GradeOpenEndedAnswerUseCase
>
> **Capa de Dominio (Entidades y Valores):**
> - Reglas de negocio en `/src/domain`
> - Entidades: Game, Question, User, AdminQuiz
> - Servicios de dominio: OpenEndedGrader, StringSimilarity
> - Value Objects: GameType, OpenEndedGradingMethod
>
> **Capa de Infraestructura (Adaptadores):**
> - Implementaciones concretas en `/src/infrastructure`
> - Adaptadores para Prisma, Google Vision, OpenAI
> - Conversión entre capas de dominio e interfaces externas
>
> **Capa de Persistencia (Repositorios):**
> - Acceso a datos en `/src/server/repositories`
> - Queries y mutations de Prisma
> - Aislamiento de cambios en BD
>
> **Beneficio clave:**
> Si mañana queremos cambiar la BD de MySQL a PostgreSQL, solo modificamos la capa de persistencia. Si queremos cambiar de OpenAI a Claude, solo cambiamos el adaptador. El resto del código no se toca."

---

## 11. EVALUACION ROBUSTA DE RESPUESTAS ABIERTAS
### (Narrativa técnica sin código)

**Lo que dices:**
> "Uno de los desafíos técnicos más importantes fue la evaluación automática de respuestas abiertas. El sistema usa un enfoque multicapa:
>
> **Nivel 1: Normalización**
> - Elimina espacios extras, saltos de línea innecesarios
> - Normaliza comillas y caracteres especiales
> - Para código: elimina prefijos como 'output:' o 'la respuesta es'
>
> **Nivel 2: Exact Match**
> - Si la respuesta coincide exactamente (sin considerar mayúsculas), es correcta
>
> **Nivel 3: Secuencia de Líneas**
> - Para preguntas de código con múltiples líneas, verifica que la secuencia correcta aparezca en la respuesta
> - Ej: Si la respuesta esperada es '9\\n16', acepta si aparece en '9,16' o en formato alternativo
>
> **Nivel 4: Word Matching**
> - Filtra stopwords (a, the, and, is, etc.)
> - Cuenta cuántas palabras significativas del usuario coinciden con las esperadas
> - Acepta si hay >80% de coincidencia
>
> **Nivel 5: String Similarity**
> - Usa algoritmo de similitud de strings (Cosine Similarity)
> - Compara valor esperado vs valor escrito
> - Si la similitud es ≥0.8, se acepta como 'typo_tolerant'
>
> **Umbral de Aceptación:**
> - 100%: Respuesta correcta
> - 80-99%: Aceptada (tolerancia a typos)
> - <80%: Rechazada
>
> Esta estrategia permite que respuestas con pequeños errores de tipeo sean aceptadas sin ser demasiado permisivo."

---

## 12. GENERACION DE PREGUNTAS CON IA
### (Narrativa sin código)

**Lo que dices:**
> "Para generar preguntas dinámicamente, el sistema usa GPT con un prompt muy específico que considera:
>
> **Mezcla de Tipos:**
> - Alternancia entre preguntas de código y preguntas generales
> - Si pide 4 preguntas: 2 de código + 2 generales
>
> **Diferenciación por Dificultad:**
> - Easy: Preguntas de recall directo, respuestas de 1-3 palabras
> - Medium: Conexión entre dos conceptos, respuestas de 2-5 palabras
> - Hard: Síntesis y razonamiento, respuestas de 3-6 palabras
>
> **Preguntas de Código:**
> - Dos modos:
>   1. Fill-Blank: [FILL_BLANK] 'What is the output?' con código y 'Output: _____'
>   2. Full-Output: 'Type the result of executing...' textarea abierta
>
> **Validación de Calidad:**
> - Se rechaza si el prompt pide 'escribir una función' sin ejecutarla (ambiguo)
> - Se rechaza si la pregunta no incluye input concreto
> - Se rechaza si es igual a pregunta anterior (deduplicación)
>
> **Fallback:**
> - Si IA no genera suficientes preguntas, hay un fallback predefinido con patrones genéricos
> - El fallback garantiza que el usuario siempre obtiene preguntas, incluso si IA falla
>
> En base de datos se guardan con timestamps, dificultad, tipo, y fuente del modelo que las generó."

---

## 13. SEGURIDAD Y CONTROL DE ACCESO
### (Narrativa sin código)

**Lo que dices:**
> "La seguridad es crucial. Implementamos múltiples capas:
>
> **Autenticación:**
> - NextAuth integrado con bases de datos
> - Sesiones seguras con HTTP-only cookies
> - Tokens JWT con expiración
>
> **Autorización:**
> - Cada página verifica sesión: si no hay usuario, redirige a login
> - Cada endpoint API chequea sesión Y verifica permisos
> - Si usuario está revocado, es bloqueado en login y redirigido a página de revocado
> - Si es baneado, es rechazado en múltiples puntos
>
> **Control de Acceso:**
> - Solo admin puede aprobar quizzes
> - Solo owner puede gestionar admins
> - Usuario solo puede ver/responder sus propios intentos
> - Admin puede ver todo (pero está auditado)
>
> **Cifrado:**
> - Contraseñas hasheadas con bcrypt
> - Credenciales en .env, nunca en código
> - API keys de terceros nunca enviadas al cliente
>
> **Validación:**
> - Zod schema en cliente Y servidor
> - Nunca confiar en datos del cliente
> - Toda entrada se valida antes de procesar"

---

## 14. TESTING Y CALIDAD
### (Narrativa sin código)

**Lo que dices:**
> "Para garantizar calidad, usamos:
>
> **Unit Tests:**
> - Testeamos use cases de forma aislada
> - Verificamos lógica de grading
> - Validamos parseo de preguntas
>
> **Integration Tests:**
> - Testamos flujos completos: crear game → generar preguntas → guardar
> - Testamos endpoints API con mocks de BD
>
> **Frontend Tests:**
> - Testamos componentes con React Testing Library
> - Verificamos que los estados se actualizan correctamente
> - Testamos validación de formularios
>
> **Cobertura:**
> - 129 tests que corren en CI/CD
> - Verifican que no rompamos funcionalidad existente
> - Coverage reports en SonarQube
>
> **Regresión:**
> - Test específico que rechaza preguntas ambiguas
> - Garantiza que 'write a function... Output: ____' sin input concreto no vuelva a pasar"

---

## 15. CIERRE Y PUNTOS FUERTES
### (Conclusión)

**Lo que dices:**
> "Para cerrar, NextQuizAI demuestra:
>
> **1. Arquitectura Limpia:**
> - Separación clara entre capas
> - Fácil de mantener, testear y escalar
> - Independencia de frameworks
>
> **2. Evaluación Inteligente:**
> - Múltiples estrategias de corrección
> - Tolerancia a typos sin ser demasiado permisivo
> - Trazabilidad de fuentes y respuestas
>
> **3. Automatización con IA:**
> - Generación de preguntas dinámicas
> - OCR de PDFs para material educativo
> - Prompt engineering robusto
>
> **4. Seguridad y Acceso:**
> - Autenticación y autorización en múltiples capas
> - Auditoría de acciones críticas
> - Manejo seguro de credenciales
>
> **5. UX Intuitiva:**
> - Interfaz clara y responsive
> - Feedback inmediato al usuario
> - Indicadores de progreso
>
> **6. Testing Riguroso:**
> - 129 tests que evitan regresiones
> - Validación tanto cliente como servidor
> - Cobertura de casos edge
>
> La aplicación está lista para usar en entornos educativos reales, desde pequeñas aulas hasta instituciones completas. Gracias."

---

## NOTAS PARA LA PRESENTACION

- **Tiempo Total Estimado:** 12-15 minutos (depende de cuánto profundices)
- **Pausa si hay preguntas:** Después de cada sección principal
- **No apures:** Habla claro y a ritmo lento
- **Mira a los jurados:** No solo la pantalla
- **Ten a mano:**
  - Usuario/password de prueba
  - Un PDF de ejemplo si vas a mostrar admin upload
  - Notas con los puntos clave
- **Si algo falla:**
  - Ten screenshots de backup
  - Explica qué debería suceder
  - Continúa sin perder ritmo
