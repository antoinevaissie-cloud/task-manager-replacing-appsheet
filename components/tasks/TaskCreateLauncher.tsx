"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/tasks/TaskForm";

export function TaskCreateLauncher() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon-lg"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg transition hover:shadow-xl"
        aria-label="Create task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>Capture a task and place it into the active loop.</DialogDescription>
          </DialogHeader>

          <TaskForm
            autoFocus
            onCreated={() => {
              close();
            }}
          />

          <DialogFooter className="flex justify-end">
            <Button variant="ghost" type="button" onClick={close}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
