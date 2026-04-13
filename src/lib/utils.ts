import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeDelta(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const secs = Math.floor(seconds - hours * 3600 - minutes * 60);
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0) {
    parts.push(`${secs}s`);
  }
  return parts.join(" ");
}
export function normalize(str: unknown) {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarity(a: unknown, b: unknown) {
  const normalizedA = normalize(a);
  const normalizedB = normalize(b);

  if (!normalizedA.length && !normalizedB.length) return 1;
  if (!normalizedA.length || !normalizedB.length) return 0;

  const matrix = [];
  for (let i = 0; i <= normalizedB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= normalizedA.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= normalizedB.length; i++) {
    for (let j = 1; j <= normalizedA.length; j++) {
      if (normalizedB.charAt(i - 1) === normalizedA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }
  const distance = matrix[normalizedB.length][normalizedA.length];
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

export function calculateAccuracy(game: any): number {
  if (!game.questions.length) return 0;
  if (game.gameType === "mcq") {
    const totalCorrect = game.questions.filter((q: any) => q.isCorrect).length;
    return Math.round((totalCorrect / game.questions.length) * 100 * 100) / 100;
  } else if (game.gameType === "open_ended") {
    const total = game.questions.reduce(
      (acc: number, q: any) => acc + (q.percentageCorrect ?? 0),
      0,
    );
    return Math.round((total / game.questions.length) * 100) / 100;
  }
  return 0;
}
