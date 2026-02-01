"use client";

import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";

const links = {
  product: [
    { name: "Documentation", href: "https://while.so/docs" },
    { name: "GitHub", href: "https://github.com/mcsdevv/while" },
    { name: "Issues", href: "https://github.com/mcsdevv/while/issues" },
  ],
  resources: [
    { name: "Setup Guide", href: "https://while.so/docs/quickstart" },
    { name: "Troubleshooting", href: "https://while.so/docs/guides/troubleshooting" },
    { name: "Architecture", href: "https://while.so/docs/architecture" },
  ],
};

interface FooterProps {
  theme?: string;
  setTheme?: (theme: string) => void;
  resolvedTheme?: string;
}

export function Footer({ theme, setTheme = () => {}, resolvedTheme }: FooterProps) {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto_auto] md:gap-12 lg:gap-16">
          {/* Brand */}
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <Image src="/icon-no-bg.svg" alt="While" width={32} height={32} />
              <span className="font-medium">While</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Open-source, self-hosted bidirectional sync between Notion and Google Calendar. Built
              with privacy and reliability in mind.
            </p>
          </div>

          {/* Product Links */}
          <div className="min-w-[140px]">
            <h3 className="font-medium">Product</h3>
            <ul className="mt-4 space-y-2">
              {links.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm text-sm underline text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="min-w-[160px]">
            <h3 className="font-medium">Resources</h3>
            <ul className="mt-4 space-y-2">
              {links.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm text-sm underline text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tech Stack & License */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t pt-8 sm:flex-row sm:justify-center sm:gap-6">
          <p className="text-sm text-muted-foreground">
            A project by{" "}
            <a
              href="https://mcs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Matthew Sweeney
            </a>
            .
          </p>
          <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden="true">
            •
          </span>
          <ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />
          <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden="true">
            •
          </span>
          <p className="text-sm text-muted-foreground">
            Released under the{" "}
            <a
              href="https://github.com/mcsdevv/while/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              MIT License
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
