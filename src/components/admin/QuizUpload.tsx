"use client";
import React, { useRef, useState } from "react";
import { AdminQuestion, AdminQuizDraft } from "@/components/admin/types";

type QuizUploadProps = {
  onQuizReady: (quiz: AdminQuizDraft) => void;
};

type UploadAndGenerateResponse = {
  questions?: AdminQuestion[];
  error?: string;
};

const QuizUpload = ({ onQuizReady }: QuizUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      if (
        selectedFile.type !== "application/json" &&
        selectedFile.type !== "text/plain" &&
        !selectedFile.name.endsWith(".json") &&
        !selectedFile.name.endsWith(".txt")
      ) {
        setError("Only JSON or TXT files are accepted.");
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
      if (
        droppedFile.type !== "application/json" &&
        droppedFile.type !== "text/plain" &&
        !droppedFile.name.endsWith(".json") &&
        !droppedFile.name.endsWith(".txt")
      ) {
        setError("Only JSON or TXT files are accepted.");
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

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a JSON or TXT file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

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
        ? data.questions.filter(
            (q) =>
              typeof q?.question === "string" &&
              q.question.trim().length > 0 &&
              typeof q?.answer === "string" &&
              q.answer.trim().length > 0,
          )
        : [];

      if (generatedQuestions.length > 0) {
        onQuizReady({
          title: file.name,
          quizType: "open_ended",
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
        style={{ cursor: "pointer" }}
      >
        <input
          type="file"
          accept=".json,.txt"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <span className="text-4xl mb-2 text-blue-400">📁</span>
        <span className="font-semibold text-blue-700">
          {file ? file.name : "Drag & drop or click to select a JSON/TXT file"}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          Only .json or .txt files are accepted.
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
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default QuizUpload;
