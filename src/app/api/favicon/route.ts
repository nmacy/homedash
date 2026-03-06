import { NextRequest, NextResponse } from "next/server";

// --- In-memory cache ---
const MAX_CACHE = 200;
const TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  body: ArrayBuffer;
  contentType: string;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts > TTL_MS) cache.delete(key);
  }
  // If still over limit, drop oldest
  if (cache.size > MAX_CACHE) {
    const keys = [...cache.keys()];
    for (let i = 0; i < keys.length - MAX_CACHE; i++) {
      cache.delete(keys[i]);
    }
  }
}

// --- Validation ---

const BLOCKED_IP_PREFIXES = [
  "169.254.", // link-local
  "0.",
];

const BLOCKED_HOSTS = [
  "metadata.google.internal",
  "metadata.google.com",
];

function isBlockedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "http:" && url.protocol !== "https:") return true;
    const host = url.hostname;
    if (BLOCKED_HOSTS.includes(host)) return true;
    for (const prefix of BLOCKED_IP_PREFIXES) {
      if (host.startsWith(prefix)) return true;
    }
    // Block 127.x for metadata, but allow localhost/127.0.0.1 for homelab
    // Actually, for homelab we should allow all internal IPs
    return false;
  } catch {
    return true;
  }
}

// --- HTML favicon parsing ---

function extractFaviconFromHtml(html: string, baseUrl: string): string | null {
  // Match <link> tags with rel containing "icon"
  const linkRegex = /<link\s+[^>]*rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]*>/gi;
  const matches = html.match(linkRegex);
  if (matches) {
    for (const match of matches) {
      const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch?.[1]) {
        try {
          return new URL(hrefMatch[1], baseUrl).href;
        } catch {
          // ignore invalid URL
        }
      }
    }
  }

  // Also try rel="icon" without shortcut (different order of attributes)
  const linkRegex2 = /<link\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]*/gi;
  let m;
  while ((m = linkRegex2.exec(html)) !== null) {
    if (m[1]) {
      try {
        return new URL(m[1], baseUrl).href;
      } catch {
        // ignore
      }
    }
  }

  return null;
}

// --- Fetch helpers ---

const FETCH_TIMEOUT = 5000;
const MAX_BODY_BYTES = 512 * 1024; // 512KB

async function fetchWithLimit(
  url: string,
  maxBytes: number
): Promise<{ ok: boolean; body: Uint8Array; contentType: string; status: number }> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
    redirect: "follow",
    headers: { "User-Agent": "Homedash Favicon Proxy/1.0" },
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !res.body) {
    return { ok: false, body: new Uint8Array(0), contentType, status: res.status };
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  const reader = res.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.byteLength;
    if (totalSize > maxBytes) {
      reader.cancel();
      return { ok: false, body: new Uint8Array(0), contentType, status: 413 };
    }
    chunks.push(value);
  }

  // Concatenate chunks into a single Uint8Array
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, body: result, contentType, status: res.status };
}

// --- Route handler ---

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (isBlockedUrl(url)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return new Response(cached.body, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  try {
    // Fetch the page HTML to find favicon link
    const pageResult = await fetchWithLimit(url, MAX_BODY_BYTES);
    let faviconUrl: string;

    if (pageResult.ok && pageResult.contentType.includes("text/html")) {
      const html = new TextDecoder().decode(pageResult.body);
      const parsed = extractFaviconFromHtml(html, url);
      faviconUrl = parsed ?? new URL("/favicon.ico", url).href;
    } else {
      // Couldn't fetch page, try favicon.ico directly
      faviconUrl = new URL("/favicon.ico", url).href;
    }

    if (isBlockedUrl(faviconUrl)) {
      return NextResponse.json({ error: "Favicon URL not allowed" }, { status: 403 });
    }

    // Fetch the favicon image
    const imgResult = await fetchWithLimit(faviconUrl, MAX_BODY_BYTES);
    if (!imgResult.ok) {
      return NextResponse.json({ error: "Failed to fetch favicon" }, { status: 502 });
    }

    if (!imgResult.contentType.startsWith("image/") && !imgResult.contentType.includes("icon")) {
      return NextResponse.json({ error: "Response is not an image" }, { status: 502 });
    }

    // Cache the result
    pruneCache();
    const arrayBuf = imgResult.body.buffer.slice(
      imgResult.body.byteOffset,
      imgResult.body.byteOffset + imgResult.body.byteLength
    ) as ArrayBuffer;
    cache.set(url, {
      body: arrayBuf,
      contentType: imgResult.contentType,
      ts: Date.now(),
    });

    return new Response(arrayBuf, {
      headers: {
        "Content-Type": imgResult.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch favicon" }, { status: 502 });
  }
}
