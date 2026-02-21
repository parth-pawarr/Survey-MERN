"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Step {current} of {total}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <Progress value={(current / total) * 100} className="h-1.5" />
    </div>
  );
}
