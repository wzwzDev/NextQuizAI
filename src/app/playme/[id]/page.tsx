"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
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
  const [attemptsAllowed, setAttemptsAllowed] = useState<number | null>(null);
  const [attemptsCompleted, setAttemptsCompleted] = useState<number | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

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
    setAttemptsAllowed(null);
    setAttemptsCompleted(null);
    setAttemptsRemaining(null);

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
          if (data?.attempts && typeof data.attempts === "object") {
            const attempts = data.attempts as {
              allowed?: unknown;
              completed?: unknown;
              remaining?: unknown;
            };
            setAttemptsAllowed(typeof attempts.allowed === "number" ? attempts.allowed : null);
            setAttemptsCompleted(typeof attempts.completed === "number" ? attempts.completed : null);
            setAttemptsRemaining(typeof attempts.remaining === "number" ? attempts.remaining : null);
          }
          setError(data?.error || "You already completed this quiz.");
          toast({
            title: "Quiz already completed",
            description: "You can review your score and return to home.",
          });
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
          if (data?.attempts && typeof data.attempts === "object") {
            const attempts = data.attempts as {
              allowed?: unknown;
              completed?: unknown;
              remaining?: unknown;
            };
            setAttemptsAllowed(typeof attempts.allowed === "number" ? attempts.allowed : null);
            setAttemptsCompleted(typeof attempts.completed === "number" ? attempts.completed : null);
            setAttemptsRemaining(typeof attempts.remaining === "number" ? attempts.remaining : null);
          }
          setQuiz(parsedQuiz);
          setUserAnswers(Array(questions.length).fill(""));
          toast({
            title: data?.attemptStatus === "pending" ? "Quiz resumed" : "Quiz started",
            description:
              data?.attemptStatus === "pending"
                ? "Continue where you left off."
                : "Good luck. Your quiz is ready.",
            variant: "success",
          });
        } else {
          setError(data?.error || "Quiz not found.");
          toast({
            title: "Could not load quiz",
            description: data?.error || "Quiz not found.",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        setError("Failed to load quiz.");
        toast({
          title: "Network error",
          description: "Failed to load quiz.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [quizId, toast]);

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
        toast({
          title: "Quiz submitted",
          description: "Your results are ready.",
          variant: "success",
        });
      } catch (submissionError) {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to submit quiz.";
        setSubmitError(message);
        toast({
          title: "Submission failed",
          description: message,
          variant: "destructive",
        });
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
            {typeof attemptsCompleted === "number" && typeof attemptsAllowed === "number" && (
              <p className="mb-3 text-gray-600">
                Attempt {attemptsCompleted} of {attemptsAllowed} completed
              </p>
            )}
            {typeof attemptsRemaining === "number" && attemptsRemaining > 0 && (
              <p className="mb-4 text-green-700 font-semibold">
                You have {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} left!
              </p>
            )}
            <div className="flex gap-2">
              {typeof attemptsRemaining === "number" && attemptsRemaining > 0 && (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                  onClick={() => {
                    setAttemptStatus("available");
                    setCompletedScore(null);
                    setAttemptsAllowed(null);
                    setAttemptsCompleted(null);
                    setAttemptsRemaining(null);
                    setCurrent(0);
                    setUserAnswers([]);
                    setError(null);
                    setQuiz(null);
                    setLoading(true);
                    fetch(`/api/start-quiz?id=${encodeURIComponent(quizId)}`)
                      .then(async (res) => {
                        const data = await res.json();
                        return { ok: res.ok, data };
                      })
                      .then(({ ok, data }) => {
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
                            category: typeof rawQuiz.category === "string" ? rawQuiz.category : "Uncategorized",
                            difficulty: typeof rawQuiz.difficulty === "string" ? rawQuiz.difficulty : "Unknown",
                            quizType: parseQuizType(rawQuiz.quizType),
                            questions,
                          };
                          setAttemptStatus(data?.attemptStatus === "pending" ? "pending" : "available");
                          if (data?.attempts && typeof data.attempts === "object") {
                            const attempts = data.attempts as {
                              allowed?: unknown;
                              completed?: unknown;
                              remaining?: unknown;
                            };
                            setAttemptsAllowed(typeof attempts.allowed === "number" ? attempts.allowed : null);
                            setAttemptsCompleted(typeof attempts.completed === "number" ? attempts.completed : null);
                            setAttemptsRemaining(typeof attempts.remaining === "number" ? attempts.remaining : null);
                          }
                          setQuiz(parsedQuiz);
                          setUserAnswers(Array(questions.length).fill(""));
                          toast({
                            title: "Quiz reloaded",
                            description: "Ready for attempt 2. Good luck!",
                            variant: "success",
                          });
                        }
                      })
                      .catch(() => {
                        setError("Failed to reload quiz.");
                        toast({
                          title: "Error",
                          description: "Failed to reload quiz.",
                          variant: "destructive",
                        });
                      })
                      .finally(() => setLoading(false));
                  }}
                >
                  Try Again
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                onClick={handleGoHome}
              >
                Back to Quizzes
              </button>
            </div>
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
  const answeredCount = userAnswers.filter((answer) => answer.trim().length > 0).length;
  const totalQuestions = quiz.questions.length;
  const remainingQuestions = Math.max(totalQuestions - answeredCount, 0);
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <main className="p-8 mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow dark:border-gray-700 dark:bg-black">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Progress</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{progress}%</p>
        </div>
        <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow dark:border-gray-700 dark:bg-black">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Answered</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{answeredCount}</p>
        </div>
        <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow dark:border-gray-700 dark:bg-black">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Remaining</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{remainingQuestions}</p>
        </div>
      </div>
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
            {typeof attemptsCompleted === "number" && typeof attemptsAllowed === "number" && (
              <p className="mb-4 text-sm text-gray-600">
                Attempt {attemptsCompleted} of {attemptsAllowed}
              </p>
            )}
            <ul className="text-left mb-4 max-h-96 overflow-y-auto">
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
            <div className="flex gap-2 justify-center">
              {typeof attemptsRemaining === "number" && attemptsRemaining > 0 && (
                <button
                  className="mt-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold"
                  onClick={() => {
                    setShowFinish(false);
                    setResult(null);
                    setAttemptStatus("available");
                    setCompletedScore(null);
                    setCurrent(0);
                    setUserAnswers([]);
                    setError(null);
                  }}
                >
                  Try Again
                </button>
              )}
              <button
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-bold"
                onClick={handleGoHome}
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
