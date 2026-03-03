import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  services: z.array(serviceSchema).default([]),
});

export const configSchema = z.object({
  title: z.string().default("My Homelab"),
  theme: z.enum(["dark", "light", "system"]).default("system"),
  categories: z.array(categorySchema).default([]),
});

export type Service = z.infer<typeof serviceSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Config = z.infer<typeof configSchema>;
