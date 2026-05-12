"use client";
import React, { useEffect, useState } from "react";
import QuizUpload from "@/components/admin/QuizUpload";
import QuizReview from "@/components/admin/QuizReview";
import QuizList from "@/components/admin/QuizList";
import QuizStatistics from "@/components/admin/QuizStatistics";
import UserManagement from "@/components/admin/UserManagement";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart3,
  ClipboardList,
  Maximize2,
  Minimize2,
  UploadCloud,
  Users2,
} from "lucide-react";
import { AdminQuizDraft } from "@/components/admin/types";

type ExpandedSection = "statistics" | "review" | "users" | null;

const AdminDashboardClient = () => {
  const [quizToReview, setQuizToReview] = useState<AdminQuizDraft | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [quizListRefreshKey, setQuizListRefreshKey] = useState(0);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key === "1") {
        event.preventDefault();
        setExpandedSection("statistics");
        return;
      }

      if (event.key === "2") {
        event.preventDefault();
        setExpandedSection("review");
        return;
      }

      if (event.key === "3") {
        event.preventDefault();
        setExpandedSection("users");
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        setExpandedSection(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const handleCancelReview = () => {
    if (isApproving) {
      return;
    }

    setApproveError(null);
    setQuizToReview(null);
  };

  const renderQuizReviewContent = () => {
    if (quizToReview) {
      return (
        <>
          {approveError && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {approveError}
            </div>
          )}
          <QuizReview
            quiz={quizToReview}
            onApprove={handleApprove}
            onCancel={handleCancelReview}
          />
          {isApproving && (
            <div className="mt-3 text-sm text-blue-700">Saving quiz...</div>
          )}
        </>
      );
    }

    return <QuizList refreshKey={quizListRefreshKey} />;
  };

  const expandedTitle =
    expandedSection === "statistics"
      ? "Quiz Statistics"
      : expandedSection === "review"
        ? "Quiz Review / List"
        : expandedSection === "users"
          ? "User Management"
          : "";

  const expandedDescription =
    expandedSection === "statistics"
      ? "Overview of quiz performance and stats."
      : expandedSection === "review"
        ? "Review quizzes awaiting approval or see all quizzes."
        : expandedSection === "users"
          ? "Manage users and their permissions."
          : "";

  return (
    <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_0%_20%,var(--glow-primary),transparent_62%),radial-gradient(circle_at_85%_0%,var(--glow-secondary),transparent_60%)]" />

      <div className="mb-6 space-y-2">
        <span className="chip-pill text-primary">Control Center</span>
        <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          Admin Dashboard
        </h2>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        Shortcuts: Alt+1 Statistics, Alt+2 Quiz Review, Alt+3 Users, Alt+0 Close.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="section-shell border-0 bg-card/80">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-xl">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload New Quiz
            </CardTitle>
            <CardDescription>
              Upload a file to generate a draft, then use Approve & Save in Quiz Review to persist it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuizUpload onQuizReady={handleQuizReady} />
          </CardContent>
        </Card>
        <Card className="section-shell lift-hover flex min-h-[32rem] flex-col border-0 bg-card/80">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
                Quiz Statistics
              </CardTitle>
              <CardDescription>
                Overview of quiz performance and stats.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Expand quiz statistics"
              title="Maximize (Alt+1)"
              onClick={() => setExpandedSection("statistics")}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 overflow-hidden">
            <div className="h-full w-full overflow-y-auto pr-1">
              <QuizStatistics compact />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="section-shell lift-hover col-span-4 flex min-h-[34rem] flex-col border-0 bg-card/80">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <ClipboardList className="h-5 w-5 text-primary" />
                Quiz Review / List
              </CardTitle>
              <CardDescription>
                Review quizzes awaiting approval or see all quizzes.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Expand quiz review"
              title="Maximize (Alt+2)"
              onClick={() => setExpandedSection("review")}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 overflow-hidden">
            <div className="h-full w-full overflow-y-auto pr-1">
              {renderQuizReviewContent()}
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell lift-hover col-span-3 flex min-h-[34rem] flex-col border-0 bg-card/80">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Users2 className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users and their permissions.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Expand user management"
              title="Maximize (Alt+3)"
              onClick={() => setExpandedSection("users")}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 overflow-hidden">
            <div className="h-full w-full overflow-y-auto pr-1">
              <UserManagement compact />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={expandedSection !== null}
        onOpenChange={(open) => {
          if (!open) {
            setExpandedSection(null);
          }
        }}
      >
        <DialogContent className="h-[88vh] w-[96vw] max-w-6xl p-0">
          {expandedSection && (
            <div className="flex h-full flex-col bg-card">
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle>{expandedTitle}</DialogTitle>
                    <DialogDescription>{expandedDescription}</DialogDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Minimize expanded section"
                    title="Minimize (Alt+0)"
                    onClick={() => setExpandedSection(null)}
                    className="shrink-0"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {expandedSection === "statistics" && <QuizStatistics compact />}
                {expandedSection === "review" && renderQuizReviewContent()}
                {expandedSection === "users" && <UserManagement compact />}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminDashboardClient;
