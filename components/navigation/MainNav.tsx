"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import dayjs from "dayjs";

import { useTaskStore } from "@/lib/store/taskStore";
import { useTasksData } from "@/lib/hooks/useTasks";

const NAV_ITEMS = [
  { href: "/", label: "Open" },
  { href: "/today", label: "Today" },
  { href: "/completed", label: "Completed" },
  { href: "/someday", label: "Someday" },
  { href: "/graveyard", label: "Graveyard" },
];

export function MainNav() {
  useTasksData();
  const pathname = usePathname();
  const tasks = useTaskStore((state) => state.tasks);

  const counters = useMemo(() => {
    const todayIso = dayjs().format("YYYY-MM-DD");
    const open = tasks.filter((task) => task.status === "open" && !task.someday).length;
    const today = tasks.filter((task) => task.status === "open" && task.dueDate === todayIso).length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const someday = tasks.filter((task) => task.someday).length;
    const graveyard = tasks.filter((task) => task.status === "archived").length;
    return { open, today, completed, someday, graveyard };
  }, [tasks]);

  const getCountForHref = (href: string) => {
    switch (href) {
      case "/":
        return counters.open;
      case "/today":
        return counters.today;
      case "/completed":
        return counters.completed;
      case "/someday":
        return counters.someday;
      case "/graveyard":
        return counters.graveyard;
      default:
        return undefined;
    }
  };

  return (
    <nav className="flex items-center gap-2 text-sm font-medium">
      {NAV_ITEMS.map((item) => {
        const count = getCountForHref(item.href);
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 transition-colors ${
              isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-1">
              <span>{item.label}</span>
              {typeof count === "number" ? (
                <span className="rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                  {count}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
