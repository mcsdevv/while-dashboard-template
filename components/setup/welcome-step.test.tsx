import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WelcomeStep } from "./welcome-step";

// Mock the UI components
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

describe("WelcomeStep", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the intro text", () => {
      render(<WelcomeStep onNext={() => {}} />);

      expect(
        screen.getByText(/This wizard will help you connect your Google Calendar/),
      ).toBeInTheDocument();
    });

    it("renders the 7-day token warning", () => {
      render(<WelcomeStep onNext={() => {}} />);

      expect(screen.getByText(/Token expiration notice:/)).toBeInTheDocument();
      expect(screen.getByText(/OAuth tokens expire every 7 days/)).toBeInTheDocument();
    });

    it("renders link to publish OAuth app in warning", () => {
      render(<WelcomeStep onNext={() => {}} />);

      const publishLink = screen.getByRole("link", { name: /publish your OAuth app/ });
      expect(publishLink).toHaveAttribute(
        "href",
        "https://while.so/docs/setup/google#step-5-publish-app-optional",
      );
      expect(publishLink).toHaveAttribute("target", "_blank");
      expect(publishLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the prerequisites section", () => {
      render(<WelcomeStep onNext={() => {}} />);

      expect(screen.getByText("Prerequisites")).toBeInTheDocument();
      expect(screen.getByText(/Google Cloud project with Calendar API/)).toBeInTheDocument();
      expect(screen.getByText(/Notion integration with access/)).toBeInTheDocument();
      expect(screen.getByText(/Share your Notion database/)).toBeInTheDocument();
    });

    it("renders external links with security attributes", () => {
      render(<WelcomeStep onNext={() => {}} />);

      const googleLink = screen.getByRole("link", { name: /Create credentials/i });
      expect(googleLink).toHaveAttribute(
        "href",
        "https://console.cloud.google.com/auth/clients/create",
      );
      expect(googleLink).toHaveAttribute("target", "_blank");
      expect(googleLink).toHaveAttribute("rel", "noopener noreferrer");

      const notionLink = screen.getByRole("link", { name: /Create integration/i });
      expect(notionLink).toHaveAttribute("href", "https://www.notion.so/my-integrations");
      expect(notionLink).toHaveAttribute("target", "_blank");
      expect(notionLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders the Get Started button", () => {
      render(<WelcomeStep onNext={() => {}} />);

      expect(screen.getByRole("button", { name: /Get Started/i })).toBeInTheDocument();
    });
  });

  describe("onNext callback", () => {
    it("calls onNext when Get Started button is clicked", () => {
      const onNextMock = vi.fn();
      render(<WelcomeStep onNext={onNextMock} />);

      fireEvent.click(screen.getByRole("button", { name: /Get Started/i }));

      expect(onNextMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("warning icon has aria-hidden", () => {
      render(<WelcomeStep onNext={() => {}} />);

      const warningContainer = screen.getByText(/Token expiration notice:/).closest("p");
      const warningIcon = warningContainer?.parentElement?.querySelector("svg");
      expect(warningIcon).toHaveAttribute("aria-hidden", "true");
    });

    it("all external links have proper security attributes", () => {
      render(<WelcomeStep onNext={() => {}} />);

      const externalLinks = screen.getAllByRole("link");
      for (const link of externalLinks) {
        if (link.getAttribute("target") === "_blank") {
          expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
          expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
        }
      }
    });
  });
});
