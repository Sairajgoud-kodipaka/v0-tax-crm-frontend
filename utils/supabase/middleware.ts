import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function updateSession(request: NextRequest) {
  // We build modified request headers so Server Components can read the
  // authenticated user from `next/headers` without making their own DB calls.
  const requestHeaders = new Headers(request.headers);

  // Capture cookies that Supabase wants to set (session refresh)
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  // Required by Supabase SSR — do not move or add code before this line.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/employee") ||
    pathname.startsWith("/client");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // For protected routes, fetch the profile once here in middleware so layouts
  // and pages don't need to make any additional Supabase calls for auth.
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      requestHeaders.set("x-user-id", user.id);
      requestHeaders.set("x-user-email", user.email ?? profile.email ?? "");
      requestHeaders.set("x-user-name", profile.full_name ?? "");
      requestHeaders.set("x-user-role", profile.role);
    }
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Build the final response with modified request headers (for Server Components)
  // and apply any session cookies Supabase needs to refresh.
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as any)
  );
  return response;
}
