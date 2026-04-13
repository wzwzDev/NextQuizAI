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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Unknown error";
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gpt-4o-mini",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false,
): Promise<any> {
  const openai = getOpenAIClient();
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));
  let error_msg: string = "";
  let lastErrorMessage = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output the following in json format: ${JSON.stringify(
      output_format,
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    if (list_input) {
      output_format_prompt += `\nGenerate a list of json, one json for each input element.`;
    }

    let response;
    try {
      response = await openai.chat.completions.create({
        temperature: temperature,
        model: model,
        messages: [
          {
            role: "system",
            content: system_prompt + output_format_prompt + error_msg,
          },
          { role: "user", content: user_prompt.toString() },
        ],
      });
    } catch (error) {
      lastErrorMessage = getErrorMessage(error);
      error_msg = `\n\nError message: ${lastErrorMessage}`;

      if (verbose) {
        console.log("OpenAI request failed:", lastErrorMessage);
      }

      continue;
    }

    let res: string =
      response.choices[0].message?.content?.replace(/'/g, '"') ?? "";

    res = res.replace(/(\w)"(\w)/g, "$1'$2");

    if (verbose) {
      console.log(
        "System prompt:",
        system_prompt + output_format_prompt + error_msg,
      );
      console.log("\nUser prompt:", user_prompt);
      console.log("\nGPT response:", res);
    }

    try {
      const parsedOutput: unknown = JSON.parse(res);
      const output = Array.isArray(parsedOutput)
        ? parsedOutput
        : [parsedOutput];

      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) continue;
          if (!(key in (output[index] as Record<string, unknown>))) {
            throw new Error(`${key} not in json output`);
          }
          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            if (Array.isArray((output[index] as Record<string, unknown>)[key])) {
              (output[index] as Record<string, unknown>)[key] = ((output[index] as Record<string, unknown>)[key] as unknown[])[0];
            }
            if (
              (!choices.includes(
                (output[index] as Record<string, string>)[key],
              ) ||
                typeof (output[index] as Record<string, string>)[key] !==
                  "string") &&
              default_category
            ) {
              (output[index] as Record<string, unknown>)[key] = default_category;
            }
            if (
              typeof (output[index] as Record<string, unknown>)[key] === "string" &&
              ((output[index] as Record<string, unknown>)[key] as string).includes(":")
            ) {
              (output[index] as Record<string, unknown>)[key] = (
                (output[index] as Record<string, unknown>)[key] as string
              ).split(":")[0];
            }
          }
        }

        if (output_value_only) {
          output[index] = Object.values(output[index] as Record<string, unknown>);
          if ((output[index] as unknown[]).length === 1) {
            output[index] = (output[index] as unknown[])[0];
          }
        }
      }

      return output as any;
    } catch (error) {
      lastErrorMessage = getErrorMessage(error);
      error_msg = `\n\nResult: ${res}\n\nError message: ${lastErrorMessage}`;
      console.log("An exception occurred:", error);
      console.log("Current invalid json format:", res);
    }
  }

  const failureMessage =
    lastErrorMessage || "Unknown generation failure while producing strict JSON output.";
  throw new Error(
    `OpenAI strict output failed after ${num_tries} attempt(s): ${failureMessage}`,
  );
}