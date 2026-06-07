import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // URLs zombis del sitio WordPress anterior → 410 Gone para que Google las
  // elimine del índice (un 404 las mantiene en cola; 410 las deindexa más rápido).
  const isWordPressGhost =
    searchParams.has("p") ||
    searchParams.has("attachment_id") ||
    searchParams.has("page_id") ||
    pathname.startsWith("/wp-");

  if (isWordPressGhost) {
    return new NextResponse(null, { status: 410 });
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
