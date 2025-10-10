"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTaskStore } from "@/lib/store/taskStore";
import type { TaskPriority } from "@/types/task";
import { PRIORITY_LIMITS, priorityLabels } from "@/lib/utils/priorityHelpers";
import { today } from "@/lib/utils/dateHelpers";
import { useTaskMutations } from "@/lib/hooks/useTasks";

const PRIORITIES: TaskPriority[] = ["P1", "P2", "P3", "P4"];

interface TaskFormProps {
  onCreated?: () => void;
  autoFocus?: boolean;
}

export function TaskForm({ onCreated, autoFocus = false }: TaskFormProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const { createTask } = useTaskMutations();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("P3");
  const [dueDate, setDueDate] = useState(() => today().format("YYYY-MM-DD"));
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [context, setContext] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [urlsInput, setUrlsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [someday, setSomeday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorityUsage = useMemo(() => {
    return PRIORITIES.reduce<Record<TaskPriority, number>>((acc, value) => {
      acc[value] = tasks.filter((task) => task.urgency === value && task.status === "open").length;
      return acc;
    }, { P1: 0, P2: 0, P3: 0, P4: 0 });
  }, [tasks]);

  useEffect(() => {
    if (!autoFocus) return;
    const handle = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(handle);
  }, [autoFocus]);

  const resetForm = () => {
    setTitle("");
    setPriority("P3");
    setDueDate(today().format("YYYY-MM-DD"));
    setDescription("");
    setProjectId("");
    setContext("");
    setTagsInput("");
    setUrlsInput("");
    setNotes("");
    setFollowUp(false);
    setSomeday(false);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    setError(null);

    const limit = PRIORITY_LIMITS[priority];
    const currentCount = priorityUsage[priority];

    const payload: {
      title: string;
      urgency: TaskPriority;
      dueDate: string | null;
      force?: boolean;
      description?: string | null;
      projectId?: string | null;
      context?: string | null;
      notes?: string | null;
      tags?: string[] | null;
      urls?: string[] | null;
      followUpItem?: boolean;
      someday?: boolean;
    } = {
      title: title.trim(),
      urgency: priority,
      dueDate: someday ? null : dueDate,
    };

    if (limit !== undefined && currentCount >= limit) {
      const confirmed = window.confirm(
        `${priorityLabels[priority]} is at capacity (${currentCount}/${limit}). Add anyway?`,
      );
      if (!confirmed) {
        setError(
          `${priorityLabels[priority]} is at capacity. Resolve or downgrade existing tasks before adding another.`,
        );
        return;
      }
      payload.force = true;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription) payload.description = trimmedDescription;

    const trimmedProject = projectId.trim();
    if (trimmedProject) payload.projectId = trimmedProject;

    const trimmedContext = context.trim();
    if (trimmedContext) payload.context = trimmedContext;

    const trimmedNotes = notes.trim();
    if (trimmedNotes) payload.notes = trimmedNotes;

    const tagList = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    if (tagList.length > 0) payload.tags = tagList;

    const urlList = urlsInput
      .split(/\n+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    if (urlList.length > 0) payload.urls = urlList;

    payload.followUpItem = followUp;
    payload.someday = someday;

    createTask.mutate(payload, {
      onSuccess: () => {
        onCreated?.();
        resetForm();
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Failed to add task");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task-title">Task title</Label>
          <Input
            id="task-title"
            ref={inputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to happen?"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
            >
              {PRIORITIES.map((value) => {
                const limit = PRIORITY_LIMITS[value];
                const currentCount = priorityUsage[value];
                return (
                  <option key={value} value={value}>
                    {priorityLabels[value]} {limit ? `( ${currentCount}/${limit} )` : "(Unlimited)"}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={someday}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-project">Project ID</Label>
            <Input
              id="task-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              placeholder="Optional project or area"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-context">Context</Label>
            <Input
              id="task-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="e.g. Home, Errands, Deep Work"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Add supporting details, checklists, or instructions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-notes">Notes</Label>
          <Textarea
            id="task-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Long-form thoughts, meeting notes, or reflections"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="Comma-separated (e.g. Finance, Home)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-urls">Related links</Label>
            <Textarea
              id="task-urls"
              value={urlsInput}
              onChange={(event) => setUrlsInput(event.target.value)}
              rows={3}
              placeholder="One URL per line"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Label className="flex items-center gap-2 text-sm font-medium" htmlFor="task-follow-up">
            <Checkbox
              id="task-follow-up"
              checked={followUp}
              onCheckedChange={(checked) => setFollowUp(checked === true)}
            />
            Follow-up item
          </Label>

          <Label className="flex items-center gap-2 text-sm font-medium" htmlFor="task-someday">
            <Checkbox
              id="task-someday"
              checked={someday}
              onCheckedChange={(checked) => setSomeday(checked === true)}
            />
            Someday (no active due date)
          </Label>
        </div>
      </section>

      <div className="space-y-2">
        <Button type="submit" disabled={createTask.isPending || !title.trim()} className="w-full">
          {createTask.isPending ? "Adding…" : "Create task"}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {createTask.error && !error ? (
          <p className="text-xs text-destructive">
            {createTask.error instanceof Error ? createTask.error.message : "Failed to add task"}
          </p>
        ) : null}
      </div>
    </form>
  );
}
