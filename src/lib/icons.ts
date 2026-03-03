import { icons, type LucideIcon } from "lucide-react";
import * as mdiIcons from "@mdi/js";
import { resolveRemoteIconUrl } from "./remote-icons";

// Lucide: "play", "heart-pulse", etc.
// MDI:    "mdi:plex", "mdi:docker", etc.
// Remote: "si:docker", "dash:jellyfin", etc.

export type IconResult =
  | { type: "lucide"; component: LucideIcon }
  | { type: "mdi"; path: string }
  | { type: "remote"; url: string };

function toLucidePascal(name: string): keyof typeof icons {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("") as keyof typeof icons;
}

function toMdiKey(name: string): string {
  // "plex" -> "mdiPlex", "home-assistant" -> "mdiHomeAssistant"
  return (
    "mdi" +
    name
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("")
  );
}

export function getIcon(name?: string): IconResult | null {
  if (!name) return null;

  if (name.startsWith("si:") || name.startsWith("dash:")) {
    const url = resolveRemoteIconUrl(name);
    if (url) return { type: "remote", url };
    return null;
  }

  if (name.startsWith("mdi:")) {
    const mdiName = name.slice(4);
    const key = toMdiKey(mdiName);
    const path = (mdiIcons as Record<string, string>)[key];
    if (path) return { type: "mdi", path };
    return null;
  }

  const comp = icons[toLucidePascal(name)];
  if (comp) return { type: "lucide", component: comp };
  return null;
}

// For the icon picker — build lists lazily

let _lucideList: { name: string; key: string }[] | null = null;
export function getLucideList() {
  if (!_lucideList) {
    _lucideList = Object.keys(icons).map((key) => ({
      key,
      name: key.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, ""),
    }));
  }
  return _lucideList;
}

let _mdiList: { name: string; key: string }[] | null = null;
export function getMdiList() {
  if (!_mdiList) {
    _mdiList = Object.keys(mdiIcons)
      .filter((k) => k.startsWith("mdi") && k !== "default")
      .map((key) => ({
        key,
        // "mdiHomeAssistant" -> "home-assistant"
        name: key
          .slice(3)
          .replace(/([A-Z])/g, "-$1")
          .toLowerCase()
          .replace(/^-/, ""),
      }));
  }
  return _mdiList;
}
