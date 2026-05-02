"use client";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { BookOpen, CopyCheck } from "lucide-react";
import { Separator } from "../ui/separator";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoadingQuestions from "../LoadingQuestions";

type Props = {
  topic: string;
};

type Input = z.infer<typeof quizCreationSchema>;
type CreateGameResponse = { gameId: string };
type QuizStat = {
  id: string;
  title: string;
  attempts: number;
  averageScore: number | null;
  lastAttempt: string;
};

function formatRecentAttempt(dateStr: string) {
  if (!dateStr) {
    return "N/A";
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
}

const QuizCreation = ({ topic: topicParam }: Props) => {
  const router = useRouter();
  const [showLoader, setShowLoader] = React.useState(false);
  const [finishedLoading, setFinishedLoading] = React.useState(false);
  const [stats, setStats] = React.useState<QuizStat[]>([]);
  const { toast } = useToast();
  const { mutate: getQuestions, isPending } = useMutation<
    CreateGameResponse,
    Error,
    Input
  >({
    mutationFn: async ({ amount, topic, type }: Input) => {
      const response = await axios.post<CreateGameResponse>("/api/game", {
        amount,
        topic,
        type,
      });
      return response.data;
    },
  });

  const form = useForm<Input>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      topic: topicParam,
      type: "mcq",
      amount: 3,
    },
  });

  React.useEffect(() => {
    if (typeof fetch !== "function") {
      return;
    }

    fetch("/api/user-quiz-stats")
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data?.quizStats)
          ? (data.quizStats as QuizStat[])
          : [];
        setStats(parsed);
      })
      .catch(() => {
        setStats([]);
      });
  }, []);

  const onSubmit = async (data: Input) => {
    setShowLoader(true);
    toast({
      title: "Preparing your quiz",
      description: "We are generating your questions now.",
    });

    getQuestions(data, {
      onError: (error) => {
        setShowLoader(false);
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        toast({
          title: "Could not start quiz",
          description:
            status === 500
              ? "Something went wrong. Please try again later."
              : "Please check your inputs and try again.",
          variant: "destructive",
        });
      },
      onSuccess: ({ gameId }) => {
        toast({
          title: "Quiz ready",
          description: "Redirecting you to your quiz now.",
          variant: "success",
        });
        setFinishedLoading(true);
        setTimeout(() => {
          if (form.getValues("type") === "mcq") {
            router.push(`/play/mcq/${gameId}`);
          } else if (form.getValues("type") === "open_ended") {
            router.push(`/play/open-ended/${gameId}`);
          }
        }, 2000);
      },
    });
  };
  form.watch();

  const totalAttempts = React.useMemo(
    () => stats.reduce((acc, curr) => acc + curr.attempts, 0),
    [stats],
  );
  const totalCompleted = stats.length;
  const recentAttemptDate = React.useMemo(
    () =>
      stats.reduce(
        (acc, curr) =>
          curr.lastAttempt && curr.lastAttempt > acc ? curr.lastAttempt : acc,
        "",
      ),
    [stats],
  );

  if (showLoader) {
    return <LoadingQuestions finished={finishedLoading} />;
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quiz Creation</CardTitle>
          <CardDescription>Choose a topic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow dark:border-gray-700 dark:bg-black">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Recent Attempt
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatRecentAttempt(recentAttemptDate)}
              </p>
            </div>
            <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow dark:border-gray-700 dark:bg-black">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total Attempts
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {totalAttempts}
              </p>
            </div>
            <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow dark:border-gray-700 dark:bg-black">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Quizzes Completed
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {totalCompleted}
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a topic" {...field} />
                    </FormControl>
                    <FormDescription>
                      Please provide any topic you would like to be quizzed on
                      here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="How many questions?"
                        type="number"
                        {...field}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) => {
                          const parsedAmount = e.target.valueAsNumber;
                          const normalizedAmount = Number.isNaN(parsedAmount)
                            ? 1
                            : Math.min(10, Math.max(1, parsedAmount));

                          form.setValue("amount", normalizedAmount, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        min={1}
                        max={10}
                      />
                    </FormControl>
                    <FormDescription>
                      You can choose how many questions you would like to be
                      quizzed on here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button
                  variant={
                    form.getValues("type") === "mcq" ? "default" : "secondary"
                  }
                  className="w-1/2 rounded-none rounded-l-lg"
                  onClick={() => {
                    form.setValue("type", "mcq");
                  }}
                  type="button"
                >
                  <CopyCheck className="w-4 h-4 mr-2" /> Multiple Choice
                </Button>
                <Separator orientation="vertical" />
                <Button
                  variant={
                    form.getValues("type") === "open_ended"
                      ? "default"
                      : "secondary"
                  }
                  className="w-1/2 rounded-none rounded-r-lg"
                  onClick={() => form.setValue("type", "open_ended")}
                  type="button"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> Open Ended
                </Button>
              </div>
              <Button disabled={isPending} type="submit">
                Submit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizCreation;
