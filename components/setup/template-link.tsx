"use client";

import { TEMPLATE_URL } from "@/lib/notion/template";
import { Button } from "@/shared/ui";

interface TemplateLinkProps {
  onContinue?: () => void;
}

/**
 * Component that provides a link to duplicate the Denver Calendar Sync template
 * and shows instructions for setting it up.
 */
export function TemplateLink({ onContinue }: TemplateLinkProps) {
  const handleOpenTemplate = () => {
    window.open(TEMPLATE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <svg
            className="h-5 w-5 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Use our template (recommended)</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with a pre-configured database that has all the right properties. Just duplicate
            and connect.
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-10">
        <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          <li>Click the button below to open our Notion template</li>
          <li>Click "Duplicate" in the top right corner</li>
          <li>Share the duplicated database with your integration</li>
          <li>Come back here and select it from the list</li>
        </ol>
      </div>

      <div className="flex gap-2 pl-10">
        <Button variant="outline" size="sm" onClick={handleOpenTemplate}>
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Open Template
        </Button>
        {onContinue && (
          <Button variant="ghost" size="sm" onClick={onContinue}>
            I already have a database
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function TemplateLinkInline() {
  return (
    <a
      href={TEMPLATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary underline"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      Use our template
    </a>
  );
}
