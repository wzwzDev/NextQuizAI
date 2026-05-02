import React from "react";
import { Progress } from "./ui/progress";
import Image from "next/image";

type Props = { finished: boolean };

const loadingTexts = [
  "Generating questions...",
  "Something good happening...",
  "Diving deep into the ocean of questions..",
  "Collecting the knowledge...",
  "The flame of wonder and exploration...",
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

const LoadingQuestions = ({ finished }: Props) => {
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
        if (finished) return 100;
        if (prev === 100) {
          return 0;
        }
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
  }, [finished]);

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-[70vw] md:w-[60vw] flex flex-col items-center">
      <Image
        src={"/Loading.gif"}
        width={400}
        height={400}
        alt="loading"
        sizes="400px"
      />{" "}
      <Progress value={progress} className="w-full mt-4" />
      <h1 className="mt-2 text-xl">{loadingText}</h1>
    </div>
  );
};

export default LoadingQuestions;
