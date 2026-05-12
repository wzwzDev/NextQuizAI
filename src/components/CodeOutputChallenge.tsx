import React from "react";

type Props = {
  question: string;
  value: string;
  onChange: (value: string) => void;
};

function detectLanguage(code: string): string {
  const lowerCode = code.toLowerCase();
  
  if (/^(import|export|const|let|function|=>|console\.|async\s+|await\s+)/.test(lowerCode)) {
    return "javascript";
  }
  if (/^(def|class|import|print\(|for\s+|if\s+|elif\s+)/.test(lowerCode)) {
    return "python";
  }
  if (/<\?php|\$_|function\s+\w+\(|echo\s+|array\(/.test(lowerCode)) {
    return "php";
  }
  if (/^(public|private|class|interface|import|static|void)/.test(lowerCode)) {
    return "java";
  }
  if (/^(fn\s+|fn\(|let\s+mut|use\s+|impl\s+)/.test(lowerCode)) {
    return "rust";
  }
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s+/i.test(code)) {
    return "sql";
  }
  
  return "javascript"; // default
}

const KEYWORDS = new Set([
  "function",
  "const",
  "let",
  "var",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "throw",
  "new",
  "this",
  "super",
  "class",
  "extends",
  "interface",
  "import",
  "export",
  "async",
  "await",
  "yield",
  "delete",
  "typeof",
  "instanceof",
  "in",
  "of",
  "void",
  "null",
  "undefined",
  "true",
  "false",
  "NaN",
  "Infinity",
  "print",
  "def",
  "elif",
  "with",
  "except",
  "raise",
  "from",
  "as",
  "pass",
  "lambda",
  "and",
  "or",
  "not",
  "is",
]);

function isWordCharacter(character: string) {
  const code = character.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    character === "_"
  );
}

function isDigitCharacter(character: string) {
  const code = character.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function splitChallengeParagraphs(code: string) {
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of code.split("\n")) {
    if (line.trim().length === 0) {
      if (current.length > 0) {
        paragraphs.push(current.join("\n").trim());
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    paragraphs.push(current.join("\n").trim());
  }

  return paragraphs;
}

type HighlightToken = {
  text: string;
  className?: string;
};

function tokenizeCodeLine(line: string, inBlockComment: boolean) {
  const tokens: HighlightToken[] = [];
  let index = 0;
  let insideBlockComment = inBlockComment;

  while (index < line.length) {
    if (insideBlockComment) {
      const blockEnd = line.indexOf("*/", index);
      if (blockEnd === -1) {
        tokens.push({ text: line.slice(index), className: "text-slate-500" });
        return { tokens, nextInBlockComment: true };
      }

      tokens.push({ text: line.slice(index, blockEnd + 2), className: "text-slate-500" });
      index = blockEnd + 2;
      insideBlockComment = false;
      continue;
    }

    const remaining = line.slice(index);
    if (remaining.startsWith("//") || remaining.startsWith("#")) {
      tokens.push({ text: remaining, className: "text-slate-500" });
      return { tokens, nextInBlockComment: false };
    }

    if (remaining.startsWith("/*")) {
      const blockEnd = line.indexOf("*/", index + 2);
      if (blockEnd === -1) {
        tokens.push({ text: remaining, className: "text-slate-500" });
        return { tokens, nextInBlockComment: true };
      }

      tokens.push({ text: line.slice(index, blockEnd + 2), className: "text-slate-500" });
      index = blockEnd + 2;
      continue;
    }

    const character = line[index];

    if (character === '"' || character === "'" || character === "`") {
      let end = index + 1;

      while (end < line.length) {
        if (line[end] === "\\") {
          end += 2;
          continue;
        }

        if (line[end] === character) {
          end += 1;
          break;
        }

        end += 1;
      }

      tokens.push({
        text: line.slice(index, Math.min(end, line.length)),
        className: "text-green-300",
      });
      index = end;
      continue;
    }

    if (isDigitCharacter(character)) {
      let end = index + 1;
      while (end < line.length && isDigitCharacter(line[end])) {
        end += 1;
      }

      if (end < line.length && line[end] === ".") {
        let decimalEnd = end + 1;
        while (decimalEnd < line.length && isDigitCharacter(line[decimalEnd])) {
          decimalEnd += 1;
        }
        if (decimalEnd > end + 1) {
          end = decimalEnd;
        }
      }

      tokens.push({ text: line.slice(index, end), className: "text-amber-300" });
      index = end;
      continue;
    }

    if (isWordCharacter(character)) {
      let end = index + 1;
      while (end < line.length && isWordCharacter(line[end])) {
        end += 1;
      }

      const word = line.slice(index, end);
      const className = KEYWORDS.has(word) ? "text-cyan-300 font-semibold" : undefined;
      tokens.push({ text: word, className });
      index = end;
      continue;
    }

    tokens.push({ text: character });
    index += 1;
  }

  return { tokens, nextInBlockComment: insideBlockComment };
}

function syntaxHighlight(code: string, language: string): React.ReactNode {
  let inBlockComment = false;

  return (
    <div className="space-y-0">
      {code.split("\n").map((line, lineIndex) => {
        const tokenized = tokenizeCodeLine(line, inBlockComment);
        inBlockComment = tokenized.nextInBlockComment;

        return (
          <div key={lineIndex} className="flex gap-3">
            <span className="w-8 text-right text-slate-500 select-none text-xs">{lineIndex + 1}</span>
            <span className="flex-1 font-mono text-sm">
              {tokenized.tokens.map((token, tokenIndex) => (
                <span key={tokenIndex} className={token.className}>
                  {token.text}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function parseCodeChallengeQuestion(question: string) {
  const normalized = question.split("\r\n").join("\n").split("\r").join("\n");
  const withoutMarker = normalized.split("[fill_blank]").join("");
  const cleanedQuestion = withoutMarker.trim();

  const lines = cleanedQuestion.split("\n");
  const outputIndex = lines.findIndex((line) => {
    const trimmedLine = line.trim().toLowerCase();
    if (!trimmedLine.startsWith("output:")) {
      return false;
    }

    const suffix = trimmedLine.slice("output:".length).trim();
    if (suffix.length < 3) {
      return false;
    }

    for (const character of suffix) {
      if (character !== "_") {
        return false;
      }
    }

    return true;
  });

  const body = (outputIndex >= 0 ? lines.slice(0, outputIndex) : lines).join("\n").trim();
  const segments = splitChallengeParagraphs(body);

  if (segments.length <= 1) {
    return {
      prompt: "Complete the missing output for this snippet.",
      code: body,
    };
  }

  return {
    prompt: segments[0],
    code: segments.slice(1).join("\n\n"),
  };
}

export default function CodeOutputChallenge({ question, value, onChange }: Props) {
  const { prompt, code } = React.useMemo(
    () => parseCodeChallengeQuestion(question),
    [question],
  );
  
  const language = React.useMemo(() => detectLanguage(code), [code]);
  const highlighted = React.useMemo(() => syntaxHighlight(code, language), [code, language]);

  return (
    <section className="relative mt-4 w-full overflow-hidden rounded-2xl border border-cyan-300/30 bg-slate-950 text-slate-100 shadow-[0_0_48px_rgba(34,211,238,0.15)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.14),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.12),transparent_40%)]" />
      <div className="relative p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Code Output Challenge
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded px-2 py-1 text-[10px] font-mono font-semibold uppercase text-slate-300 bg-slate-800/50 border border-slate-700/50">
              {language}
            </span>
            <span className="text-xs text-cyan-100/70">Fill the runtime output</span>
          </div>
        </div>

        <p className="mb-3 text-sm text-slate-200">{prompt}</p>

        <div className="mb-4 overflow-x-auto rounded-xl border border-slate-700/90 bg-slate-900/90 p-3 text-sm leading-6">
          {highlighted}
        </div>

        <div className="rounded-xl border border-slate-700/90 bg-slate-900/80 px-3 py-2">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Output
          </label>
          <input
            data-blank-answer-input="true"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Type exact output"
            autoComplete="off"
          />
        </div>
      </div>
    </section>
  );
}
