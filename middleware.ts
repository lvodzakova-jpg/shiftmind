import { updateSession } from "@/lib/supabase/middleware";
import { isManagerRole } from "@/lib/roles";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/join",
  "/forgot-password",
  "/reset-password",
]);

const MANAGER_ONLY_PREFIXES = [
  "/dashboard",
  "/staff",
  "/settings",
  "/payroll",
  "/compliance",
  "/documents",
  "/attendance",
  "/templates",
  "/onboarding",
  "/leaves",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  return false;
}

function isManagerOnlyPath(pathname: string): boolean {
  return MANAGER_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  if (user) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member && pathname !== "/join" && !isPublicPath(pathname)) {
      const joinUrl = request.nextUrl.clone();
      joinUrl.pathname = "/join";
      return NextResponse.redirect(joinUrl);
    }

    if (member) {
      const manager = isManagerRole(member.role);

      if (!manager && isManagerOnlyPath(pathname)) {
        const staffUrl = request.nextUrl.clone();
        staffUrl.pathname = "/my-schedule";
        return NextResponse.redirect(staffUrl);
      }

      if (
        manager &&
        pathname !== "/onboarding" &&
        pathname !== "/staff" &&
        !pathname.startsWith("/api") &&
        !isPublicPath(pathname)
      ) {
        const { count } = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", member.workspace_id);

        if ((count ?? 0) === 0) {
          const onboardingUrl = request.nextUrl.clone();
          onboardingUrl.pathname = "/onboarding";
          return NextResponse.redirect(onboardingUrl);
        }
      }

      if (!manager && pathname === "/") {
        const staffUrl = request.nextUrl.clone();
        staffUrl.pathname = "/my-schedule";
        return NextResponse.redirect(staffUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon|apple-touch-icon|icon-192|icon-512).*)",
  ],
};
