import { Metadata } from "next";
import { SomedayPageClient } from "@/components/pages/SomedayPageClient";

export const metadata: Metadata = {
  title: "Someday | Temporary Task Manager",
};

export default function SomedayPage() {
  return <SomedayPageClient />;
}
