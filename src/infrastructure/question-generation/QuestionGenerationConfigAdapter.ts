import type { QuestionGenerationConfigPort } from "@/application/ports/out/QuestionGenerationConfigPort";
import { randomBytes } from "node:crypto";

const DEFAULT_QUESTION_MODELS = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1"];
const DEFAULT_TEMPERATURE = 0.85;

export class QuestionGenerationConfigAdapter implements QuestionGenerationConfigPort {
  getAvailableModels(): string[] {
    const fromList = (process.env.OPENAI_QUESTION_MODELS ?? "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean);

    const fromSingle = [
      process.env.OPENAI_QUESTION_MODEL?.trim(),
      process.env.OPENAI_MODEL?.trim(),
    ].filter((model): model is string => Boolean(model));

    const merged = [...fromList, ...fromSingle];
    if (merged.length === 0) {
      return DEFAULT_QUESTION_MODELS;
    }

    return Array.from(new Set(merged));
  }

  getTemperature(): number {
    const raw = process.env.OPENAI_QUESTION_TEMPERATURE;
    const parsed = raw ? Number(raw) : Number.NaN;

    if (!Number.isFinite(parsed)) {
      return DEFAULT_TEMPERATURE;
    }

    return Math.min(1.2, Math.max(0, parsed));
  }

  createBatchToken(): string {
    return `${Date.now().toString(36)}-${randomBytes(4).toString("hex").slice(0, 6)}`;
  }
}
