"use client";

import { useQuery } from "@tanstack/react-query";

interface DailyStat {
  id: string;
  stat_date: string;
  completions: number;
  rollovers: number;
  overrides: number;
  perfect_day: boolean;
}

interface DailyStatsResponse {
  stats: DailyStat[];
}

const fetchDailyStats = async (): Promise<DailyStat[]> => {
  const response = await fetch("/api/stats/daily?days=14", { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? "Failed to load stats");
  }
  const payload = (await response.json()) as DailyStatsResponse;
  return payload.stats ?? [];
};

export function useDailyStats() {
  return useQuery({
    queryKey: ["daily-stats"],
    queryFn: fetchDailyStats,
    staleTime: 60_000,
  });
}
