import "openai/shims/node";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

type JsonRecord = Record<string, unknown>;
type StrictOutputParsed = JsonRecord | JsonRecord[] | string | number | boolean | null;

function buildOutputFormatPrompt(
  output_format: OutputFormat,
  list_output: boolean,
  dynamic_elements: boolean,
  list_input: boolean,
) {
  let prompt = `\nYou are to output the following in json format: ${JSON.stringify(
    output_format,
  )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

  if (list_output) {
    prompt += `\nIf output field is a list, classify output into the best element of the list.`;
  }
  if (dynamic_elements) {
    prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it.
    Example input: Go to <location>, Example output: Go to the garden`;
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
  let normalized: unknown = value;
  if (Array.isArray(normalized)) {
    normalized = normalized[0];
  }
  if (default_category && !choices.includes(String(normalized))) {
    normalized = default_category;
  }
  if (typeof normalized === "string" && normalized.includes(":")) {
    normalized = normalized.split(":")[0];
  }
  return normalized;
}

function validateAndNormalizeOutput(
  output: StrictOutputParsed,
  output_format: OutputFormat,
  default_category: string,
  output_value_only: boolean,
  list_input: boolean,
) {
  // Always work with the original output for output_value_only
  if (output_value_only) {
    if (Array.isArray(output)) {
      const flat = output.flatMap((obj) => Object.values(obj));
      if (flat.length === 1) return flat[0];
      return flat;
    }
    if (typeof output === "object" && output !== null) {
      const values = Object.values(output);
      return values.length === 1 ? values[0] : values;
    }
    return output;
  }

  // The rest of your normalization logic
  if (typeof output !== "object" || output === null) {
    throw new Error("Output format is not a JSON object");
  }

  const outputArr: JsonRecord[] = list_input
    ? (output as JsonRecord[])
    : [output as JsonRecord];
  for (let index = 0; index < outputArr.length; index++) {
    for (const key in output_format) {
      if (key.includes("<") && key.includes(">")) continue;
      if (!(key in outputArr[index])) {
        throw new Error(`${key} not in json output`);
      }
      if (Array.isArray(output_format[key])) {
        outputArr[index][key] = normalizeOutputValue(
          outputArr[index][key],
          output_format[key] as string[],
          default_category,
        );
      }
    }
  }

  return list_input ? outputArr : outputArr[0];
}

function escapeInnerQuotes(jsonStr: string): string {
  let inString = false;
  let prevChar = "";
  let result = "";
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && prevChar !== "\\") {
      inString = !inString;
      result += char;
    } else {
      result += char;
    }
    prevChar = char;
  }
  return result;
}

function quotePropertyNames(jsonStr: string): string {
  return jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
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
  const list_input = Array.isArray(user_prompt);
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

    let res: string =
      response.choices?.[0]?.message?.content?.replace(/'/g, '"') ?? "";
    res = res.replace(/(\w)"(\w)/g, "$1'$2").trim();

    const firstBracket = res.indexOf("[");
    const firstBrace = res.indexOf("{");
    if (
      firstBracket !== -1 &&
      (firstBracket < firstBrace || firstBrace === -1)
    ) {
      res = res.slice(firstBracket);
    } else if (firstBrace !== -1) {
      res = res.slice(firstBrace);
    }

    res = quotePropertyNames(res);
    res = escapeInnerQuotes(res);

    if (verbose) {
      console.log(
        "System prompt:",
        system_prompt + output_format_prompt + error_msg,
      );
      console.log("\nUser prompt:", user_prompt);
      console.log("\nGPT response:", res);
    }

    try {
      const output = JSON.parse(res) as StrictOutputParsed;
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
