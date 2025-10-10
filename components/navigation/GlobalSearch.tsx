"use client";

import { ChangeEvent } from "react";
import { Search } from "lucide-react";

import { useTaskStore } from "@/lib/store/taskStore";

export function GlobalSearch() {
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const setSearchQuery = useTaskStore((state) => state.setSearchQuery);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="relative w-full max-w-sm">
      <label htmlFor="global-task-search" className="sr-only">
        Search tasks
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="global-task-search"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search tasks"
        className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
