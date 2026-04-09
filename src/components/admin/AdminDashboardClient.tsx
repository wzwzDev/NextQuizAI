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

  const handleQuizReady = (quiz: AdminQuizDraft) => {
    setQuizToReview(quiz);
  };

  const handleApprove = async (approvedQuiz: AdminQuizDraft) => {
    await fetch("/api/quiz-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(approvedQuiz),
    });
    setQuizToReview(null);
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
              Upload or create a new quiz for review.
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
              <QuizReview quiz={quizToReview} onApprove={handleApprove} />
            ) : (
              <QuizList />
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
