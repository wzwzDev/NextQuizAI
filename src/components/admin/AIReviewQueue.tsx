"use client";

import React, { useEffect, useMemo, useState } from "react";

type ReviewItem = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  questionIndex: number;
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  confidence: number;
  confidenceLevel: "low" | "medium" | "high";
  decisionReason: string;
  rawSimilarity: number;
  reviewRequired: boolean;
  citation?: {
    source: string;
    snippet: string;
    confidence?: number;
  };
};

type ReviewQueueResponse = {
  items?: ReviewItem[];
  summary?: {
    pendingItems: number;
    highPriorityItems: number;
    totalQuestionResults: number;
    lowConfidenceRate: number;
  };
  error?: string;
};

type AIReviewQueueProps = {
  compact?: boolean;
};

function confidenceChipClass(level: ReviewItem["confidenceLevel"]) {
  if (level === "high") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200";
  }

  if (level === "medium") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200";
  }

  return "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200";
}

export default function AIReviewQueue({ compact = false }: AIReviewQueueProps) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewQueueResponse["summary"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const refreshQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-review");
      const payload = (await response.json()) as ReviewQueueResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load AI review queue.");
      }

      setItems(Array.isArray(payload.items) ? payload.items : []);
      setSummary(payload.summary);
    } catch (loadError) {
      setItems([]);
      setSummary(undefined);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load AI review queue.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshQueue();
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        if (left.confidence === right.confidence) {
          return left.quizTitle.localeCompare(right.quizTitle);
        }

        return left.confidence - right.confidence;
      }),
    [items],
  );

  const resolveItem = async (item: ReviewItem, action: "accept_ai" | "mark_incorrect" | "set_expected_answer") => {
    const processingId = `${item.attemptId}:${item.questionIndex}`;
    setProcessingKey(processingId);
    setError(null);

    try {
      let correctedAnswer: string | undefined;
      if (action === "set_expected_answer") {
        const nextAnswer = window.prompt(
          "Set the expected answer for this question:",
          item.expectedAnswer,
        );

        if (!nextAnswer || !nextAnswer.trim()) {
          setProcessingKey(null);
          return;
        }

        correctedAnswer = nextAnswer.trim();
      }

      const response = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: item.attemptId,
          questionIndex: item.questionIndex,
          action,
          ...(correctedAnswer ? { correctedAnswer } : {}),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Failed to resolve review item.",
        );
      }

      await refreshQueue();
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Failed to resolve review item.",
      );
    } finally {
      setProcessingKey(null);
    }
  };

  if (loading) {
    return <div>Loading AI review queue...</div>;
  }

  return (
    <div className={compact ? "h-full" : "rounded-xl bg-white p-8 shadow dark:bg-black"}>
      {!compact && <h2 className="mb-4 text-2xl font-bold">AI Review Queue</h2>}

      {summary && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded border px-3 py-2 text-sm">Pending: <strong>{summary.pendingItems}</strong></div>
          <div className="rounded border px-3 py-2 text-sm">High Priority: <strong>{summary.highPriorityItems}</strong></div>
          <div className="rounded border px-3 py-2 text-sm">AI-graded Questions: <strong>{summary.totalQuestionResults}</strong></div>
          <div className="rounded border px-3 py-2 text-sm">Low-Confidence Rate: <strong>{summary.lowConfidenceRate}%</strong></div>
        </div>
      )}

      {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {sortedItems.length === 0 ? (
        <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          No pending AI review items.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border bg-white dark:bg-black">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="border px-3 py-2 text-left text-xs">Quiz</th>
                <th className="border px-3 py-2 text-left text-xs">Question</th>
                <th className="border px-3 py-2 text-left text-xs">AI Assessment</th>
                <th className="border px-3 py-2 text-left text-xs">Source</th>
                <th className="border px-3 py-2 text-left text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                const itemKey = `${item.attemptId}:${item.questionIndex}`;
                const isProcessing = processingKey === itemKey;

                return (
                  <tr key={itemKey}>
                    <td className="border px-3 py-2 align-top text-sm">
                      <div className="font-semibold">{item.quizTitle}</div>
                      <div className="text-xs text-gray-500">Attempt: {item.attemptId.slice(0, 8)}...</div>
                    </td>
                    <td className="border px-3 py-2 align-top text-sm">
                      <div className="font-semibold">Q{item.questionIndex + 1}: {item.question}</div>
                      <div className="mt-1 text-xs text-gray-600">User: {item.userAnswer || "(empty)"}</div>
                      <div className="text-xs text-gray-600">Expected: {item.expectedAnswer}</div>
                    </td>
                    <td className="border px-3 py-2 align-top text-sm">
                      <div className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${confidenceChipClass(item.confidenceLevel)}`}>
                        {item.confidenceLevel.toUpperCase()} ({Math.round(item.confidence * 100)}%)
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Similarity: {Math.round(item.rawSimilarity * 100)}%</div>
                      <div className="mt-1 text-xs text-gray-700">{item.decisionReason}</div>
                    </td>
                    <td className="border px-3 py-2 align-top text-sm">
                      {item.citation ? (
                        <div>
                          <div className="text-xs font-semibold">{item.citation.source}</div>
                          <div className="text-xs text-gray-600">{item.citation.snippet}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No citation</span>
                      )}
                    </td>
                    <td className="border px-3 py-2 align-top text-sm">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => resolveItem(item, "accept_ai")}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Accept AI
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => resolveItem(item, "mark_incorrect")}
                          className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          Mark Incorrect
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => resolveItem(item, "set_expected_answer")}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          Set Expected Answer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
