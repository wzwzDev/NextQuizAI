import { act, renderHook } from "@testing-library/react";
import { useToast, toast, reducer } from "../../components/ui/use-toast";

describe("use-toast", () => {
  afterEach(() => {
    // Reset the internal state after each test
    // @ts-ignore
    if (global.setTimeout.mockRestore) global.setTimeout.mockRestore();
  });

  it("adds a toast and exposes it in state", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast({ title: "Hello", description: "World" });
    });
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe("Hello");
    expect(result.current.toasts[0].description).toBe("World");
  });

  it("dismisses a toast", () => {
    const { result } = renderHook(() => useToast());
    let id: string = "";
    act(() => {
      const t = toast({ title: "Dismiss me" });
      id = t.id;
    });
    act(() => {
      result.current.dismiss(id);
    });
    expect(result.current.toasts[0].open).toBe(false);
  });

  it("removes a toast", () => {
    const initialState = {
      toasts: [
        { id: "1", title: "A", open: true },
        { id: "2", title: "B", open: true },
      ],
    };
    const newState = reducer(initialState, { type: "REMOVE_TOAST", toastId: "1" });
    expect(newState.toasts.length).toBe(1);
    expect(newState.toasts[0].id).toBe("2");
  });

  it("updates a toast", () => {
    const initialState = {
      toasts: [{ id: "1", title: "A", open: true }],
    };
    const newState = reducer(initialState, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "B" },
    });
    expect(newState.toasts[0].title).toBe("B");
  });

  it("limits toasts to TOAST_LIMIT", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast({ title: "First" });
      toast({ title: "Second" });
    });
    expect(result.current.toasts.length).toBe(1); // TOAST_LIMIT is 1
    expect(result.current.toasts[0].title).toBe("Second");
  });

  it("dismisses all toasts if no id is provided", () => {
    const initialState = {
      toasts: [
        { id: "1", title: "A", open: true },
        { id: "2", title: "B", open: true },
      ],
    };
    const newState = reducer(initialState, { type: "DISMISS_TOAST" });
    expect(newState.toasts.every((t) => t.open === false)).toBe(true);
  });
});