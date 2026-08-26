import { NextResponse } from "next/server";
import { cleanProps, getEvents, isEventName, recordEvent, type Device } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEVICES: Device[] = ["mobile", "tablet", "desktop"];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  // Analytics must never break the page, so a bad event is swallowed quietly.
  if (!isEventName(body.name)) return new NextResponse(null, { status: 204 });

  const session = typeof body.session === "string" ? body.session.slice(0, 40) : "unknown";
  const path = typeof body.path === "string" ? body.path.slice(0, 120) : "/";
  const device = DEVICES.includes(body.device as Device) ? (body.device as Device) : "desktop";
  const source = typeof body.source === "string" && body.source ? body.source.slice(0, 80) : undefined;

  await recordEvent({ name: body.name, session, path, device, source, props: cleanProps(body.props) });
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return NextResponse.json(await getEvents());
}
