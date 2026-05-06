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
  createdAt?: string | null;
  updatedAt?: string | null;
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

const QUIZZES_PER_PAGE = 9;

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

function toTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatShortDate(value?: string | null) {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return "Unknown date";
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isCompletedAttempt(status?: string) {
  return normalizeFilterValue(status) === "completed";
}

function getCreatedTimestamp(quiz: Quiz) {
  return toTimestamp(quiz.createdAt ?? null);
}

function sortByCreatedAtDesc(left: Quiz, right: Quiz) {
  const leftTimestamp = getCreatedTimestamp(left);
  const rightTimestamp = getCreatedTimestamp(right);

  if (leftTimestamp === rightTimestamp) {
    return left.title.localeCompare(right.title);
  }

  return rightTimestamp - leftTimestamp;
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
  const [showCompleted, setShowCompleted] = useState(true);
  const [availablePage, setAvailablePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

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

  useEffect(() => {
    setAvailablePage(1);
    setCompletedPage(1);
  }, [selectedCategory, selectedDifficulty, selectedQuizType, showCompleted]);

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

  const availableFilteredQuizzes = filteredQuizzes
    .filter((quiz) => !isCompletedAttempt(quiz.attemptStatus))
    .sort(sortByCreatedAtDesc);

  const completedFilteredQuizzes = filteredQuizzes
    .filter((quiz) => isCompletedAttempt(quiz.attemptStatus))
    .sort(sortByCreatedAtDesc);

  const visibleCompletedQuizzes = showCompleted
    ? completedFilteredQuizzes
    : [];

  const availableTotalPages = Math.max(
    1,
    Math.ceil(availableFilteredQuizzes.length / QUIZZES_PER_PAGE),
  );
  const completedTotalPages = Math.max(
    1,
    Math.ceil(visibleCompletedQuizzes.length / QUIZZES_PER_PAGE),
  );

  const pagedAvailableQuizzes = availableFilteredQuizzes.slice(
    (availablePage - 1) * QUIZZES_PER_PAGE,
    availablePage * QUIZZES_PER_PAGE,
  );
  const pagedCompletedQuizzes = visibleCompletedQuizzes.slice(
    (completedPage - 1) * QUIZZES_PER_PAGE,
    completedPage * QUIZZES_PER_PAGE,
  );

  const filterCategoryOptions = Array.from(
    new Set([
      ...categories.map((category) => category.name),
      ...quizzes
        .map((quiz) => quiz.category)
        .filter((category): category is string => Boolean(category?.trim())),
    ]),
  ).sort((left, right) => left.localeCompare(right));

  const categoryProgress = quizzes.reduce<
    Map<
      string,
      {
        category: string;
        available: number;
        completed: number;
      }
    >
  >((accumulator, quiz) => {
    const category = quiz.category?.trim() || "Uncategorized";
    const existing = accumulator.get(category) ?? {
      category,
      available: 0,
      completed: 0,
    };

    if (isCompletedAttempt(quiz.attemptStatus)) {
      existing.completed += 1;
    } else {
      existing.available += 1;
    }

    accumulator.set(category, existing);
    return accumulator;
  }, new Map());

  const availableCategorySummaries = Array.from(categoryProgress.values())
    .filter((category) => category.available > 0)
    .sort((left, right) => left.category.localeCompare(right.category));

  const completedCategorySummaries = Array.from(categoryProgress.values())
    .filter((category) => category.completed > 0)
    .sort((left, right) => left.category.localeCompare(right.category));

  const recentlyAddedQuizzes = [...quizzes]
    .sort(sortByCreatedAtDesc)
    .slice(0, 6);

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

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="section-shell rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Available Categories
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableCategorySummaries.length > 0 ? (
                availableCategorySummaries.map((category) => (
                  <span
                    key={`available-category-${category.category}`}
                    className="chip-pill bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                  >
                    {category.category} ({category.available})
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No available categories.
                </p>
              )}
            </div>
          </div>

          <div className="section-shell rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Completed Categories
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {completedCategorySummaries.length > 0 ? (
                completedCategorySummaries.map((category) => (
                  <span
                    key={`completed-category-${category.category}`}
                    className="chip-pill bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {category.category} ({category.completed})
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No completed categories yet.
                </p>
              )}
            </div>
          </div>

          <div className="section-shell rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Recently Added Quizzes
            </h2>
            <div className="mt-3 space-y-2">
              {recentlyAddedQuizzes.length > 0 ? (
                recentlyAddedQuizzes.map((quiz) => (
                  <div
                    key={`recently-added-${quiz.id}`}
                    className="rounded-xl border border-border/70 bg-card/70 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {quiz.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {quiz.category} - Added {formatShortDate(quiz.createdAt ?? null)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No quizzes available yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="section-shell mb-6 rounded-2xl p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-4">
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
                {filterCategoryOptions.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName}
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

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">
                Completed:
              </span>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(event) => setShowCompleted(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Show completed quizzes
              </label>
            </div>
          </div>
        </div>
      </motion.section>

      {loading && <LoadingQuizzes />}
      {error && <div className="text-red-500">{error}</div>}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Available Quizzes
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pagedAvailableQuizzes.map((quiz, idx) => {
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

      {!loading && availableFilteredQuizzes.length > QUIZZES_PER_PAGE && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              setAvailablePage((prev) => Math.max(1, prev - 1))
            }
            disabled={availablePage === 1}
            className="h-10 rounded-xl border border-border/70 bg-card/85 px-4 text-sm font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {availablePage} of {availableTotalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setAvailablePage((prev) =>
                Math.min(availableTotalPages, prev + 1),
              )
            }
            disabled={availablePage === availableTotalPages}
            className="h-10 rounded-xl border border-border/70 bg-card/85 px-4 text-sm font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      )}

      {!loading && availableFilteredQuizzes.length === 0 && (
        <div className="section-shell mt-8 rounded-2xl p-6 text-sm text-muted-foreground">
          No quizzes found.
        </div>
      )}

      {!loading && visibleCompletedQuizzes.length > 0 && (
        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Completed Quizzes
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pagedCompletedQuizzes.map((quiz, idx) => {
              const cat = categories.find(
                (c) =>
                  normalizeFilterValue(c.name) ===
                  normalizeFilterValue(quiz.category),
              );
              const CategoryIcon =
                categoryIcons[normalizeFilterValue(quiz.category)] || BookOpen;

              return (
                <motion.article
                  key={`completed-${quiz.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.045,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="section-shell lift-hover flex h-full flex-col rounded-2xl border-dashed border-border/60 bg-muted/30 p-4 sm:p-5"
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
                    <h3 className="font-display text-2xl font-semibold leading-tight text-foreground">
                      {quiz.title}
                    </h3>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="chip-pill bg-primary/10 text-primary">
                      Category: {quiz.category}
                    </span>
                    <span
                      className={`chip-pill ${getDifficultyChipClass(quiz.difficulty)}`}
                    >
                      <Flame className="h-3.5 w-3.5" />
                      Difficulty: {quiz.difficulty}
                    </span>
                    <span
                      className={`chip-pill ${getAttemptStatusChipClass(quiz.attemptStatus)}`}
                    >
                      Status: Completed
                    </span>
                    <span className="chip-pill bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                      Type: {formatQuizTypeLabel(quiz.quizType)}
                    </span>
                    <span className="chip-pill bg-muted text-muted-foreground">
                      Questions: {quiz.questionCount ?? quiz.questions?.length ?? 0}
                    </span>
                  </div>

                  {quiz.recommendationReason && (
                    <p className="mb-4 text-xs text-muted-foreground">
                      {quiz.recommendationReason}
                    </p>
                  )}

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
                </motion.article>
              );
            })}
          </div>

          {visibleCompletedQuizzes.length > QUIZZES_PER_PAGE && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setCompletedPage((prev) => Math.max(1, prev - 1))
                }
                disabled={completedPage === 1}
                className="h-10 rounded-xl border border-border/70 bg-card/85 px-4 text-sm font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {completedPage} of {completedTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCompletedPage((prev) =>
                    Math.min(completedTotalPages, prev + 1),
                  )
                }
                disabled={completedPage === completedTotalPages}
                className="h-10 rounded-xl border border-border/70 bg-card/85 px-4 text-sm font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
