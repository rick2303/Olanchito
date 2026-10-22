import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { updateUrl } from "@/lib/updateLink";

// El admin pide el enlace para que un dueño complete su ficha
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { slug } = await req.json().catch(() => ({}));
  if (typeof slug !== "string" || !slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  return NextResponse.json({ url: updateUrl(slug) });
}
