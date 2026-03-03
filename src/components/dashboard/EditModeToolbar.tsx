"use client";

import { Save, X, Archive } from "lucide-react";

interface EditModeToolbarProps {
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onExit: () => void;
  onBackup: () => void;
}

export function EditModeToolbar({ hasChanges, saving, onSave, onDiscard, onExit, onBackup }: EditModeToolbarProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-flame-accent/20 bg-background/95 px-6 py-2.5 backdrop-blur">
      <span className="text-xs font-normal uppercase tracking-widest text-flame-accent">
        Edit Mode
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onBackup}
          className="flex items-center gap-1.5 rounded border border-foreground/20 px-3 py-1 text-xs uppercase text-foreground/70 transition-colors hover:border-flame-accent/40 hover:text-foreground"
        >
          <Archive className="h-3 w-3" />
          Backup
        </button>
        {hasChanges && (
          <button
            onClick={onDiscard}
            className="rounded border border-flame-accent/40 px-3 py-1 text-xs uppercase text-foreground transition-colors hover:bg-flame-accent hover:text-background"
          >
            Discard
          </button>
        )}
        <button
          onClick={onSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-1.5 rounded border border-flame-accent px-3 py-1 text-xs uppercase text-foreground transition-colors hover:bg-flame-accent hover:text-background disabled:opacity-30"
        >
          <Save className="h-3 w-3" />
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onExit}
          className="flex h-7 w-7 items-center justify-center rounded text-foreground/50 transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
