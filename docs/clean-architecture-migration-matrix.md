# Clean Architecture Migration Matrix

This matrix maps concrete current modules to the target layered structure.

## Current -> Target

- `src/server/services/answerEvaluationService.ts`
  - Domain: `src/domain/services/OpenEndedGrader.ts`
  - Application: `src/application/use-cases/quiz/GradeOpenEndedAnswerUseCase.ts`
  - Infrastructure: `src/infrastructure/similarity/StringSimilarityAdapter.ts`
  - Notes: grading logic has been centralized in domain/application and reused.

- `src/server/admin/services/adminQuizAttemptService.ts`
  - Domain: `src/domain/services/OpenEndedGrader.ts`
  - Application: `src/application/use-cases/quiz/GradeOpenEndedAnswerUseCase.ts`
  - Notes: duplicated typo-tolerant logic removed in favor of use case.

- `src/server/repositories/*.ts`
  - Target: `src/infrastructure/persistence/prisma/repositories/*.ts`
  - Port contracts now available under `src/application/ports/out/*RepositoryPort.ts`.

- `src/server/core/auth.ts`
  - Target infra: `src/infrastructure/identity/nextauth/NextAuthSessionAdapter.ts`
  - Target app: use cases consume `src/application/ports/out/AuthSessionPort.ts`.

- `src/server/mailer/email.ts`
  - Target infra: `src/infrastructure/mail/smtp/NodemailerEmailSender.ts`
  - Target app port: `src/application/ports/out/EmailSenderPort.ts`.

- `src/server/ai/gpt.ts` and `src/server/ai/gptadmin.ts`
  - Target infra: `src/infrastructure/ai/openai/OpenAiGateway.ts`
  - Target app port: `src/application/ports/out/LlmGatewayPort.ts`.

## New Ports Introduced

- `AuthSessionPort`
- `EmailSenderPort`
- `LlmGatewayPort`
- `PasswordHasherPort`
- `QuestionRepositoryPort`
- `QuizAttemptRepositoryPort`
- `QuizRepositoryPort`
- `StringSimilarityPort`
- `TopicRepositoryPort`
- `UserRepositoryPort`

## Safe Refactor Order (Build-Stable)

1. Keep existing service/repository exports stable while introducing ports and use cases.
2. Move pure business rules into domain services first.
3. Introduce application use cases that depend only on ports.
4. Implement infrastructure adapters one-by-one and switch internal service wiring.
5. Replace direct Prisma usage in pages/components with application query use cases.
6. Move NextAuth and external providers under infrastructure adapters.
7. Remove shim imports in `src/lib/*` after all call sites are migrated.
