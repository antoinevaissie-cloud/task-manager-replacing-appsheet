#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dayjs from "dayjs";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function loadEnvFile(filename) {
  try {
    const fullPath = path.resolve(repoRoot, filename);
    const raw = await fs.readFile(fullPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      if (!key || process.env[key] !== undefined) continue;
      const value = trimmed.slice(eqIndex + 1).trim();
      process.env[key] = value.replace(/^"|"$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Failed to read ${filename}:`, error.message);
    }
  }
}

await loadEnvFile(".env");
await loadEnvFile(".env.local");

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase URL or service role key missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);
const options = {
  dryRun: args.includes("--dry-run"),
  openOnly: args.includes("--open-only"),
  limit: null,
};

for (const arg of args) {
  if (arg.startsWith("--limit=")) {
    const value = Number.parseInt(arg.split("=")[1] ?? "", 10);
    if (!Number.isNaN(value) && value > 0) {
      options.limit = value;
    }
  }
}

function toDateString(value) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
}

function toTimestamp(value) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toISOString() : null;
}

const STATUS_MAP = {
  Open: "open",
  Completed: "completed",
  Archived: "archived",
  Waiting: "waiting",
};

const PRIORITY_VALUES = new Set(["P1", "P2", "P3", "P4"]);

const migrationPath = path.resolve(repoRoot, "migration.json");
const migrationRaw = await fs.readFile(migrationPath, "utf8");
const migrationData = JSON.parse(migrationRaw);

const tasksSheet = migrationData.sheets.find((sheet) => sheet.name === "Tasks");
if (!tasksSheet) {
  console.error("No 'Tasks' sheet found in migration.json");
  process.exit(1);
}

const [headers, ...rows] = tasksSheet.data;
const headerIndex = new Map(headers.map((header, index) => [header, index]));

function getValue(row, key) {
  const index = headerIndex.get(key);
  return index !== undefined ? row[index] ?? "" : "";
}

const legacyTasks = rows
  .filter((row) => (getValue(row, "Title") ?? "").trim().length > 0)
  .map((row) => ({
    legacyId: String(getValue(row, "Task ID") ?? "").trim() || null,
    projectId: String(getValue(row, "Project ID") ?? "").trim() || null,
    title: String(getValue(row, "Title") ?? "").trim(),
    description: String(getValue(row, "Description") ?? "").trim() || null,
    status: STATUS_MAP[String(getValue(row, "Status") ?? "Open")] ?? "open",
    dueDate: toDateString(getValue(row, "Due Date")) ?? dayjs().format("YYYY-MM-DD"),
    createdAt: toTimestamp(getValue(row, "Created Date")) ?? new Date().toISOString(),
    completedAt: toTimestamp(getValue(row, "Completed Date")) ?? null,
    urgency: PRIORITY_VALUES.has(String(getValue(row, "Urgency")).trim())
      ? String(getValue(row, "Urgency")).trim()
      : "P3",
    urls: ["URL1", "URL2", "URL3"]
      .map((key) => String(getValue(row, key) ?? "").trim())
      .filter((value) => value.length > 0),
    followUpItem: (() => {
      const raw = getValue(row, "FollowUpItem");
      if (typeof raw === "boolean") return raw;
      if (typeof raw === "string") {
        const normalized = raw.trim().toLowerCase();
        return ["true", "1", "y", "yes"].includes(normalized);
      }
      return false;
    })(),
  }));

let tasksToProcess = legacyTasks;
if (options.openOnly) {
  tasksToProcess = tasksToProcess.filter((task) => task.status === "open");
}
if (options.limit != null) {
  tasksToProcess = tasksToProcess.slice(0, options.limit);
}

const { data: existingTasks, error: fetchError } = await supabase
  .from("tasks")
  .select("id,title,due_date,urgency");

if (fetchError) {
  console.error("Failed to fetch existing tasks:", fetchError.message);
  process.exit(1);
}

const existingKeys = new Set(
  (existingTasks ?? []).map((task) => `${task.title}::${task.due_date}::${task.urgency}`),
);

const tasksToInsert = tasksToProcess.filter((task) => {
  const key = `${task.title}::${task.dueDate}::${task.urgency}`;
  if (existingKeys.has(key)) {
    return false;
  }
  existingKeys.add(key);
  return true;
});

if (tasksToInsert.length === 0) {
  console.log("No tasks to insert (all duplicates or filtered out).");
  process.exit(0);
}

const TITLE_MAX = 200;
const warnings = [];

const preparedRows = tasksToInsert.map((task) => {
  let title = task.title;
  if (title.length > TITLE_MAX) {
    const original = title;
    title = title.slice(0, TITLE_MAX).trimEnd();
    warnings.push({
      type: "title-truncated",
      legacyId: task.legacyId,
      original: original,
      truncated: title,
    });
  }

  return {
    title,
    description: task.description,
    urgency: task.urgency,
    status: task.status,
    due_date: task.dueDate,
  rollover_count: 0,
  reschedule_count: 0,
  last_rolled_over_at: null,
  last_rescheduled_at: null,
  tags: task.legacyId ? [`legacy:${task.legacyId}`] : null,
  context: null,
  project_id: task.projectId || null,
  someday: false,
  follow_up_item: task.followUpItem,
  notes: null,
  reality_check_stage: "none",
  reality_check_due_at: null,
  sort_order: null,
  created_at: task.createdAt,
  updated_at: task.completedAt ?? task.createdAt,
  completed_at: task.status === "completed" ? task.completedAt : null,
  urls: task.urls.length > 0 ? task.urls : null,
};
});

if (options.dryRun) {
  console.log(`[dry-run] Would insert ${preparedRows.length} tasks.`);
  console.table(
    preparedRows.slice(0, 5).map((task) => ({
      title: task.title,
      due_date: task.due_date,
      urgency: task.urgency,
      status: task.status,
      project_id: task.project_id,
      follow_up_item: task.follow_up_item,
      urls: task.urls?.length ?? 0,
      tags: task.tags?.join(","),
    })),
  );
  process.exit(0);
}

const chunkSize = 50;
for (let index = 0; index < preparedRows.length; index += chunkSize) {
  const chunk = preparedRows.slice(index, index + chunkSize);
  const { error } = await supabase.from("tasks").insert(chunk);
  if (error) {
    console.error(`Insertion failed on batch ${index / chunkSize + 1}:`, error.message);
    process.exit(1);
  }
}

console.log(`Inserted ${preparedRows.length} tasks into Supabase.`);
if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s):`);
  warnings.slice(0, 10).forEach((warning, index) => {
    if (warning.type === "title-truncated") {
      console.log(
        `${index + 1}. [legacy:${warning.legacyId ?? "unknown"}] title truncated to ${TITLE_MAX} chars.`,
      );
    }
  });
  if (warnings.length > 10) {
    console.log(`…and ${warnings.length - 10} more.`);
  }
}
