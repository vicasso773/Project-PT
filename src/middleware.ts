// Optional password for the team-only parts of the app.
// Set APP_PASSWORD to turn it on. Report links (/r/...) always stay open so owners can view them.

import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    const [, pass] = atob(auth.slice(6)).split(":");
    if (pass === password) return NextResponse.next();
  }
  return new NextResponse("Password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Precise Talons Scanner", charset="UTF-8"' },
  });
}

export const config = {
  // Protect: home (scan form), history, and the scan/lead APIs. Everything under /r/ stays public.
  matcher: ["/", "/history/:path*", "/api/scan/:path*", "/api/lead/:path*"],
};
