import { Metadata } from "next";
import { TodayBoard } from "@/components/tasks/TodayBoard";

export const metadata: Metadata = {
  title: "Today | Temporary Task Manager",
};

export default function TodayPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Daily focus</p>
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review overdue items, commit to what matters, and close the loop before the day ends.
        </p>
      </header>
      <TodayBoard />
    </main>
  );
}
