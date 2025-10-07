import { Metadata } from "next";

import { CompletedPageClient } from "@/components/pages/CompletedPageClient";

export const metadata: Metadata = {
  title: "Completed | Temporary Task Manager",
};

export default function CompletedPage() {
  return <CompletedPageClient />;
}
