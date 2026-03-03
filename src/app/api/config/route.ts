import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/config";
import { configSchema } from "@/lib/schema";

export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const config = configSchema.parse(body);
    writeConfig(config);
    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid config", details: error }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to write config" },
      { status: 500 }
    );
  }
}
