import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from "@/lib/workspace";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(WORKSPACE_COOKIE)?.value;
  const workspaceId = existing ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  if (!existing) {
    requestHeaders.set(WORKSPACE_HEADER, workspaceId);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!existing) {
    response.cookies.set(WORKSPACE_COOKIE, workspaceId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon|apple-touch-icon|icon-192|icon-512).*)",
  ],
};
