import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "The OPENAI_API_KEY environment variable is missing or empty.",
    );
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

function buildOutputFormatPrompt(
  output_format: OutputFormat,
  list_output: boolean,
  dynamic_elements: boolean,
  list_input: boolean,
) {
  let prompt = `\nYou are to output the following in json format: ${JSON.stringify(
    output_format,
  )}. \nRespond with valid JSON only.`;

  if (list_output) {
    prompt += `\nIf output field is a list, classify output into the best element of the list.`;
  }
  if (dynamic_elements) {
    prompt += `\nAny text enclosed by s< and > indicates you must generate content to replace it.
      Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it.
       Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
  }
  if (list_input) {
    prompt += `\nGenerate a list of json, one json for each input element.`;
  }
  prompt += `\nAlways escape double quotes inside string values using a backslash (e.g., \\"). Respond ONLY with valid JSON. All property names and string values must be wrapped in double quotes.`;
  return prompt;
}

function normalizeOutputValue(
  value: unknown,
  choices: string[],
  default_category: string,
) {
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (
    default_category &&
    (typeof value !== "string" || !choices.includes(value))
  ) {
    value = default_category;
  }
  if (typeof value === "string" && value.includes(":")) {
    value = value.split(":")[0];
  }
  return value;
}

function validateAndNormalizeOutput(
  output: unknown,
  output_format: OutputFormat,
  default_category: string,
  output_value_only: boolean,
  list_input: boolean,
) {
  const outputArr = list_input
    ? ((output as unknown[]) ?? [])
    : [output];

  for (let index = 0; index < outputArr.length; index++) {
    const item = outputArr[index] as Record<string, unknown>;

    for (const key in output_format) {
      // SAFE: Avoid regex, just check for both chars
      if (key.includes("<") && key.includes(">")) continue;
      if (!(key in item)) {
        throw new Error(`${key} not in json output`);
      }
      if (Array.isArray(output_format[key])) {
        item[key] = normalizeOutputValue(
          item[key],
          output_format[key] as string[],
          default_category,
        );
      }
    }

    if (output_value_only) {
      const values = Object.values(item);
      outputArr[index] = values.length === 1 ? values[0] : values;
    } else {
      outputArr[index] = item;
    }
  }

  return list_input ? outputArr : outputArr[0];
}

function stripCodeFences(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```") || !trimmed.endsWith("```")) {
    return trimmed;
  }

  const firstLineBreak = trimmed.indexOf("\n");
  if (firstLineBreak === -1) {
    return "";
  }

  const closingFenceIndex = trimmed.lastIndexOf("```");
  if (closingFenceIndex <= firstLineBreak) {
    return trimmed.slice(firstLineBreak + 1).trim();
  }

  return trimmed.slice(firstLineBreak + 1, closingFenceIndex).trim();
}

function extractFirstJsonSegment(value: string) {
  const firstBrace = value.indexOf("{");
  const firstBracket = value.indexOf("[");

  let start = -1;
  if (firstBrace === -1 && firstBracket === -1) {
    return value;
  }

  if (firstBrace === -1) {
    start = firstBracket;
  } else if (firstBracket === -1) {
    start = firstBrace;
  } else {
    start = Math.min(firstBrace, firstBracket);
  }

  const startChar = value[start];
  const endChar = startChar === "{" ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i++) {
    const char = value[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === startChar) {
      depth += 1;
      continue;
    }

    if (char === endChar) {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }
  }

  return value.slice(start).trim();
}

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
): Promise<unknown> {
  const openai = getOpenAIClient();
  const list_input = Array.isArray(user_prompt);
  // SAFE: Avoid regex, just check for both chars
  const dynamic_elements =
    JSON.stringify(output_format).includes("<") &&
    JSON.stringify(output_format).includes(">");
  const list_output =
    JSON.stringify(output_format).includes("[") &&
    JSON.stringify(output_format).includes("]");
  let error_msg = "";

  for (let i = 0; i < num_tries; i++) {
    const output_format_prompt = buildOutputFormatPrompt(
      output_format,
      list_output,
      dynamic_elements,
      list_input,
    );
    const response = await openai.chat.completions.create({
      temperature,
      model,
      messages: [
        {
          role: "system",
          content: system_prompt + output_format_prompt + error_msg,
        },
        { role: "user", content: user_prompt.toString() },
      ],
    });

    const rawResponse = response.choices[0].message?.content ?? "";
    const withoutFences = stripCodeFences(rawResponse);
    const res = extractFirstJsonSegment(withoutFences);

    if (verbose) {
      console.log(
        "System prompt:",
        system_prompt + output_format_prompt + error_msg,
      );
      console.log("\nUser prompt:", user_prompt);
      console.log("\nGPT response:", res);
    }

    try {
      const output = JSON.parse(res);
      if (list_input && !Array.isArray(output)) {
        throw new Error("Output format not in a list of json");
      }
      return validateAndNormalizeOutput(
        output,
        output_format,
        default_category,
        output_value_only,
        list_input,
      );
    } catch (e) {
      error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
      console.log("An exception occurred:", e);
      console.log("Current invalid json format:", res);
    }
  }
  return [];
}
