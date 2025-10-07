"use client";

import { Button } from "@/components/ui/button";
import type { TaskPriority } from "@/types/task";
import { priorityLabels } from "@/lib/utils/priorityHelpers";

interface PriorityLimitModalProps {
  open: boolean;
  priority: TaskPriority;
  current: number;
  limit: number;
  onClose: () => void;
  onCompleteExisting?: () => void;
  onDowngradeExisting?: () => void;
  onCreateAsLower?: () => void;
  onForceAdd?: () => void;
}

export function PriorityLimitModal({
  open,
  priority,
  current,
  limit,
  onClose,
  onCompleteExisting,
  onDowngradeExisting,
  onCreateAsLower,
  onForceAdd,
}: PriorityLimitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {priorityLabels[priority]} limit reached
          </h2>
          <p className="text-sm text-muted-foreground">
            You&apos;ve used {current} of {limit} slots. Choose how to proceed.
          </p>
        </header>

        <div className="mt-4 space-y-3 text-sm">
          <button
            className="w-full rounded-md border bg-card p-3 text-left hover:border-primary"
            onClick={onCompleteExisting}
          >
            Complete an existing {priorityLabels[priority]}
          </button>
          <button
            className="w-full rounded-md border bg-card p-3 text-left hover:border-primary"
            onClick={onDowngradeExisting}
          >
            Downgrade an existing task
          </button>
          <button
            className="w-full rounded-md border bg-card p-3 text-left hover:border-primary"
            onClick={onCreateAsLower}
          >
            Create this task at a lower priority
          </button>
          <button
            className="w-full rounded-md border bg-card p-3 text-left hover:border-primary"
            onClick={onForceAdd}
          >
            Force add and log override
          </button>
        </div>

        <footer className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </footer>
      </div>
    </div>
  );
}
