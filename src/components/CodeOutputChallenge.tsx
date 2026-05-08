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

function syntaxHighlight(code: string, language: string): React.ReactNode {
  // Simple syntax highlighting - split by common patterns
  const keywords = /\b(function|const|let|var|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|super|class|extends|interface|import|export|async|await|yield|delete|typeof|instanceof|in|of|void|null|undefined|true|false|NaN|Infinity|print|def|class|if|elif|else|for|while|with|try|except|finally|raise|return|import|from|as|pass|break|continue|lambda|and|or|not|is)\b/g;
  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  const numbers = /\b\d+(\.\d+)?\b/g;
  const comments = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(#.*$)/gm;
  
  let result = code;
  
  return (
    <div className="space-y-0">
      {code.split('\n').map((line, i) => (
        <div key={i} className="flex gap-3">
          <span className="w-8 text-right text-slate-500 select-none text-xs">{i + 1}</span>
          <span className="flex-1 font-mono text-sm">
            {line.split(keywords).map((part, j) => {
              if (keywords.test(part)) {
                return <span key={j} className="text-cyan-300 font-semibold">{part}</span>;
              }
              if (strings.test(part)) {
                return <span key={j} className="text-green-300">{part}</span>;
              }
              if (numbers.test(part)) {
                return <span key={j} className="text-amber-300">{part}</span>;
              }
              return <span key={j}>{part}</span>;
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

function parseCodeChallengeQuestion(question: string) {
  const withoutMarker = question.replace(/\[fill_blank\]/gi, "").trim();
  const normalized = withoutMarker.replace(/\r\n/g, "\n");

  const outputSplit = normalized.split(/\n\s*output\s*:\s*_{3,}\s*$/i);
  const body = outputSplit[0]?.trim() ?? normalized;

  const segments = body
    .split(/\n\s*\n/)
    .map((segment) => segment.trim())
    .filter(Boolean);

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
