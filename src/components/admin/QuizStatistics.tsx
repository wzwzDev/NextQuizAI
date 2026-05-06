"use client";
import React, { useEffect, useState } from "react";

type QuizStatistic = {
  quizId: string;
  quizTitle: string;
  attempts: number;
  averageScore: number;
  completionRate?: number; // Optional
};

type QuizStatisticsProps = {
  compact?: boolean;
};

const STATS_PER_PAGE_OPTIONS = [5, 8, 12, 20];

const QuizStatistics = ({ compact = false }: QuizStatisticsProps) => {
  const [statistics, setStatistics] = useState<QuizStatistic[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem("adminQuizStatsPageSize");
    const parsed = Number(stored);
    if (Number.isFinite(parsed) && parsed > 0) {
      setPageSize(parsed);
    }
  }, []);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch("/api/quiz-statistics");
        const data = await response.json();
        if (Array.isArray(data)) {
          setStatistics(data);
        } else if (Array.isArray(data?.quizStatistics)) {
          setStatistics(data.quizStatistics);
        } else {
          setStatistics([]);
        }
      } catch (error) {
        console.error("Error fetching quiz statistics:", error);
      }
    };

    fetchStatistics();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statistics.length]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("adminQuizStatsPageSize", String(pageSize));
  }, [pageSize]);

  const totalPages = Math.max(1, Math.ceil(statistics.length / pageSize));
  const pagedStats = statistics.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleGoToPage = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const nextPage = Math.min(Math.max(1, Math.floor(parsed)), totalPages);
    setPage(nextPage);
    setPageInput(String(nextPage));
  };

  return (
    <div className={compact ? "h-full" : "rounded-xl bg-white p-8 shadow dark:bg-black"}>
      {!compact && <h2 className="mb-4 text-2xl font-bold">Quiz Statistics</h2>}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white dark:bg-black">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Quiz Title</th>
              <th className="border border-gray-300 px-4 py-2">Attempts</th>
              <th className="border border-gray-300 px-4 py-2">Average Score</th>
              <th className="border border-gray-300 px-4 py-2">
                Completion Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedStats.map((stat) => (
              <tr key={`${stat.quizId}-${stat.quizTitle}`}>
                <td className="border border-gray-300 px-4 py-2">
                  {stat.quizTitle}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {stat.attempts}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {stat.averageScore}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {stat.completionRate !== undefined
                    ? `${stat.completionRate}%`
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 mr-2 rounded border"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded border"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages}
          >
            Next
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="quiz-stats-page-size">Rows:</label>
          <select
            id="quiz-stats-page-size"
            className="border rounded px-2 py-1 bg-white dark:bg-black text-gray-900 dark:text-white"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {STATS_PER_PAGE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="quiz-stats-go-page">Go to:</label>
          <input
            id="quiz-stats-go-page"
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            className="w-20 rounded border px-2 py-1"
          />
          <button
            type="button"
            className="px-3 py-1 rounded border"
            onClick={handleGoToPage}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizStatistics;
