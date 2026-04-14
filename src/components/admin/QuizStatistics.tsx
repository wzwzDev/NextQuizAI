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

const QuizStatistics = ({ compact = false }: QuizStatisticsProps) => {
  const [statistics, setStatistics] = useState<QuizStatistic[]>([]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch("/api/quiz-statistics");
        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        console.error("Error fetching quiz statistics:", error);
      }
    };

    fetchStatistics();
  }, []);

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
            {statistics.map((stat) => (
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
    </div>
  );
};

export default QuizStatistics;
