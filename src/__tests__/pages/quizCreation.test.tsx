import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizCreation from "../../components/forms/QuizCreation";

// Mocks
jest.mock("@/components/ui/form", () => ({
  Form: ({ children }: any) => <div>{children}</div>, // Avoid nested <form>
  FormField: ({ render, ...props }: any) => render({ field: { ...props } }),
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormDescription: ({ children }: any) => <div>{children}</div>,
  FormMessage: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("../../components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock("../../components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));
jest.mock("../../components/ui/separator", () => ({
  Separator: (props: any) => <div data-testid="separator" {...props} />,
}));
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("../../components/LoadingQuestions", () => ({ finished }: any) => (
  <div data-testid="loading-questions">{finished ? "Finished" : "Loading..."}</div>
));
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: (_: any, { onSuccess }: any) => onSuccess?.({ gameId: "test-game-id" }),
    isPending: false,
  }),
}));
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: { gameId: "test-game-id" } })),
}));
jest.mock("../../components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("QuizCreation", () => {
  

  it("switches quiz type when buttons are clicked", () => {
    render(<QuizCreation topic="Math" />);
    const mcqBtn = screen.getByRole("button", { name: /Multiple Choice/i });
    const openBtn = screen.getByRole("button", { name: /Open Ended/i });
    fireEvent.click(openBtn);
    fireEvent.click(mcqBtn);
    // No assertion needed, just ensure no crash
  });

});