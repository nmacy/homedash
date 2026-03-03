"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const themeOrder = ["light", "dark", "system"] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const current = (theme ?? "system") as keyof typeof themeIcons;
  const Icon = themeIcons[current] ?? Monitor;
  const next = themeOrder[(themeOrder.indexOf(current) + 1) % themeOrder.length];

  return (
    <button
      onClick={() => setTheme(next)}
      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/40 transition-all duration-300 hover:text-foreground"
      title={`Switch to ${next} theme`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
