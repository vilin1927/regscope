import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Shared rate limiter (per-IP, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component — ignore
          }
        },
      },
    }
  );
}

export async function requireAuth(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return { userId: null, error: "Anmeldung erforderlich" };
  }
  return { userId: session.user.id, error: null };
}

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
  maxTokens?: number
): Promise<{ content: string; error: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  if (!apiKey) {
    return { content: "", error: "OpenAI API-Schlüssel nicht konfiguriert" };
  }

  const controller = new AbortController();
  // 50s timeout — leave 10s buffer for Vercel cleanup/response
  const timeout = setTimeout(() => controller.abort(), 50_000);

  // Link external signal if provided
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    };
    if (maxTokens) body.max_completion_tokens = maxTokens;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API error:", response.status, errorBody);
      return { content: "", error: `OpenAI API-Fehler: ${response.status}` };
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return { content: "", error: "Leere Antwort von OpenAI" };
    }

    return { content, error: null };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { content: "", error: "Zeitüberschreitung. Bitte versuchen Sie es erneut." };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
