import OpenAI from "openai";

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

/**
 * Refactored strict_output function now accepts an optional OpenAI client instance.
 * If not provided, it creates its own with env var.
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
  openaiClient?: OpenAI, // <-- injected client
): Promise<{ question: string; answer: string }[]> {
  // Use provided client or create new one
  const openai =
    openaiClient ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const isListInput = Array.isArray(user_prompt);
  const hasDynamicElements = /<.*?>/.test(JSON.stringify(output_format));
  const isListOutput = /\[.*?\]/.test(JSON.stringify(output_format));
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
          content: isListInput
            ? JSON.stringify(user_prompt)
            : String(user_prompt),
        },
      ],
    });

    let content = response.choices[0].message?.content ?? "";

    if (verbose) {
      console.log(
        "=== System prompt ===\n",
        system_prompt + formatPrompt + errorMsg,
      );
      console.log("=== User prompt ===\n", user_prompt);
      console.log("=== GPT raw output ===\n", content);
    }

    try {
      const outputRaw = JSON.parse(content);
      const outputArray = Array.isArray(outputRaw) ? outputRaw : [outputRaw];

      for (let item of outputArray) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) continue; // skip dynamic keys

          if (!(key in item)) throw new Error(`Missing key: ${key}`);

          if (Array.isArray(output_format[key])) {
            const allowed = output_format[key] as string[];
            if (Array.isArray(item[key])) {
              item[key] = item[key][0]; // pick first if array
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
