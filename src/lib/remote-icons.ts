export type RemoteIconSet = "si" | "dash";

export interface RemoteIcon {
  name: string;
  slug: string;
  set: RemoteIconSet;
  url: string;
}

// --- Index caching ---

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
    "https://cdn.jsdelivr.net/npm/simple-icons/_data/simple-icons.json"
  )
    .then((r) => {
      if (!r.ok) throw new Error(`Simple Icons index fetch failed: ${r.status}`);
      return r.json();
    })
    .then((data: { icons: SimpleIconEntry[] }) => {
      siIndex = data.icons;
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
    "https://data.jsdelivr.com/v1/packages/gh/walkxcode/dashboard-icons@main?structure=flat"
  )
    .then((r) => {
      if (!r.ok) throw new Error(`Dashboard Icons index fetch failed: ${r.status}`);
      return r.json();
    })
    .then((data: { files: { name: string }[] }) => {
      dashIndex = data.files
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

export function resolveRemoteIconUrl(prefixedName: string): string | null {
  if (prefixedName.startsWith("si:")) {
    const slug = prefixedName.slice(3);
    return `https://cdn.simpleicons.org/${slug}`;
  }
  if (prefixedName.startsWith("dash:")) {
    const name = prefixedName.slice(5);
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${name}.svg`;
  }
  return null;
}
