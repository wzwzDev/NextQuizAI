"use client";
import React, { useState } from "react";
import QuizUpload from "@/components/admin/QuizUpload";
import QuizReview from "@/components/admin/QuizReview";
import QuizList from "@/components/admin/QuizList";
import QuizStatistics from "@/components/admin/QuizStatistics";
import UserManagement from "@/components/admin/UserManagement";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AdminQuizDraft } from "@/components/admin/types";

const AdminDashboardClient = () => {
  const [quizToReview, setQuizToReview] = useState<AdminQuizDraft | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [quizListRefreshKey, setQuizListRefreshKey] = useState(0);

  const handleQuizReady = (quiz: AdminQuizDraft) => {
    setApproveError(null);
    setQuizToReview(quiz);
  };

  const handleApprove = async (approvedQuiz: AdminQuizDraft) => {
    if (isApproving) {
      return;
    }

    setIsApproving(true);
    setApproveError(null);

    try {
      const response = await fetch("/api/quiz-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvedQuiz),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save approved quiz.");
      }

      setQuizToReview(null);
      setQuizListRefreshKey((prev) => prev + 1);
    } catch (error) {
      setApproveError(
        error instanceof Error ? error.message : "Failed to save approved quiz.",
      );
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <main className="p-8 mx-auto max-w-7xl">
      <h2 className="mb-6 text-3xl font-bold tracking-tight">
        Admin Dashboard
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <CardTitle>Upload New Quiz</CardTitle>
            <CardDescription>
              Upload a file to generate a draft, then use Approve & Save in Quiz Review to persist it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuizUpload onQuizReady={handleQuizReady} />
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <CardTitle>Quiz Statistics</CardTitle>
            <CardDescription>
              Overview of quiz performance and stats.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuizStatistics />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white dark:bg-black">
          <CardHeader>
            <CardTitle>Quiz Review / List</CardTitle>
            <CardDescription>
              Review quizzes awaiting approval or see all quizzes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizToReview ? (
              <>
                {approveError && (
                  <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {approveError}
                  </div>
                )}
                <QuizReview quiz={quizToReview} onApprove={handleApprove} />
                {isApproving && (
                  <div className="mt-3 text-sm text-blue-700">Saving quiz...</div>
                )}
              </>
            ) : (
              <QuizList refreshKey={quizListRefreshKey} />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-white dark:bg-black">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage users and their permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagement />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AdminDashboardClient;
