import { z } from "zod";

export const PALETTE_IDS = [
  "tron",
  "nord",
  "catppuccin",
  "dracula",
  "solarized",
  "emerald",
  "amber",
  "rose",
] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

const safeUrl = z
  .string()
  .url("Must be a valid URL")
  .max(2048, "URL too long")
  .refine(
    (u) => {
      try {
        const scheme = new URL(u).protocol;
        return scheme === "http:" || scheme === "https:";
      } catch {
        return false;
      }
    },
    { message: "Only http and https URLs are allowed" }
  );

const iconSlug = z
  .string()
  .max(128, "Icon name too long")
  .regex(
    /^(?:[a-z][a-z0-9-]*|mdi:[a-z0-9-]+|si:[a-z0-9._-]+|dash:[a-z0-9._-]+)$/,
    "Invalid icon format"
  )
  .optional();

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  url: safeUrl,
  icon: iconSlug,
  description: z.string().max(500, "Description too long").optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  icon: iconSlug,
  services: z.array(serviceSchema).max(200, "Too many services").default([]),
});

export const configSchema = z.object({
  title: z.string().max(200, "Title too long").default("My Homelab"),
  theme: z.enum(["dark", "light", "system"]).default("system"),
  palette: z.enum(PALETTE_IDS).default("tron"),
  categories: z.array(categorySchema).max(50, "Too many categories").default([]),
});

export type Service = z.infer<typeof serviceSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Config = z.infer<typeof configSchema>;
