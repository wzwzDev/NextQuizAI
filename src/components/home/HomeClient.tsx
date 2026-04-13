"use client";
import React from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import LoadingQuizzes from "@/components/LoadingQuizzes";

const categories = [
  { name: "Math", img: "/math.png" },
  { name: "Science", img: "/categories/Science.png" },
  { name: "History", img: "/categories/History.png" },
  { name: "Programming", img: "/categories/image--programming.svg" },
];

type Quiz = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  quizType?: "mcq" | "open_ended";
  questions?: unknown[];
};

function normalizeFilterValue(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

export default function HomeClient() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null,
  );
  const [selectedQuizType, setSelectedQuizType] = useState<string | null>(null);

  // Fetch quizzes
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/quiz-review")
      .then((res) => res.json())
      .then((data: { quizzes?: Quiz[] }) => {
        setQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error loading quizzes.");
        setLoading(false);
      });
  }, []);

  // Filtering logic for category and difficulty
  const filteredQuizzes = quizzes.filter((quiz) => {
    const selectedCategoryNormalized = normalizeFilterValue(selectedCategory);
    const selectedDifficultyNormalized =
      normalizeFilterValue(selectedDifficulty);
    const selectedQuizTypeNormalized = normalizeFilterValue(selectedQuizType);
    const quizCategoryNormalized = normalizeFilterValue(quiz.category);
    const quizDifficultyNormalized = normalizeFilterValue(quiz.difficulty);
    const quizTypeNormalized = normalizeFilterValue(quiz.quizType);

    const categoryMatch =
      !selectedCategoryNormalized ||
      quizCategoryNormalized === selectedCategoryNormalized;
    const difficultyMatch =
      !selectedDifficultyNormalized ||
      quizDifficultyNormalized === selectedDifficultyNormalized;
    const quizTypeMatch =
      !selectedQuizTypeNormalized ||
      quizTypeNormalized === selectedQuizTypeNormalized;

    return categoryMatch && difficultyMatch && quizTypeMatch;
  });

  const formatQuizTypeLabel = (quizType?: string) => {
    if (normalizeFilterValue(quizType) === "mcq") {
      return "MCQ";
    }

    if (normalizeFilterValue(quizType) === "open_ended") {
      return "Open Ended";
    }

    return "Unknown";
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Available Quizzes</h1>
      {/* Category and Difficulty Filters */}
      <div className="mb-6 flex gap-4">
        <label htmlFor="category" className="font-semibold">
          Category:
        </label>
        <select
          id="category"
          value={selectedCategory || ""}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="border rounded px-2 py-1 bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <label htmlFor="difficulty" className="font-semibold">
          Difficulty:
        </label>
        <select
          id="difficulty"
          value={selectedDifficulty || ""}
          onChange={(e) => setSelectedDifficulty(e.target.value || null)}
          className="border rounded px-2 py-1 bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <label htmlFor="quizType" className="font-semibold">
          Quiz Type:
        </label>
        <select
          id="quizType"
          value={selectedQuizType || ""}
          onChange={(e) => setSelectedQuizType(e.target.value || null)}
          className="border rounded px-2 py-1 bg-white dark:bg-black text-gray-900 dark:text-white"
        >
          <option value="">All</option>
          <option value="mcq">MCQ</option>
          <option value="open_ended">Open Ended</option>
        </select>
      </div>

      {/* Loading and Error Messages */}
      {loading && <LoadingQuizzes />}
      {error && <div className="text-red-500">{error}</div>}

      {/* Quiz List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => {
          const cat = categories.find(
            (c) =>
              normalizeFilterValue(c.name) ===
              normalizeFilterValue(quiz.category),
          );
          return (
            <div
              key={quiz.id}
              className="border rounded-lg p-4 flex flex-col items-center shadow hover:shadow-lg transition"
            >
              {cat && cat.img ? (
                <Image
                  src={cat.img}
                  alt={cat.name}
                  width={80}
                  height={80}
                  className="mb-2 rounded"
                />
              ) : null}
              <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">
                {quiz.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-2 justify-center">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                  Category: {quiz.category}
                </span>
                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-semibold">
                  Difficulty: {quiz.difficulty}
                </span>
                <span className="inline-block bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
                  Type: {formatQuizTypeLabel(quiz.quizType)}
                </span>
                <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-xs font-semibold">
                  Questions: {quiz.questions?.length || 0}
                </span>
              </div>
              <a
                href={`/playme/${quiz.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold mt-2"
              >
                Start Quiz
              </a>
            </div>
          );
        })}
      </div>

      {/* No quizzes found */}
      {!loading && filteredQuizzes.length === 0 && (
        <div className="mt-8 text-gray-500">No quizzes found.</div>
      )}
    </div>
  );
}
