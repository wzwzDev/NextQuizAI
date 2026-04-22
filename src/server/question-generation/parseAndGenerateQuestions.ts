type GeneratedQuestion = {
  question: string;
  answer?: string;
  [key: string]: unknown;
};

type StrictOutput = (content: string) => Promise<GeneratedQuestion[]>;

export async function parseAndGenerateQuestions(
  file: { name: string; type: string; text: () => Promise<string> },
  strict_output: StrictOutput,
): Promise<GeneratedQuestion[]> {
  if (!file) throw new Error("No file uploaded");
  if (!["application/json", "text/plain"].includes(file.type)) {
    throw new Error("Only JSON or TXT files are accepted");
  }

  let content = await file.text();
  if (file.type === "application/json") {
    try {
      const json = JSON.parse(content);
      content = json.content;
    } catch {
      throw new Error("Invalid JSON");
    }
  }
  if (!content) throw new Error("No course content");
  if (content.length < 20) throw new Error("Too short");

  const questions = await strict_output(content);
  return questions;
}