import React from "react";
import { Progress } from "./ui/progress";
import Image from "next/image";

const loadingTexts = [
  "Loading quizzes...",
  "Fetching the best questions...",
  "Sharpening your mind...",
  "Preparing your quiz adventure...",
  "Almost ready to start!",
];

/**
 * Generate cryptographically secure random integer in range [0, max)
 */
const getSecureRandomIndex = (length: number): number => {
  if (length <= 0) return 0;
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0] % length;
};

const LoadingQuizzes = () => {
  const [progress, setProgress] = React.useState(10);
  const [loadingText, setLoadingText] = React.useState(loadingTexts[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = getSecureRandomIndex(loadingTexts.length);
      setLoadingText(loadingTexts[randomIndex]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        // Use crypto for random threshold comparison
        const randomValues = new Uint32Array(1);
        crypto.getRandomValues(randomValues);
        if ((randomValues[0] % 10000) < 1000) {
          return prev + 2;
        }
        return prev + 0.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Image src="/LoadingQuiz.gif" width={200} height={200} alt="loading" />
      <Progress value={progress} className="w-full mt-4" />
      <h1 className="mt-2 text-xl">{loadingText}</h1>
    </div>
  );
};

export default LoadingQuizzes;
