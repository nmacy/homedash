import fs from "fs";
import path from "path";
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
  categories: [],
};

function ensureConfigExists(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    const yamlStr = yaml.dump(DEFAULT_CONFIG, { lineWidth: -1 });
    fs.writeFileSync(CONFIG_PATH, yamlStr, "utf-8");
  }
}

export function readConfig(): Config {
  ensureConfigExists();
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const parsed = yaml.load(raw);
  return configSchema.parse(parsed);
}

export function writeConfig(config: Config): void {
  ensureConfigExists();
  const validated = configSchema.parse(config);
  const yamlStr = yaml.dump(validated, { lineWidth: -1 });
  const tmpPath = CONFIG_PATH + ".tmp";
  fs.writeFileSync(tmpPath, yamlStr, "utf-8");
  fs.renameSync(tmpPath, CONFIG_PATH);
}

function ensureBackupsDir(): void {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function isValidBackupName(name: string): boolean {
  return /^[\w\-:.]+\.yaml$/.test(name) && !name.includes("..");
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
  const name = label ? `${ts}_${label}.yaml` : `${ts}.yaml`;
  fs.copyFileSync(CONFIG_PATH, path.join(BACKUPS_DIR, name));
  return name;
}

export function restoreBackup(name: string): Config {
  if (!isValidBackupName(name)) throw new Error("Invalid backup name");
  const backupPath = path.join(BACKUPS_DIR, name);
  if (!fs.existsSync(backupPath)) throw new Error("Backup not found");
  const raw = fs.readFileSync(backupPath, "utf-8");
  const parsed = yaml.load(raw);
  const validated = configSchema.parse(parsed);
  writeConfig(validated);
  return validated;
}

export function readBackupFile(name: string): string {
  if (!isValidBackupName(name)) throw new Error("Invalid backup name");
  const backupPath = path.join(BACKUPS_DIR, name);
  if (!fs.existsSync(backupPath)) throw new Error("Backup not found");
  return fs.readFileSync(backupPath, "utf-8");
}

export function importBackup(content: string, label?: string): { name: string; config: Config } {
  const parsed = yaml.load(content);
  const validated = configSchema.parse(parsed);
  ensureBackupsDir();
  const ts = new Date().toISOString().replace(/[:/]/g, "-").replace(/\.\d+Z$/, "");
  const suffix = label ? `_${label}` : "_uploaded";
  const name = `${ts}${suffix}.yaml`;
  const yamlStr = yaml.dump(validated, { lineWidth: -1 });
  fs.writeFileSync(path.join(BACKUPS_DIR, name), yamlStr, "utf-8");
  return { name, config: validated };
}

export function deleteBackup(name: string): void {
  if (!isValidBackupName(name)) throw new Error("Invalid backup name");
  const backupPath = path.join(BACKUPS_DIR, name);
  if (!fs.existsSync(backupPath)) throw new Error("Backup not found");
  fs.unlinkSync(backupPath);
}
