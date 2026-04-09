"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { similarity } from "@/lib/utils";

type Question = {
  question: string;
  answer: string;
};

type Quiz = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  questions: Question[];
};

//Similarity with a threshold for flexible answer checking
function isAnswerCorrect(user: string, actual: string) {
  return similarity(user, actual) >= 0.8; // Accept answers with 80% similarity
}

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

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/start-quiz?id=${encodeURIComponent(quizId)}`)
      .then(async (res) => {
        const data = await res.json();
        return { ok: res.ok, data };
      })
      .then((data) => {
        if (data.ok && data.data?.quiz) {
          setQuiz(data.data.quiz);
          setUserAnswers(Array(data.data.quiz.questions.length).fill(""));
        } else {
          setError(data.data?.error || "Quiz not found.");
        }
      })
      .catch(() => setError("Failed to load quiz."))
      .finally(() => setLoading(false));
  }, [quizId]);

  // Save the user's quiz attempt to the database
  async function saveQuizAttempt() {
    // Get the user session (adjust if you use a different auth system)
    const session = await fetch("/api/auth/session").then((res) => res.json());
    if (!session?.user?.id) return;

    // Calculate score
    const correctCount = quiz!.questions.reduce(
      (acc, q, i) => acc + (isAnswerCorrect(userAnswers[i], q.answer) ? 1 : 0),
      0,
    );
    const score = (correctCount / quiz!.questions.length) * 100;

    await fetch("/api/user-quiz-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        quizId: quiz!.id,
        quizTitle: quiz!.title,
        answers: userAnswers,
        score,
      }),
    });
  }

  const handleInput = (val: string) => {
    setUserAnswers((prev) => {
      const copy = [...prev];
      copy[current] = val;
      return copy;
    });
  };

  const handleNext = async () => {
    if (current === quiz!.questions.length - 1) {
      setShowFinish(true);
      await saveQuizAttempt();
    } else {
      setCurrent((prev) => Math.min(prev + 1, quiz!.questions.length - 1));
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
      </main>
    );
  }

  if (!quiz) {
    return null;
  }

  const question = quiz.questions[current];

  return (
    <main className="p-8 mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
      <div className="mb-2 text-gray-600">
        Category: {quiz.category} | Difficulty: {quiz.difficulty}
      </div>
      {!showFinish ? (
        <div className="mb-6">
          <div className="text-lg font-semibold mb-2">
            Question {current + 1} of {quiz.questions.length}
          </div>
          <div className="mb-4">{question.question}</div>
          <input
            type="text"
            className="border px-3 py-2 rounded w-full mb-2"
            placeholder="Type your answer..."
            value={userAnswers[current] || ""}
            onChange={(e) => handleInput(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
              onClick={handlePrev}
              disabled={current === 0}
            >
              Previous
            </button>
            <button
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={handleNext}
              disabled={userAnswers[current].trim() === ""}
            >
              {current === quiz.questions.length - 1 ? "Finish" : "Next"}
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
            <ul className="text-left mb-4">
              {quiz.questions.map((q, i) => (
                <li key={i} className="mb-2">
                  <span className="font-semibold">
                    {i + 1}. {q.question}
                  </span>
                  <br />
                  <span>
                    Your answer:{" "}
                    <span
                      className={
                        isAnswerCorrect(userAnswers[i], q.answer)
                          ? "text-green-700 font-bold"
                          : "text-red-700 font-bold"
                      }
                    >
                      {userAnswers[i] || <em>No answer</em>}
                    </span>
                  </span>
                  {!isAnswerCorrect(userAnswers[i], q.answer) && (
                    <span className="ml-2 text-gray-600">
                      (Correct: <span className="underline">{q.answer}</span>)
                    </span>
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
