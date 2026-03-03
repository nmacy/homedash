import type { PaletteId } from "./schema";

export interface PaletteColors {
  label: string;
  light: string;
  dark: string;
  lightBg: string;
  darkBg: string;
}

export const PALETTES: Record<PaletteId, PaletteColors> = {
  tron: { label: "Tron", light: "#5c9ecf", dark: "#6ee2ff", lightBg: "#f2f7ff", darkBg: "#242b33" },
  nord: { label: "Nord", light: "#5e81ac", dark: "#88c0d0", lightBg: "#eceff4", darkBg: "#2e3440" },
  catppuccin: { label: "Catppuccin", light: "#8839ef", dark: "#cba6f7", lightBg: "#eff1f5", darkBg: "#1e1e2e" },
  dracula: { label: "Dracula", light: "#bd93f9", dark: "#ff79c6", lightBg: "#f8f8f2", darkBg: "#282a36" },
  solarized: { label: "Solarized", light: "#268bd2", dark: "#2aa198", lightBg: "#fdf6e3", darkBg: "#002b36" },
  emerald: { label: "Emerald", light: "#059669", dark: "#34d399", lightBg: "#f0fdf4", darkBg: "#1a2e25" },
  amber: { label: "Amber", light: "#d97706", dark: "#fbbf24", lightBg: "#fffbeb", darkBg: "#2a2418" },
  rose: { label: "Rose", light: "#e11d48", dark: "#fb7185", lightBg: "#fff1f2", darkBg: "#2a1a1e" },
  "tokyo-night": { label: "Tokyo Night", light: "#7aa2f7", dark: "#7aa2f7", lightBg: "#edf0f8", darkBg: "#1a1b26" },
  gruvbox: { label: "Gruvbox", light: "#b57614", dark: "#fabd2f", lightBg: "#fbf1c7", darkBg: "#282828" },
  kanagawa: { label: "Kanagawa", light: "#957fb8", dark: "#7e9cd8", lightBg: "#f2ecbc", darkBg: "#1f1f28" },
  moonlight: { label: "Moonlight", light: "#82aaff", dark: "#82aaff", lightBg: "#e8ecf5", darkBg: "#212337" },
  synthwave: { label: "Synthwave", light: "#e9439b", dark: "#ff7edb", lightBg: "#f8eef5", darkBg: "#262335" },
  oxocarbon: { label: "Oxocarbon", light: "#6698e8", dark: "#78a9ff", lightBg: "#eef1f7", darkBg: "#161616" },
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

function shiftLightness(hex: string, delta: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb(h, s, Math.max(0, Math.min(1, l + delta)));
  return `#${((1 << 24) | (nr << 16) | (ng << 8) | nb).toString(16).slice(1)}`;
}

export interface BgSurfaces {
  background: string;
  card: string;
  secondary: string;
  muted: string;
  accent: string;
  popover: string;
  primaryForeground: string;
}

export function getBgSurfaces(hex: string, mode: "light" | "dark"): BgSurfaces {
  if (mode === "dark") {
    const card = shiftLightness(hex, 0.03);
    const shifted = shiftLightness(hex, 0.05);
    return {
      background: hex,
      card,
      secondary: shifted,
      muted: shifted,
      accent: shifted,
      popover: card,
      primaryForeground: hex,
    };
  }
  const shifted = shiftLightness(hex, -0.04);
  return {
    background: hex,
    card: hex,
    secondary: shifted,
    muted: shifted,
    accent: shifted,
    popover: "#ffffff",
    primaryForeground: hex,
  };
}
