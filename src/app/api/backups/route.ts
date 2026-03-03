import { NextResponse } from "next/server";
import { listBackups, createBackup, importBackup } from "@/lib/config";

export async function GET() {
  try {
    const backups = listBackups();
    return NextResponse.json(backups);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list backups" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : undefined;
    const name = createBackup(label);
    return NextResponse.json({ name });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create backup" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const content = await file.text();
    const label = formData.get("label");
    const labelStr = typeof label === "string" && label.trim() ? label.trim() : undefined;
    const result = importBackup(content, labelStr);
    return NextResponse.json({ name: result.name });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to import backup";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
