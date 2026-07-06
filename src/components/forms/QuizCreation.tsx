"use client";
import { quizCreationSchema, isGibberish, SUGGESTED_TOPICS } from "@/schemas/forms/quiz";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LoadingQuestions from "../LoadingQuestions";

type Props = {
  topic: string;
};

type Input = z.infer<typeof quizCreationSchema>;
type CreateGameResponse = { gameId: string };

const QuizCreation = ({ topic: topicParam }: Props) => {
  const router = useRouter();
  const [showLoader, setShowLoader] = React.useState(false);
  const [finishedLoading, setFinishedLoading] = React.useState(false);
  const [showGibberishDialog, setShowGibberishDialog] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<Input | null>(null);
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

  const onSubmit = async (data: Input) => {
    // ✅ Check if topic is gibberish
    if (isGibberish(data.topic)) {
      setPendingData(data);
      setShowGibberishDialog(true);
      return;
    }

    // ✅ Normal flow: submit
    startQuiz(data);
  };

  const startQuiz = (data: Input) => {
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

  const handleChooseSuggestedTopic = () => {
    // Pick random suggested topic (cryptographically secure)
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % SUGGESTED_TOPICS.length;
    const randomTopic = SUGGESTED_TOPICS[randomIndex];
    form.setValue("topic", randomTopic);
    setShowGibberishDialog(false);
    setPendingData(null);
    toast({
      title: "Topic updated",
      description: `Changed to "${randomTopic}". Ready to generate!`,
    });
  };

  const handleGenerateAnyway = () => {
    if (pendingData) {
      setShowGibberishDialog(false);
      setPendingData(null);
      startQuiz(pendingData);
    }
  };

  form.watch();

  if (showLoader) {
    return <LoadingQuestions finished={finishedLoading} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quiz Creation</CardTitle>
          <CardDescription>Create a new quiz</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Topic Input */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Java, React, Python" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a topic you want to be quizzed on
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Number of Questions */}
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
                      Choose between 1 and 10 questions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quiz Type Selection */}
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

              {/* Submit Button */}
              <Button disabled={isPending} type="submit">
                Submit
              </Button>
            </form>
          </Form>

          {/* Gibberish Alert Dialog */}
          <AlertDialog open={showGibberishDialog} onOpenChange={setShowGibberishDialog}>
            <AlertDialogContent>
              <AlertDialogTitle>⚠️ Topic Seems Unclear</AlertDialogTitle>
              <AlertDialogDescription>
                The topic "<strong>{pendingData?.topic}</strong>" looks unclear or contains invalid characters. This might result in poor quiz questions.
              </AlertDialogDescription>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleChooseSuggestedTopic}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium transition"
                >
                  💡 Choose a Suggested Topic
                </button>

                <button
                  onClick={handleGenerateAnyway}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium transition"
                >
                  ⚡ Generate Anyway
                </button>

                <button
                  onClick={() => {
                    setShowGibberishDialog(false);
                    setPendingData(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-sm font-medium transition"
                >
                  ❌ Cancel
                </button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizCreation;
