"use client";
import React, { useEffect, useState } from "react";

type QuizStatistic = {
  quizId: string;
  quizTitle: string;
  attempts: number;
  averageScore: number;
  completionRate?: number; // Optional
};

type AiMetrics = {
  totalAttempts: number;
  totalQuestionResults: number;
  acceptanceRate: number;
  lowConfidenceRate: number;
  reviewedRate: number;
  overrideRate: number;
  averageConfidence: number;
  averageSimilarity: number;
};

type QuizStatisticsProps = {
  compact?: boolean;
};

const QuizStatistics = ({ compact = false }: QuizStatisticsProps) => {
  const [statistics, setStatistics] = useState<QuizStatistic[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AiMetrics | null>(null);

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

      try {
        const metricsResponse = await fetch("/api/ai-metrics");
        const metricsData = await metricsResponse.json();

        if (
          metricsData &&
          typeof metricsData === "object" &&
          typeof metricsData.totalQuestionResults === "number"
        ) {
          setAiMetrics(metricsData as AiMetrics);
        } else {
          setAiMetrics(null);
        }
      } catch (error) {
        console.error("Error fetching AI metrics:", error);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div className={compact ? "h-full" : "rounded-xl bg-white p-8 shadow dark:bg-black"}>
      {!compact && <h2 className="mb-4 text-2xl font-bold">Quiz Statistics</h2>}

      {aiMetrics && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded border px-3 py-2 text-sm">
            AI-Graded Questions: <strong>{aiMetrics.totalQuestionResults}</strong>
          </div>
          <div className="rounded border px-3 py-2 text-sm">
            Avg Confidence: <strong>{Math.round(aiMetrics.averageConfidence * 100)}%</strong>
          </div>
          <div className="rounded border px-3 py-2 text-sm">
            Low Confidence Rate: <strong>{aiMetrics.lowConfidenceRate}%</strong>
          </div>
          <div className="rounded border px-3 py-2 text-sm">
            Override Rate: <strong>{aiMetrics.overrideRate}%</strong>
          </div>
        </div>
      )}

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
