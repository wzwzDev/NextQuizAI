"use client";
import React, { useState } from "react";
import {
  AdminQuestion,
  AdminQuizDraft,
  AdminQuizType,
} from "@/components/admin/types";

const categories = ["Math", "Science", "History", "Programming"];
const difficulties = ["easy", "medium", "hard"];
const quizTypes: Array<{ value: AdminQuizType; label: string }> = [
  { value: "open_ended", label: "Open Ended" },
  { value: "mcq", label: "Multiple Choice" },
];
const difficultyDescriptions: Record<string, string> = {
  easy: "Direct recall from a visible fact. Answers should be short and obvious.",
  medium: "Small inference or comparison. Answers can combine two nearby ideas.",
  hard: "Requires broader reasoning. Answers should still be concise but less obvious.",
};
const MIN_AUTO_MCQ_OPTIONS = 4;
const FALLBACK_MCQ_OPTIONS = [
  "None of the above.",
  "All of the above.",
  "Not mentioned in the provided content.",
  "Insufficient information.",
];

function normalizeOptions(values: string[]) {
  return Array.from(
    new Set(values.map((option) => option.trim()).filter(Boolean)),
  );
}

function normalizeOptionKey(value: string) {
  return value.trim().toLowerCase();
}

function buildAutoMcqOptions(
  answer: string,
  allAnswers: string[],
  existingOptions?: string[],
) {
  const normalizedAnswer = answer.trim();
  const options = normalizeOptions([normalizedAnswer, ...(existingOptions ?? [])]);
  const used = new Set(options.map(normalizeOptionKey));

  const distractors = allAnswers
    .map((value) => value.trim())
    .filter(Boolean)
    .filter(
      (value) => normalizeOptionKey(value) !== normalizeOptionKey(normalizedAnswer),
    );

  for (const distractor of distractors) {
    const key = normalizeOptionKey(distractor);
    if (used.has(key)) {
      continue;
    }

    options.push(distractor);
    used.add(key);
    if (options.length >= MIN_AUTO_MCQ_OPTIONS) {
      return options;
    }
  }

  for (const fallbackOption of FALLBACK_MCQ_OPTIONS) {
    const key = normalizeOptionKey(fallbackOption);
    if (used.has(key)) {
      continue;
    }

    options.push(fallbackOption);
    used.add(key);
    if (options.length >= MIN_AUTO_MCQ_OPTIONS) {
      return options;
    }
  }

  return options;
}

function parseOptionsInput(input: string) {
  return normalizeOptions(input.split(/\r?\n|[,;|]/));
}

function optionsToEditorText(options?: string[]) {
  if (!Array.isArray(options)) {
    return "";
  }

  return options.join("\n");
}

function getRegenerationStatusClass(
  isRegenerating: boolean,
  hasError: boolean,
): string {
  if (isRegenerating) return "text-amber-600";
  if (hasError) return "text-red-600";
  return "text-blue-600";
}

function getRegenerationStatusMessage(
  isRegenerating: boolean,
  regenerationError: string | null,
): string {
  if (isRegenerating) return "Regenerating...";
  if (regenerationError) return `Error: ${regenerationError}`;
  return "";
}

function shouldUseInputForAnswer(
  isEditing: boolean,
  currentIdx: number,
  editIdx: number | null,
  quizType: AdminQuizType,
  editA: string,
): boolean {
  if (!isEditing || editIdx !== currentIdx) return false;
  return quizType === "mcq" && editA.length <= 80 && !editA.includes("\n");
}

export default function QuizReview({
  quiz,
  onApprove,
  onCancel,
}: Readonly<{
  quiz: AdminQuizDraft;
  onApprove: (quiz: AdminQuizDraft) => void;
  onCancel?: () => void;
}>) {
  const initialQuizType = quiz.quizType ?? "open_ended";
  const [editedQuiz, setEditedQuiz] = useState<AdminQuizDraft>({
    ...quiz,
    quizType: initialQuizType,
  });
  const [title, setTitle] = useState(quiz.title || "");
  const [category] = useState(
    quiz.category && categories.includes(quiz.category)
      ? quiz.category
      : categories[0],
  );
  const [difficulty, setDifficulty] = useState(
    quiz.difficulty && difficulties.includes(quiz.difficulty)
      ? quiz.difficulty
      : difficulties[0],
  );
  const [quizType, setQuizType] = useState<AdminQuizType>(initialQuizType);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [editOptionsText, setEditOptionsText] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<any>(null);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [isRegeneratingDifficulty, setIsRegeneratingDifficulty] = useState(false);
  const [regenerationError, setRegenerationError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const currentDifficultyDescription =
    difficultyDescriptions[difficulty] ??
    "The generated questions should remain concise, reviewable, and clearly tied to the source content.";

  const questions = Array.isArray(editedQuiz?.questions)
    ? editedQuiz.questions
    : [];

  const updateQuestions =
    (updater: (currentQuestions: AdminQuestion[]) => AdminQuestion[]) => {
      setEditedQuiz((prev) => {
        const baseQuestions = Array.isArray(prev.questions) ? prev.questions : [];
        return {
          ...prev,
          questions: updater([...baseQuestions]),
        };
      });
    };

  const handleQuizTypeChange = (nextType: AdminQuizType) => {
    setQuizType(nextType);
    setEditIdx(null);
    updateQuestions((currentQuestions) => {
      const answersPool = currentQuestions
        .map((question) => question.answer.trim())
        .filter(Boolean);

      return currentQuestions.map((question) => {
        if (nextType === "mcq") {
          const nextOptions = buildAutoMcqOptions(
            question.answer,
            answersPool,
            question.options,
          );

          return {
            ...question,
            options: nextOptions,
          };
        }

        return {
          ...question,
          options: undefined,
        };
      });
    });
  };

  const handleDifficultyChange = async (newDifficulty: string) => {
    if (newDifficulty === difficulty) {
      return; // No change
    }

    setIsRegeneratingDifficulty(true);
    setRegenerationError(null);

    try {
      const response = await fetch("/api/adjust-questions-difficulty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: questions,
          difficulty: newDifficulty,
          category: category,
          quizType: quizType,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to adjust questions difficulty";
        try {
          const errorData = await response.json();
          // Use details field if available for more specific error, otherwise use error field
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch {
          // Response is not JSON (might be HTML error page)
          const text = await response.text();
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            errorMessage = `Server error (${response.status}): Check server logs for details`;
          } else {
            errorMessage = `Request failed with status ${response.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid JSON response from server");
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response structure: missing questions");
      }

      setDifficulty(newDifficulty);
      updateQuestions(() => data.questions);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to regenerate questions";
      setRegenerationError(errorMessage);
      console.error("Error changing difficulty:", error);
    } finally {
      setIsRegeneratingDifficulty(false);
    }
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditQ(questions[idx].question);
    setEditA(questions[idx].answer);
    setEditOptionsText(optionsToEditorText(questions[idx].options));
  };

  const handleSave = (idx: number) => {
    const normalizedQuestion = editQ.trim();
    const normalizedAnswer = editA.trim();

    updateQuestions((currentQuestions) => {
      const next = [...currentQuestions];
      const existingQuestion = next[idx];
      if (!existingQuestion) {
        return next;
      }

      let options: string[] | undefined = undefined;
      if (quizType === "mcq") {
        const typedOptions = parseOptionsInput(editOptionsText);
        const answersPool = next
          .map((question, questionIndex) =>
            questionIndex === idx ? normalizedAnswer : question.answer.trim(),
          )
          .filter(Boolean);

        const optionsWithAnswer = buildAutoMcqOptions(
          normalizedAnswer,
          answersPool,
          typedOptions,
        );
        options = optionsWithAnswer;
      }

      next[idx] = {
        ...existingQuestion,
        question: normalizedQuestion,
        answer: normalizedAnswer,
        options,
      };

      return next;
    });

    setEditIdx(null);
  };

  const handleDelete = (idx: number) => {
    updateQuestions((currentQuestions) => {
      const next = [...currentQuestions];
      next.splice(idx, 1);
      return next;
    });
    if (editIdx === idx) setEditIdx(null);
  };

  const handleApprove = () => {
    const answersPool = questions
      .map((question) => question.answer.trim())
      .filter(Boolean);

    const preparedQuestions = questions.map((question) => {
      const normalizedQuestion = question.question.trim();
      const normalizedAnswer = question.answer.trim();

      if (quizType === "mcq") {
        const normalizedOptions = buildAutoMcqOptions(
          normalizedAnswer,
          answersPool,
          question.options,
        );

        return {
          question: normalizedQuestion,
          answer: normalizedAnswer,
          options: normalizedOptions,
          ...(question.citation ? { citation: question.citation } : {}),
        };
      }

      return {
        question: normalizedQuestion,
        answer: normalizedAnswer,
        ...(question.citation ? { citation: question.citation } : {}),
      };
    });

    onApprove({
      ...editedQuiz,
      title: title.trim(),
      category,
      difficulty,
      quizType,
      questions: preparedQuestions,
    });
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    if (onCancel) {
      onCancel();
    }
  };

  const rejectCancel = () => {
    setShowCancelDialog(false);
  };

  return (
    <div className="p-6 border rounded-xl bg-white dark:bg-black shadow-md max-h-[80vh] overflow-y-auto flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Review Quiz</h2>
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <p className="font-semibold text-slate-900 dark:text-white">Review guide</p>
        <p className="mt-1">
          Generated answers are displayed explicitly in the <span className="font-semibold">Correct Answer</span> column. For MCQ quizzes, the answer is also kept among the options and highlighted below.
        </p>
        <p className="mt-2">
          <span className="font-semibold">Difficulty:</span> {difficulty} - {currentDifficultyDescription}
        </p>
      </div>
      <div className="flex gap-4 mb-4 items-center flex-wrap">
        {/* Title - EDITABLE */}
        <div>
          <label htmlFor="quiz-title" className="font-semibold mr-2 text-slate-900 text-sm">Title:</label>
          <input
            id="quiz-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-blue-400 rounded px-3 py-2 bg-white text-slate-900 font-medium transition hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            placeholder="Enter quiz title..."
          />
          <p className="text-xs text-slate-500 mt-1">✏️ Editable</p>
        </div>

        {/* Category - READ ONLY */}
        <div>
          <label htmlFor="quiz-category" className="font-semibold mr-2 text-slate-600 text-sm">Category:</label>
          <div id="quiz-category" className="bg-slate-100 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium cursor-not-allowed opacity-75">
            {category}
          </div>
          <p className="text-xs text-slate-500 mt-1">📌 Fixed after upload</p>
        </div>

        {/* Difficulty - EDITABLE */}
        <div>
          <label htmlFor="quiz-difficulty" className="font-semibold mr-2 text-slate-900 text-sm">Difficulty:</label>
          <select
            id="quiz-difficulty"
            className={`border rounded px-3 py-2 bg-white text-slate-900 font-medium transition ${
              isRegeneratingDifficulty
                ? "border-amber-400 opacity-60 cursor-wait"
                : "border-blue-400 hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            }`}
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value)}
            disabled={isRegeneratingDifficulty}
          >
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
          <p className={`text-xs mt-1 ${getRegenerationStatusClass(
            isRegeneratingDifficulty,
            !!regenerationError,
          )}`}>
            {getRegenerationStatusMessage(
              isRegeneratingDifficulty,
              regenerationError,
            )}
          </p>
        </div>

        {/* Quiz Type - EDITABLE */}
        <div>
          <label htmlFor="quiz-type-select" className="font-semibold mr-2 text-slate-900 text-sm">Quiz Type:</label>
          <select
            id="quiz-type-select"
            className="border border-blue-400 rounded px-3 py-2 bg-white text-slate-900 font-medium hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition"
            value={quizType}
            onChange={(event) =>
              handleQuizTypeChange(event.target.value as AdminQuizType)
            }
          >
            {quizTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-600 mt-1">✏️ Editable</p>
        </div>
      </div>

      {/* Error Alert */}
      {regenerationError && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-start">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <h3 className="font-bold text-red-900">Failed to regenerate questions</h3>
              <p className="text-red-800 text-sm mt-1">{regenerationError}</p>
              <button
                onClick={() => setRegenerationError(null)}
                className="text-red-700 hover:text-red-900 font-semibold text-sm mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="min-w-full border rounded-lg">
          <thead>
            <tr className="bg-blue-100 sticky top-0">
              <th className="p-2 border">#</th>
              <th className="p-2 border text-left">Question</th>
              <th className="p-2 border text-left">Source (Citation)</th>
              <th className="p-2 border text-left">
                {quizType === "mcq" ? "Correct Answer" : "Answer"}
              </th>
              {quizType === "mcq" && (
                <th className="p-2 border text-left">Options</th>
              )}
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q: AdminQuestion, idx: number) => (
              <tr key={`${q.question}-${idx}`} className="hover:bg-blue-50">
                <td className="p-2 border text-center">{idx + 1}</td>
                
                {/* Question Column */}
                <td className="p-2 border">
                  {editIdx === idx ? (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={editQ}
                      onChange={(e) => setEditQ(e.target.value)}
                    />
                  ) : (
                    <div className="text-sm text-slate-900 font-medium">
                      {q.question}
                    </div>
                  )}
                </td>

                {/* Citation Column - NOW VISIBLE & CLICKABLE */}
                <td className="p-2 border align-top">
                  {q.citation ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedCitation(q.citation);
                          setShowCitationModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md transition cursor-pointer"
                      >
                        <span className="text-lg">📄</span>
                        <div className="text-xs text-left">
                          <div className="font-semibold text-amber-900">{q.citation.source}</div>
                          <div className="text-amber-700 italic truncate">{q.citation.snippet?.substring(0, 40)}...</div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 bg-slate-50 rounded px-2 py-1">
                      No source
                    </div>
                  )}
                </td>
                
                {/* Answer Column */}
                <td className="p-2 border align-top">
                  {editIdx === idx ? (
                  shouldUseInputForAnswer(true, idx, editIdx, quizType, editA) ? (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={editA}
                      onChange={(e) => setEditA(e.target.value)}
                    />
                  ) : (
                    <textarea
                      className="border rounded px-2 py-1 w-full min-h-24 whitespace-pre-wrap"
                      value={editA}
                      onChange={(e) => setEditA(e.target.value)}
                      placeholder="Type or paste the full expected output"
                    />
                  )
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {quizType === "mcq" ? "Correct answer" : "Expected answer"}
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                        {q.answer || "No answer"}
                      </div>
                    </div>
                  )}
                </td>
                {quizType === "mcq" && (
                  <td className="p-2 border align-top">
                    {editIdx === idx ? (
                      <textarea
                        className="border rounded px-2 py-1 w-full min-h-24"
                        value={editOptionsText}
                        onChange={(event) =>
                          setEditOptionsText(event.target.value)
                        }
                        placeholder="One option per line or separated by commas"
                      />
                    ) : (
                      <div className="space-y-2 text-sm">
                        {(q.options ?? []).length > 0 ? (
                          <div className="space-y-2">
                            {(q.options ?? []).map((option) => {
                              const isCorrect =
                                option.trim().toLowerCase() === q.answer.trim().toLowerCase();
                              return (
                                <div
                                  key={option}
                                  className={
                                    isCorrect
                                      ? "rounded-md border-2 border-emerald-400 bg-emerald-50 px-3 py-2 font-semibold text-emerald-900 shadow-md flex items-start gap-2"
                                      : "rounded-md border border-slate-300 bg-white px-3 py-2 flex items-start gap-2 hover:bg-slate-50"
                                  }
                                >
                                  <span
                                    className={
                                      isCorrect
                                        ? "text-emerald-700 font-bold text-lg"
                                        : "text-slate-400 text-lg"
                                    }
                                  >
                                    {isCorrect ? "✓" : "○"}
                                  </span>
                                  <span className="flex-1">{option}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-300 rounded-md px-3 py-2 text-red-700 font-semibold text-xs">
                            ⚠️ No options generated yet
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                )}
                <td className="p-2 border text-center space-x-2">
                  {editIdx === idx ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={() => handleSave(idx)}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                        onClick={() => setEditIdx(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => handleEdit(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => handleDelete(idx)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td
                  colSpan={quizType === "mcq" ? 5 : 4}
                  className="text-center text-gray-400 py-4"
                >
                  No questions available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 sticky bottom-0 bg-white dark:bg-black pt-4 border-t">
        <button
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          onClick={handleApprove}
        >
          Approve & Save
        </button>
        {onCancel && (
          <button
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Citation Detail Modal */}
      {showCitationModal && selectedCitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-amber-100 dark:bg-amber-900 border-b border-amber-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Source Details</h3>
              </div>
              <button
                onClick={() => setShowCitationModal(false)}
                className="text-2xl font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Source Name */}
              <div className="border-b pb-4">
                <div className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2" role="heading" aria-level={3}>
                  📋 Source File
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-3 font-semibold text-blue-900 dark:text-blue-100 break-words">
                  {selectedCitation.source || "Unknown source"}
                </div>
              </div>

              {/* Snippet */}
              <div className="border-b pb-4">
                <div className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2" role="heading" aria-level={3}>
                  ✂️ Text Snippet
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed font-mono text-sm max-h-48 overflow-y-auto">
                  {selectedCitation.snippet || "No snippet available"}
                </div>
              </div>

              {/* Additional Details */}
              {selectedCitation.page && (
                <div className="border-b pb-4">
                  <div className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2" role="heading" aria-level={3}>
                    📖 Page Number
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg px-4 py-3 font-semibold text-green-900 dark:text-green-100">
                    {selectedCitation.page}
                  </div>
                </div>
              )}

              {selectedCitation.lineNumber && (
                <div className="border-b pb-4">
                  <div className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2" role="heading" aria-level={3}>
                    🔢 Line Number
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 border border-purple-300 dark:border-purple-700 rounded-lg px-4 py-3 font-semibold text-purple-900 dark:text-purple-100">
                    {selectedCitation.lineNumber}
                  </div>
                </div>
              )}

              {selectedCitation.context && (
                <div className="border-b pb-4">
                  <div className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2" role="heading" aria-level={3}>
                    🔗 Full Context
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed text-sm max-h-56 overflow-y-auto">
                    {selectedCitation.context}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCitationModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full">
            {/* Dialog Header */}
            <div className="bg-amber-100 dark:bg-amber-900 border-b border-amber-300 px-6 py-4">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Cancel Review?</h3>
            </div>

            {/* Dialog Body */}
            <div className="px-6 py-4">
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to discard this quiz review? Your unsaved changes will be lost.
              </p>
            </div>

            {/* Dialog Footer */}
            <div className="bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={rejectCancel}
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

