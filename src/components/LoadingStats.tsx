import React from "react";
import { Progress } from "./ui/progress";
import Image from "next/image";

const loadingTexts = [
  "Loading your stats...",
  "Crunching the numbers...",
  "Analyzing your quiz journey...",
  "Gathering your achievements...",
  "Almost ready to show your progress!",
];

const getRandomIndex = (length: number): number => {
  return Math.floor(Math.random() * length);
};

const LoadingStats = () => {
  const [progress, setProgress] = React.useState(10);
  const [loadingText, setLoadingText] = React.useState(loadingTexts[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = getRandomIndex(loadingTexts.length);
      setLoadingText(loadingTexts[randomIndex]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        if (Math.random() < 0.1) {
          return prev + 2;
        }
        return prev + 0.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-[70vw] md:w-[60vw] flex flex-col items-center">
      <Image
        src={"/LoadingStat.gif"}
        width={400}
        height={400}
        alt="loading"
        sizes="400px"
      />
      <Progress value={progress} className="w-full mt-4" />
      <h1 className="mt-2 text-xl">{loadingText}</h1>
    </div>
  );
};

export default LoadingStats;
