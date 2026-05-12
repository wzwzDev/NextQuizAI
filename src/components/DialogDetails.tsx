"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { HelpCircle } from "lucide-react";
import Image from "next/image";

const DetailsDialog = () => {
  return (
    <Dialog>
      <DialogTrigger>
        <span className="flex items-center px-2 py-1 text-white rounded-sm bg-slate-800">
          About
          <HelpCircle className="w-5 h-5 ml-1" />
        </span>
      </DialogTrigger>
      <DialogContent className="w-[70vw] max-w-[100vw] md:w-[50vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to QuizUPM!</DialogTitle>
          <DialogDescription asChild>
            <div>
              <div className="my-2 mt-4">
                <strong>QuizUPM</strong> is an AI-powered quiz platform
                developed as part of my Master’s Final Project (TFM) at
                Universidad Politécnica de Madrid. The goal is to make learning
                more interactive, adaptive, and effective for students and
                educators. QuizUPM leverages modern web technologies and
                artificial intelligence to generate, evaluate, and personalize
                quizzes for a smarter educational experience.
              </div>
              <div className="my-2">
                <span>
                  <strong>Author:</strong>{" "}
                  <a
                    href="https://www.linkedin.com/in/wael-louati/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-700 hover:text-blue-900"
                  >
                    Wael Louati
                  </a>
                </span>
                <br />
                <span>
                  <strong>Tutor:</strong>{" "}
                  <a
                    href="mailto:Alonso.Valverde@upm.es"
                    className="underline text-blue-700 hover:text-blue-900"
                  >
                    Alonso Valverde
                  </a>
                </span>
              </div>
              <hr />
              <div className="my-2 font-semibold">
                <h4 className="text-base font-semibold">Built with</h4>
                <div className="grid justify-around grid-cols-4 mt-2 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Image
                      alt="planetscale"
                      src="/railway.png"
                      width={35}
                      height={35}
                    />
                    <span>Railway</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      alt="nextjs"
                      src="/nextjs.png"
                      width={35}
                      height={35}
                    />
                    <span>Next.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      alt="tailwind"
                      src="/tailwind.png"
                      width={35}
                      height={35}
                    />
                    <span>Tailwind</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      alt="nextauth"
                      src="/nextauth.png"
                      width={30}
                      height={30}
                      style={{ width: "auto", height: "auto" }}
                    />
                    <span>NextAuth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      alt="openai"
                      src="/openai.png"
                      width={30}
                      height={30}
                    />
                    <span>OpenAI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      alt="react query"
                      src="/react-query.png"
                      width={30}
                      height={30}
                    />
                    <span>React Query</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      alt="primsa"
                      src="/prisma.png"
                      width={30}
                      height={30}
                    />
                    <span>Prisma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      alt="typescript"
                      src="/typescript.png"
                      width={30}
                      height={30}
                    />
                    <span>TypeScript</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default DetailsDialog;
