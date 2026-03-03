import type { PaletteId } from "./schema";

export interface PaletteColors {
  label: string;
  light: string;
  dark: string;
}

export const PALETTES: Record<PaletteId, PaletteColors> = {
  tron: { label: "Tron", light: "#5c9ecf", dark: "#6ee2ff" },
  nord: { label: "Nord", light: "#5e81ac", dark: "#88c0d0" },
  catppuccin: { label: "Catppuccin", light: "#8839ef", dark: "#cba6f7" },
  dracula: { label: "Dracula", light: "#bd93f9", dark: "#ff79c6" },
  solarized: { label: "Solarized", light: "#268bd2", dark: "#2aa198" },
  emerald: { label: "Emerald", light: "#059669", dark: "#34d399" },
  amber: { label: "Amber", light: "#d97706", dark: "#fbbf24" },
  rose: { label: "Rose", light: "#e11d48", dark: "#fb7185" },
};
