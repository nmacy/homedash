"use client";

import { useState, useRef, useEffect } from "react";
import { Save, X, Archive, Palette } from "lucide-react";
import type { PaletteId } from "@/lib/schema";
import { PALETTE_IDS } from "@/lib/schema";
import { PALETTES } from "@/lib/palettes";

interface EditModeToolbarProps {
  hasChanges: boolean;
  saving: boolean;
  currentPalette: PaletteId;
  onPaletteChange: (id: PaletteId) => void;
  onSave: () => void;
  onDiscard: () => void;
  onExit: () => void;
  onBackup: () => void;
}

export function EditModeToolbar({ hasChanges, saving, currentPalette, onPaletteChange, onSave, onDiscard, onExit, onBackup }: EditModeToolbarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paletteOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPaletteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [paletteOpen]);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-flame-accent/20 bg-background/95 px-6 py-2.5 backdrop-blur">
      <span className="text-xs font-normal uppercase tracking-widest text-flame-accent">
        Edit Mode
      </span>
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setPaletteOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded border border-foreground/20 px-3 py-1 text-xs uppercase text-foreground/70 transition-colors hover:border-flame-accent/40 hover:text-foreground"
          >
            <Palette className="h-3 w-3" />
            {PALETTES[currentPalette].label}
          </button>
          {paletteOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded border border-foreground/10 bg-background shadow-lg">
              {PALETTE_IDS.map((id) => {
                const p = PALETTES[id];
                return (
                  <button
                    key={id}
                    onClick={() => { onPaletteChange(id); setPaletteOpen(false); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-foreground/5 ${id === currentPalette ? "text-flame-accent" : "text-foreground/70"}`}
                  >
                    <span className="grid grid-cols-2 gap-px">
                      <span className="inline-block h-2.5 w-2.5 rounded-tl-sm" style={{ background: p.lightBg }} />
                      <span className="inline-block h-2.5 w-2.5 rounded-tr-sm" style={{ background: p.light }} />
                      <span className="inline-block h-2.5 w-2.5 rounded-bl-sm" style={{ background: p.darkBg }} />
                      <span className="inline-block h-2.5 w-2.5 rounded-br-sm" style={{ background: p.dark }} />
                    </span>
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
