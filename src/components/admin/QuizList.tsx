"use client";
import React, { useEffect, useState } from "react";
import { AdminQuizDraft } from "@/components/admin/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function parseQuestionMetadata(rawOptions: unknown) {
  if (Array.isArray(rawOptions)) {
    return {
      options: rawOptions.filter(
        (option): option is string => typeof option === "string",
      ),
    };
  }

  if (rawOptions && typeof rawOptions === "object") {
    const options = Array.isArray((rawOptions as { choices?: unknown }).choices)
      ? (rawOptions as { choices: unknown[] }).choices.filter(
          (option): option is string => typeof option === "string",
        )
      : Array.isArray((rawOptions as { options?: unknown }).options)
        ? (rawOptions as { options: unknown[] }).options.filter(
            (option): option is string => typeof option === "string",
          )
        : [];

    const citation =
      (rawOptions as { citation?: unknown }).citation &&
      typeof (rawOptions as { citation?: unknown }).citation === "object"
        ? (rawOptions as {
            citation: { source?: unknown; snippet?: unknown; confidence?: unknown };
          }).citation
        : null;

    return {
      options,
      citation:
        citation &&
        typeof citation.source === "string" &&
        typeof citation.snippet === "string"
          ? {
              source: citation.source,
              snippet: citation.snippet,
              ...(typeof citation.confidence === "number"
                ? { confidence: citation.confidence }
                : {}),
            }
          : undefined,
    };
  }

  return { options: [] as string[] };
}

function normalizeFilterValue(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "N/A";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
}

type QuizListProps = {
  refreshKey?: number;
};

export default function QuizList({ refreshKey = 0 }: QuizListProps) {
  const [allQuizzes, setAllQuizzes] = useState<AdminQuizDraft[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [quizType, setQuizType] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<AdminQuizDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (category) params.set("category", category);
        if (difficulty) params.set("difficulty", difficulty);

        const res = await fetch(`/api/quiz-review?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load quizzes.");
        }

        if (isMounted) {
          const quizzes = Array.isArray(data.quizzes) ? data.quizzes : [];
          const normalizedQuizzes: AdminQuizDraft[] = quizzes.map(
            (quiz: AdminQuizDraft) => ({
              ...quiz,
              questions: Array.isArray(quiz.questions)
                ? quiz.questions.map((question) => {
                    const metadata = parseQuestionMetadata(question.options);

                    return {
                      ...question,
                      options: metadata.options,
                      ...(metadata.citation
                        ? { citation: metadata.citation }
                        : {}),
                    };
                  })
                : quiz.questions,
            }),
          );

          setAllQuizzes(normalizedQuizzes);
          setTotal(Number.isFinite(Number(data.total)) ? Number(data.total) : 0);
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
  }, [refreshKey, page, limit, category, difficulty]);

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
                <th className="p-2 border text-left">Status</th>
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
                  <td className="p-2 border">{quiz.status || "approved"}</td>
                  <td className="p-2 border text-center">
                    {quiz.questionCount ??
                      (quiz.questions && Array.isArray(quiz.questions)
                        ? quiz.questions.length
                        : 0)}
                  </td>
                  <td className="p-2 border text-center space-x-2">
                    <button
                      className="bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-700"
                      onClick={() => setSelectedQuiz(quiz)}
                    >
                      Details
                    </button>
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

      {/* Pagination controls */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <button
            className="px-3 py-1 mr-2 rounded border"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 rounded border"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * limit >= total}
          >
            Next
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {page} — {Math.min(page * limit, total)} of {total}
        </div>
      </div>

      <Dialog
        open={selectedQuiz !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuiz(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedQuiz && (
            <>
              <DialogHeader>
                <DialogTitle>Approved Quiz Details</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold">Title:</span> {selectedQuiz.title}</div>
                <div><span className="font-semibold">Status:</span> {selectedQuiz.status || "approved"}</div>
                <div><span className="font-semibold">Category:</span> {selectedQuiz.category || "N/A"}</div>
                <div><span className="font-semibold">Difficulty:</span> {selectedQuiz.difficulty || "N/A"}</div>
                <div><span className="font-semibold">Type:</span> {formatQuizTypeLabel(selectedQuiz.quizType)}</div>
                <div>
                  <span className="font-semibold">Questions:</span>{" "}
                  {selectedQuiz.questionCount ?? selectedQuiz.questions?.length ?? 0}
                </div>
                <div><span className="font-semibold">Created:</span> {formatDate(selectedQuiz.createdAt)}</div>
                <div><span className="font-semibold">Updated:</span> {formatDate(selectedQuiz.updatedAt)}</div>
              </div>

              <div className="mt-2 rounded-lg border p-3 text-sm">
                <p className="font-semibold mb-2">Attempt Summary</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>Total Attempts: {selectedQuiz.attemptSummary?.totalAttempts ?? 0}</div>
                  <div>Completed Attempts: {selectedQuiz.attemptSummary?.completedAttempts ?? 0}</div>
                  <div>Pending Attempts: {selectedQuiz.attemptSummary?.pendingAttempts ?? 0}</div>
                  <div>
                    Average Score: {selectedQuiz.attemptSummary?.averageScore ?? "N/A"}
                  </div>
                  <div>Last Attempt: {formatDate(selectedQuiz.attemptSummary?.lastAttemptAt)}</div>
                  <div>
                    Last Completed: {formatDate(selectedQuiz.attemptSummary?.lastCompletedAt)}
                  </div>
                </div>
              </div>

              {Array.isArray(selectedQuiz.questions) && selectedQuiz.questions.length > 0 && (
                <div className="mt-2 rounded-lg border p-3 text-sm">
                  <p className="font-semibold mb-2">Question Sources</p>
                  <div className="space-y-3">
                    {selectedQuiz.questions.slice(0, 6).map((question, index) => (
                      <div key={`${selectedQuiz.id}-source-${index}`} className="rounded border px-2 py-2">
                        <div className="font-semibold">Q{index + 1}. {question.question}</div>
                        {question.citation ? (
                          <div className="mt-1 text-xs text-gray-600">
                            Source: {question.citation.source} - {question.citation.snippet}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-500">No citation metadata available.</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
