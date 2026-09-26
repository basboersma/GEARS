"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BoardPermissionDialog({
  open,
  onCancel,
  onContinue,
}: {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && onCancel()} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ask for board permission</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Ask for board permission, board members will get a notification
        </p>
        <DialogFooter>
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button onClick={onContinue} type="button">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
