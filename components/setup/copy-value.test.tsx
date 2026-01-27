import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyValue } from "./copy-value";

// Mock the Button component from @while/ui
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
}));

describe("CopyValue", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  describe("rendering", () => {
    it("renders the value in a code block", () => {
      render(<CopyValue value="test-value-123" />);

      const codeElement = screen.getByText("test-value-123");
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.tagName).toBe("CODE");
    });

    it("renders the label when provided", () => {
      render(<CopyValue value="test-value" label="Test Label" />);

      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("does not render label when not provided", () => {
      render(<CopyValue value="test-value" />);

      // Should only have one child in the container (the flex div)
      const container = screen.getByText("test-value").closest("div");
      const parent = container?.parentElement;
      expect(parent?.querySelector("span")).toBeNull();
    });

    it("applies custom className to container", () => {
      const { container } = render(<CopyValue value="test-value" className="custom-class" />);

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("renders copy button", () => {
      render(<CopyValue value="test-value" />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders clipboard icon initially (not checkmark)", () => {
      render(<CopyValue value="test-value" />);

      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      // Initial icon should NOT have green color (checkmark has green)
      expect(svg).not.toHaveClass("text-green-600");
    });

    it("code block has correct styling classes", () => {
      render(<CopyValue value="test-value" />);

      const code = screen.getByText("test-value");
      expect(code).toHaveClass("flex-1", "rounded", "bg-muted", "font-mono", "break-all");
    });
  });

  describe("copy functionality", () => {
    it("calls clipboard.writeText with value when button is clicked", async () => {
      render(<CopyValue value="copy-me-123" />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("copy-me-123");
    });

    it("shows checkmark icon after successful copy", async () => {
      render(<CopyValue value="test-value" />);

      // Click to trigger copy
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
        // Wait for the clipboard promise to resolve
        await Promise.resolve();
      });

      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");
      expect(svg).toHaveClass("text-green-600");
    });

    it("reverts to clipboard icon after timeout", async () => {
      vi.useFakeTimers();
      render(<CopyValue value="test-value" />);

      // Click to copy
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
        // Let the clipboard promise resolve
        await Promise.resolve();
      });

      // Verify checkmark is shown
      expect(screen.getByRole("button").querySelector("svg")).toHaveClass("text-green-600");

      // Advance time by 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Verify clipboard icon is shown again
      expect(screen.getByRole("button").querySelector("svg")).not.toHaveClass("text-green-600");
      vi.useRealTimers();
    });
  });

  describe("edge cases", () => {
    it("handles empty string value", () => {
      render(<CopyValue value="" />);

      const codeElement = screen.getByRole("button").parentElement?.querySelector("code");
      expect(codeElement?.textContent).toBe("");
    });

    it("handles very long values", () => {
      const longValue = "a".repeat(1000);
      render(<CopyValue value={longValue} />);

      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it("handles special characters in value", () => {
      const specialValue = "<script>alert('xss')</script>";
      render(<CopyValue value={specialValue} />);

      // Should render as text, not execute
      expect(screen.getByText(specialValue)).toBeInTheDocument();
    });

    it("handles URL values", () => {
      const urlValue = "https://example.com/api/auth/callback/google";
      render(<CopyValue value={urlValue} />);

      expect(screen.getByText(urlValue)).toBeInTheDocument();
    });

    it("handles values with spaces", () => {
      const spacedValue = "openid email profile";
      render(<CopyValue value={spacedValue} />);

      expect(screen.getByText(spacedValue)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("button is accessible via keyboard", () => {
      render(<CopyValue value="test-value" />);

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("type", "button");
    });

    it("svg icons have aria-hidden", () => {
      render(<CopyValue value="test-value" />);

      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("label styling", () => {
    it("label has correct styling classes", () => {
      render(<CopyValue value="test-value" label="My Label" />);

      const label = screen.getByText("My Label");
      expect(label).toHaveClass("text-xs", "text-muted-foreground", "block", "mb-1");
    });
  });
});
