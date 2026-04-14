type QuizType = "mcq" | "open_ended";

export type QuizCitation = {
  source: string;
  snippet: string;
  confidence?: number;
};

export type ParsedQuestionMetadata = {
  options: string[];
  citation?: QuizCitation;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function splitOptionChunks(option: string): string[] {
  if (!option) {
    return [];
  }

  return option
    .split(/\r?\n|[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptions(rawOptions: unknown): string[] {
  if (Array.isArray(rawOptions)) {
    return Array.from(
      new Set(
        rawOptions
          .filter((item): item is string => typeof item === "string")
          .flatMap(splitOptionChunks),
      ),
    );
  }

  if (typeof rawOptions === "string") {
    const trimmed = rawOptions.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizeOptions(parsed);
      }
    } catch {
      // Fall back to plain text splitting.
    }

    return Array.from(new Set(splitOptionChunks(trimmed)));
  }

  if (isRecord(rawOptions)) {
    if (Array.isArray(rawOptions.choices)) {
      return normalizeOptions(rawOptions.choices);
    }

    if (Array.isArray(rawOptions.options)) {
      return normalizeOptions(rawOptions.options);
    }

    const numericKeyValues = Object.entries(rawOptions)
      .filter(([key, value]) => /^\d+$/.test(key) && typeof value === "string")
      .map(([, value]) => value as string);

    if (numericKeyValues.length > 0) {
      return normalizeOptions(numericKeyValues);
    }
  }

  return [];
}

function normalizeCitation(rawCitation: unknown): QuizCitation | undefined {
  if (!isRecord(rawCitation)) {
    return undefined;
  }

  const source =
    typeof rawCitation.source === "string" ? rawCitation.source.trim() : "";
  const snippet =
    typeof rawCitation.snippet === "string" ? rawCitation.snippet.trim() : "";

  if (!source || !snippet) {
    return undefined;
  }

  const confidence =
    typeof rawCitation.confidence === "number" &&
    Number.isFinite(rawCitation.confidence)
      ? Math.max(0, Math.min(1, rawCitation.confidence))
      : undefined;

  return {
    source,
    snippet,
    ...(confidence !== undefined ? { confidence } : {}),
  };
}

export function parseQuestionMetadata(rawOptions: unknown): ParsedQuestionMetadata {
  if (isRecord(rawOptions)) {
    return {
      options: normalizeOptions(rawOptions),
      citation: normalizeCitation(rawOptions.citation),
    };
  }

  return {
    options: normalizeOptions(rawOptions),
  };
}

export function buildStoredQuestionMetadata(params: {
  quizType: QuizType;
  options?: string[];
  citation?: QuizCitation;
}) {
  const normalizedOptions = normalizeOptions(params.options ?? []);

  if (params.quizType === "mcq") {
    if (params.citation) {
      return {
        choices: normalizedOptions,
        citation: params.citation,
      };
    }

    return normalizedOptions;
  }

  if (params.citation) {
    return {
      citation: params.citation,
    };
  }

  return undefined;
}
