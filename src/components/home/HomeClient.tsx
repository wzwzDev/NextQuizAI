"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingQuizzes from "@/components/LoadingQuizzes";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Atom,
  BookOpen,
  Code2,
  Flame,
  Landmark,
  Sigma,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  questionCount?: number;
  questions?: unknown[];
  attemptStatus?: "available" | "pending" | "completed";
  isLocked?: boolean;
  userScore?: number | null;
  userStartedAt?: string | null;
  userCompletedAt?: string | null;
  recommendationScore?: number | null;
  recommendationReason?: string | null;
  categoryMastery?: number | null;
  difficultyReadiness?: number | null;
};

function normalizeFilterValue(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

const categoryIcons: Record<string, LucideIcon> = {
  math: Sigma,
  science: Atom,
  history: Landmark,
  programming: Code2,
};

function getDifficultyChipClass(value?: string) {
  const normalized = normalizeFilterValue(value);
  if (normalized === "easy") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200";
  }

  if (normalized === "medium") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200";
  }

  if (normalized === "hard") {
    return "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200";
  }

  return "bg-muted text-muted-foreground";
}

function getAttemptStatusChipClass(status?: string) {
  const normalized = normalizeFilterValue(status);
  if (normalized === "completed") {
    return "bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900";
  }

  if (normalized === "pending") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200";
  }

  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200";
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
    fetch("/api/quizzes")
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

  const rankedFilteredQuizzes = filteredQuizzes
    .map((quiz, index) => ({ quiz, index }))
    .sort((left, right) => {
      const leftScore =
        typeof left.quiz.recommendationScore === "number"
          ? left.quiz.recommendationScore
          : -1;
      const rightScore =
        typeof right.quiz.recommendationScore === "number"
          ? right.quiz.recommendationScore
          : -1;

      if (leftScore === rightScore) {
        return left.index - right.index;
      }

      return rightScore - leftScore;
    })
    .map(({ quiz }) => quiz);

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
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
      <div className="absolute inset-x-0 top-2 -z-10 h-52 bg-[radial-gradient(circle_at_20%_35%,var(--glow-primary),transparent_65%),radial-gradient(circle_at_90%_15%,var(--glow-secondary),transparent_70%)]" />

      <motion.section
        className="animated-fade-up"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-6 flex flex-col gap-3 sm:mb-8">
          <span className="chip-pill w-fit text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Quiz Library
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Available Quizzes
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Filter by category, difficulty, and quiz type to jump directly into the right challenge.
          </p>
        </div>

        <div className="section-shell mb-6 rounded-2xl p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-sm font-semibold text-foreground">
                Category:
              </label>
              <select
                id="category"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="h-11 rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="difficulty" className="text-sm font-semibold text-foreground">
                Difficulty:
              </label>
              <select
                id="difficulty"
                value={selectedDifficulty || ""}
                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                className="h-11 rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="quizType" className="text-sm font-semibold text-foreground">
                Quiz Type:
              </label>
              <select
                id="quizType"
                value={selectedQuizType || ""}
                onChange={(e) => setSelectedQuizType(e.target.value || null)}
                className="h-11 rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
              >
                <option value="">All</option>
                <option value="mcq">MCQ</option>
                <option value="open_ended">Open Ended</option>
              </select>
            </div>
          </div>
        </div>
      </motion.section>

      {loading && <LoadingQuizzes />}
      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rankedFilteredQuizzes.map((quiz, idx) => {
          const cat = categories.find(
            (c) =>
              normalizeFilterValue(c.name) ===
              normalizeFilterValue(quiz.category),
          );
          const CategoryIcon = categoryIcons[normalizeFilterValue(quiz.category)] || BookOpen;

          return (
            <motion.article
              key={quiz.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: idx * 0.045,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="section-shell lift-hover flex h-full flex-col rounded-2xl p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="animated-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card/80 p-2">
                  {cat && cat.img ? (
                    <Image
                      src={cat.img}
                      alt={cat.name}
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  ) : (
                    <CategoryIcon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <h2 className="font-display text-2xl font-semibold leading-tight text-foreground">
                  {quiz.title}
                </h2>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <span className="chip-pill bg-primary/10 text-primary">
                  Category: {quiz.category}
                </span>
                <span className={`chip-pill ${getDifficultyChipClass(quiz.difficulty)}`}>
                  <Flame className="h-3.5 w-3.5" />
                  Difficulty: {quiz.difficulty}
                </span>
                <span className={`chip-pill ${getAttemptStatusChipClass(quiz.attemptStatus)}`}>
                  Status: {quiz.attemptStatus === "completed" ? "Completed" : quiz.attemptStatus === "pending" ? "Pending" : "Available"}
                </span>
                <span className="chip-pill bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  Type: {formatQuizTypeLabel(quiz.quizType)}
                </span>
                <span className="chip-pill bg-muted text-muted-foreground">
                  Questions: {quiz.questionCount ?? quiz.questions?.length ?? 0}
                </span>
                {typeof quiz.recommendationScore === "number" && quiz.recommendationScore >= 0.7 && (
                  <span className="chip-pill bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                    AI Recommended ({Math.round(quiz.recommendationScore * 100)}%)
                  </span>
                )}
              </div>

              {quiz.recommendationReason && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {quiz.recommendationReason}
                </p>
              )}

              {quiz.isLocked ? (
                <div className="mt-auto space-y-2">
                  <div className="rounded-xl border border-border/70 bg-muted/60 px-4 py-2.5 text-center text-sm font-semibold text-muted-foreground">
                    Completed
                  </div>
                  {typeof quiz.userScore === "number" && (
                    <p className="text-center text-xs text-muted-foreground">
                      Your score: {quiz.userScore}%
                    </p>
                  )}
                </div>
              ) : (
                <Link
                  href={`/playme/${quiz.id}`}
                  className="pulse-focus mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  {quiz.attemptStatus === "pending" ? "Resume Quiz" : "Start Quiz"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </motion.article>
          );
        })}
      </div>

      {!loading && rankedFilteredQuizzes.length === 0 && (
        <div className="section-shell mt-8 rounded-2xl p-6 text-sm text-muted-foreground">
          No quizzes found.
        </div>
      )}
    </div>
  );
}
