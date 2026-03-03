import { z } from "zod";

export type RemoteIconSet = "si" | "dash";

export interface RemoteIcon {
  name: string;
  slug: string;
  set: RemoteIconSet;
  url: string;
}

// --- Index caching ---

const FETCH_TIMEOUT_MS = 10_000;

const simpleIconEntrySchema = z.object({
  title: z.string(),
  slug: z.string(),
  hex: z.string(),
});

const simpleIconsResponseSchema = z.object({
  icons: z.array(simpleIconEntrySchema),
});

const dashboardIconsResponseSchema = z.object({
  files: z.array(z.object({ name: z.string() })),
});

interface SimpleIconEntry {
  title: string;
  slug: string;
  hex: string;
}

let siIndex: SimpleIconEntry[] | null = null;
let siPromise: Promise<SimpleIconEntry[]> | null = null;

let dashIndex: string[] | null = null;
let dashPromise: Promise<string[]> | null = null;

async function fetchSimpleIconsIndex(): Promise<SimpleIconEntry[]> {
  if (siIndex) return siIndex;
  if (siPromise) return siPromise;

  siPromise = fetch(
    "https://cdn.jsdelivr.net/npm/simple-icons/_data/simple-icons.json",
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  )
    .then((r) => {
      if (!r.ok) throw new Error(`Simple Icons index fetch failed: ${r.status}`);
      return r.json();
    })
    .then((data: unknown) => {
      const parsed = simpleIconsResponseSchema.parse(data);
      siIndex = parsed.icons;
      return siIndex;
    })
    .catch((err) => {
      siPromise = null;
      throw err;
    });

  return siPromise;
}

async function fetchDashboardIconsIndex(): Promise<string[]> {
  if (dashIndex) return dashIndex;
  if (dashPromise) return dashPromise;

  dashPromise = fetch(
    "https://data.jsdelivr.com/v1/packages/gh/walkxcode/dashboard-icons@main?structure=flat",
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  )
    .then((r) => {
      if (!r.ok) throw new Error(`Dashboard Icons index fetch failed: ${r.status}`);
      return r.json();
    })
    .then((data: unknown) => {
      const parsed = dashboardIconsResponseSchema.parse(data);
      dashIndex = parsed.files
        .map((f) => f.name)
        .filter((n) => n.startsWith("/svg/") && n.endsWith(".svg"))
        .map((n) => n.slice(5, -4)); // "/svg/jellyfin.svg" -> "jellyfin"
      return dashIndex;
    })
    .catch((err) => {
      dashPromise = null;
      throw err;
    });

  return dashPromise;
}

// --- Search ---

export async function searchRemoteIcons(
  query: string,
  set?: RemoteIconSet
): Promise<RemoteIcon[]> {
  const q = query.toLowerCase();
  const results: RemoteIcon[] = [];

  if (!set || set === "si") {
    const index = await fetchSimpleIconsIndex();
    for (const entry of index) {
      if (
        entry.slug.includes(q) ||
        entry.title.toLowerCase().includes(q)
      ) {
        results.push({
          name: entry.title,
          slug: entry.slug,
          set: "si",
          url: `https://cdn.simpleicons.org/${entry.slug}`,
        });
        if (set && results.length >= 50) break;
      }
    }
  }

  if (!set || set === "dash") {
    const index = await fetchDashboardIconsIndex();
    let count = 0;
    for (const name of index) {
      if (name.includes(q)) {
        results.push({
          name,
          slug: name,
          set: "dash",
          url: `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${name}.svg`,
        });
        count++;
        if (set && count >= 50) break;
      }
    }
  }

  return results.slice(0, 50);
}

// --- URL resolution (pure, no fetch) ---

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/;

export function resolveRemoteIconUrl(prefixedName: string): string | null {
  if (prefixedName.startsWith("si:")) {
    const slug = prefixedName.slice(3);
    if (!SAFE_SLUG_RE.test(slug)) return null;
    return `https://cdn.simpleicons.org/${slug}`;
  }
  if (prefixedName.startsWith("dash:")) {
    const name = prefixedName.slice(5);
    if (!SAFE_SLUG_RE.test(name)) return null;
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${name}.svg`;
  }
  return null;
}
