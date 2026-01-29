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
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="md:max-w-md">
            <div className="flex items-center gap-2">
              <Image src="/icon-no-bg.svg" alt="While" width={32} height={32} />
              <span className="font-medium">While</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Open-source, self-hosted bidirectional sync between Notion and Google Calendar. Built
              with privacy and reliability in mind.
            </p>
          </div>

          {/* Product and Resources - right aligned */}
          <div className="flex gap-12">
            {/* Product Links */}
            <div>
              <h3 className="font-medium">Product</h3>
              <ul className="mt-4 space-y-2">
                {links.product.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline text-muted-foreground hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="font-medium">Resources</h3>
              <ul className="mt-4 space-y-2">
                {links.resources.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline text-muted-foreground hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tech Stack & License */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            A project by{" "}
            <a
              href="https://mcs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Matthew Sweeney
            </a>
            .
          </p>
          <ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />
          <p className="text-sm text-muted-foreground">
            Released under the{" "}
            <a
              href="https://github.com/mcsdevv/while/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
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
