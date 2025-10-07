import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Graveyard | Temporary Task Manager",
};

export default function GraveyardPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Graveyard</h1>
        <p className="text-sm text-muted-foreground">
          Tasks auto-archived after chronic rollovers are surfaced here.
        </p>
      </header>
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Chronic tasks analysis forthcoming.
      </div>
    </section>
  );
}
