"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { icons } from "lucide-react";
import * as mdiIcons from "@mdi/js";
import { Input } from "@/components/ui/input";
import type { RemoteIcon } from "@/lib/remote-icons";

interface IconPickerProps {
  value?: string;
  onSelect: (iconName: string) => void;
}

type Tab = "lucide" | "mdi" | "si" | "dash";

function toDashCase(name: string): string {
  return name.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
}

function detectTab(value?: string): Tab {
  if (value?.startsWith("si:")) return "si";
  if (value?.startsWith("dash:")) return "dash";
  if (value?.startsWith("mdi:")) return "mdi";
  return "lucide";
}

const lucideEntries = Object.entries(icons);
const mdiEntries = Object.entries(mdiIcons)
  .filter(([k, v]) => k.startsWith("mdi") && typeof v === "string" && k !== "default")
  .map(([k, v]) => ({
    key: k,
    name: k.slice(3).replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, ""),
    path: v as string,
  }));

const isRemoteTab = (t: Tab): t is "si" | "dash" => t === "si" || t === "dash";

const TAB_BUTTON_CLASS = (active: boolean) =>
  `rounded px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
    active
      ? "bg-flame-accent text-background"
      : "text-foreground/50 hover:text-foreground"
  }`;

export function IconPicker({ value, onSelect }: IconPickerProps) {
  const [tab, setTab] = useState<Tab>(detectTab(value));
  const [search, setSearch] = useState("");

  // Remote icon state
  const [remoteResults, setRemoteResults] = useState<RemoteIcon[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRemote = useCallback(
    (query: string, set: "si" | "dash") => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (query.length < 2) {
        setRemoteResults([]);
        setRemoteLoading(false);
        return;
      }

      setRemoteLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/icons?q=${encodeURIComponent(query)}&set=${set}`
          );
          if (res.ok) {
            const data: RemoteIcon[] = await res.json();
            setRemoteResults(data);
          } else {
            setRemoteResults([]);
          }
        } catch {
          setRemoteResults([]);
        } finally {
          setRemoteLoading(false);
        }
      }, 300);
    },
    []
  );

  // Trigger remote search when search text or remote tab changes
  useEffect(() => {
    if (isRemoteTab(tab)) {
      fetchRemote(search, tab);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, tab, fetchRemote]);

  // Clear remote results when switching to a local tab
  useEffect(() => {
    if (!isRemoteTab(tab)) {
      setRemoteResults([]);
    }
  }, [tab]);

  const filteredLucide = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? lucideEntries.filter(([name]) => name.toLowerCase().includes(q))
      : lucideEntries;
    return list.slice(0, 80);
  }, [search]);

  const filteredMdi = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? mdiEntries.filter((e) => e.name.includes(q))
      : mdiEntries;
    return list.slice(0, 80);
  }, [search]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(["lucide", "mdi", "si", "dash"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={TAB_BUTTON_CLASS(tab === t)}
          >
            {t === "lucide"
              ? "Lucide"
              : t === "mdi"
                ? "MDI"
                : t === "si"
                  ? "Simple Icons"
                  : "Dashboard Icons"}
          </button>
        ))}
      </div>
      <Input
        placeholder={
          isRemoteTab(tab) ? "Type to search..." : "Search icons..."
        }
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-foreground/20 bg-transparent"
      />
      <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto">
        {tab === "lucide" &&
          filteredLucide.map(([name, Icon]) => {
            const dashName = toDashCase(name);
            return (
              <button
                key={name}
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-black/20 ${
                  value === dashName ? "bg-flame-accent text-background" : "text-foreground/70"
                }`}
                onClick={() => onSelect(dashName)}
                title={dashName}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        {tab === "mdi" &&
          filteredMdi.map((entry) => {
            const fullName = `mdi:${entry.name}`;
            return (
              <button
                key={entry.key}
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-black/20 ${
                  value === fullName ? "bg-flame-accent text-background" : "text-foreground/70"
                }`}
                onClick={() => onSelect(fullName)}
                title={entry.name}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d={entry.path} />
                </svg>
              </button>
            );
          })}
        {isRemoteTab(tab) && (
          <>
            {remoteLoading && (
              <p className="col-span-8 py-4 text-center text-xs uppercase tracking-wider text-foreground/40">
                Searching...
              </p>
            )}
            {!remoteLoading && search.length < 2 && (
              <p className="col-span-8 py-4 text-center text-xs uppercase tracking-wider text-foreground/40">
                Type to search...
              </p>
            )}
            {!remoteLoading &&
              search.length >= 2 &&
              remoteResults.length === 0 && (
                <p className="col-span-8 py-4 text-center text-xs uppercase tracking-wider text-foreground/40">
                  No icons found
                </p>
              )}
            {!remoteLoading &&
              remoteResults.map((icon) => {
                const fullName = `${icon.set}:${icon.slug}`;
                return (
                  <button
                    key={fullName}
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-black/20 ${
                      value === fullName
                        ? "bg-flame-accent text-background"
                        : "text-foreground/70"
                    }`}
                    onClick={() => onSelect(fullName)}
                    title={icon.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon.url} alt="" className="h-4 w-4" />
                  </button>
                );
              })}
          </>
        )}
        {tab === "lucide" && filteredLucide.length === 0 && (
          <p className="col-span-8 py-4 text-center text-xs uppercase tracking-wider text-foreground/40">
            No icons found
          </p>
        )}
        {tab === "mdi" && filteredMdi.length === 0 && (
          <p className="col-span-8 py-4 text-center text-xs uppercase tracking-wider text-foreground/40">
            No icons found
          </p>
        )}
      </div>
    </div>
  );
}
