import { NextResponse } from "next/server";
import { createOrder, listOrders, validateOrder } from "@/lib/db";
import type { OrderInput } from "@/lib/types";
import { deny, isAuthorised, tokenFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns names, emails and postcodes, so it is token guarded. The POST below
// stays open: it is the reservation form, and it only ever writes.
export async function GET(request: Request) {
  if (!isAuthorised(tokenFromRequest(request))) return deny();
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
