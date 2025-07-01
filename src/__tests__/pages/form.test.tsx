import React from "react";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "../../components/ui/form";

function TestForm() {
  const methods = useForm({
    defaultValues: { name: "" },
    mode: "onChange",
  });

  return (
    <FormProvider {...methods}>
      <form>
        <FormField
          name="name"
          control={methods.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <input {...field} placeholder="Your name" />
              </FormControl>
              <FormDescription>Description</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </FormProvider>
  );
}

describe("Form UI components", () => {
  it("renders form field, label, control, description, and message", () => {
    render(<TestForm />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});