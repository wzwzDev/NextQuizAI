import OpenAI from "openai";

let openaiClient: OpenAI | null = null;
let cachedApiKey: string | null = null;
let cachedBaseUrl: string | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "The OPENAI_API_KEY environment variable is missing or empty.",
    );
  }

  const baseURL = process.env.OPENAI_BASE_URL?.trim() || null;

  if (
    !openaiClient ||
    cachedApiKey !== apiKey ||
    cachedBaseUrl !== baseURL
  ) {
    openaiClient = new OpenAI(
      baseURL
        ? { apiKey, baseURL }
        : { apiKey },
    );
    cachedApiKey = apiKey;
    cachedBaseUrl = baseURL;
  }

  return openaiClient;
}

export function canUseEmbeddings() {
  return (
    Boolean(process.env.OPENAI_API_KEY) &&
    process.env.DISABLE_SEMANTIC_GRADING !== "true"
  );
}

export async function getEmbedding(text: string): Promise<number[]> {
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model,
    input: text,
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("No embedding returned by OpenAI");
  }

  return embedding;
}
