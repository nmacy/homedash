"use client";

import { getIcon, type IconResult } from "@/lib/icons";

interface DynamicIconProps {
  name?: string;
  className?: string;
}

export function DynamicIcon({ name, className = "h-5 w-5" }: DynamicIconProps) {
  const icon = getIcon(name);
  if (!icon) return null;

  if (icon.type === "lucide") {
    const LucideComp = icon.component;
    return <LucideComp className={className} strokeWidth={1.5} />;
  }

  if (icon.type === "remote") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon.url} alt="" className={className} />;
  }

  // MDI — render as SVG with the path data
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d={icon.path} />
    </svg>
  );
}
