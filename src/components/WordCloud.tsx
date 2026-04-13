"use client";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  formattedTopics: { text: string; value: number }[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getFontSize = (value: number, min: number, max: number) => {
  if (min === max) {
    return 26;
  }

  const normalized = (value - min) / (max - min);
  return clamp(16 + normalized * 26, 16, 42);
};

const WordCloud = ({ formattedTopics }: Props) => {
  const { theme } = useTheme();
  const router = useRouter();

  if (formattedTopics.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No topics available yet.
      </p>
    );
  }

  const values = formattedTopics.map((topic) => topic.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return (
    <div className="flex min-h-[280px] flex-wrap items-center justify-center gap-4 py-4">
      {formattedTopics.map((topic, index) => {
        const fontSize = getFontSize(topic.value, minValue, maxValue);
        const rotation = [-9, -5, -2, 0, 2, 5, 9][index % 7];

        return (
          <button
            key={`${topic.text}-${index}`}
            type="button"
            className="cursor-pointer border-0 bg-transparent px-2 leading-none transition-opacity hover:opacity-75"
            style={{
              color: theme === "dark" ? "#f3f4f6" : "#111827",
              fontFamily: "Times",
              fontSize: `${fontSize}px`,
              transform: `rotate(${rotation}deg)`,
            }}
            onClick={() => {
              router.push(`/quiz?topic=${encodeURIComponent(topic.text)}`);
            }}
          >
            {topic.text}
          </button>
        );
      })}
    </div>
  );
};

export default WordCloud;
