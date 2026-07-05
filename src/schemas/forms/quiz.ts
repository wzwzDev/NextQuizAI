import { z } from "zod";

// ✅ Whitelist de temas válidos (ONLY estos se aceptan)
// ✅ Curated topics for suggestions
export const SUGGESTED_TOPICS = [
  "JavaScript",
  "React",
  "TypeScript",
  "Python",
  "Java",
  "Node.js",
  "Database Design",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "REST API",
  "GraphQL",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Git",
  "DevOps",
  "CI/CD",
  "Linux",
  "CSS",
  "HTML",
  "Vue.js",
  "Angular",
  "Svelte",
  "Next.js",
  "Express.js",
  "Django",
  "Flask",
  "FastAPI",
  "Spring Boot",
  "Laravel",
  "C++",
  "C#",
  ".NET",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Machine Learning",
  "Data Science",
  "Algorithms",
  "Design Patterns",
  "Testing",
];

// ✅ Function to detect if a topic is gibberish or not clear
export const isGibberish = (topic: string): boolean => {
  // Allow if exact match with suggested topics (case-insensitive)
  if (SUGGESTED_TOPICS.some((t) => t.toLowerCase() === topic.toLowerCase())) {
    return false;
  }

  // Split by spaces to validate each word
  const words = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return true;

  // Validate EACH word individually
  for (const word of words) {
    // ❌ Cannot start with number (21street, 123java → GIBBERISH)
    if (/^\d/.test(word)) {
      return true;
    }

    // ❌ Cannot have more numbers than letters (js123123 → GIBBERISH)
    const letterCount = (word.match(/[a-z]/gi) || []).length;
    const numberCount = (word.match(/\d/gi) || []).length;
    if (numberCount > letterCount) {
      return true;
    }

    // ❌ Too many consonants in a row (qwerty, bcdfghjk → GIBBERISH)
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/.test(word)) {
      return true;
    }

    // ❌ Q not followed by U (unusual)
    if (/q(?!u)/.test(word)) {
      return true;
    }

    // ❌ Rare consonant pairs (dj, qw, jq, xz, etc.)
    const rarePatterns = /dj|qw|jq|xz|zq|vj|fq|kx|zx|wq|xq/;
    if (rarePatterns.test(word)) {
      return true;
    }

    // ❌ More than 2 vowels in a row (rare in English)
    if (/[aeiou]{3,}/.test(word)) {
      return true;
    }

    // ❌ Starts with consonant cluster > 2 (most English words don't)
    if (/^[bcdfghjklmnpqrstvwxyz]{3,}/.test(word)) {
      return true;
    }

    // ❌ Ends with consonant cluster > 2
    if (/[bcdfghjklmnpqrstvwxyz]{3,}$/.test(word)) {
      return true;
    }

    // ❌ Only one type of vowel repeated (aaaa, eeee, iiii)
    if (/a{3,}|e{3,}|i{3,}|o{3,}|u{3,}/.test(word)) {
      return true;
    }

    // ✅ Each word must have at least one vowel (except numbers/special)
    const hasVowel = /[aeiou]/.test(word);
    const hasConsonant = /[bcdfghjklmnpqrstvwxyz]/.test(word);

    // Word must have both vowels AND consonants to be valid
    if (!(hasVowel && hasConsonant)) {
      return true;
    }
  }

  // ✅ All checks passed: topic seems valid
  return false;
};

export const quizCreationSchema = z.object({
  topic: z
    .string()
    .min(1, "Topic is required")
    .max(50, "Topic must be at most 50 characters"),
  type: z.enum(["mcq", "open_ended"]),
  amount: z.number().min(1).max(10),
});
