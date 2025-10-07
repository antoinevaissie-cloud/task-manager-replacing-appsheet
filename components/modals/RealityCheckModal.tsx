"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type RealityCheckStage = "warning" | "alert" | "intervention" | "auto-archive";

interface RealityCheckAction {
  key: string;
  label: string;
  onSelect?: () => void;
  intent?: "primary" | "secondary" | "danger";
}

interface RealityCheckModalProps {
  open: boolean;
  stage: RealityCheckStage;
  taskTitle: string;
  rolloverCount: number;
  description?: ReactNode;
  actions: RealityCheckAction[];
  onDismiss?: () => void;
}

const stageCopy: Record<RealityCheckStage, { title: string; tone: string }> = {
  warning: {
    title: "Still relevant?",
    tone: "This task has slipped a few times. Take a moment to confirm it matters today.",
  },
  alert: {
    title: "Decision time",
    tone: "Five rollovers in a row. Decide how you want to handle this task moving forward.",
  },
  intervention: {
    title: "Break the bottleneck",
    tone: "Seven rollovers suggests friction. Choose how to unblock progress.",
  },
  "auto-archive": {
    title: "Auto-archived",
    tone: "Ten rollovers reached. The task has been moved to the Graveyard to protect focus.",
  },
};

export function RealityCheckModal({
  open,
  stage,
  taskTitle,
  rolloverCount,
  description,
  actions,
  onDismiss,
}: RealityCheckModalProps) {
  if (!open) return null;

  const copy = stageCopy[stage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-xl bg-background p-6 shadow-xl">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {rolloverCount} rollovers
          </p>
          <h2 className="text-xl font-semibold tracking-tight">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.tone}</p>
        </header>

        <div className="space-y-3">
          <div className="rounded-md border bg-card p-4">
            <p className="text-sm font-medium">{taskTitle}</p>
            {description ? <div className="mt-2 text-sm text-muted-foreground">{description}</div> : null}
          </div>

          <ul className="space-y-2 text-sm">
            {actions.map((action) => (
              <li key={action.key}>
                <button
                  onClick={action.onSelect}
                  className="flex w-full items-center justify-between rounded-md border bg-card px-4 py-3 text-left hover:border-primary"
                >
                  <span>{action.label}</span>
                  {action.intent === "danger" ? (
                    <span className="text-xs uppercase tracking-wide text-red-500">Required</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {onDismiss ? (
          <footer className="flex justify-end">
            <Button variant="ghost" onClick={onDismiss}>
              Close
            </Button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
