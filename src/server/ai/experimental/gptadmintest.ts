import OpenAI from "openai";

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

function hasDelimitedPlaceholder(value: string, openChar: string, closeChar: string): boolean {
  const openIndex = value.indexOf(openChar);
  if (openIndex === -1) {
    return false;
  }

  const closeIndex = value.indexOf(closeChar, openIndex + 1);
  return closeIndex !== -1;
}

let cachedClient: OpenAI | null = null;
let cachedApiKey: string | null = null;

/**
 * Gets or creates a cached OpenAI client instance.
 * SAFE: Client is cached to prevent repeated instantiation with API keys.
 * @returns OpenAI client instance
 * @throws Error if OPENAI_API_KEY is not set
 */
function getOrCreateClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("The OPENAI_API_KEY environment variable is missing or empty.");
  }

  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new OpenAI({ apiKey });
  cachedApiKey = apiKey;
  return cachedClient;
}

/**
 * Refactored strict_output function now accepts an optional OpenAI client instance.
 * If not provided, uses cached client or creates new one with env var.
 */
export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gpt-3.5-turbo",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false,
  openaiClient?: OpenAI,
): Promise<{ question: string; answer: string }[]> {
  const openai = openaiClient ?? getOrCreateClient();

  const isListInput = Array.isArray(user_prompt);
  const formatJson = JSON.stringify(output_format);
  const hasDynamicElements = hasDelimitedPlaceholder(formatJson, "<", ">");
  const isListOutput = hasDelimitedPlaceholder(formatJson, "[", "]");
  let errorMsg = "";

  for (let i = 0; i < num_tries; i++) {
    let formatPrompt = `\nPlease output exactly in JSON matching this: ${JSON.stringify(output_format)}.`;

    if (isListOutput) {
      formatPrompt += `\nIf output field is a list, pick the best matching element.`;
    }

    if (hasDynamicElements) {
      formatPrompt += `\nText in < and > means you must generate a replacement.`;
    }

    if (isListInput) {
      formatPrompt += `\nIf user input is a list, respond with a JSON array — one per input.`;
    }

    const response = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        {
          role: "system",
          content: system_prompt + formatPrompt + errorMsg,
        },
        {
          role: "user",
          content: isListInput ? JSON.stringify(user_prompt) : String(user_prompt),
        },
      ],
    });

    const content = response.choices[0].message?.content ?? "";

    if (verbose) {
      console.log("=== System prompt ===\n", system_prompt + formatPrompt + errorMsg);
      console.log("=== User prompt ===\n", user_prompt);
      console.log("=== GPT raw output ===\n", content);
    }

    try {
      const outputRaw = JSON.parse(content);
      const outputArray = Array.isArray(outputRaw) ? outputRaw : [outputRaw];

      for (let item of outputArray) {
        for (const key in output_format) {
          if (hasDelimitedPlaceholder(key, "<", ">")) continue;

          if (!(key in item)) throw new Error(`Missing key: ${key}`);

          if (Array.isArray(output_format[key])) {
            const allowed = output_format[key] as string[];
            if (Array.isArray(item[key])) {
              item[key] = item[key][0];
            }
            if (!allowed.includes(item[key]) && default_category) {
              item[key] = default_category;
            }
          }
        }

        if (output_value_only) {
          const values = Object.values(item);
          item = values.length === 1 ? values[0] : values;
        }
      }

      return outputArray;
    } catch (e) {
      errorMsg = `\n\nGPT output was: ${content}\n\nJSON parse error: ${e}`;
      if (verbose) {
        console.error("JSON parse failed:", e);
      }
    }
  }

  return [];
}
