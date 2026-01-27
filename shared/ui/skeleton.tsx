import { cn } from "./utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-none bg-muted", className)} {...props} />;
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-none border bg-card p-6 space-y-4", className)} {...props}>
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

function SkeletonSettingsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Connection status skeleton */}
        <SkeletonCard />

        {/* Service settings skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Field mapping skeleton */}
        <SkeletonCard className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        {/* Danger zone skeleton */}
        <SkeletonCard />
      </div>
    </div>
  );
}

function SkeletonSetupWizard() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress indicator skeleton */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-2 w-8 rounded-full" />
          ))}
        </div>

        {/* Card skeleton */}
        <div className="rounded-none border bg-card p-6 space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonSettingsPage, SkeletonSetupWizard };
