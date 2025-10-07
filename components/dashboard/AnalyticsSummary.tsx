"use client";

import dayjs from "dayjs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyStats } from "@/lib/hooks/useDailyStats";

const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

export function AnalyticsSummary() {
  const { data, isLoading, isError, error } = useDailyStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {(error as Error).message ?? "Failed to load analytics"}
      </div>
    );
  }

  const stats = data ?? [];
  const today = stats[0];
  const completionsToday = today?.completions ?? 0;
  const rolloversToday = today?.rollovers ?? 0;
  const perfectDays = stats.filter((entry) => entry.perfect_day).length;
  const completionRate = stats.length
    ? Math.round((stats.reduce((acc, entry) => acc + entry.completions, 0) / stats.length) * 100) / 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="shadow-sm transition hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today&apos;s completions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{formatter.format(completionsToday)}</p>
          <p className="text-xs text-muted-foreground">
            {today ? dayjs(today.stat_date).format("MMM D, YYYY") : "No data yet"}
          </p>
          <p className="text-xs text-muted-foreground">Rollovers today: {formatter.format(rolloversToday)}</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm transition hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Average completions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{completionRate.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Per day (14-day window)</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm transition hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Perfect days</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{perfectDays}</p>
          <p className="text-xs text-muted-foreground">No rollovers in the last 14 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
