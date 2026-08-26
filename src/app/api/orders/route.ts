import { NextResponse } from "next/server";
import { createOrder, listOrders, validateOrder } from "@/lib/db";
import type { OrderInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listOrders());
}

export async function POST(request: Request) {
  let body: OrderInput;
  try {
    body = (await request.json()) as OrderInput;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const problem = await validateOrder(body);
  if (problem) return NextResponse.json({ error: problem }, { status: 422 });

  const order = await createOrder(body);
  return NextResponse.json(order, { status: 201 });
}
