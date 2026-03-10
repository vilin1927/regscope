import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/src/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session for ALL routes (including API)
  //    This keeps auth cookies alive so server-side routes can read them.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() instead of getUser() to avoid a network call to Supabase.
  // getUser() validates the JWT server-side which can exceed Vercel's edge
  // middleware timeout (1.5 s on Hobby). getSession() reads from the cookie
  // locally, which is sufficient for keeping the session alive in middleware.
  // Actual getUser() validation should happen in server components / route handlers.
  await supabase.auth.getSession();

  // 2. For API / static routes, return the Supabase-refreshed response directly
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  // 3. For page routes, run next-intl middleware and copy Supabase cookies onto it
  const intlResponse = intlMiddleware(request);

  // Copy any refreshed auth cookies from Supabase onto the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
