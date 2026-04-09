"use client";
import React, { useState } from "react";
import { AdminQuestion, AdminQuizDraft } from "@/components/admin/types";

const categories = ["Math", "Science", "History", "Programming"];
const difficulties = ["easy", "medium", "hard"];

export default function QuizReview({
  quiz,
  onApprove,
}: {
  quiz: AdminQuizDraft;
  onApprove: (quiz: AdminQuizDraft) => void;
}) {
  const [editedQuiz, setEditedQuiz] = useState<AdminQuizDraft>(quiz);
  const [title, setTitle] = useState(quiz.title || "");
  const [category, setCategory] = useState(categories[0]);
  const [difficulty, setDifficulty] = useState(difficulties[0]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");

  const questions = Array.isArray(editedQuiz?.questions)
    ? editedQuiz.questions
    : [];

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditQ(questions[idx].question);
    setEditA(questions[idx].answer);
  };

  const handleSave = (idx: number) => {
    const updated = { ...editedQuiz };
    if (Array.isArray(updated.questions)) {
      updated.questions[idx].question = editQ;
      updated.questions[idx].answer = editA;
    }
    setEditedQuiz(updated);
    setEditIdx(null);
  };

  const handleDelete = (idx: number) => {
    const updated = { ...editedQuiz };
    if (Array.isArray(updated.questions)) {
      updated.questions.splice(idx, 1);
    }
    setEditedQuiz(updated);
    if (editIdx === idx) setEditIdx(null);
  };

  return (
    <div className="p-6 border rounded-xl bg-white dark:bg-black shadow-md">
      <h2 className="text-2xl font-bold mb-4">Review Quiz</h2>
      <div className="flex gap-4 mb-4 items-center">
        <div>
          <label className="font-semibold mr-2">Title:</label>
          <input
            className="border rounded px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quiz title"
          />
        </div>
        <div>
          <label className="font-semibold mr-2">Category:</label>
          <select
            className="border rounded px-2 py-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold mr-2">Difficulty:</label>
          <select
            className="border rounded px-2 py-1"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {difficulties.map((diff) => (
              <option key={diff}>{diff}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-2 border">#</th>
              <th className="p-2 border text-left">Question</th>
              <th className="p-2 border text-left">Answer</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q: AdminQuestion, idx: number) => (
              <tr key={idx} className="hover:bg-blue-50">
                <td className="p-2 border text-center">{idx + 1}</td>
                <td className="p-2 border">
                  {editIdx === idx ? (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={editQ}
                      onChange={(e) => setEditQ(e.target.value)}
                    />
                  ) : (
                    q.question
                  )}
                </td>
                <td className="p-2 border">
                  {editIdx === idx ? (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={editA}
                      onChange={(e) => setEditA(e.target.value)}
                    />
                  ) : (
                    q.answer
                  )}
                </td>
                <td className="p-2 border text-center space-x-2">
                  {editIdx === idx ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={() => handleSave(idx)}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                        onClick={() => setEditIdx(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => handleEdit(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => handleDelete(idx)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4">
                  No questions available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
        onClick={() =>
          onApprove({
            ...editedQuiz,
            title: title.trim(), // <-- send only if user entered
            category,
            difficulty,
          })
        }
      >
        Approve & Save
      </button>
    </div>
  );
}
