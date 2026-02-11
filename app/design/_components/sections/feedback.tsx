import { Separator, Skeleton } from "@/shared/ui";
import { ComponentSection, ComponentRow, ComponentGrid } from "../component-section";

export function FeedbackSection() {
  return (
    <ComponentSection id="feedback" title="FEEDBACK_INDICATORS" description="Loading states, separators, and status indicators">
      <ComponentRow label="SEPARATOR">
        <div className="w-full space-y-4">
          <p className="text-[13px]">SECTION_A // Performance metrics</p>
          <Separator />
          <p className="text-[13px]">SECTION_B // Training configuration</p>
        </div>
      </ComponentRow>

      <ComponentGrid cols={2} label="SKELETON_LOADING">
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      </ComponentGrid>
    </ComponentSection>
  );
}
