"use client";

import { Button } from "@/shared/ui";
import { useState } from "react";

interface CopyValueProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyValue({ value, label, className }: CopyValueProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={className}>
      {label && <span className="text-xs text-muted-foreground block mb-1">{label}</span>}
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs font-mono break-all">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 h-8 px-2"
        >
          {copied ? (
            <svg
              aria-hidden="true"
              className="h-4 w-4 text-green-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
