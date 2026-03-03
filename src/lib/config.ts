import fs from "fs";
import path from "path";
import crypto from "crypto";
import yaml from "js-yaml";
import { configSchema, type Config } from "./schema";

const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.yaml");
const BACKUPS_DIR = path.join(CONFIG_DIR, "backups");

export interface BackupInfo {
  name: string;
  createdAt: string;
  size: number;
}

const DEFAULT_CONFIG: Config = {
  title: "My Homelab",
  theme: "system",
  palette: "tron",
  categories: [],
};

function ensureConfigExists(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    const yamlStr = yaml.dump(DEFAULT_CONFIG, { lineWidth: -1 });
    fs.writeFileSync(CONFIG_PATH, yamlStr, { encoding: "utf-8", mode: 0o600 });
  }
}

export function readConfig(): Config {
  ensureConfigExists();
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
  return configSchema.parse(parsed);
}

export function writeConfig(config: Config): void {
  ensureConfigExists();
  const validated = configSchema.parse(config);
  const yamlStr = yaml.dump(validated, { lineWidth: -1 });
  const tmpPath = `${CONFIG_PATH}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpPath, yamlStr, { encoding: "utf-8", mode: 0o600 });
  fs.renameSync(tmpPath, CONFIG_PATH);
}

function ensureBackupsDir(): void {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

const SAFE_LABEL_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_BACKUPS = 100;

function isValidBackupName(name: string): boolean {
  return /^[\w\-:.]+\.yaml$/.test(name) && !name.includes("..");
}

function sanitizeLabel(label: string): string {
  const trimmed = label.trim().slice(0, 64);
  if (!SAFE_LABEL_RE.test(trimmed)) {
    throw new Error("Label may only contain alphanumeric characters, hyphens, and underscores");
  }
  return trimmed;
}

function assertWithinDir(dir: string, filePath: string): void {
  const resolved = path.resolve(filePath);
  const resolvedDir = path.resolve(dir) + path.sep;
  if (!resolved.startsWith(resolvedDir)) {
    throw new Error("Invalid file path");
  }
}

function pruneOldBackups(): void {
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .map((name) => ({
      name,
      mtime: fs.statSync(path.join(BACKUPS_DIR, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const old of files.slice(MAX_BACKUPS)) {
    fs.unlinkSync(path.join(BACKUPS_DIR, old.name));
  }
}

export function listBackups(): BackupInfo[] {
  ensureBackupsDir();
  const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith(".yaml"));
  return files
    .map((name) => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, name));
      return { name, createdAt: stat.mtime.toISOString(), size: stat.size };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createBackup(label?: string): string {
  ensureBackupsDir();
  ensureConfigExists();
  const ts = new Date().toISOString().replace(/[:/]/g, "-").replace(/\.\d+Z$/, "");
  const safeLabel = label ? sanitizeLabel(label) : undefined;
  const name = safeLabel ? `${ts}_${safeLabel}.yaml` : `${ts}.yaml`;
  const dest = path.join(BACKUPS_DIR, name);
  assertWithinDir(BACKUPS_DIR, dest);
  fs.copyFileSync(CONFIG_PATH, dest);
  pruneOldBackups();
  return name;
}

export function restoreBackup(name: string): Config {
  if (!isValidBackupName(name)) throw new Error("Invalid backup name");
  const backupPath = path.join(BACKUPS_DIR, name);
  assertWithinDir(BACKUPS_DIR, backupPath);
  let raw: string;
  try {
    raw = fs.readFileSync(backupPath, "utf-8");
  } catch {
    throw new Error("Backup not found");
  }
  const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
  const validated = configSchema.parse(parsed);
  writeConfig(validated);
  return validated;
}

export function readBackupFile(name: string): string {
  if (!isValidBackupName(name)) throw new Error("Invalid backup name");
  const backupPath = path.join(BACKUPS_DIR, name);
  assertWithinDir(BACKUPS_DIR, backupPath);
  try {
    return fs.readFileSync(backupPath, "utf-8");
  } catch {
    throw new Error("Backup not found");
  }
}

export function importBackup(content: string, label?: string): { name: string; config: Config } {
  const parsed = yaml.load(content, { schema: yaml.JSON_SCHEMA });
  const validated = configSchema.parse(parsed);
  ensureBackupsDir();
  const ts = new Date().toISOString().replace(/[:/]/g, "-").replace(/\.\d+Z$/, "");
  const safeLabel = label ? sanitizeLabel(label) : "uploaded";
  const name = `${ts}_${safeLabel}.yaml`;
  const dest = path.join(BACKUPS_DIR, name);
  assertWithinDir(BACKUPS_DIR, dest);
  const yamlStr = yaml.dump(validated, { lineWidth: -1 });
  fs.writeFileSync(dest, yamlStr, { encoding: "utf-8", mode: 0o600 });
  pruneOldBackups();
  return { name, config: validated };
}

export function deleteBackup(name: string): void {
  if (!isValidBackupName(name)) throw new Error("Invalid backup name");
  const backupPath = path.join(BACKUPS_DIR, name);
  assertWithinDir(BACKUPS_DIR, backupPath);
  try {
    fs.unlinkSync(backupPath);
  } catch {
    throw new Error("Backup not found");
  }
}
