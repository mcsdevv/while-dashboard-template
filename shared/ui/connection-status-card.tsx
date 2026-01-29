import { CheckCircle2 } from "lucide-react";
import * as React from "react";

import { cn } from "./utils";

interface ConnectionStatusCardProps {
  /** The name of the connected service (e.g., "Google Calendar", "Notion") */
  title: string;
  /** Status text shown after title (defaults to "Connected") */
  status?: string;
  /** Optional subtitle shown below the title (e.g., calendar name, database name) */
  subtitle?: string;
  /** Optional label for the subtitle (e.g., "Calendar", "Database") */
  subtitleLabel?: string;
  /** Additional class names */
  className?: string;
}

const ConnectionStatusCard = React.forwardRef<HTMLDivElement, ConnectionStatusCardProps>(
  ({ title, status = "Connected", subtitle, subtitleLabel, className }, ref) => (
    <div
      ref={ref}
      className={cn("border border-emerald-500/30 bg-emerald-500/5 p-4", className)}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div>
            <span className="font-medium text-foreground">{title}</span>
            <span className="text-muted-foreground">: {status}</span>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitleLabel ? `${subtitleLabel}: ` : ""}
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  ),
);
ConnectionStatusCard.displayName = "ConnectionStatusCard";

export { ConnectionStatusCard, type ConnectionStatusCardProps };
