import type { Metadata } from "next";
import { TaskBoard } from "@/components/tasks/TaskBoard";

export const metadata: Metadata = {
  title: "Open Tasks | Temporary Task Manager",
  description:
    "Plan, prioritize, and review your single-user productivity system with disciplined limits and automated rollovers.",
};

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Temporary Task Manager</p>
        <h1 className="text-3xl font-semibold tracking-tight">Open tasks</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Constrain your commitments, automate daily rollovers, and surface the habits that keep you stuck.
        </p>
      </header>
      <TaskBoard />
    </main>
  );
}
