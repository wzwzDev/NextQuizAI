"use client";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "./ui/table"; // Adjust the import path if needed

import { ChartContainer, ChartTooltip, ChartLegend } from "./ui/chart"; // Adjust the path if needed
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import LoadingStats from "./LoadingStats";

type QuizStat = {
  id: string;
  title: string;
  attempts: number;
  averageScore: number | null;
  lastAttempt: string;
};

function formatTime(dateStr: string) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString();
}

export default function UserQuizStats() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<QuizStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user-quiz-stats")
        .then((res) => res.json())
        .then((data) => setStats(data.quizStats || []))
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) return <LoadingStats />;
  if (!session) return <div>Please sign in to see your stats.</div>;

  // Overview calculations
  const totalAttempts = stats.reduce((acc, curr) => acc + curr.attempts, 0);
  const totalCompleted = stats.length;
  const recentAttemptDate = stats.reduce(
    (acc, curr) =>
      curr.lastAttempt && curr.lastAttempt > acc ? curr.lastAttempt : acc,
    "",
  );
  const latestStats = [...stats]
    .sort(
      (a, b) =>
        new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime(),
    )
    .slice(0, 2);

  // Chart config for colors (optional)
  const chartConfig = Object.fromEntries(
    stats.map((q) => [
      q.title,
      { label: q.title, color: "#3b82f6" }, // blue-500, change as needed
    ]),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-6 font-semibold">
        <div className="py-4 px-4 flex flex-col gap-1 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-black">
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">
            {session.user?.name || "User"}
          </h2>
          <p className="text-gray-400 dark:text-gray-300 font-semibold">
            Recent Attempt
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-300 font-semibold">
            {formatTime(recentAttemptDate)}
          </p>
        </div>
        <div className="py-4 px-4 flex gap-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-black">
          <div className="text-2xl text-blue-400">🎯</div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              Total Attempts
            </p>
            <p className="mt-2 font-bold text-3xl text-gray-900 dark:text-white">
              {totalAttempts}
            </p>
          </div>
        </div>
        <div className="py-4 px-4 flex gap-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-black">
          <div className="text-2xl text-blue-400">✅</div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              Total Completed
            </p>
            <p className="mt-2 font-bold text-3xl text-gray-900 dark:text-white">
              {totalCompleted}
            </p>
          </div>
        </div>
      </div>

      {/* Chart: Attempts per Quiz */}
      <div className="mt-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 bg-white dark:bg-black">
        <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
          Attempts per Quiz
        </h2>
        <ChartContainer config={chartConfig}>
          <BarChart data={stats} height={250}>
            <XAxis dataKey="title" />
            <YAxis allowDecimals={false} />
            <ChartTooltip />
            <ChartLegend />
            <Bar dataKey="attempts" fill="#3b82f6" />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Recent Attempts */}
      <div className="mt-2 grid grid-cols-2 gap-6">
        {latestStats.map((quiz) => (
          <div
            key={quiz.id}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow bg-white dark:bg-black"
          >
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
              {quiz.title}
            </h3>
            <div className="text-gray-700 dark:text-gray-200">
              Attempts: {quiz.attempts}
            </div>
            <div className="text-gray-700 dark:text-gray-200">
              Avg. Score:{" "}
              {quiz.averageScore !== null
                ? quiz.averageScore.toFixed(2)
                : "N/A"}
            </div>
            <div className="text-gray-700 dark:text-gray-200">
              Last Attempt: {formatTime(quiz.lastAttempt)}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="mt-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-black">
        <h1 className="font-bold text-2xl p-4 text-gray-900 dark:text-white">
          Detailed Quiz Stats
        </h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-900 dark:text-white">
                Quiz
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white">
                Attempts
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white">
                Avg. Score
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white">
                Last Attempt
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="text-gray-900 dark:text-white">
                  {q.title}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-white">
                  {q.attempts}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-white">
                  {q.averageScore !== null ? q.averageScore.toFixed(2) : "N/A"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-white">
                  {formatTime(q.lastAttempt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
