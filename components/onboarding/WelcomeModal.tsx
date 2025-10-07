"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ttm.welcome.dismissed";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? handleClose() : setOpen(isOpen))}>
      <DialogContent className="max-w-lg space-y-4">
        <DialogHeader className="space-y-2">
          <DialogTitle>Welcome to the Temporary Task Manager</DialogTitle>
          <DialogDescription>
            This app constrains your commitments so you focus on what matters today.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How it works:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Priority caps: <strong>P1</strong> max 3, <strong>P2</strong> max 5, <strong>P3</strong> max 10, <strong>P4</strong> unlimited.
            </li>
            <li>Incomplete tasks auto-roll forward; chronic offenders land in the Graveyard.</li>
            <li>Use Cmd/Ctrl+K to quick-add and Cmd/Ctrl+Enter to complete selected tasks.</li>
          </ul>
        </div>

        <DialogFooter className="flex justify-end">
          <Button onClick={handleClose}>Let&apos;s go</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
