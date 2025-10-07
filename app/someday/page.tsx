import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Someday | Temporary Task Manager",
};

export default function SomedayPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Someday</h1>
        <p className="text-sm text-muted-foreground">
          Ideas and tasks held outside of the active loop.
        </p>
      </header>
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Parked tasks will live here once implemented.
      </div>
    </section>
  );
}
