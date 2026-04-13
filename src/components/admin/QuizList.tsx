"use client";
import React, { useEffect, useState } from "react";
import { AdminQuizDraft } from "@/components/admin/types";

function normalizeFilterValue(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

type QuizListProps = {
  refreshKey?: number;
};

export default function QuizList({ refreshKey = 0 }: QuizListProps) {
  const [allQuizzes, setAllQuizzes] = useState<AdminQuizDraft[]>([]);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [quizType, setQuizType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/quiz-review");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load quizzes.");
        }

        if (isMounted) {
          setAllQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load quizzes.",
          );
          setAllQuizzes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const categories = React.useMemo(() => {
    return Array.from(
      new Set(
        allQuizzes
          .map((quiz) => quiz.category)
          .filter((value): value is string =>
            Boolean(value && value.trim().length > 0),
          ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [allQuizzes]);

  const difficulties = React.useMemo(() => {
    return Array.from(
      new Set(
        allQuizzes
          .map((quiz) => quiz.difficulty)
          .filter((value): value is string =>
            Boolean(value && value.trim().length > 0),
          ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [allQuizzes]);

  const quizTypes = React.useMemo(() => {
    return Array.from(
      new Set(
        allQuizzes
          .map((quiz) => quiz.quizType)
          .filter(
            (
              value,
            ): value is NonNullable<AdminQuizDraft["quizType"]> =>
              Boolean(value && value.trim().length > 0),
          ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [allQuizzes]);

  const filteredQuizzes = React.useMemo(() => {
    const selectedCategory = normalizeFilterValue(category);
    const selectedDifficulty = normalizeFilterValue(difficulty);
    const selectedQuizType = normalizeFilterValue(quizType);

    return allQuizzes.filter((quiz) => {
      const quizCategory = normalizeFilterValue(quiz.category);
      const quizDifficulty = normalizeFilterValue(quiz.difficulty);
      const quizKind = normalizeFilterValue(quiz.quizType);

      const categoryMatch =
        selectedCategory.length === 0 || quizCategory === selectedCategory;
      const difficultyMatch =
        selectedDifficulty.length === 0 || quizDifficulty === selectedDifficulty;
      const quizTypeMatch =
        selectedQuizType.length === 0 || quizKind === selectedQuizType;

      return categoryMatch && difficultyMatch && quizTypeMatch;
    });
  }, [allQuizzes, category, difficulty, quizType]);

  const formatQuizTypeLabel = (value?: string) => {
    const normalized = normalizeFilterValue(value);
    if (normalized === "mcq") {
      return "MCQ";
    }

    if (normalized === "open_ended") {
      return "Open Ended";
    }

    return "Unknown";
  };

  const handleDelete = async (quiz: AdminQuizDraft) => {
    if (window.confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
      try {
        const res = await fetch(`/api/quiz-review?id=${quiz.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setAllQuizzes((qs) => qs.filter((q) => q.id !== quiz.id));
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete quiz.");
        }
      } catch {
        alert("Failed to delete quiz.");
      }
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-black rounded-xl shadow border">
      <div className="mb-4 flex gap-4 items-center">
        <select
          className="border rounded px-2 py-1 bg-white dark:bg-black text-gray-900 dark:text-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 bg-white dark:bg-black text-gray-900 dark:text-white"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">All Difficulties</option>
          {difficulties.map((diff) => (
            <option key={diff} value={diff}>
              {diff}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 bg-white dark:bg-black text-gray-900 dark:text-white"
          value={quizType}
          onChange={(e) => setQuizType(e.target.value)}
        >
          <option value="">All Types</option>
          {quizTypes.map((type) => (
            <option key={type} value={type}>
              {formatQuizTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>
      {loading && <div>Loading quizzes...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && filteredQuizzes.length === 0 && <div>No quizzes found.</div>}
      {!loading && filteredQuizzes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg">
            <thead>
              <tr className="bg-blue-100 dark:bg-blue-900">
                <th className="p-2 border">#</th>
                <th className="p-2 border text-left">Title</th>
                <th className="p-2 border text-left">Category</th>
                <th className="p-2 border text-left">Difficulty</th>
                <th className="p-2 border text-left">Type</th>
                <th className="p-2 border text-center">Questions</th>
                <th className="p-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.map((quiz: AdminQuizDraft, idx: number) => (
                <tr key={quiz.id} className="hover:bg-blue-50">
                  <td className="p-2 border text-center">{idx + 1}</td>
                  <td className="p-2 border">{quiz.title}</td>
                  <td className="p-2 border">{quiz.category}</td>
                  <td className="p-2 border">{quiz.difficulty}</td>
                  <td className="p-2 border">{formatQuizTypeLabel(quiz.quizType)}</td>
                  <td className="p-2 border text-center">
                    {quiz.questions && Array.isArray(quiz.questions)
                      ? quiz.questions.length
                      : 0}
                  </td>
                  <td className="p-2 border text-center space-x-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => handleDelete(quiz)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
