import { NextRequest, NextResponse } from "next/server";
import { searchRemoteIcons, type RemoteIconSet } from "@/lib/remote-icons";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const set = searchParams.get("set") as RemoteIconSet | null;

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (set && set !== "si" && set !== "dash") {
    return NextResponse.json(
      { error: "Parameter 'set' must be 'si' or 'dash'" },
      { status: 400 }
    );
  }

  try {
    const results = await searchRemoteIcons(q, set ?? undefined);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch icon index" },
      { status: 502 }
    );
  }
}
