import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignIn } from "./sign-in";

const signInMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("@/shared/ui", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardDescription: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <p {...props}>{children}</p>,
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <h1 {...props}>{children}</h1>
  ),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParamsMock(),
}));

describe("SignIn", () => {
  beforeEach(() => {
    signInMock.mockClear();
    useSearchParamsMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("uses callbackUrl from query string when provided", () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("callbackUrl=%2Fdashboard"));

    render(<SignIn />);

    fireEvent.click(screen.getByRole("button", { name: /sign in with google/i }));

    expect(signInMock).toHaveBeenCalledWith("google", { callbackUrl: "/dashboard" });
  });

  it("defaults to root when callbackUrl is missing", () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    render(<SignIn />);

    fireEvent.click(screen.getByRole("button", { name: /sign in with google/i }));

    expect(signInMock).toHaveBeenCalledWith("google", { callbackUrl: "/" });
  });
});
