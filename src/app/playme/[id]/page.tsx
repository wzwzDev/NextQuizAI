"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  options: string[];
  citation?: {
    source: string;
    snippet: string;
    confidence?: number;
  };
};

type QuizType = "mcq" | "open_ended";

type QuestionResult = {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  percentageSimilar: number;
  isAccepted: boolean;
  gradingMethod: "typo_tolerant" | "exact_match";
  confidence?: number;
  confidenceLevel?: "low" | "medium" | "high";
  decisionReason?: string;
  reviewRequired?: boolean;
};

type QuizResult = {
  quizId: string;
  title: string;
  quizType: QuizType;
  score: number;
  questionResults: QuestionResult[];
};

type Quiz = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  quizType: QuizType;
  questions: Question[];
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showFinish, setShowFinish] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<
    "available" | "pending" | "completed"
  >("available");
  const [completedScore, setCompletedScore] = useState<number | null>(null);

  function parseQuizType(value: unknown): QuizType {
    return value === "mcq" ? "mcq" : "open_ended";
  }

  function parseQuestion(rawQuestion: unknown, index: number): Question {
    if (!rawQuestion || typeof rawQuestion !== "object") {
      return {
        id: `q-${index}`,
        question: "",
        options: [],
      };
    }

    const candidate = rawQuestion as {
      id?: unknown;
      question?: unknown;
      options?: unknown;
      citation?: unknown;
    };

    const options = Array.isArray(candidate.options)
      ? candidate.options.filter((option): option is string => typeof option === "string")
      : [];

    const citation =
      candidate.citation && typeof candidate.citation === "object"
        ? (candidate.citation as {
            source?: unknown;
            snippet?: unknown;
            confidence?: unknown;
          })
        : null;

    const normalizedCitation =
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
        : undefined;

    return {
      id: typeof candidate.id === "string" ? candidate.id : `q-${index}`,
      question: typeof candidate.question === "string" ? candidate.question : "",
      options,
      ...(normalizedCitation ? { citation: normalizedCitation } : {}),
    };
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSubmitError(null);
    setResult(null);
    setShowFinish(false);
    setCurrent(0);
    setAttemptStatus("available");
    setCompletedScore(null);

    fetch(`/api/start-quiz?id=${encodeURIComponent(quizId)}`)
      .then(async (res) => {
        const data = await res.json();
        return { ok: res.ok, data };
      })
      .then(({ ok, data }) => {
        if (!ok && data?.attemptStatus === "completed") {
          setAttemptStatus("completed");
          setCompletedScore(
            typeof data?.score === "number" ? data.score : null,
          );
          setError(data?.error || "You already completed this quiz.");
          return;
        }

        if (ok && data?.quiz) {
          const rawQuiz = data.quiz as {
            id?: unknown;
            title?: unknown;
            category?: unknown;
            difficulty?: unknown;
            quizType?: unknown;
            questions?: unknown;
          };

          const questions = Array.isArray(rawQuiz.questions)
            ? rawQuiz.questions.map((rawQuestion, index) =>
                parseQuestion(rawQuestion, index),
              )
            : [];

          const parsedQuiz: Quiz = {
            id: typeof rawQuiz.id === "string" ? rawQuiz.id : quizId,
            title: typeof rawQuiz.title === "string" ? rawQuiz.title : "Untitled Quiz",
            category:
              typeof rawQuiz.category === "string" ? rawQuiz.category : "Uncategorized",
            difficulty:
              typeof rawQuiz.difficulty === "string" ? rawQuiz.difficulty : "Unknown",
            quizType: parseQuizType(rawQuiz.quizType),
            questions,
          };

          setAttemptStatus(data?.attemptStatus === "pending" ? "pending" : "available");
          setQuiz(parsedQuiz);
          setUserAnswers(Array(questions.length).fill(""));
        } else {
          setError(data?.error || "Quiz not found.");
        }
      })
      .catch(() => setError("Failed to load quiz."))
      .finally(() => setLoading(false));
  }, [quizId]);

  async function submitQuizAttempt() {
    if (!quiz) {
      return;
    }

    const response = await fetch("/api/start-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: quiz.id,
        answers: userAnswers,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload && typeof payload.error === "string"
          ? payload.error
          : "Failed to submit quiz.";
      throw new Error(message);
    }

    const parsedResult = payload as QuizResult;
    setResult(parsedResult);
    setAttemptStatus("completed");
  }

  const handleInput = (val: string) => {
    setUserAnswers((prev) => {
      const copy = [...prev];
      copy[current] = val;
      return copy;
    });
  };

  const handleNext = async () => {
    if (!quiz) {
      return;
    }

    if (current === quiz.questions.length - 1) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await submitQuizAttempt();
        setShowFinish(true);
      } catch (submissionError) {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to submit quiz.";
        setSubmitError(message);
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrent((prev) => Math.min(prev + 1, quiz.questions.length - 1));
      setSubmitError(null);
    }
  };

  const handlePrev = () => {
    setCurrent((prev) => Math.max(prev - 1, 0));
  };

  const handleGoHome = () => {
    router.push("/home");
  };

  if (loading) {
    return (
      <main className="p-8 mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Loading quiz...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8 mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-4 text-red-600">{error}</h1>
        {attemptStatus === "completed" && (
          <>
            {typeof completedScore === "number" && (
              <p className="mb-3 text-gray-700">Your score: {completedScore}%</p>
            )}
            <button
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={handleGoHome}
            >
              Go to Home
            </button>
          </>
        )}
      </main>
    );
  }

  if (!quiz) {
    return null;
  }

  const question = quiz.questions[current];
  const hasAnswer = userAnswers[current]?.trim().length > 0;

  return (
    <main className="p-8 mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
      <div className="mb-2 text-gray-600">
        Category: {quiz.category} | Difficulty: {quiz.difficulty} | Type: {quiz.quizType === "mcq" ? "Multiple Choice" : "Open Ended"}
      </div>
      <div className="mb-4 text-sm text-gray-500">
        Attempt Status: {attemptStatus === "pending" ? "Pending" : "In Progress"}
      </div>
      {!showFinish ? (
        <div className="mb-6">
          <div className="text-lg font-semibold mb-2">
            Question {current + 1} of {quiz.questions.length}
          </div>
          <div className="mb-4">{question.question}</div>
          {question.citation && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Source: {question.citation.source} - {question.citation.snippet}
              {typeof question.citation.confidence === "number" && (
                <span className="ml-2">(Citation confidence: {Math.round(question.citation.confidence * 100)}%)</span>
              )}
            </div>
          )}
          {quiz.quizType === "mcq" ? (
            <div className="mb-4 space-y-2">
              {question.options.length > 0 ? (
                question.options.map((option) => (
                  <label
                    key={`${question.id}-${option}`}
                    className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={userAnswers[current] === option}
                      onChange={(event) => handleInput(event.target.value)}
                    />
                    <span>{option}</span>
                  </label>
                ))
              ) : (
                <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
                  No answer options are available for this question.
                </div>
              )}
            </div>
          ) : (
            <input
              type="text"
              className="border px-3 py-2 rounded w-full mb-2"
              placeholder="Type your answer..."
              value={userAnswers[current] || ""}
              onChange={(e) => handleInput(e.target.value)}
            />
          )}
          {submitError && (
            <p className="mb-2 text-red-600 text-sm">{submitError}</p>
          )}
          <div className="flex gap-2">
            <button
              className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
              onClick={handlePrev}
              disabled={current === 0 || submitting}
            >
              Previous
            </button>
            <button
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={handleNext}
              disabled={!hasAnswer || submitting}
            >
              {submitting
                ? "Submitting..."
                : current === quiz.questions.length - 1
                  ? "Finish"
                  : "Next"}
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-8 rounded shadow text-center max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">
              Quiz Finished!
            </h2>
            <p className="mb-4">Here are your results:</p>
            <p className="mb-4 font-semibold">Score: {result?.score ?? 0}%</p>
            <ul className="text-left mb-4">
              {(result?.questionResults ?? []).map((questionResult, i) => (
                <li key={i} className="mb-2">
                  <span className="font-semibold">
                    {i + 1}. {questionResult.question}
                  </span>
                  <br />
                  <span>
                    Your answer:{" "}
                    <span
                      className={
                        questionResult.isAccepted
                          ? "text-green-700 font-bold"
                          : "text-red-700 font-bold"
                      }
                    >
                      {questionResult.userAnswer || <em>No answer</em>}
                    </span>
                  </span>
                  {!questionResult.isAccepted && (
                    <span className="ml-2 text-gray-600">
                      (Correct: <span className="underline">{questionResult.expectedAnswer}</span>)
                    </span>
                  )}
                  {typeof questionResult.confidence === "number" && (
                    <div className="text-xs text-gray-600">
                      AI confidence: {Math.round(questionResult.confidence * 100)}%
                      {questionResult.confidenceLevel
                        ? ` (${questionResult.confidenceLevel})`
                        : ""}
                      {questionResult.reviewRequired ? " - flagged for admin review" : ""}
                    </div>
                  )}
                  {questionResult.decisionReason && (
                    <div className="text-xs text-gray-500">Reason: {questionResult.decisionReason}</div>
                  )}
                </li>
              ))}
            </ul>
            <button
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-bold"
              onClick={handleGoHome}
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
