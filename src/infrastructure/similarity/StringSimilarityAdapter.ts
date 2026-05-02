import stringSimilarity from "string-similarity";
import type { StringSimilarityPort } from "@/domain/ports/StringSimilarityPort";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export class StringSimilarityAdapter implements StringSimilarityPort {
  compare(left: string, right: string): number {
    return stringSimilarity.compareTwoStrings(
      normalizeText(left),
      normalizeText(right),
    );
  }
}
