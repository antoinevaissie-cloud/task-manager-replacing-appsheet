import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ShortcutProvider } from "@/components/providers/ShortcutProvider";
import { RealityCheckManager } from "@/components/providers/RealityCheckManager";
import Link from "next/link";
import { MainNav } from "@/components/navigation/MainNav";
import { GlobalSearch } from "@/components/navigation/GlobalSearch";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskCreateLauncher } from "@/components/tasks/TaskCreateLauncher";
import { Toaster } from "react-hot-toast";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Temporary Task Manager",
  description:
    "A disciplined productivity system with priority caps, automated rollovers, and reflective analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <QueryProvider>
          <ShortcutProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <WelcomeModal />
            <RealityCheckManager />
            <div className="flex min-h-screen flex-col">
              <header className="border-b bg-card/60 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
                  <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em]">
                    Temp Task Manager
                  </Link>
                  <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <MainNav />
                    <GlobalSearch />
                  </div>
                </div>
              </header>
              <div className="flex-1 bg-muted/10">{children}</div>
              <footer className="border-t bg-card/60 text-xs text-muted-foreground">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                  <span>Built for single-player focus.</span>
                  <span>v1.0 roadmap in progress</span>
                </div>
              </footer>
              <TaskDetailSheet />
              <TaskCreateLauncher />
            </div>
          </ShortcutProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
