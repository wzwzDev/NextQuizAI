"use client";
import { Game, Question } from "@prisma/client";
import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "./ui/button";
import { differenceInSeconds } from "date-fns";
import Link from "next/link";
import { BarChart, ChevronRight, Loader2, Timer } from "lucide-react";
import { checkAnswerSchema, endGameSchema } from "@/schemas/questions";
import { cn, formatTimeDelta } from "@/lib/utils";
import MCQCounter from "./MCQCounter";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { useToast } from "./ui/use-toast";

type Props = {
  game: Game & { questions: Pick<Question, "id" | "options" | "question">[] };
};

type CheckAnswerResponse = {
  isCorrect: boolean;
};

function splitOptionChunks(option: string): string[] {
  return option
    .split(/\r?\n|[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptions(rawOptions: unknown): string[] {
  if (Array.isArray(rawOptions)) {
    return Array.from(
      new Set(
        rawOptions
          .filter((item): item is string => typeof item === "string")
          .flatMap(splitOptionChunks),
      ),
    );
  }

  if (typeof rawOptions === "string") {
    const trimmed = rawOptions.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeOptions(parsed);
    } catch {
      return Array.from(new Set(splitOptionChunks(trimmed)));
    }
  }

  if (rawOptions && typeof rawOptions === "object") {
    const candidate = rawOptions as {
      choices?: unknown;
      options?: unknown;
      [key: string]: unknown;
    };

    if (Array.isArray(candidate.choices)) {
      return normalizeOptions(candidate.choices);
    }

    if (Array.isArray(candidate.options)) {
      return normalizeOptions(candidate.options);
    }

    const optionKeys = Object.keys(candidate)
      .filter((key) => /^option\d+$/i.test(key))
      .sort((left, right) => {
        const leftNumber = Number(left.replace(/\D+/g, ""));
        const rightNumber = Number(right.replace(/\D+/g, ""));
        return leftNumber - rightNumber;
      });

    if (optionKeys.length > 0) {
      return normalizeOptions(optionKeys.map((key) => candidate[key]));
    }
  }

  return [];
}

function extractErrorMessage(error: unknown, fallback: string) {
  const axiosLikeError = error as {
    isAxiosError?: boolean;
    response?: { data?: { message?: unknown } };
  };

  if (axiosLikeError?.isAxiosError) {
    const responseData = axiosLikeError.response?.data;
    const responseMessage = responseData?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

const MCQ = ({ game }: Props) => {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [hasEnded, setHasEnded] = React.useState(false);
  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });
  const [selectedChoice, setSelectedChoice] = React.useState<number | null>(
    null,
  );
  const [now, setNow] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false); // Add this line

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentQuestion = React.useMemo(() => {
    return game.questions[questionIndex];
  }, [questionIndex, game.questions]);

  const options = React.useMemo(() => {
    if (!currentQuestion) return [];
    return normalizeOptions(currentQuestion.options);
  }, [currentQuestion]);
  const { toast } = useToast();
  const { mutate: checkAnswer, status: checkAnswerStatus } = useMutation<
    CheckAnswerResponse,
    Error,
    void
  >({
    mutationFn: async () => {
      if (selectedChoice === null || !options[selectedChoice]) {
        throw new Error("Please select an answer before continuing.");
      }

      const payload: z.infer<typeof checkAnswerSchema> = {
        questionId: currentQuestion.id,
        userInput: options[selectedChoice],
      };
      const response = await axios.post<CheckAnswerResponse>(
        `/api/checkAnswer`,
        payload,
      );
      return response.data;
    },
  });
  const isChecking = checkAnswerStatus === "pending";

  const { mutate: endGame } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof endGameSchema> = {
        gameId: game.id,
      };
      const response = await axios.post(`/api/endGame`, payload);
      return response.data;
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);

  React.useEffect(() => {
    setSelectedChoice(null);
  }, [questionIndex]);

  const handleNext = React.useCallback(() => {
    if (isChecking || hasEnded || !currentQuestion) {
      return;
    }

    if (selectedChoice === null) {
      return;
    }

    checkAnswer(undefined, {
      onSuccess: ({ isCorrect }) => {
        if (isCorrect) {
          setStats((stats) => ({
            ...stats,
            correct_answers: stats.correct_answers + 1,
          }));
          toast({
            title: "Correct",
            description: "You got it right!",
            variant: "success",
          });
        } else {
          setStats((stats) => ({
            ...stats,
            wrong_answers: stats.wrong_answers + 1,
          }));
          toast({
            title: "Incorrect",
            description: "You got it wrong!",
            variant: "destructive",
          });
        }
        if (questionIndex === game.questions.length - 1) {
          endGame();
          setHasEnded(true);
          return;
        }
        setQuestionIndex((questionIndex) => questionIndex + 1);
      },
      onError: (error) => {
        setStats((currentStats) => ({
          ...currentStats,
          wrong_answers: currentStats.wrong_answers + 1,
        }));

        toast({
          title: "Could not validate this answer",
          description: `${extractErrorMessage(error, "Unexpected error")} Moving to the next question.`,
          variant: "destructive",
        });

        if (questionIndex === game.questions.length - 1) {
          endGame();
          setHasEnded(true);
          return;
        }

        setQuestionIndex((currentIndex) => currentIndex + 1);
      },
    });
  }, [
    checkAnswer,
    isChecking,
    hasEnded,
    currentQuestion,
    selectedChoice,
    toast,
    questionIndex,
    game.questions.length,
    endGame,
  ]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "1") {
        setSelectedChoice(0);
      } else if (key === "2") {
        setSelectedChoice(1);
      } else if (key === "3") {
        setSelectedChoice(2);
      } else if (key === "4") {
        setSelectedChoice(3);
      } else if (key === "Enter") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext]);

  if (hasEnded) {
    return (
      <div className="absolute flex flex-col justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
          You Completed in{" "}
          {mounted &&
            formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
        </div>
        <Link
          href={`/statistics/${game.id}`}
          className={cn(buttonVariants({ size: "lg" }), "mt-2")}
        >
          View Statistics
          <BarChart className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          {/* topic */}
          <p>
            <span className="text-slate-400">Topic</span> &nbsp;
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {game.topic}
            </span>
          </p>
          {mounted && (
            <div className="flex self-start mt-3 text-slate-400">
              <Timer className="mr-2" />
              {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
            </div>
          )}
        </div>
        <MCQCounter
          correct_answers={stats.correct_answers}
          wrong_answers={stats.wrong_answers}
        />
      </div>
      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.questions.length}
            </div>
          </CardTitle>
          <CardDescription className="flex-grow text-lg">
            {currentQuestion?.question}
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="flex flex-col items-center justify-center w-full mt-4">
        {options.map((option, index) => {
          return (
            <Button
              key={`${currentQuestion.id}-${index}`}
              variant={selectedChoice === index ? "default" : "outline"}
              className="justify-start w-full py-8 mb-4"
              onClick={() => setSelectedChoice(index)}
            >
              <div className="flex items-center justify-start">
                <div className="p-2 px-3 mr-5 border rounded-md">
                  {index + 1}
                </div>
                <div className="text-start">{option}</div>
              </div>
            </Button>
          );
        })}

        <Button
          variant="default"
          className="mt-2"
          size="lg"
          disabled={isChecking || hasEnded || selectedChoice === null}
          onClick={() => {
            handleNext();
          }}
        >
          {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Next <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MCQ;
