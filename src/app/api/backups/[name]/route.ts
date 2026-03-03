import { NextResponse } from "next/server";
import { restoreBackup, deleteBackup, readBackupFile } from "@/lib/config";

interface Params {
  params: Promise<{ name: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { name } = await params;
    const content = readBackupFile(name);
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/x-yaml",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to download backup";
    const status = message === "Backup not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(_request: Request, { params }: Params) {
  try {
    const { name } = await params;
    const config = restoreBackup(name);
    return NextResponse.json(config);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to restore backup";
    const status = message === "Backup not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { name } = await params;
    deleteBackup(name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete backup";
    const status = message === "Backup not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
