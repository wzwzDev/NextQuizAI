"use client";
import React, { useId, useRef, useState } from "react";
import {
  AdminQuestion,
  AdminQuizDraft,
  AdminQuizType,
} from "@/components/admin/types";

const categories = ["Math", "Science", "History", "Programming"];
const difficulties = ["easy", "medium", "hard"];

const quizTypes: Array<{ value: AdminQuizType; label: string }> = [
  { value: "open_ended", label: "Open Ended" },
  { value: "mcq", label: "Multiple Choice" },
];

type QuizUploadProps = {
  onQuizReady: (quiz: AdminQuizDraft) => void;
};

type UploadAndGenerateResponse = {
  questions?: Array<Partial<AdminQuestion>>;
  error?: string;
};

function normalizeCitation(rawCitation: unknown): AdminQuestion["citation"] {
  if (!rawCitation || typeof rawCitation !== "object") {
    return undefined;
  }

  const source =
    typeof (rawCitation as { source?: unknown }).source === "string"
      ? (rawCitation as { source: string }).source.trim()
      : "";
  const snippet =
    typeof (rawCitation as { snippet?: unknown }).snippet === "string"
      ? (rawCitation as { snippet: string }).snippet.trim()
      : "";
  const confidence =
    typeof (rawCitation as { confidence?: unknown }).confidence === "number" &&
    Number.isFinite((rawCitation as { confidence: number }).confidence)
      ? Math.max(0, Math.min(1, (rawCitation as { confidence: number }).confidence))
      : undefined;

  if (!source || !snippet) {
    return undefined;
  }

  return {
    source,
    snippet,
    ...(confidence !== undefined ? { confidence } : {}),
  };
}

function isAcceptedUploadFile(file: File) {
  const fileName = file.name.toLowerCase();
  return (
    file.type === "application/json" ||
    file.type === "text/plain" ||
    file.type === "application/pdf" ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".pdf")
  );
}

const QuizUpload = ({ onQuizReady }: QuizUploadProps) => {
  const fileInputId = useId();
  const categorySelectId = useId();
  const difficultySelectId = useId();
  const quizTypeSelectId = useId();
  const questionCountInputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(categories[0]);
  const [difficulty, setDifficulty] = useState(difficulties[0]);
  const [quizType, setQuizType] = useState<AdminQuizType>("open_ended");
  const [questionCount, setQuestionCount] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      if (!isAcceptedUploadFile(selectedFile)) {
        setError("Only JSON, TXT, or PDF files are accepted.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const droppedFile = event.dataTransfer.files[0];
      if (!isAcceptedUploadFile(droppedFile)) {
        setError("Only JSON, TXT, or PDF files are accepted.");
        setFile(null);
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDropZoneKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleButtonClick();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a JSON, TXT, or PDF file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("difficulty", difficulty);
      formData.append("quizType", quizType);
      formData.append("questionCount", String(questionCount));

      const res = await fetch("/api/upload-and-generate", {
        method: "POST",
        body: formData,
      });
      const data: UploadAndGenerateResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate quiz from file.");
        return;
      }

      const generatedQuestions = Array.isArray(data.questions)
        ? data.questions
            .map((q) => {
              const question =
                typeof q?.question === "string" ? q.question.trim() : "";
              const answer =
                typeof q?.answer === "string" ? q.answer.trim() : "";

              if (!question || !answer) {
                return null;
              }

              const options = Array.isArray(q.options)
                ? q.options.filter(
                    (value): value is string => typeof value === "string",
                  )
                : undefined;

              return {
                question,
                answer,
                ...(Array.isArray(options) && options.length > 0
                  ? { options }
                  : {}),
                ...(normalizeCitation(q.citation)
                  ? { citation: normalizeCitation(q.citation) }
                  : {}),
              };
            })
            .filter((q): q is AdminQuestion => q !== null)
        : [];

      if (generatedQuestions.length > 0) {
        onQuizReady({
          title: file.name,
          category,
          difficulty,
          quizType,
          generationOptions: {
            category,
            difficulty,
            quizType,
            questionCount,
          },
          questions: generatedQuestions,
        });
        setFile(null);
      } else {
        setError(
          data.error ||
            "No valid question/answer pairs were generated. Please try another file.",
        );
      }
    } catch {
      setError("Failed to generate quiz from file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-white dark:bg-black rounded-xl shadow p-6">
      <div
        className={`w-full max-w-md border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors
          ${file ? "border-green-400 bg-green-50" : "border-blue-400 bg-blue-50 hover:bg-blue-100"}
          ${error ? "border-red-400 bg-red-50" : ""}
        `}
        onClick={handleButtonClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onKeyDown={handleDropZoneKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload a JSON, TXT, or PDF file"
        style={{ cursor: "pointer" }}
      >
        <input
          id={fileInputId}
          type="file"
          accept=".json,.txt,.pdf"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <span className="text-4xl mb-2 text-blue-400">📁</span>
        <span className="font-semibold text-blue-700">
          {file
            ? file.name
            : "Drag & drop or click to select a JSON/TXT/PDF file"}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          Only .json, .txt, or .pdf files are accepted.
        </span>
      </div>
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className={`w-full max-w-md py-2 rounded-lg font-bold transition-colors
          ${
            uploading || !file
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600"
          }
        `}
      >
        {uploading ? "Uploading..." : "Upload & Generate"}
      </button>
      <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={categorySelectId} className="text-xs font-semibold text-gray-600">Category</label>
          <select
            id={categorySelectId}
            className="border rounded px-2 py-2 bg-white text-gray-900"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={uploading}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={difficultySelectId} className="text-xs font-semibold text-gray-600">Difficulty</label>
          <select
            id={difficultySelectId}
            className="border rounded px-2 py-2 bg-white text-gray-900"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            disabled={uploading}
          >
            {difficulties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={quizTypeSelectId} className="text-xs font-semibold text-gray-600">Quiz Type</label>
          <select
            id={quizTypeSelectId}
            className="border rounded px-2 py-2 bg-white text-gray-900"
            value={quizType}
            onChange={(event) => setQuizType(event.target.value as AdminQuizType)}
            disabled={uploading}
          >
            {quizTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={questionCountInputId} className="text-xs font-semibold text-gray-600">Question Count</label>
          <input
            id={questionCountInputId}
            type="number"
            min={1}
            max={15}
            className="border rounded px-2 py-2 bg-white text-gray-900"
            value={questionCount}
            onChange={(event) => {
              const parsedValue = Number(event.target.value);
              if (Number.isNaN(parsedValue)) {
                setQuestionCount(1);
                return;
              }

              setQuestionCount(Math.max(1, Math.min(15, parsedValue)));
            }}
            disabled={uploading}
          />
        </div>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default QuizUpload;
