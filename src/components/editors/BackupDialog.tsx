"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Archive, RotateCcw, Trash2, Plus, Loader2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface BackupInfo {
  name: string;
  createdAt: string;
  size: number;
}

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function parseBackupName(name: string): { date: string; label?: string } {
  const base = name.replace(/\.yaml$/, "");
  const underscoreIdx = base.indexOf("_");
  if (underscoreIdx !== -1) {
    return { date: base.slice(0, underscoreIdx), label: base.slice(underscoreIdx + 1) };
  }
  return { date: base };
}

export function BackupDialog({ open, onOpenChange, onRestore }: BackupDialogProps) {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backups");
      if (!res.ok) throw new Error("Failed to fetch backups");
      setBackups(await res.json());
    } catch {
      toast.error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchBackups();
  }, [open, fetchBackups]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create backup");
      toast.success("Backup created");
      setLabel("");
      await fetchBackups();
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (name: string) => {
    try {
      const res = await fetch(`/api/backups/${encodeURIComponent(name)}`, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error("Failed to restore backup");
      toast.success("Backup restored");
      onRestore();
      onOpenChange(false);
    } catch {
      toast.error("Failed to restore backup");
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/backups", {
        method: "PUT",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload");
      }
      toast.success("Config uploaded");
      await fetchBackups();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload config");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const res = await fetch(`/api/backups/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error("Failed to delete backup");
      toast.success("Backup deleted");
      await fetchBackups();
    } catch {
      toast.error("Failed to delete backup");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-flame-accent/20 bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-normal uppercase tracking-widest text-flame-accent">
            <Archive className="h-4 w-4" />
            Backups
          </DialogTitle>
        </DialogHeader>

        {/* Create backup */}
        <div className="flex gap-2">
          <Input
            placeholder="Optional label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border-foreground/20 bg-transparent text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex shrink-0 items-center gap-1.5 rounded border border-flame-accent px-3 py-1.5 text-xs uppercase tracking-wider text-foreground transition-colors hover:bg-flame-accent hover:text-background disabled:opacity-30"
          >
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Create
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".yaml,.yml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex shrink-0 items-center gap-1.5 rounded border border-foreground/20 px-3 py-1.5 text-xs uppercase tracking-wider text-foreground/70 transition-colors hover:border-flame-accent/40 hover:text-foreground disabled:opacity-30"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload
          </button>
        </div>

        {/* Backup list */}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {loading && backups.length === 0 && (
            <p className="py-4 text-center text-xs text-foreground/40">Loading...</p>
          )}
          {!loading && backups.length === 0 && (
            <p className="py-4 text-center text-xs text-foreground/40">No backups yet</p>
          )}
          {backups.map((backup) => {
            const { label: backupLabel } = parseBackupName(backup.name);
            return (
              <div
                key={backup.name}
                className="flex items-center justify-between rounded border border-foreground/10 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  {backupLabel && (
                    <p className="truncate text-xs font-medium text-foreground">{backupLabel}</p>
                  )}
                  <p className="text-[10px] text-foreground/50">
                    {formatRelativeTime(backup.createdAt)} &middot; {formatSize(backup.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={`/api/backups/${encodeURIComponent(backup.name)}`}
                    download={backup.name}
                    className="flex h-7 w-7 items-center justify-center rounded text-foreground/40 transition-colors hover:bg-flame-accent/10 hover:text-flame-accent"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => handleRestore(backup.name)}
                    className="flex h-7 w-7 items-center justify-center rounded text-foreground/40 transition-colors hover:bg-flame-accent/10 hover:text-flame-accent"
                    title="Restore"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(backup.name)}
                    className="flex h-7 w-7 items-center justify-center rounded text-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
