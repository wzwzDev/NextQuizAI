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
  const options = normalizeOptions([...(existingOptions ?? []), normalizedAnswer]);
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

export default function QuizReview({
  quiz,
  onApprove,
  onCancel,
}: {
  quiz: AdminQuizDraft;
  onApprove: (quiz: AdminQuizDraft) => void;
  onCancel?: () => void;
}) {
  const initialQuizType = quiz.quizType ?? "open_ended";
  const [editedQuiz, setEditedQuiz] = useState<AdminQuizDraft>({
    ...quiz,
    quizType: initialQuizType,
  });
  const [title, setTitle] = useState(quiz.title || "");
  const [category, setCategory] = useState(
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
    if (!onCancel) {
      return;
    }

    const shouldDiscard = window.confirm(
      "Discard this generated quiz draft? Your unsaved review changes will be lost.",
    );

    if (shouldDiscard) {
      onCancel();
    }
  };

  return (
    <div className="p-6 border rounded-xl bg-white dark:bg-black shadow-md">
      <h2 className="text-2xl font-bold mb-4">Review Quiz</h2>
      <div className="flex gap-4 mb-4 items-center flex-wrap">
        <div>
          <label className="font-semibold mr-2">Title:</label>
          <input
            className="border rounded px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quiz title"
          />
        </div>
        <div>
          <label className="font-semibold mr-2">Category:</label>
          <select
            className="border rounded px-2 py-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold mr-2">Difficulty:</label>
          <select
            className="border rounded px-2 py-1"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {difficulties.map((diff) => (
              <option key={diff}>{diff}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold mr-2">Quiz Type:</label>
          <select
            className="border rounded px-2 py-1"
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
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-2 border">#</th>
              <th className="p-2 border text-left">Question</th>
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
              <tr key={idx} className="hover:bg-blue-50">
                <td className="p-2 border text-center">{idx + 1}</td>
                <td className="p-2 border">
                  {editIdx === idx ? (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={editQ}
                      onChange={(e) => setEditQ(e.target.value)}
                    />
                  ) : (
                    <div className="space-y-1">
                      <div>{q.question}</div>
                      {q.citation && (
                        <div className="text-xs text-slate-600">
                          Source: {q.citation.source} - {q.citation.snippet}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-2 border">
                  {editIdx === idx ? (
                    quizType === "mcq" && editA.length <= 80 && !editA.includes("\n") ? (
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
                    q.answer
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
                      <div className="text-sm text-slate-700 whitespace-pre-line">
                        {(q.options ?? []).join("\n") || "No options"}
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
      <div className="mt-6 flex flex-wrap gap-3">
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
    </div>
  );
}
